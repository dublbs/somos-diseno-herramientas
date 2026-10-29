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
