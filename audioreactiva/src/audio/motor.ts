// Motor de la estación: toca los estilos (estilos.ts) con osciladores, ruido filtrado y envolventes, y le cuenta a las
// escenas qué está sonando. Dos fuentes para la imagen:
//  1. un analizador sobre la mezcla (volumen, graves, medios, agudos, tono y 12 bandas);
//  2. los eventos exactos del secuenciador (cuándo cae el bombo, la caja, el hi-hat, cada nota del bajo y la melodía),
//     así la reacción cae justo en el golpe aunque la mezcla esté llena.
// El secuenciador programa con el reloj de AudioContext (lookahead de 120 ms, revisado cada 25 ms).

import { ESTILOS, PISTAS, TEMPOS, leerMelodia, type Estilo, type NotaMel, type Onda, type Pista, type Tempo, type Voz } from './estilos';

export interface Rasgos {
  volumen: number; graves: number; medios: number; agudos: number; // 0..1 (analizador)
  tono: number;            // 0..1, centroide espectral
  bandas: number[];        // 12 bandas de graves a agudos (0..1)
  golpe: boolean;          // en este cuadro cayó un bombo, una caja o un pad
  pulso: number;           // 1 en el golpe y cae a 0 en ~0,3 s
  bombo: number; caja: number; hat: number; // envolventes de cada golpe de la batería (0..1)
  bajo: number; notaBajo: number;           // nivel del bajo y su altura (0..1)
  acordes: number; cambioAcorde: number;    // nivel del acorde y un pulso en cada ataque
  melodia: number; notaMel: number; notaNueva: number; // nivel, nota MIDI (-1 sin nota) y pulso en cada nota
  mano: number; manoTipo: 'bum' | 'chas' | null; // pads de golpe que se tocan con el dedo
  nuevo: { bombo: boolean; caja: boolean; hat: boolean; mel: boolean; acorde: boolean; mano: boolean };
  paso: number; compas: number; // semicorchea (0..15) y compás (0..7) que suenan
  filtro: number; eco: number;  // lo que mueve el dedo sobre la escena (0..1; filtro 1 = abierto)
  quieto: boolean;               // prefers-reduced-motion: sin destellos
}
const NADA = { bombo: false, caja: false, hat: false, mel: false, acorde: false, mano: false };
export const SILENCIO: Rasgos = {
  volumen: 0, graves: 0, medios: 0, agudos: 0, tono: 0.3, bandas: Array(12).fill(0), golpe: false, pulso: 0,
  bombo: 0, caja: 0, hat: 0, bajo: 0, notaBajo: 0.3, acordes: 0, cambioAcorde: 0, melodia: 0, notaMel: -1, notaNueva: 0,
  mano: 0, manoTipo: null, nuevo: NADA, paso: 0, compas: 0, filtro: 1, eco: 0, quieto: false,
};

type TipoEvento = 'bombo' | 'caja' | 'hat' | 'bajo' | 'acorde' | 'mel' | 'bum' | 'chas';
interface Evento { t: number; tipo: TipoEvento; vel: number; nota: number; dur: number }

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const LOOK = 0.12;
const MARGEN = 0.5, SALIDA = 0.92; // ganancia antes de la dinámica y después del limitador
// Pads: cuántos golpes de cada uno suenan a la vez. Al tocar Chas muy rápido, cada golpe nuevo apaga el más viejo
// (en ~6 ms, sin clic): así la mezcla no se amontona ni le pide a la tablet más voces de las que alcanza a calcular.
const MAX_PAD = 3;
interface GolpePad { tipo: 'bum' | 'chas'; envs: GainNode[]; fuentes: AudioScheduledSourceNode[]; fin: number }

// congela una automatización en su valor actual (para cortar o agachar sin saltos)
function sujetar(p: AudioParam, t: number) {
  if (typeof p.cancelAndHoldAtTime === 'function') p.cancelAndHoldAtTime(t);
  else { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); }
}
// cuando la fuente termina, suelta la cadena para que no se acumulen nodos
function alTerminar(f: AudioScheduledSourceNode, nodos: AudioNode[]) {
  f.onended = () => { f.disconnect(); for (const n of nodos) n.disconnect(); };
}

export class Motor {
  ctx: AudioContext | null = null;
  estilo: Estilo = ESTILOS[0];
  tempo: Tempo = 'medio';
  activas: Record<Pista, boolean> = { bateria: true, bajo: true, acordes: true, melodia: true };
  pausado = false;

  private an!: AnalyserNode;
  private bus = {} as Record<Pista | 'manos', GainNode>;
  private musica!: GainNode; // las cuatro pistas en seco: se agacha un poco cuando suena un pad
  private pads: GolpePad[] = [];
  private ecoBus = {} as Record<Pista | 'manos', GainNode>;
  private salaBus = {} as Record<Pista | 'manos', GainNode>;
  private filtro!: BiquadFilterNode;
  private envioEco!: GainNode;
  private eco!: DelayNode;
  private ecoFb!: GainNode;
  private nivel!: GainNode;
  private grabacion!: MediaStreamAudioDestinationNode;
  private ruido!: AudioBuffer;
  private pulso25!: PeriodicWave;
  private reloj = 0;
  private paso = 0;
  private proximo = 0;
  private mel = new Map<number, NotaMel>();
  private eventos: Evento[] = [];
  private marcas: { t: number; paso: number }[] = [];
  // análisis
  private frec = new Uint8Array(0);
  private onda = new Float32Array(0);
  private suave: Rasgos = { ...SILENCIO, bandas: [...SILENCIO.bandas] };
  private picos = { volumen: 0.3, graves: 0.3, medios: 0.3, agudos: 0.3, bandas: Array(12).fill(0.3) as number[] };
  private ultimaLectura = 0;
  private ultimoT = 0;
  private ultimoPulso = -10;
  private manoObj = { filtro: 1, eco: 0 };
  private manoSuave = { filtro: 1, eco: 0 };
  medida = { rms: 0, pico: 0, saturados: 0 }; // para medir (ventana del último cuadro)

  // Debe llamarse desde un toque: los navegadores piden un gesto para que suene.
  async empezar() {
    if (this.ctx) { await this.seguir(); return; }
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    this.ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // onda de pulso al 25 % (la de las consolas de 8 bits)
    const N = 40, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    this.pulso25 = ctx.createPeriodicWave(re, im);

    // mezcla: pistas → (eco y sala) → filtro del dedo → nivel del estilo → margen → compresor → limitador → salida
    // (el limitador va al final: de ahí salen el analizador, los parlantes y la grabación del loop)
    const seco = ctx.createGain(), mezcla = ctx.createGain();
    this.eco = ctx.createDelay(2); this.ecoFb = ctx.createGain(); this.ecoFb.gain.value = 0.32;
    const ecoTono = ctx.createBiquadFilter(); ecoTono.type = 'lowpass'; ecoTono.frequency.value = 3200;
    const ecoSal = ctx.createGain(); ecoSal.gain.value = 0.55;
    this.eco.connect(ecoTono); ecoTono.connect(this.ecoFb); this.ecoFb.connect(this.eco); ecoTono.connect(ecoSal); ecoSal.connect(mezcla);
    const sala = ctx.createConvolver(); sala.buffer = this.respuestaSala(ctx, 2.4); const salaSal = ctx.createGain(); salaSal.gain.value = 0.5;
    sala.connect(salaSal); salaSal.connect(mezcla);
    this.musica = ctx.createGain(); this.musica.connect(seco);
    for (const p of [...PISTAS, 'manos'] as const) {
      this.bus[p] = ctx.createGain(); this.bus[p].connect(p === 'manos' ? seco : this.musica);
      this.ecoBus[p] = ctx.createGain(); this.ecoBus[p].connect(this.eco);
      this.salaBus[p] = ctx.createGain(); this.salaBus[p].connect(sala);
    }
    seco.connect(mezcla);
    this.envioEco = ctx.createGain(); this.envioEco.gain.value = 0; seco.connect(this.envioEco); this.envioEco.connect(this.eco);
    this.filtro = ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 20000; this.filtro.Q.value = 0.7;
    this.nivel = ctx.createGain();
    // margen: la mezcla llegaba al compresor con picos de 1,2 a 1,9 y él vivía bajando 9-13 dB (apretada y, con los
    // pads encima, rota). Con −6 dB antes, el compresor trabaja menos y el limitador solo ataja los picos.
    const margen = ctx.createGain(); margen.gain.value = MARGEN;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.2;
    const lim = ctx.createDynamicsCompressor(); // limitador: −6 dB, 20:1, ataque de 2 ms
    lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const salida = ctx.createGain(); salida.gain.value = SALIDA;
    mezcla.connect(this.filtro); this.filtro.connect(this.nivel); this.nivel.connect(margen); margen.connect(comp); comp.connect(lim); lim.connect(salida);
    this.an = ctx.createAnalyser(); this.an.fftSize = 2048; this.an.smoothingTimeConstant = 0.55;
    this.an.minDecibels = -90; this.an.maxDecibels = -20;
    this.frec = new Uint8Array(this.an.frequencyBinCount); this.onda = new Float32Array(this.an.fftSize);
    salida.connect(this.an); this.an.connect(ctx.destination);
    this.grabacion = ctx.createMediaStreamDestination(); salida.connect(this.grabacion);

    this.ponerEstilo(this.estilo.id);
    PISTAS.forEach(p => this.ponerPista(p, this.activas[p]));
    await ctx.resume();
    this.proximo = ctx.currentTime + 0.08;
    this.reloj = window.setInterval(this.programar, 25);
    this.programar();
  }

  // Respuesta de una sala chica: ruido estéreo que se apaga (sin archivos).
  private respuestaSala(ctx: BaseAudioContext, seg: number) {
    const n = Math.round(ctx.sampleRate * seg), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    return b;
  }

  get flujo(): MediaStream | null { return this.grabacion?.stream ?? null; }

  ponerEstilo(id: string) {
    const e = ESTILOS.find(s => s.id === id) ?? ESTILOS[0];
    this.estilo = e;
    this.mel = new Map(leerMelodia(e.melodia).map(n => [n.paso, n]));
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.nivel.gain.setTargetAtTime(e.nivel, t, 0.05);
    this.ajustarEco();
    // el estilo nuevo empieza en el primer compás, en el próximo paso
    this.paso = 0;
    this.eventos = this.eventos.filter(v => v.t <= t);
    this.marcas = this.marcas.filter(v => v.t <= t);
  }

  ponerTempo(t: Tempo) { this.tempo = t; this.ajustarEco(); }
  private get negra() { return 60 / (this.estilo.bpm * (TEMPOS.find(x => x.id === this.tempo)?.factor ?? 1)); }
  private ajustarEco() { if (this.ctx) this.eco.delayTime.setTargetAtTime(Math.min(1.9, this.estilo.eco * this.negra), this.ctx.currentTime, 0.05); }

  ponerPista(p: Pista, si: boolean) {
    this.activas[p] = si;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const g of [this.bus[p], this.ecoBus[p], this.salaBus[p]]) g.gain.setTargetAtTime(si ? 1 : 0, t, 0.03);
  }

  // El dedo sobre la escena: x (0 izquierda..1 derecha) cierra o abre el filtro; y (0 abajo..1 arriba) suma eco.
  // null = soltó: vuelve a sonar limpio.
  mano(x: number | null, y = 0) {
    this.manoObj = x === null ? { filtro: 1, eco: 0 } : { filtro: Math.max(0, Math.min(1, x)), eco: Math.max(0, Math.min(1, y)) };
    if (!this.ctx) return;
    const t = this.ctx.currentTime, { filtro, eco } = this.manoObj, lento = x === null ? 0.18 : 0.04;
    this.filtro.frequency.setTargetAtTime(240 * Math.pow(20000 / 240, filtro), t, lento);
    this.filtro.Q.setTargetAtTime(0.7 + (1 - filtro) * 7, t, lento);
    this.envioEco.gain.setTargetAtTime(eco * 0.7, t, lento);
    this.ecoFb.gain.setTargetAtTime(0.32 + eco * 0.33, t, lento);
  }

  // Pads de golpe: suenan al tiro (no esperan el compás), afinados con el acorde que está sonando.
  tocarPad(tipo: 'bum' | 'chas') {
    const ctx = this.ctx; if (!ctx || this.pausado) return;
    const t = ctx.currentTime + 0.005, [bajo, notas] = this.estilo.acordes[this.compasActual()];
    // tope de golpes simultáneos de este pad: el más viejo se apaga rápido pero sin clic
    this.pads = this.pads.filter(g => g.fin > t);
    const mios = this.pads.filter(g => g.tipo === tipo);
    while (mios.length >= MAX_PAD) {
      const viejo = mios.shift()!; this.pads.splice(this.pads.indexOf(viejo), 1);
      for (const e of viejo.envs) { sujetar(e.gain, t); e.gain.setTargetAtTime(0, t, 0.006); }
      for (const f of viejo.fuentes) { try { f.stop(t + 0.05); } catch { /* ya paró */ } }
    }
    // si todavía suenan otros, este entra un poco más bajo: la suma queda pareja
    const vel = 1 / Math.sqrt(1 + 0.6 * mios.length);
    // la música se agacha un instante (~3 dB con Chas, ~2 dB con Bum) para dejarle lugar al golpe
    const m = this.musica.gain;
    sujetar(m, t); m.linearRampToValueAtTime(tipo === 'chas' ? 0.7 : 0.8, t + 0.012); m.setTargetAtTime(1, t + 0.1, 0.12);
    let golpe: GolpePad;
    if (tipo === 'bum') {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = hz(bajo + 24);
      o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.35);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9 * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g); alTerminar(o, [g, ...this.enviar(g, 'manos', 0, 0.25)]); o.start(t); o.stop(t + 0.62);
      const r = this.ruidoGolpe(t, 'lowpass', 900, 0.5, 0.25 * vel, 'manos', 0.2);
      golpe = { tipo, envs: [g, r.env], fuentes: [o, r.fuente], fin: t + 0.62 };
    } else {
      const r = this.ruidoGolpe(t, 'highpass', 2500, 0.35, 0.7 * vel, 'manos', 0.4);
      const v: Voz = { ondas: ['square', 'sawtooth'], desafinar: [-8, 8], ataque: 0.002, caida: 0.25, sostener: 0, relajo: 0.2, filtro: 2400, filtroEnv: 2, vol: 0.07, sala: 0.4, eco: 0.3 };
      const acorde = this.voz('manos', t, notas.map(n => n + 12), 0.3, v, vel);
      golpe = { tipo, envs: [r.env, acorde.env], fuentes: [r.fuente, ...acorde.fuentes], fin: Math.max(t + 0.37, acorde.fin) };
    }
    this.pads.push(golpe);
    this.evento(t, tipo, 1, bajo, 0.4);
  }

  async pausar() { this.pausado = true; await this.ctx?.suspend(); }
  async seguir() {
    this.pausado = false;
    if (!this.ctx) return;
    await this.ctx.resume();
    this.proximo = Math.max(this.proximo, this.ctx.currentTime + 0.05);
  }
  apagar() {
    clearInterval(this.reloj); this.reloj = 0;
    this.ctx?.close().catch(() => {}); this.ctx = null;
  }

  // ---------------------------------------------------------------- secuenciador
  private programar = () => {
    const ctx = this.ctx; if (!ctx || this.pausado || ctx.state !== 'running') return;
    // si la pestaña se durmió, no recupera el tiempo perdido de un tirón
    if (this.proximo < ctx.currentTime - 0.2) this.proximo = ctx.currentTime + 0.05;
    while (this.proximo < ctx.currentTime + LOOK) {
      this.tocarPaso(this.paso, this.proximo);
      this.proximo += this.negra / 4;
      this.paso = (this.paso + 1) % 128;
    }
    const viejo = ctx.currentTime - 3;
    if (this.eventos.length > 400) this.eventos = this.eventos.filter(v => v.t > viejo);
    if (this.marcas.length > 200) this.marcas = this.marcas.filter(v => v.t > viejo);
  };

  private compasActual() {
    const ahora = this.ahora(); let c = 0;
    for (const m of this.marcas) if (m.t <= ahora) c = Math.floor(m.paso / 16);
    return c;
  }

  private tocarPaso(p: number, t: number) {
    const e = this.estilo, bar = Math.floor(p / 16), s = p % 16, d16 = this.negra / 4;
    const ts = t + (s % 2 ? e.swing * d16 : 0);
    this.marcas.push({ t: ts, paso: p });
    const vel = (c: string) => (c === 'x' || c === 'O' ? 1 : c === 'o' ? 0.65 : 0.35);
    const de = (a: string[]) => a[bar % a.length][s];
    const dr = e.bateria;
    const k = de(dr.bombo); if (k !== '.') this.bombo(ts, vel(k));
    const c = de(dr.caja); if (c !== '.') this.caja(ts, vel(c));
    const h = de(dr.hat); if (h !== '.') this.hat(ts, vel(h), h === 'O');

    const [raiz, notas] = e.acordes[bar];
    const largo = (patron: string) => { let n = 1; while (s + n < 16 && patron[s + n] === '-') n++; return n; };
    const bp = typeof e.bajo === 'string' ? e.bajo : e.bajo[bar % e.bajo.length], b = bp[s];
    if (b === 'R' || b === 'O' || b === '5') {
      const nota = raiz + (b === 'O' ? 12 : b === '5' ? 7 : 0), dur = largo(bp) * d16 * 0.92;
      this.voz('bajo', ts, nota, dur, e.timbre.bajo);
      this.evento(ts, 'bajo', 1, nota, dur, 'bajo');
    }
    const r = e.ritmoAcordes[s];
    if (r === 'x' || r === 'o') {
      const dur = largo(e.ritmoAcordes) * d16 * 0.95, v = r === 'x' ? 1 : 0.7;
      this.voz('acordes', ts, notas, dur, e.timbre.acordes, v);
      this.evento(ts, 'acorde', v, notas[0], dur, 'acordes');
    } else if (r === 'a') {
      const orden = [0, 1, 2, 3, 2, 1], n = notas[orden[s % orden.length] % notas.length];
      this.voz('acordes', ts, n, d16 * 0.85, e.timbre.acordes, s % 4 === 0 ? 1 : 0.75);
      this.evento(ts, 'acorde', s % 4 === 0 ? 1 : 0.5, n, d16, 'acordes');
    }
    const m = this.mel.get(p);
    if (m) {
      const dur = m.largo * d16 * 0.92, nota = m.midi + 12 * (e.timbre.melodia.octava ?? 0);
      this.voz('melodia', ts, m.midi, dur, e.timbre.melodia);
      this.evento(ts, 'mel', 1, nota, dur, 'melodia');
    }
  }

  private evento(t: number, tipo: TipoEvento, vel: number, nota = 0, dur = 0, pista?: Pista) {
    if (pista && !this.activas[pista]) return; // una pista apagada no mueve la imagen
    this.eventos.push({ t, tipo, vel, nota, dur });
  }

  // salida de una nota o golpe: a su pista y, si corresponde, a eco y sala (que se apagan con la pista).
  // Devuelve los envíos creados, para soltarlos cuando la nota termina.
  private enviar(n: AudioNode, p: Pista | 'manos', eco = 0, sala = 0): AudioNode[] {
    n.connect(this.bus[p]);
    const ctx = this.ctx!, creados: AudioNode[] = [];
    if (eco > 0) { const g = ctx.createGain(); g.gain.value = eco; n.connect(g); g.connect(this.ecoBus[p]); creados.push(g); }
    if (sala > 0) { const g = ctx.createGain(); g.gain.value = sala; n.connect(g); g.connect(this.salaBus[p]); creados.push(g); }
    return creados;
  }

  // ---------------------------------------------------------------- instrumentos
  // Una o varias notas con el mismo timbre: comparten filtro, envolvente y envíos (suena igual que notas sueltas,
  // porque todo es lineal, y cuesta la mitad de nodos).
  private voz(p: Pista | 'manos', t: number, notas: number | number[], dur: number, v: Voz, vel = 1) {
    const ctx = this.ctx!, lista = typeof notas === 'number' ? [notas] : notas;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = v.q ?? 0.7;
    if (v.filtroEnv) {
      lp.frequency.setValueAtTime(Math.min(16000, v.filtro * v.filtroEnv), t);
      lp.frequency.exponentialRampToValueAtTime(v.filtro, t + v.ataque + v.caida);
    } else lp.frequency.value = v.filtro;
    const g = ctx.createGain(), pico = v.vol * vel, fin = t + Math.max(dur, v.ataque);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(pico, t + v.ataque);
    g.gain.setTargetAtTime(pico * v.sostener, t + v.ataque, Math.max(0.005, v.caida / 3));
    g.gain.setTargetAtTime(0, fin, Math.max(0.005, v.relajo / 4));
    const fin2 = fin + v.relajo * 1.3 + 0.05;
    let lfo: OscillatorNode | null = null, prof: GainNode | null = null;
    if (v.vibrato) {
      lfo = ctx.createOscillator(); lfo.frequency.value = v.vibrato[0];
      prof = ctx.createGain(); prof.gain.value = v.vibrato[1]; lfo.connect(prof); lfo.start(t); lfo.stop(fin2);
    }
    const suma = ctx.createGain(); suma.gain.value = 1 / v.ondas.length; suma.connect(lp);
    const fuentes: OscillatorNode[] = [];
    for (const nota of lista) {
      const f = hz(nota + 12 * (v.octava ?? 0));
      v.ondas.forEach((onda: Onda, i) => {
        const o = ctx.createOscillator();
        if (onda === 'pulso25') o.setPeriodicWave(this.pulso25); else o.type = onda;
        o.frequency.value = f; o.detune.value = v.desafinar?.[i] ?? 0;
        if (prof) prof.connect(o.detune);
        o.connect(suma); o.start(t); o.stop(fin2);
        fuentes.push(o);
      });
    }
    lp.connect(g);
    const envios = this.enviar(g, p, v.eco, v.sala);
    // al terminar (todas paran juntas, salvo las que un pad corta antes), suelta la cadena completa
    let vivas = fuentes.length;
    const soltar = () => { if (--vivas > 0) return; for (const o of fuentes) o.disconnect(); for (const n of [suma, lp, g, ...envios]) n.disconnect(); lfo?.disconnect(); prof?.disconnect(); };
    for (const o of fuentes) o.onended = soltar;
    return { env: g, fuentes: lfo ? [...fuentes, lfo] : fuentes, fin: fin2 };
  }

  private bombo(t: number, vel: number) {
    const ctx = this.ctx!, b = this.estilo.timbre.bombo;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(b.f0, t); o.frequency.exponentialRampToValueAtTime(b.f1, t + b.caida * 0.45);
    g.gain.setValueAtTime(b.vol * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + b.caida);
    o.connect(g); alTerminar(o, [g, ...this.enviar(g, 'bateria')]); o.start(t); o.stop(t + b.caida + 0.02);
    if (b.clic > 0) this.ruidoGolpe(t, 'highpass', 1800, 0.012, b.clic * vel * 0.4, 'bateria');
    this.evento(t, 'bombo', vel, 0, 0, 'bateria');
  }

  private caja(t: number, vel: number) {
    const ctx = this.ctx!, c = this.estilo.timbre.caja;
    this.ruidoGolpe(t, 'bandpass', c.filtro, c.caida, c.vol * vel, 'bateria', c.sala ?? 0, c.q);
    if (c.cuerpo > 0) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
      o.frequency.setValueAtTime(c.tono, t); o.frequency.exponentialRampToValueAtTime(c.tono * 0.75, t + c.caida * 0.5);
      g.gain.setValueAtTime(c.cuerpo * c.vol * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + c.caida * 0.6);
      o.connect(g); alTerminar(o, [g, ...this.enviar(g, 'bateria', 0, (c.sala ?? 0) * 0.5)]); o.start(t); o.stop(t + c.caida);
    }
    this.evento(t, 'caja', vel, 0, 0, 'bateria');
  }

  private hat(t: number, vel: number, abierto: boolean) {
    const h = this.estilo.timbre.hat;
    this.ruidoGolpe(t, 'highpass', h.filtro, abierto ? h.abierto : h.caida, h.vol * vel, 'bateria');
    this.evento(t, 'hat', vel * (abierto ? 1 : 0.8), 0, 0, 'bateria');
  }

  private ruidoGolpe(t: number, tipo: BiquadFilterType, frec: number, caida: number, vol: number, p: Pista | 'manos', sala = 0, q = 0.7) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.ruido; f.type = tipo; f.frequency.value = frec; f.Q.value = q;
    // 1,5 ms de subida: el ruido no arranca con un escalón (clic)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.001, t + caida);
    s.connect(f); f.connect(g); alTerminar(s, [f, g, ...this.enviar(g, p, 0, sala)]);
    s.start(t, Math.random() * 1.5); s.stop(t + caida + 0.02);
    return { env: g, fuente: s };
  }

  // ---------------------------------------------------------------- lectura (una vez por cuadro)
  private ahora() {
    const ctx = this.ctx; if (!ctx) return 0;
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
  }

  leer(ahoraMs = performance.now()): Rasgos {
    const ctx = this.ctx;
    if (!ctx) return { ...this.suave, golpe: false, pulso: 0, nuevo: NADA };
    const an = this.an, sr = ctx.sampleRate, binHz = sr / an.fftSize;
    an.getByteFrequencyData(this.frec);
    an.getFloatTimeDomainData(this.onda);
    let rms = 0, pico = 0, sat = 0;
    for (let i = 0; i < this.onda.length; i++) { const v = this.onda[i]; rms += v * v; const a = Math.abs(v); if (a > pico) pico = a; if (a >= 0.999) sat++; }
    rms = Math.sqrt(rms / this.onda.length);
    this.medida = { rms, pico, saturados: sat };
    const banda = (a: number, b: number) => {
      const i0 = Math.max(1, Math.round(a / binHz)), i1 = Math.max(i0 + 1, Math.round(b / binHz));
      let s = 0; for (let i = i0; i < i1; i++) s += this.frec[i]; return s / (i1 - i0) / 255;
    };
    let num = 0, den = 0;
    for (let i = 1; i < Math.round(8000 / binHz); i++) { num += Math.log2(i * binHz) * this.frec[i]; den += this.frec[i]; }
    const tono = den > 0 ? Math.min(1, Math.max(0, (num / den - Math.log2(80)) / (Math.log2(6000) - Math.log2(80)))) : this.suave.tono;
    const bandas = Array.from({ length: 12 }, (_, i) => banda(40 * Math.pow(200, i / 12), 40 * Math.pow(200, (i + 1) / 12)));
    const medido = { volumen: Math.min(1, rms * 4), graves: banda(30, 250), medios: banda(250, 2000), agudos: banda(2000, 9000) };
    // cada rasgo se lee contra su pico reciente (que baja a la mitad en 5 s): todos los estilos recorren el rango
    const dt = Math.min(0.1, (ahoraMs - (this.ultimaLectura || ahoraMs)) / 1000); this.ultimaLectura = ahoraMs;
    const caida = Math.pow(0.5, dt / 5), P = this.picos, PISO = 0.18;
    const norm = (v: number, p: number) => Math.min(1, v / Math.max(PISO, p) * 0.95);
    (['volumen', 'graves', 'medios', 'agudos'] as const).forEach(k => { P[k] = Math.max(medido[k], P[k] * caida); });
    P.bandas = P.bandas.map((v, i) => Math.max(bandas[i], v * caida));
    const s = this.suave, seguir = (a: number, b: number) => (b > a ? a + (b - a) * 0.6 : a + (b - a) * 0.22);
    s.volumen = seguir(s.volumen, norm(medido.volumen, P.volumen)); s.graves = seguir(s.graves, norm(medido.graves, P.graves));
    s.medios = seguir(s.medios, norm(medido.medios, P.medios)); s.agudos = seguir(s.agudos, norm(medido.agudos, P.agudos));
    s.tono += (tono - s.tono) * 0.1;
    s.bandas = s.bandas.map((v, i) => seguir(v, norm(bandas[i], Math.max(P.bandas[i], P.volumen * 0.3))));

    // eventos del secuenciador
    const t = this.ahora(), desde = this.ultimoT; this.ultimoT = t;
    const env = (tipo: TipoEvento, tau: number) => { let v = 0; for (const e of this.eventos) if (e.tipo === tipo && e.t <= t) v = Math.max(v, e.vel * Math.exp(-(t - e.t) / tau)); return v; };
    const ultimo = (tipo: TipoEvento) => { let u: Evento | null = null; for (const e of this.eventos) if (e.tipo === tipo && e.t <= t && (!u || e.t >= u.t)) u = e; return u; };
    const llego = (tipo: TipoEvento) => this.eventos.some(e => e.tipo === tipo && e.t <= t && e.t > desde);
    const sostenido = (e: Evento | null, tauAtaque: number) => {
      if (!e) return 0;
      const pasado = t - e.t;
      return pasado < e.dur ? e.vel * (0.55 + 0.45 * Math.exp(-pasado / tauAtaque)) : e.vel * 0.55 * Math.exp(-(pasado - e.dur) / 0.12);
    };
    const eb = ultimo('bajo'), em = ultimo('mel'), ea = ultimo('acorde');
    const bum = env('bum', 0.3), chas = env('chas', 0.3);
    const nuevo = { bombo: llego('bombo'), caja: llego('caja'), hat: llego('hat'), mel: llego('mel'), acorde: llego('acorde'), mano: llego('bum') || llego('chas') };
    const golpe = nuevo.bombo || nuevo.caja || nuevo.mano;
    if (golpe) this.ultimoPulso = t;
    let paso = 0; for (const m of this.marcas) if (m.t <= t) paso = m.paso;
    const k = 1 - Math.pow(0.001, Math.max(dt, 0.016) / 0.25);
    this.manoSuave.filtro += (this.manoObj.filtro - this.manoSuave.filtro) * k;
    this.manoSuave.eco += (this.manoObj.eco - this.manoSuave.eco) * k;
    return {
      ...s, bandas: [...s.bandas], golpe,
      pulso: Math.max(0, 1 - (t - this.ultimoPulso) / 0.3),
      bombo: env('bombo', 0.11), caja: env('caja', 0.13), hat: env('hat', 0.05),
      bajo: sostenido(eb, 0.15), notaBajo: eb ? Math.max(0, Math.min(1, (eb.nota - 28) / 30)) : s.notaBajo,
      acordes: sostenido(ea, 0.3), cambioAcorde: env('acorde', 0.18),
      melodia: sostenido(em, 0.12), notaMel: em && t - em.t < em.dur + 0.4 ? em.nota : -1, notaNueva: env('mel', 0.15),
      mano: Math.max(bum, chas), manoTipo: bum || chas ? (bum >= chas ? 'bum' : 'chas') : null,
      nuevo, paso: paso % 16, compas: Math.floor(paso / 16) % 8,
      filtro: this.manoSuave.filtro, eco: this.manoSuave.eco, quieto: false,
    };
  }
}
