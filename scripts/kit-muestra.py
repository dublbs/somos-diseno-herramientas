#!/usr/bin/env python3
"""Genera docs/kit/muestra.html: los componentes del kit (shared/ui/somos-kit.css) en los tres lenguajes, lado a lado.
Página autónoma (CSS en línea; fuentes de Google Fonts) para revisar el kit con el equipo."""
import os
R = os.path.join(os.path.dirname(__file__), '..')
tokens = open(os.path.join(R, 'shared/somos-tokens.css')).read()
kit = open(os.path.join(R, 'shared/ui/somos-kit.css')).read()
COLORES = [('Hueso', '#F4EEE3'), ('Negro', '#000'), ('Azul', '#0062B8'), ('Celeste', '#7FC8F8'), ('Amarillo', '#FFC20E'), ('Verde', '#00A651'), ('Rosa', '#FF8FB1'), ('Morado', '#7A2E8E')]

def col(v, nota):
    k = v[:3]
    paleta = ''.join(f'<button class="k-color" role="radio" aria-checked="{"true" if i == 2 else "false"}" style="--c:{c}" aria-label="{n}"></button>' for i, (n, c) in enumerate(COLORES))
    return f'''
<section class="col" data-visual="{v}">
  <header class="col-cab"><p class="k-etq">Lenguaje</p><h2>{v}</h2><p class="k-ayuda">{nota}</p></header>
  <div class="k-panel bloque">
    <p class="k-etq">Botones</p>
    <div class="k-grupo">
      <button class="k-btn"><span class="material-symbols-outlined">undo</span>Deshacer</button>
      <button class="k-btn k-primario"><span class="material-symbols-outlined">download</span>Descargar</button>
      <button class="k-btn k-icono" aria-label="Rehacer"><span class="material-symbols-outlined">redo</span></button>
      <button class="k-btn" disabled>Deshabilitado</button>
    </div>
    <p class="k-etq">Barra de herramientas</p>
    <div class="k-grupo" role="radiogroup" aria-label="Herramienta">
      <button class="k-herr" role="radio" aria-checked="true"><span class="material-symbols-outlined">brush</span>Spray</button>
      <button class="k-herr" role="radio" aria-checked="false"><span class="material-symbols-outlined">format_paint</span>Rodillo</button>
      <button class="k-herr" role="radio" aria-checked="false"><span class="material-symbols-outlined">draw</span>Plumón</button>
      <button class="k-herr" role="radio" aria-checked="false"><span class="material-symbols-outlined">ink_eraser</span>Borrar</button>
    </div>
    <p class="k-etq">Segmentado</p>
    <div class="k-seg" role="radiogroup" aria-label="Grosor"><button role="radio" aria-checked="false">Fina</button><button role="radio" aria-checked="true">Media</button><button role="radio" aria-checked="false">Gruesa</button></div>
    <p class="k-etq">Paleta</p>
    <div class="k-paleta" role="radiogroup" aria-label="Color">{paleta}</div>
    <label class="k-etq" for="r-{k}">Deslizador</label>
    <input id="r-{k}" class="k-rango" type="range" value="60">
    <label class="k-interruptor" for="i-{k}"><input id="i-{k}" type="checkbox" checked><span class="riel"></span>Goteo</label>
  </div>
</section>'''

html = f'''<title>Kit Somos Diseño</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Silkscreen&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block">
<style>
{tokens}
{kit}
.material-symbols-outlined{{font-family:"Material Symbols Outlined",sans-serif;font-weight:normal;font-style:normal;font-size:22px;line-height:1;display:inline-block;white-space:nowrap;font-feature-settings:"liga"}}
body{{background:var(--bg)}}
.pagina{{max-width:1320px;margin:0 auto;padding-block:32px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:28px}}
.pagina>header h1{{margin:0;font:800 clamp(34px,5vw,60px)/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em;text-wrap:balance}}
.pagina>header p{{margin:10px 0 0;max-width:70ch;color:var(--muted);font-size:17px}}
.cols{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}}
.col{{display:grid;gap:14px;align-content:start;padding:18px;background:var(--bg);min-width:0}}
.col-cab h2{{margin:2px 0 4px;font:800 28px/1 var(--fuente-tit)}}
[data-visual="Pixel"] .col-cab h2{{font:400 26px/1 "Silkscreen",monospace}}
.bloque{{display:grid;gap:10px;padding:16px;--k-fondo:var(--surface)}}
.bloque .k-etq{{margin-top:6px}}
@media (max-width:980px){{.cols{{grid-template-columns:minmax(0,1fr)}}}}
</style>
<main class="pagina">
  <header><p class="k-etq">Ronda 5 · Bloque A</p><h1>Kit de interfaz por lenguaje</h1>
  <p>Los mismos componentes en los tres lenguajes de la campaña. No cambia solo el color: cambia la forma. Pixel usa esquinas escalonadas, sombra dura que se hunde al tocar y Silkscreen. Geométrica, borde recto, triángulo del módulo FA en la esquina, damero y acordeón. Orgánica, papel recortado, troquel hueso, grano y un giro leve al elegir. Toca y presiona para ver los estados.</p></header>
  <div class="cols">{col('Pixel', 'Morado · Silkscreen')}{col('Geométrica', 'Azul · Bricolage Grotesque')}{col('Orgánica', 'Verde · DM Sans')}</div>
</main>
<script>
document.querySelectorAll('[role="radiogroup"]').forEach(g=>g.addEventListener('click',e=>{{const b=e.target.closest('[role="radio"]');if(!b)return;g.querySelectorAll('[role="radio"]').forEach(x=>x.setAttribute('aria-checked',x===b?'true':'false'));}}));
</script>
'''
open(os.path.join(R, 'docs/kit/muestra.html'), 'w').write(html)
print('docs/kit/muestra.html')

# ------------------------------------------------------------------ kit v2 «herramienta» (plan 012)
# docs/kit/muestra-v2.html: las piezas de shared/ui/Herramienta.tsx con su marcado real y herramienta.css en línea.
import re
herr = re.sub(r"@import[^;]+;", '', open(os.path.join(R, 'shared/ui/herramienta.css')).read())
kit_sin_import = re.sub(r"@import[^;]+;", '', kit)
LINEA = [('Azul', '#0062B8'), ('Lapislázuli', '#2B4BD8'), ('Celeste', '#7FC8F8'), ('Amarillo', '#FFC20E'), ('Verde', '#00A651'),
         ('Rosa', '#FF8FB1'), ('Morado', '#7A2E8E'), ('Negro', '#000000'), ('Hueso', '#F4EEE3')]

def _rgb(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def _hex(c): return '#' + ''.join(f'{round(max(0, min(255, v))):02X}' for v in c)
def _mez(h, con, t): return _hex([v + (con[i] - v) * t for i, v in enumerate(_rgb(h))])
def escala(h, pasos=5):  # igual que escala() en Herramienta.tsx
    r, g, b = _rgb(h); L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; B, N = [255] * 3, [0] * 3
    t = lambda i: i / (pasos - 1)
    if L < 0.1: return [h.upper() if i == pasos - 1 else _mez(h, B, 0.85 * (1 - t(i))) for i in range(pasos)]
    if L > 0.85: return [h.upper() if i == 0 else _mez(h, N, 0.55 * t(i)) for i in range(pasos)]
    m = pasos // 2
    return [h.upper() if i == m else _mez(h, B, 0.6 * (m - i) / m) if i < m else _mez(h, N, 0.5 * (i - m) / (pasos - 1 - m)) for i in range(pasos)]

ic = lambda n: f'<span class="material-symbols-outlined h-icono" aria-hidden="true">{n}</span>'
def btn(t, i=None, v='', p=None): return f'<button type="button" class="h-btn{(" h-" + v) if v else ""}"{"" if p is None else f" aria-pressed={chr(34)}{p}{chr(34)}"}>{ic(i) if i else ""}<span class="h-btn-texto">{t}</span></button>'
def bico(i, e, v=''): return f'<button type="button" class="h-btn h-solo-icono{(" h-" + v) if v else ""}" aria-label="{e}" title="{e}">{ic(i)}</button>'
def seg(ops, sel, et): return f'<div class="h-seg" role="radiogroup" aria-label="{et}">' + ''.join(f'<button type="button" role="radio" aria-checked="{str(o == sel).lower()}">{o}</button>' for o in ops) + '</div>'
def mues(c, n, a=False): return f'<button type="button" role="radio" aria-checked="{str(a).lower()}" aria-label="{n}" title="{n}" class="h-muestra" style="--c:{c}"></button>'
def seccion(t, cuerpo, plegable=False, acc=''):
    cab = (f'<button type="button" class="h-plegar" aria-expanded="true"><h2 class="h-seccion-titulo">{t}</h2>{ic("expand_more")}</button>' if plegable else f'<h2 class="h-seccion-titulo">{t}</h2>')
    return f'<section class="h-seccion"><div class="h-seccion-cab">{cab}{f"<div class=h-seccion-acciones>{acc}</div>" if acc else ""}</div><div style="display:grid;gap:12px">{cuerpo}</div></section>'
def herrs(lst, act):
    return '<div class="h-flotante" role="toolbar" aria-label="Herramientas"><div role="radiogroup" style="display:flex;gap:4px">' + ''.join(
        f'<button type="button" role="radio" aria-checked="{str(i == act).lower()}" class="h-herr">{ic(n)}{t}</button>' for i, (n, t) in enumerate(lst)) + '</div></div>'
def capa(n, vis=True, act=False):
    return (f'<li class="h-capa{" activa" if act else ""}{"" if vis else " oculta"}">{bico("visibility" if vis else "visibility_off", ("Ocultar " if vis else "Mostrar ") + n, "fantasma")}'
            f'<span class="h-capa-mini"></span><button type="button" class="h-capa-nombre">{n}</button><span class="h-capa-orden">{bico("arrow_upward", "Traer adelante")}{bico("arrow_downward", "Llevar atrás")}</span></li>')
rosa = escala('#FF8FB1')
selector = ('<div class="h-selector-color"><div class="h-muestras" role="radiogroup" aria-label="Color">' + ''.join(mues(h, n, n == 'Rosa') for n, h in LINEA) +
            '</div><div class="h-escala" role="radiogroup" aria-label="Tono de Rosa" style="--h-pasos:5">' + ''.join(mues(t, f'Rosa {i}', i == 3) for i, t in enumerate(rosa)) + '</div></div>')
deslizador = ('<div class="h-deslizador"><div class="h-deslizador-cab"><label class="h-etq" for="dz">Tamaño</label><span class="h-valor">60 %</span></div>'
              '<input id="dz" class="h-rango" type="range" value="60" style="--p:60%" oninput="this.style.setProperty(\'--p\',this.value+\'%\');this.previousElementSibling.lastChild.textContent=this.value+\' %\'"></div>')
interruptor = '<label class="h-interruptor" for="iz"><span>Goteo</span><input id="iz" type="checkbox" role="switch" checked><span class="h-riel" aria-hidden="true"></span></label>'
biblio = '<div class="h-biblioteca" role="radiogroup" aria-label="Módulos" style="--h-tam:56px">' + ''.join(
    f'<button type="button" role="radio" aria-checked="{str(i == 2).lower()}" class="h-item" aria-label="Módulo {i + 1}"><svg viewBox="0 0 12 12" width="40" height="40"><rect width="12" height="12" fill="#F4EEE3"/><path d="{d}" fill="#0062B8"/></svg></button>'
    for i, d in enumerate(['M0 0H12V12H0Z', 'M0 0H12L0 12Z', 'M0 12L6 0L12 12Z', 'M0 0H12A12 12 0 0 1 0 12Z', 'M6 0L12 6L6 12L0 6Z', 'M0 0H6V6H0Z M6 6H12V12H6Z', 'M0 12V8H4V4H8V0H12V12Z', 'M2 6a4 4 0 1 0 8 0a4 4 0 1 0 -8 0Z'])) + '</div>'
capas = '<ul class="h-capas" aria-label="Capas">' + capa('Marco', False) + capa('Taco hoja', True, True) + capa('Fondo') + '</ul><div class="h-capas-pie">' + btn('Capa', 'add') + btn('Borrar', 'delete', 'peligro') + '</div>'
barrita = '<div class="h-barrita" role="toolbar" aria-label="Acciones de la selección">' + bico('rotate_right', 'Girar 90°') + bico('content_copy', 'Duplicar') + bico('flip_to_front', 'Traer adelante') + bico('delete', 'Borrar', 'peligro') + '<span class="h-divisor"></span>' + bico('close', 'Cancelar') + bico('check', 'Confirmar', 'primario') + '</div>'
manijas = ('<div class="h-manijas" style="position:absolute"><div class="h-caja" style="width:180px;height:120px;transform:translate(90px,170px) rotate(-12deg)">'
           '<span class="h-tallo" style="top:-32px;height:32px"></span><span class="h-manija giro" style="left:50%;top:-36px"></span>'
           + ''.join(f'<span class="h-manija esq-{i}" style="left:{x}%;top:{y}%"></span>' for i, (x, y) in enumerate([(0, 0), (100, 0), (100, 100), (0, 100)])) + '</div></div>')
marco = f'''<div class="h-marco" style="height:600px">
  <header class="h-barra-sup"><div class="h-izq"><a class="h-volver" href="#">{ic('arrow_back')}<span class="h-btn-texto">Experiencias</span></a><span class="h-divisor"></span>
    <div class="h-titulos"><h1 class="h-titulo">Taller de Grabado</h1><p class="h-ayuda-sup">Toca el papel para elegir dónde va el taco.</p></div></div>
    <div class="h-der">{bico('undo', 'Deshacer', 'fantasma')}{bico('redo', 'Rehacer', 'fantasma')}<span class="h-divisor"></span>{btn('Sorpréndeme', 'shuffle')}{btn('Llévatelo', 'ios_share', 'primario')}</div></header>
  <main class="h-cuerpo"><section class="h-zona-lienzo"><div class="h-escenario"><div class="h-ajustado" style="--h-ratio:.8;background:#FFFFFF">
      <svg viewBox="0 0 400 500" width="100%" height="100%"><circle cx="190" cy="240" r="70" fill="#FF8FB1" opacity=".8" transform="rotate(-12 190 240)"/></svg>{manijas}
      <div class="h-anclada" style="left:50%;top:60px;transform:translateX(-50%)">{barrita}</div></div></div>
    {herrs([('touch_app', 'Colocar'), ('format_paint', 'Entintar'), ('layers', 'Capas'), ('ink_eraser', 'Borrar')], 0)}</section>
    <aside class="h-panel"><div class="h-panel-contenido">{seccion('Tinta', selector)}{seccion('Capas', capas)}{seccion('Taco', biblio, True)}</div></aside></main></div>'''
html2 = f'''<!doctype html><html lang="es" data-ui="v2"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kit v2 herramienta</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block">
<style>
{tokens}
{kit_sin_import}
{herr}
.material-symbols-outlined{{font-family:"Material Symbols Outlined",sans-serif;font-weight:normal;font-style:normal;font-size:22px;line-height:1;display:inline-block;white-space:nowrap;font-feature-settings:"liga"}}
html:has(.h-marco),body:has(.h-marco){{height:auto;overflow:auto}}
body{{margin:0;background:var(--h-superficie-2);color:var(--h-texto);font-family:var(--h-fuente)}}
.pagina{{max-width:1240px;margin:0 auto;padding:32px max(16px,env(safe-area-inset-left,0px)) 56px;display:grid;gap:28px}}
.pagina>header h1{{margin:0;font:700 clamp(30px,4vw,48px)/1.05 var(--h-fuente);letter-spacing:-.02em}}
.pagina>header p{{margin:10px 0 0;max-width:72ch;color:var(--h-texto-2);font-size:16px;line-height:1.5}}
.pagina h2.t{{margin:0 0 4px;font:700 20px var(--h-fuente)}}
.marco-muestra{{border:1px solid var(--h-borde);border-radius:14px;overflow:hidden;box-shadow:var(--h-sombra-flotante)}}
.grilla{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:16px}}
.tarjeta{{background:var(--h-superficie);border:1px solid var(--h-borde);border-radius:14px;padding:16px;display:grid;gap:12px;align-content:start}}
.tarjeta>p.n{{margin:0;font:600 13px var(--h-fuente);color:var(--h-texto-2)}}
.fila{{display:flex;flex-wrap:wrap;gap:8px;align-items:center}}
.tokens{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}}
.token{{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;font:500 12px/1.3 var(--h-fuente)}}
.token i{{width:28px;height:28px;border-radius:6px;border:1px solid rgba(0,0,0,.12)}}
@media (max-width:700px){{.marco-muestra{{overflow-x:auto}}.marco-muestra .h-marco{{min-width:900px}}}}
</style></head><body>
<main class="pagina">
  <header><p class="h-etq">Plan 012 · etapa 1</p><h1>Kit v2: interfaz de herramienta</h1>
  <p>Una sola interfaz neutra para todas las experiencias, con las zonas de Figma y Affinity: barra superior delgada, lienzo, herramientas flotando abajo al centro y un panel derecho con scroll propio. En la etapa 2 cada lenguaje (Pixel, Geométrica, Orgánica) cambia solo los tokens. API y receta de migración: <code>shared/ui/README.md</code>. Experiencia de referencia: Taller de Mosaicos.</p></header>
  <section><h2 class="t">Plantilla · MarcoHerramienta</h2><div class="marco-muestra">{marco}</div></section>
  <section><h2 class="t">Tokens</h2><div class="tarjeta"><div class="tokens">{''.join(f'<div class="token"><i style="background:var({t})"></i><span>{t}<br>{v}</span></div>' for t, v in [('--h-lienzo-fondo', '#E9E9E7'), ('--h-superficie', '#FFFFFF'), ('--h-superficie-2', '#F5F5F4'), ('--h-borde', '#D4D4D2'), ('--h-texto', '#1A1A1A'), ('--h-texto-2', '#6B6B69'), ('--h-acento', '#0062B8'), ('--h-acento-suave', '#E5EEF7'), ('--h-peligro', '#C62828')])}</div>
    <p class="h-ayuda">Radio 10 px · toque 48 px · sombra flotante 0 4px 16px rgba(0,0,0,.14) · DM Sans · espacio 4 · 8 · 12 · 16 · 24.</p></div></section>
  <section><h2 class="t">Átomos y moléculas</h2><div class="grilla">
    <div class="tarjeta"><p class="n">Boton · BotonIcono</p><div class="fila">{btn('Normal', 'tune')}{btn('Llévatelo', 'ios_share', 'primario')}{btn('Fantasma', 'shuffle', 'fantasma')}{btn('Borrar', 'delete', 'peligro')}{btn('Encendido', 'grid_on', '', 'true')}{bico('undo', 'Deshacer')}{bico('redo', 'Rehacer', 'fantasma')}</div></div>
    <div class="tarjeta"><p class="n">Segmento · Deslizador · Interruptor</p>{seg(['Chico', 'Medio', 'Grande'], 'Medio', 'Grosor')}{deslizador}{interruptor}</div>
    <div class="tarjeta"><p class="n">SelectorColor (Línea azul con escalas)</p>{selector}</div>
    <div class="tarjeta"><p class="n">GrillaBiblioteca</p>{biblio}</div>
    <div class="tarjeta"><p class="n">ListaCapas</p>{capas}</div>
    <div class="tarjeta"><p class="n">FilaPropiedad · SeccionPanel plegable</p><div style="border:1px solid var(--h-borde);border-radius:10px;overflow:hidden">{seccion('Ajustes', '<div class="h-fila"><span class="h-etq">Formato</span>' + seg(['1:1', '4:5', '9:16'], '4:5', 'Formato') + '</div>' + interruptor.replace('iz', 'iz2').replace('Goteo', 'Mostrar grilla'), True)}</div></div>
  </div></section>
  <section><h2 class="t">Organismos</h2><div class="grilla">
    <div class="tarjeta"><p class="n">BarraFlotante</p>{herrs([('draw', 'Poner'), ('rotate_right', 'Girar'), ('flip', 'Reflejar'), ('ink_eraser', 'Borrar'), ('highlight_alt', 'Multiplicar')], 0)}</div>
    <div class="tarjeta"><p class="n">BarritaSeleccion</p><div class="fila">{barrita}</div></div>
  </div></section>
</main>
<script>
document.querySelectorAll('[role="radiogroup"]').forEach(g=>g.addEventListener('click',e=>{{const b=e.target.closest('[role="radio"]');if(!b||!g.contains(b))return;g.querySelectorAll(':scope [role="radio"]').forEach(x=>{{if(x.closest('[role="radiogroup"]')===g)x.setAttribute('aria-checked',x===b?'true':'false')}});}}));
document.querySelectorAll('.h-capa').forEach(c=>c.addEventListener('click',()=>{{c.parentElement.querySelectorAll('.h-capa').forEach(x=>x.classList.toggle('activa',x===c))}}));
document.querySelectorAll('.h-plegar').forEach(b=>b.addEventListener('click',()=>{{const a=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!a));b.parentElement.nextElementSibling.hidden=a}}));
</script></body></html>
'''
open(os.path.join(R, 'docs/kit/muestra-v2.html'), 'w').write(html2)
print('docs/kit/muestra-v2.html')
