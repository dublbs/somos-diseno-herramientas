// El «oído» de la estación: lee el micrófono (o una música de demo sintetizada) y resume el sonido
// en rasgos simples que mueven las escenas. Solo Web Audio, sin librerías.

export interface Rasgos {
  volumen: number; // 0..1
  graves: number; // 0..1 (≈ 20–250 Hz)
  medios: number; // 0..1 (≈ 250 Hz–2 kHz)
  agudos: number; // 0..1 (≈ 2–8 kHz)
  tono: number; // 0..1, qué tan agudo es el sonido en promedio (centroide espectral)
  golpe: boolean; // un aplauso, un bombo, una palmada: subida brusca de energía
  bandas: number[]; // 12 bandas de graves a agudos (0..1)
}
export const SILENCIO: Rasgos = { volumen: 0, graves: 0, medios: 0, agudos: 0, tono: 0.3, golpe: false, bandas: Array(12).fill(0) };
export type Fuente = 'microfono' | 'demo';

export class Oido {
  private ctx: AudioContext | null = null;
  private analizador: AnalyserNode | null = null;
  private frec = new Uint8Array(0);
  private onda = new Uint8Array(0);
  private detener: (() => void) | null = null;
  private salidaDemo: GainNode | null = null;
  private suave: Rasgos = { ...SILENCIO, bandas: [...SILENCIO.bandas] };
  private lento = 0; // energía de graves promedio (para detectar golpes)
  private ultimoGolpe = 0;
  fuente: Fuente | null = null;
  sensibilidad = 1;

  private preparar() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analizador = this.ctx.createAnalyser();
      this.analizador.fftSize = 2048;
      this.analizador.smoothingTimeConstant = 0.6;
      this.frec = new Uint8Array(this.analizador.frequencyBinCount);
      this.onda = new Uint8Array(this.analizador.fftSize);
    }
    this.detener?.(); this.detener = null;
    return { ctx: this.ctx, an: this.analizador! };
  }

  // Debe llamarse desde un toque (los navegadores piden un gesto para activar el audio).
  async microfono() {
    const { ctx, an } = this.preparar();
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
    await ctx.resume();
    const src = ctx.createMediaStreamSource(flujo);
    src.connect(an);
    this.detener = () => { src.disconnect(); flujo.getTracks().forEach(t => t.stop()); };
    this.fuente = 'microfono';
  }

  // Música de demo: bombo, caja de ruido, platillo y una línea de bajo que sube y baja.
  async demo(audible = true) {
    const { ctx, an } = this.preparar();
    await ctx.resume();
    const mezcla = ctx.createGain();
    const salida = ctx.createGain(); salida.gain.value = audible ? 0.35 : 0;
    mezcla.connect(an); mezcla.connect(salida); salida.connect(ctx.destination);
    this.salidaDemo = salida;
    const ruido = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const datos = ruido.getChannelData(0); for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
    const NOTAS = [55, 55, 82.4, 73.4, 55, 98, 82.4, 110];
    const negra = 0.5; // 120 bpm
    let siguiente = ctx.currentTime + 0.05, paso = 0;
    const programar = () => {
      while (siguiente < ctx.currentTime + 0.3) {
        const t = siguiente;
        if (paso % 2 === 0) { // bombo
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
          g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.connect(g); g.connect(mezcla); o.start(t); o.stop(t + 0.32);
        }
        if (paso % 4 === 2) { // caja / aplauso
          const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          b.buffer = ruido; f.type = 'bandpass'; f.frequency.value = 1800;
          g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          b.connect(f); f.connect(g); g.connect(mezcla); b.start(t); b.stop(t + 0.2);
        }
        { // platillo en cada corchea
          const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          b.buffer = ruido; f.type = 'highpass'; f.frequency.value = 7000;
          g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          b.connect(f); f.connect(g); g.connect(mezcla); b.start(t); b.stop(t + 0.06);
        }
        if (paso % 2 === 0) { // bajo
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sawtooth'; o.frequency.value = NOTAS[(paso / 2) % NOTAS.length] * (Math.floor(paso / 16) % 2 ? 2 : 1);
          g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + negra * 0.9);
          o.connect(g); g.connect(mezcla); o.start(t); o.stop(t + negra);
        }
        siguiente += negra / 2; paso++;
      }
    };
    const id = window.setInterval(programar, 50);
    programar();
    this.detener = () => { clearInterval(id); mezcla.disconnect(); salida.disconnect(); this.salidaDemo = null; };
    this.fuente = 'demo';
  }

  set demoAudible(si: boolean) { if (this.salidaDemo) this.salidaDemo.gain.value = si ? 0.35 : 0; }

  apagar() { this.detener?.(); this.detener = null; this.fuente = null; }

  leer(ahora = performance.now()): Rasgos {
    if (!this.analizador || !this.fuente) return { ...this.suave, golpe: false };
    const an = this.analizador, sr = this.ctx!.sampleRate, hz = sr / an.fftSize;
    an.getByteFrequencyData(this.frec);
    an.getByteTimeDomainData(this.onda);
    const k = this.sensibilidad;
    const banda = (a: number, b: number) => {
      const i0 = Math.max(1, Math.round(a / hz)), i1 = Math.max(i0 + 1, Math.round(b / hz));
      let s = 0; for (let i = i0; i < i1; i++) s += this.frec[i]; return Math.min(1, (s / (i1 - i0) / 255) * 1.4 * k);
    };
    let rms = 0; for (let i = 0; i < this.onda.length; i++) { const v = (this.onda[i] - 128) / 128; rms += v * v; }
    rms = Math.min(1, Math.sqrt(rms / this.onda.length) * 3.2 * k);
    let num = 0, den = 0;
    for (let i = 1; i < Math.round(8000 / hz); i++) { num += Math.log2(i * hz) * this.frec[i]; den += this.frec[i]; }
    const tono = den > 0 ? Math.min(1, Math.max(0, (num / den - Math.log2(80)) / (Math.log2(6000) - Math.log2(80)))) : this.suave.tono;
    // 12 bandas en escala logarítmica entre 40 Hz y 8 kHz
    const bandas = Array.from({ length: 12 }, (_, i) => banda(40 * Math.pow(200, i / 12), 40 * Math.pow(200, (i + 1) / 12)));
    const crudo = { volumen: rms, graves: banda(20, 250), medios: banda(250, 2000), agudos: banda(2000, 8000), tono };
    // Golpe: los graves (o el volumen) suben de golpe sobre su promedio lento
    const energia = Math.max(crudo.graves, crudo.volumen);
    const golpe = energia - this.lento > 0.18 && energia > 0.25 && ahora - this.ultimoGolpe > 220;
    if (golpe) this.ultimoGolpe = ahora;
    this.lento += (energia - this.lento) * 0.08;
    // Suavizado: sube rápido, baja lento (como un vúmetro)
    const s = this.suave;
    const seguir = (a: number, b: number) => (b > a ? a + (b - a) * 0.6 : a + (b - a) * 0.12);
    s.volumen = seguir(s.volumen, crudo.volumen); s.graves = seguir(s.graves, crudo.graves);
    s.medios = seguir(s.medios, crudo.medios); s.agudos = seguir(s.agudos, crudo.agudos);
    s.tono += (crudo.tono - s.tono) * 0.1;
    s.bandas = s.bandas.map((v, i) => seguir(v, bandas[i]));
    return { ...s, bandas: [...s.bandas], golpe };
  }
}
