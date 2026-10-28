#!/usr/bin/env python3
"""Fondos de Orgánica creados aquí (mar y campo), con el lenguaje de los cordones de Figma:
bordes de papel recortado a mano (polilíneas irregulares) y el mismo grano (ruido fractal) de «Cordón cercano».
Cuando se pasen a Figma, esto es solo la referencia. Correr: python3 scripts/generar-fondos.py"""
import math, random, os

SALIDA = os.path.join(os.path.dirname(__file__), '..', 'public', 'figma', 'organica')
LILA, AZUL, LAPIS, CELESTE, AMARILLO, VERDE, ROSA, MORADO, HUESO = '#7A2E8E', '#0062B8', '#2B4BD8', '#7FC8F8', '#FFC20E', '#00A651', '#FF8FB1', '#7A2E8E', '#F4EEE3'

def grano(fid, x, y, w, h):
    # Mismo filtro que Figma pone a «Cordón cercano»: motas oscuras al 25 % y un desplazamiento mínimo del borde.
    tabla = '0 ' * 14 + '1 ' * 21 + '0 ' * 65
    return (f'<filter id="{fid}" x="{x}" y="{y}" width="{w}" height="{h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
            '<feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>'
            '<feTurbulence type="fractalNoise" baseFrequency="1.6666666 1.6666666" stitchTiles="stitch" numOctaves="3" result="noise" seed="0"/>'
            '<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>'
            f'<feComponentTransfer in="alphaNoise" result="coloredNoise1"><feFuncA type="discrete" tableValues="{tabla}"/></feComponentTransfer>'
            '<feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped"/>'
            '<feFlood flood-color="rgba(0, 0, 0, 0.25)" result="color1Flood"/><feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1"/>'
            '<feMerge result="effect1_noise"><feMergeNode in="shape"/><feMergeNode in="color1"/></feMerge>'
            '<feTurbulence type="fractalNoise" baseFrequency="0.999 0.999" numOctaves="3" seed="0"/>'
            '<feDisplacementMap in="effect1_noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="displacedImage" width="100%" height="100%"/>'
            '<feMerge result="effect2_texture"><feMergeNode in="displacedImage"/></feMerge></filter>')

def svg(ancho, alto, x0, cuerpo, fid=None):
    defs = f'<defs>{grano(fid, x0, 0, ancho, alto)}</defs>' if fid else ''
    return (f'<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="{ancho}" height="{alto}" '
            f'viewBox="{x0} 0 {ancho} {alto}" fill="none" xmlns="http://www.w3.org/2000/svg">{defs}{cuerpo}</svg>\n')

def poli(puntos, color, fid):
    d = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in puntos) + 'Z'
    return f'<g filter="url(#{fid})"><path d="{d}" fill="{color}"/></g>'

def periodica(base, amp, per, ancho, x0, semilla, tipo='ola'):
    """Borde superior recortado a mano que se repite cada `per` (para correrlo un período sin que se note el corte)."""
    r = random.Random(semilla)
    paso = 4
    n = per // paso
    tir = [r.uniform(-1.6, 1.6) for _ in range(n)]
    tir[0] = tir[-1] = 0
    pts = []
    x = x0
    while x <= x0 + ancho + per:
        i = int(((x - x0) % per) / paso)
        t = ((x - x0) % per) / per
        # ola de papel: medias lunas apuntando hacia arriba, con la cresta un poco desplazada
        forma = math.sin(math.pi * t) ** 0.8 if tipo == 'ola' else math.sin(2 * math.pi * t)
        pts.append((x, base - amp * forma + tir[i]))
        x += paso
    return pts

def cerro(base, picos, ancho, semilla, x0=0):
    """Cordón de cerros de papel: segmentos rectos entre picos y valles irregulares."""
    r = random.Random(semilla)
    pts = [(x0 - 10, base)]
    x = x0 - 10
    arriba = True
    while x < x0 + ancho + 10:
        paso = r.uniform(22, 44)
        x += paso
        pts.append((x, base - r.uniform(*picos) if arriba else base - r.uniform(2, picos[0] * 0.5)))
        arriba = not arriba
    return pts

def cerrar(pts, x0, ancho, alto=240):
    return [(x0 - 10, alto + 10)] + pts + [(x0 + ancho + 10, alto + 10)]

def escribir(carpeta, nombre, contenido):
    os.makedirs(os.path.join(SALIDA, carpeta), exist_ok=True)
    open(os.path.join(SALIDA, carpeta, nombre + '.svg'), 'w').write(contenido)

def sinuosa(base, amp, largo, ancho, x0, semilla, jitter=0.7, fases=((1, 0.0),)):
    """Borde de papel recortado a mano con ondas largas (suma de senos). `largo` es el período de la onda principal."""
    r = random.Random(semilla)
    pts = []
    x = x0 - 8
    while x <= x0 + ancho + 8:
        y = base - sum(amp * a * math.sin(2 * math.pi * x * m / largo + ph) for m, ph, a in [(f[0], f[1], f[2] if len(f) > 2 else 1) for f in fases])
        pts.append((x, y + r.uniform(-jitter, jitter)))
        x += 4
    return pts

def sobre(pts, x0, ancho, alto=250):
    return [(x0 - 8, alto)] + pts + [(x0 + ancho + 8, alto)]

def mezcla(a, b, t):
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02X}' for x, y in zip(ca, cb))

CIELO = '#A9D9F8'  # celeste más claro que el de la paleta, para que las piezas de colores destaquen

def filo_periodico(base, amp, per, ancho, x0, semilla):
    """Borde de papel recortado: picos irregulares y rectos, como los cordones de la cordillera, que se repiten cada `per`."""
    r = random.Random(semilla)
    fr = [0.0, r.uniform(.16, .24), r.uniform(.40, .5), r.uniform(.62, .72), r.uniform(.84, .92), 1.0]
    alt = [0.0, r.uniform(.7, 1), r.uniform(.15, .4), r.uniform(.8, 1), r.uniform(.1, .35), 0.0]
    pts = []
    k = -1
    while x0 + k * per <= x0 + ancho + per:
        for f, h in zip(fr[:-1], alt[:-1]):
            pts.append((x0 + (k + f) * per, base - amp * h))
        k += 1
    pts.append((x0 + k * per, base))
    return [p for p in pts if x0 - per <= p[0] <= x0 + ancho + per]

def sobre(pts, x0, ancho, alto=250):
    return [(x0 - per_pad, alto)] + pts + [(x0 + ancho + per_pad, alto)] if False else [(pts[0][0], alto)] + pts + [(pts[-1][0], alto)]

# ---- MAR · cielo claro y tres franjas de olas recortadas (lapislázuli, azul, lapislázuli) + playa ----
# Las franjas se repiten cada 80 y miden 480 de ancho: correrlas 80 en 4 s cierra el ciclo sin salto.
P, A, X0 = 80, 480, -80
escribir('mar', 'cielo', svg(240, 240, 0, f'<rect width="240" height="240" fill="{CIELO}"/>'))
for nombre, base, amp, color, sem in (('ola-lejana', 112, 7, LAPIS, 41), ('ola-media', 142, 10, AZUL, 52), ('ola-cercana', 176, 12, LAPIS, 63)):
    pts = filo_periodico(base, amp, P, A, X0, sem)
    escribir('mar', nombre, svg(A, 240, X0, poli(sobre(pts, X0, A), color, 'g_' + nombre), 'g_' + nombre))
# espuma: una cinta de hueso sobre la última franja, también con filo
esp = filo_periodico(176 - 2, 12, P, A, X0, 63)
esp_b = [(x, y + 4.2) for x, y in esp]
escribir('mar', 'crestas', svg(A, 240, X0, poli(esp + esp_b[::-1], HUESO, 'g_cr'), 'g_cr'))
orilla = [(x, 209 + 2.2 * math.sin(x / 19) + random.Random(int(x) + 5).uniform(-.6, .6)) for x in range(-60, 302, 4)]
escribir('mar', 'playa', svg(360, 240, -60, poli([(-60, 250)] + orilla + [(300, 250)], AMARILLO, 'g_playa'), 'g_playa'))
esp2 = [(x, y - 3.4) for x, y in orilla]
escribir('mar', 'espuma', svg(360, 240, -60, poli(esp2 + orilla[::-1], HUESO, 'g_esp'), 'g_esp'))

# ---- DESIERTO · dunas marcadas: cara iluminada larga, cara en sombra corta y cresta con filo ----
def dunas(base, altos, anchos, color, sombra, semilla, id_):
    """Dunas con la cara al viento larga y suave, y la cara de sotavento corta y en sombra."""
    r = random.Random(semilla)
    x = -30; picos = []
    while x < 270:
        w = r.uniform(*anchos); h = r.uniform(*altos)
        picos.append((x, w, h)); x += w
    cresta = [(-30, base)]; sombras = []
    for (x, w, h) in picos:
        px = x + w * 0.72                                 # el pico queda hacia el sotavento
        # barlovento: curva cóncava hasta el pico
        for k in range(1, 7):
            t = k / 6; cresta.append((x + (px - x) * t, base - h * (t ** 1.8)))
        # sotavento: caída casi recta hasta el valle siguiente
        vx = x + w
        cresta.append((vx, base))
        sombras.append([(px, base - h), (vx, base), (px - (vx - px) * 0.35, base - h * 0.2)])
    cuerpo = poli([(cresta[0][0], 250)] + cresta + [(cresta[-1][0], 250)], color, 'g_' + id_)
    for tri in sombras:
        d = 'M' + 'L'.join(f'{px:.1f} {py:.1f}' for px, py in tri) + 'Z'
        cuerpo += f'<g filter="url(#g_{id_})"><path d="{d}" fill="{sombra}"/></g>'
    return svg(240, 240, 0, cuerpo, 'g_' + id_)

escribir('desierto', 'cielo', svg(240, 240, 0, f'<rect width="240" height="240" fill="{CIELO}"/>'))
escribir('desierto', 'duna-lejana', dunas(158, (16, 30), (70, 110), MORADO, mezcla(MORADO, '#000000', .28), 4, 'dl'))
escribir('desierto', 'duna-media', dunas(184, (14, 26), (60, 95), ROSA, mezcla(ROSA, MORADO, .45), 9, 'dm'))
escribir('desierto', 'arena', dunas(212, (8, 14), (80, 120), AMARILLO, mezcla(AMARILLO, '#C25A00', .35), 15, 'ar'))
print('fondos listos')
