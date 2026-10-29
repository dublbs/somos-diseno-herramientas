#!/usr/bin/env python3
"""BOCETOS de las piezas nuevas de Teatro de Papel (plan 004): no vienen de Figma, se generan aquí para verlas
en movimiento y decidir. Siguen las reglas de la familia Orgánica: formas planas de la paleta Línea azul,
bordes de papel recortado a mano y el mismo grano (ruido fractal) que ponen los SVG de Figma.
Cada pieza vive en el marco de 240 × 240 de Teatro (las capas animadas van en archivos separados).
Correr: python3 scripts/generar-bocetos.py  → public/figma/organica-bocetos/<pieza>/<capa>.svg"""
import math, os, random

SALIDA = os.path.join(os.path.dirname(__file__), '..', 'public', 'figma', 'organica-bocetos')
HUESO, NEGRO, AZUL, LAPIS, CELESTE, AMARILLO, VERDE, ROSA, MORADO = '#F4EEE3', '#000000', '#0062B8', '#2B4BD8', '#7FC8F8', '#FFC20E', '#00A651', '#FF8FB1', '#7A2E8E'

def mezcla(a, b, t):
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02X}' for x, y in zip(ca, cb))

VERDE_OSC = mezcla(VERDE, NEGRO, 0.35)

def grano(fid):
    # El mismo filtro de Figma (FA03 Helecho, Cordón cercano): motas oscuras al 25 % y un leve desplazamiento del borde.
    tabla = '0 ' * 14 + '1 ' * 21 + '0 ' * 65
    return (f'<filter id="{fid}" x="-20" y="-20" width="280" height="280" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
            '<feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>'
            '<feTurbulence type="fractalNoise" baseFrequency="1.6666666 1.6666666" stitchTiles="stitch" numOctaves="3" result="noise" seed="0"/>'
            '<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>'
            f'<feComponentTransfer in="alphaNoise" result="coloredNoise1"><feFuncA type="discrete" tableValues="{tabla}"/></feComponentTransfer>'
            '<feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped"/>'
            '<feFlood flood-color="rgba(0, 0, 0, 0.25)" result="color1Flood"/><feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1"/>'
            '<feMerge result="effect1_noise"><feMergeNode in="shape"/><feMergeNode in="color1"/></feMerge>'
            '<feTurbulence type="fractalNoise" baseFrequency="0.999 0.999" numOctaves="3" seed="0"/>'
            '<feDisplacementMap in="effect1_noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="displacedImage"/>'
            '<feMerge result="effect2_texture"><feMergeNode in="displacedImage"/></feMerge></filter>')

# ---------- formas recortadas a mano ----------
def recortar(pts, semilla, j=0.55, paso=3.0):
    """Densifica el contorno y lo mueve un poco en cada punto: el borde de un papel cortado con tijera."""
    r = random.Random(semilla)
    out = []
    for i, (x0, y0) in enumerate(pts):
        x1, y1 = pts[(i + 1) % len(pts)]
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / paso))
        for k in range(n):
            t = k / n
            out.append((x0 + (x1 - x0) * t + r.uniform(-j, j), y0 + (y1 - y0) * t + r.uniform(-j, j)))
    return out

def elipse(cx, cy, rx, ry, rot=0.0, n=44):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(cx + rx * math.cos(a) * c - ry * math.sin(a) * s, cy + rx * math.cos(a) * s + ry * math.sin(a) * c)
            for a in (2 * math.pi * k / n for k in range(n))]

def trazo(pts, ancho):
    """Una línea gruesa (tallo, rama, pata) como polígono: va por un lado y vuelve por el otro."""
    izq, der = [], []
    for i, (x, y) in enumerate(pts):
        xa, ya = pts[max(0, i - 1)]; xb, yb = pts[min(len(pts) - 1, i + 1)]
        dx, dy = xb - xa, yb - ya; L = math.hypot(dx, dy) or 1
        w = ancho[i] if isinstance(ancho, (list, tuple)) else ancho
        nx, ny = -dy / L * w / 2, dx / L * w / 2
        izq.append((x + nx, y + ny)); der.append((x - nx, y - ny))
    return izq + der[::-1]

def espejo_y(pts, eje):
    return [(x, 2 * eje - y) for x, y in pts]

def mover(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]

class Capa:
    def __init__(self):
        self.formas = []
    def add(self, pts, color, semilla=0, j=0.55):
        self.formas.append((recortar(pts, semilla + len(self.formas) * 7, j), color)); return self
    def svg(self, fid):
        cuerpo = ''.join(f'<path d="M{"L".join(f"{x:.1f} {y:.1f}" for x, y in p)}Z" fill="{c}"/>' for p, c in self.formas)
        return (f'<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="240" height="240" viewBox="0 0 240 240" '
                f'fill="none" xmlns="http://www.w3.org/2000/svg"><defs>{grano(fid)}</defs><g filter="url(#{fid})">{cuerpo}</g></svg>\n')

def guardar(pieza, capas):
    os.makedirs(os.path.join(SALIDA, pieza), exist_ok=True)
    for nombre, capa in capas.items():
        open(os.path.join(SALIDA, pieza, nombre + '.svg'), 'w').write(capa.svg(f'g_{pieza}_{nombre}'.replace('-', '_')))

# ---------- aves (cuerpo + ala de arriba + ala de abajo; las alas giran en el hombro) ----------
def ave(pieza, cuerpo_color, ala_pts, ala_color, banda=None, cabeza=None, pico=None, cola=None, extra=(), hombro_y=121, semilla=1):
    cuerpo, sup, inf = Capa(), Capa(), Capa()
    if cola: cuerpo.add(cola, cuerpo_color if len(cola) > 2 else cuerpo_color, semilla)
    for pts, color in extra: cuerpo.add(pts, color, semilla + 3)
    sup.add(ala_pts, ala_color, semilla + 5)
    if banda: sup.add(banda[0], banda[1], semilla + 6)
    inf.add(espejo_y(ala_pts, hombro_y), mezcla(ala_color, NEGRO, 0.25) if ala_color != NEGRO else NEGRO, semilla + 8)
    if banda: inf.add(espejo_y(banda[0], hombro_y), banda[1], semilla + 9)
    for pts, color in (cabeza or []): cuerpo.add(pts, color, semilla + 11)
    if pico: cuerpo.add(pico, pico_color(pieza), semilla + 13, 0.3)
    guardar(pieza, {'ala-inferior': inf, 'cuerpo': cuerpo, 'ala-superior': sup})

def pico_color(pieza):
    return {'gaviota': AMARILLO, 'condor': HUESO, 'carpintero': HUESO}.get(pieza, NEGRO)

# Cóndor: negro, collar de plumas blancas, cabeza rosada; ala enorme con dedos y banda blanca.
ala_condor = [(108, 116), (100, 96), (88, 76), (70, 56), (52, 40), (58, 54), (44, 46), (54, 62), (40, 58), (54, 74), (42, 74), (62, 88), (84, 104), (120, 123)]
ave('condor', NEGRO, ala_condor, NEGRO, banda=([(100, 110), (90, 94), (80, 82), (86, 92), (98, 108)], HUESO),
    cola=[(84, 118), (52, 112), (50, 124), (54, 134), (84, 130)],
    extra=[(elipse(120, 124, 44, 17, -4), NEGRO)],
    cabeza=[(elipse(158, 118, 13, 12), HUESO), (elipse(172, 112, 10, 8, -10), ROSA), (elipse(175, 109, 1.8, 1.8), NEGRO)],
    pico=[(180, 108), (192, 111), (188, 116), (181, 115)], semilla=11)

# Gaviota dominicana: cuerpo blanco grisáceo (hueso con un poco de celeste, para que se vea sobre papel claro),
# manto y alas negras con borde hueso, pico amarillo.
GRIS_GAV = mezcla(HUESO, CELESTE, 0.3)
ala_gav = [(110, 118), (98, 100), (84, 88), (62, 76), (36, 70), (52, 80), (40, 84), (70, 96), (94, 110), (122, 124)]
ave('gaviota', GRIS_GAV, ala_gav, NEGRO, banda=([(104, 116), (92, 104), (74, 94), (60, 90), (78, 98), (96, 112)], HUESO),
    cola=[(90, 118), (66, 114), (66, 128), (90, 130)],
    extra=[(elipse(120, 124, 36, 14, -3), GRIS_GAV)],
    cabeza=[(elipse(156, 114, 12, 11), GRIS_GAV), (elipse(160, 111, 1.7, 1.7), NEGRO)],
    pico=[(166, 112), (182, 115), (180, 118), (167, 118)], semilla=21)

# Picaflor de Arica: chiquito y verde, garganta magenta (morado), pico largo; alas celestes que vibran.
ala_pf = [(118, 118), (112, 96), (100, 72), (94, 60), (104, 74), (116, 98), (126, 120)]
ave('picaflor', VERDE, ala_pf, CELESTE,
    cola=[(104, 136), (86, 156), (92, 160), (100, 152), (102, 162), (110, 142)],
    extra=[(elipse(120, 130, 22, 12, -28), VERDE), (elipse(134, 120, 9, 7, -28), MORADO)],
    cabeza=[(elipse(142, 110, 10, 9), VERDE), (elipse(146, 108, 1.6, 1.6), NEGRO)],
    pico=[(150, 107), (190, 98), (190, 100), (151, 111)], hombro_y=121, semilla=31)

# Carpintero negro: negro con cresta rosada (en vez de roja), parche blanco en el ala y pico claro.
ala_carp = [(108, 118), (98, 98), (82, 82), (64, 72), (72, 84), (60, 84), (80, 98), (98, 112), (122, 124)]
ave('carpintero', NEGRO, ala_carp, NEGRO, banda=([(98, 110), (88, 98), (80, 92), (86, 100), (96, 110)], HUESO),
    cola=[(90, 124), (62, 132), (62, 140), (92, 134)],
    extra=[(elipse(120, 126, 34, 15, -6), NEGRO)],
    cabeza=[(elipse(150, 112, 12, 12), NEGRO), (trazo([(142, 102), (150, 96), (160, 98)], [10, 12, 6]), ROSA), (elipse(154, 110, 2, 2), HUESO)],
    pico=[(160, 112), (178, 115), (160, 118)], semilla=41)

# Chucao: ave de suelo del bosque; espalda negra, pecho amarillo (en vez de rufo) y cola levantada. Salta.
cola_ch, cuerpo_ch = Capa(), Capa()
cola_ch.add([(104, 168), (88, 132), (82, 128), (84, 136), (96, 172)], NEGRO, 51)
cuerpo_ch.add(trazo([(118, 188), (114, 206)], 3), NEGRO, 52).add(trazo([(130, 188), (128, 206)], 3), NEGRO, 53)
cuerpo_ch.add(elipse(122, 172, 26, 18, -10), NEGRO, 54).add(elipse(134, 178, 15, 12, -10), AMARILLO, 55)
cuerpo_ch.add(elipse(144, 154, 11, 10), NEGRO, 56).add(elipse(148, 152, 3, 3), HUESO, 57).add(elipse(148, 152, 1.4, 1.4), NEGRO, 58)
cuerpo_ch.add([(154, 154), (164, 157), (154, 159)], NEGRO, 59, 0.3)
guardar('chucao', {'cola': cola_ch, 'cuerpo': cuerpo_ch})

# ---------- mamíferos (4 patas que giran en la cadera, como el pudú) ----------
def cuadrupedo(pieza, color, panza, patas_x, cadera_y, suelo_y, cuerpo_pts, cuello, cabeza, extras=(), pata_ancho=8, semilla=60):
    capas = {}
    for i, x in enumerate(patas_x):
        c = Capa()
        c.add(trazo([(x, cadera_y), (x + 1, (cadera_y + suelo_y) / 2), (x, suelo_y - 6)], [pata_ancho + 2, pata_ancho, pata_ancho - 1]), color if i % 2 == 0 else mezcla(color, NEGRO, 0.18), semilla + i)
        c.add(elipse(x, suelo_y - 3, pata_ancho * 0.6, 3.5), NEGRO, semilla + 10 + i)
        capas[f'pata{i + 1}'] = c
    cuerpo = Capa()
    cuerpo.add(cuerpo_pts, color, semilla + 20)
    if panza: cuerpo.add(panza, HUESO, semilla + 21)
    cuerpo.add(cuello, color, semilla + 22)
    for pts, col in cabeza: cuerpo.add(pts, col, semilla + 23)
    for pts, col in extras: cuerpo.add(pts, col, semilla + 30)
    orden = ['pata1', 'pata2', 'cuerpo', 'pata3', 'pata4']
    capas_ord = {k: capas[k] for k in ('pata1', 'pata2')}
    capas_ord['pata3'] = capas['pata3']; capas_ord['pata4'] = capas['pata4']; capas_ord['cuerpo'] = cuerpo
    guardar(pieza, capas_ord)

# Huemul: ciervo del sur; morado, panza hueso, astas hueso en Y, hocico negro.
cuadrupedo('huemul', MORADO, elipse(118, 140, 36, 8), [86, 100, 138, 152], 138, 206,
           elipse(118, 126, 48, 22),
           [(150, 118), (160, 96), (170, 86), (178, 92), (172, 110), (164, 128)],
           [(elipse(176, 88, 14, 10, 20), MORADO), (elipse(188, 94, 5, 4), NEGRO), (elipse(176, 84, 2, 2), NEGRO),
            ([(168, 78), (162, 66), (168, 72)], MORADO)],
           extras=[(trazo([(172, 80), (168, 60), (160, 50)], 3.4), HUESO), (trazo([(169, 66), (178, 54)], 3), HUESO),
                   (trazo([(178, 80), (182, 62), (176, 52)], 3.4), HUESO), (trazo([(181, 66), (190, 58)], 3), HUESO),
                   ([(70, 118), (62, 112), (66, 124)], HUESO)], semilla=61)

# Guanaco: amarillo con panza hueso, cuello largo, cara negra.
cuadrupedo('guanaco', AMARILLO, elipse(110, 138, 36, 9), [78, 92, 128, 142], 140, 210,
           elipse(110, 128, 44, 20),
           [(136, 120), (144, 90), (150, 64), (162, 60), (160, 92), (152, 126)],
           [(elipse(164, 58, 14, 9, 15), AMARILLO), (elipse(172, 62, 7, 6, 15), NEGRO), (elipse(164, 54, 2, 2), NEGRO),
            ([(156, 48), (154, 38), (160, 46)], AMARILLO), ([(162, 48), (164, 38), (166, 48)], AMARILLO)],
           extras=[([(68, 120), (60, 116), (62, 128)], AMARILLO)], pata_ancho=7, semilla=71)

# ---------- plantas y objetos (una capa que se mece) ----------
def una(pieza, capa, nombre=None):
    guardar(pieza, {nombre or pieza: capa})

# Chagual: roseta de hojas espinudas y una vara alta con flores amarillo verdosas.
c = Capa()
r = random.Random(81)
for k in range(11):
    a = math.radians(-170 + k * 16 + r.uniform(-4, 4)); L = r.uniform(44, 60)
    x, y = 120 + math.cos(a) * L, 216 + math.sin(a) * L * 0.75
    c.add([(120 - 5, 216), (x, y), (120 + 5, 216)], VERDE if k % 2 else VERDE_OSC, 81 + k)
c.add(trazo([(120, 212), (121, 150), (119, 90), (120, 44)], [9, 8, 7, 5]), VERDE_OSC, 95)
for k in range(16):
    y = 48 + k * 5.2; lado = -1 if k % 2 else 1
    c.add(elipse(120 + lado * r.uniform(7, 11), y, 6, 4, lado * 20), AMARILLO, 100 + k)
una('chagual', c)

# Cochayuyo: cintas largas de alga que salen de un disco (se mecen como en el agua).
c = Capa()
c.add(elipse(120, 214, 14, 6), NEGRO, 120)
for k, (dx, largo, fase) in enumerate([(-24, 150, 0.0), (-10, 175, 1.0), (4, 160, 2.1), (18, 140, 0.6), (30, 120, 1.7)]):
    pts = [(120 + dx * t / 1.0 * 1.0 + math.sin(fase + t * 4) * 9 * t, 212 - largo * t) for t in (i / 14 for i in range(15))]
    c.add(trazo(pts, [9 - i * 0.35 for i in range(15)]), MORADO if k % 2 else mezcla(MORADO, NEGRO, 0.3), 121 + k)
una('cochayuyo', c)

# Doca: hojas suculentas triangulares y flores rosadas de muchos pétalos.
c = Capa()
for k, (x, a) in enumerate([(78, -30), (96, -60), (112, -100), (130, -80), (150, -120), (166, -150)]):
    ra = math.radians(a)
    c.add([(x - 5, 214), (x + math.cos(ra) * 52, 214 + math.sin(ra) * 40), (x + 5, 214)], VERDE if k % 2 else VERDE_OSC, 130 + k)
for (cx, cy, rr) in [(104, 170, 20), (148, 178, 16)]:
    for k in range(18):
        a = 2 * math.pi * k / 18
        c.add(elipse(cx + math.cos(a) * rr * 0.55, cy + math.sin(a) * rr * 0.55, rr * 0.55, rr * 0.13, math.degrees(a)), ROSA, 140 + k)
    c.add(elipse(cx, cy, rr * 0.28, rr * 0.28), AMARILLO, 160)
una('doca', c)

# Concha de loco: caracol de vuelta gruesa, rosado con estrías hueso y la boca clara.
c = Capa()
c.add(elipse(118, 182, 44, 32, -12), ROSA, 170)
for k in range(5):
    pts = [(118 + math.cos(a) * (40 - k * 8), 182 + math.sin(a) * (29 - k * 6)) for a in (math.radians(d) for d in range(200, 340, 10))]
    c.add(trazo(pts, 2.4), HUESO, 171 + k)
c.add(elipse(140, 192, 16, 11, -20), mezcla(ROSA, HUESO, 0.6), 180)
una('concha', c)

# Chañar: arbolito del desierto, tronco torcido, copa verde y frutos amarillos.
c = Capa()
c.add(trazo([(120, 216), (116, 190), (124, 166), (118, 140), (124, 120)], [14, 12, 11, 9, 8]), MORADO, 190)
c.add(trazo([(120, 160), (96, 134)], 6), MORADO, 191).add(trazo([(122, 150), (148, 128)], 6), MORADO, 192)
for k, (x, y, rx, ry) in enumerate([(120, 104, 34, 22), (90, 122, 22, 16), (152, 118, 24, 17), (104, 96, 20, 14), (138, 94, 20, 14)]):
    c.add(elipse(x, y, rx, ry), VERDE if k % 2 else VERDE_OSC, 193 + k)
for k, (x, y) in enumerate([(96, 128), (112, 112), (132, 104), (150, 124), (122, 92), (86, 116), (142, 112)]):
    c.add(elipse(x, y, 4, 4), AMARILLO, 200 + k)
una('chanar', c)

# Alerce: árbol muy alto del sur, tronco rojizo (morado) y copa verde por capas.
c = Capa()
c.add(trazo([(120, 218), (120, 120), (120, 40)], [14, 11, 6]), MORADO, 210)
for k in range(7):
    y = 52 + k * 22; w = 18 + k * 9
    c.add([(120 - w, y + 18), (120 - w * 0.4, y), (120, y - 10), (120 + w * 0.4, y), (120 + w, y + 18), (120, y + 12)], VERDE if k % 2 else VERDE_OSC, 211 + k)
una('alerce', c)

# Copihue: enredadera con hojas y tres campanas rosadas colgando.
c = Capa()
c.add(trazo([(60, 40), (90, 60), (110, 52), (140, 70), (176, 62)], 4), VERDE_OSC, 230)
for k, (x, y, a) in enumerate([(82, 58, 30), (118, 56, -20), (150, 70, 40), (100, 54, -40), (166, 64, -30)]):
    c.add(elipse(x, y, 13, 6, a), VERDE, 231 + k)
for k, (x, y0, L) in enumerate([(92, 60, 60), (126, 60, 84), (158, 66, 54)]):
    c.add(trazo([(x, y0), (x + 2, y0 + L * 0.5), (x, y0 + L)], 2), VERDE_OSC, 240 + k)
    y = y0 + L
    c.add([(x - 4, y), (x - 15, y + 34), (x - 9, y + 38), (x, y + 34), (x + 9, y + 38), (x + 15, y + 34), (x + 4, y)], ROSA, 245 + k)
    c.add(elipse(x - 4, y + 18, 1.6, 1.6), HUESO, 250 + k).add(elipse(x + 3, y + 24, 1.6, 1.6), HUESO, 255 + k)
una('copihue', c)

# Maqui: arbusto de ramas negras, hojas verdes y racimos de bayas moradas.
c = Capa()
for k, pts in enumerate([[(120, 216), (118, 160), (96, 110)], [(118, 180), (150, 130), (160, 100)], [(119, 150), (128, 96), (120, 70)]]):
    c.add(trazo(pts, [6, 4, 3]), NEGRO, 260 + k)
for k, (x, y, a) in enumerate([(98, 112, 40), (106, 136, -20), (150, 126, 30), (160, 104, -30), (124, 92, 60), (118, 74, -50), (136, 150, 20), (90, 128, -40)]):
    c.add(elipse(x, y, 14, 6, a), VERDE if k % 2 else VERDE_OSC, 270 + k)
for k, (cx, cy) in enumerate([(108, 120), (142, 138), (128, 82), (152, 112)]):
    for j in range(6):
        c.add(elipse(cx + (j % 3) * 6 - 6, cy + (j // 3) * 6, 3.4, 3.4), MORADO, 280 + k * 6 + j)
una('maqui', c)

# Telar mapuche (witral): dos postes, travesaños y un tejido a medio hacer con rombos escalonados.
c = Capa()
c.add([(62, 34), (70, 34), (70, 220), (62, 220)], NEGRO, 300).add([(170, 34), (178, 34), (178, 220), (170, 220)], NEGRO, 301)
c.add([(56, 44), (184, 44), (184, 52), (56, 52)], NEGRO, 302).add([(56, 196), (184, 196), (184, 204), (56, 204)], NEGRO, 303)
c.add([(76, 56), (164, 56), (164, 150), (76, 150)], HUESO, 304)
for k, color in enumerate([ROSA, LAPIS, ROSA]):
    y0 = 62 + k * 30
    c.add([(76, y0), (164, y0), (164, y0 + 4), (76, y0 + 4)], color, 310 + k)
    for x in range(84, 164, 20):
        c.add([(x, y0 + 16), (x + 8, y0 + 8), (x + 16, y0 + 16), (x + 8, y0 + 24)], LAPIS if color == ROSA else ROSA, 320 + x + k)
for x in range(80, 164, 6):
    c.add([(x, 150), (x + 1.4, 150), (x + 1.4, 196), (x, 196)], HUESO, 400 + x, 0.2)
una('telar', c)

# Luna: creciente amarilla con estrellas hueso.
c = Capa()
afuera = [(120 + 32 * math.cos(a), 64 + 32 * math.sin(a)) for a in (math.radians(d) for d in range(70, 291, 6))]
adentro = [(134 + 26 * math.cos(a), 60 + 26 * math.sin(a)) for a in (math.radians(d) for d in range(250, 109, -6))]
c.add(afuera + adentro, AMARILLO, 500)
for k, (x, y, s) in enumerate([(164, 40, 6), (176, 76, 4), (84, 34, 4)]):
    c.add([(x, y - s), (x + s * 0.3, y - s * 0.3), (x + s, y), (x + s * 0.3, y + s * 0.3), (x, y + s), (x - s * 0.3, y + s * 0.3), (x - s, y), (x - s * 0.3, y - s * 0.3)], HUESO, 501 + k, 0.2)
una('luna', c)

# Lluvia: una nube y dos capas de gotas que caen alternadas.
nube, g1, g2 = Capa(), Capa(), Capa()
for k, (x, y, rx, ry) in enumerate([(98, 60, 26, 18), (124, 50, 30, 24), (150, 62, 24, 16), (122, 70, 44, 14)]):
    nube.add(elipse(x, y, rx, ry), HUESO if k != 3 else mezcla(HUESO, CELESTE, 0.4), 520 + k)
gota = lambda x, y: [(x, y), (x + 5, y + 12), (x + 4, y + 17), (x, y + 19), (x - 4, y + 17), (x - 5, y + 12)]
for k, (x, y) in enumerate([(90, 92), (112, 104), (134, 90), (156, 102), (100, 126), (146, 124)]):
    g1.add(gota(x, y), LAPIS, 530 + k, 0.2)
    g2.add(gota(x + 11, y + 18), AZUL, 540 + k, 0.2)
guardar('lluvia', {'gotas-a': g1, 'gotas-b': g2, 'nube': nube})

# ---------- fondo Bosque (cielo húmedo, cerros con bosque y suelo de musgo) ----------
def fondo(nombre, capa):
    os.makedirs(os.path.join(SALIDA, 'bosque'), exist_ok=True)
    open(os.path.join(SALIDA, 'bosque', nombre + '.svg'), 'w').write(capa.svg('g_bosque_' + nombre.replace('-', '_')))

c = Capa(); c.add([(0, 0), (240, 0), (240, 240), (0, 240)], mezcla(CELESTE, HUESO, 0.35), 600, 0.0)
for k, (x, y, rx, ry) in enumerate([(50, 40, 34, 10), (78, 34, 24, 12), (180, 56, 40, 9), (200, 50, 22, 10)]):
    c.add(elipse(x, y, rx, ry), HUESO, 601 + k)
fondo('cielo', c)

def copas(base, alto, radio, color, color2, semilla, x0=-30, x1=270):
    """Cordón de cerros cubiertos de árboles: una fila de copas redondas sobre una loma."""
    r = random.Random(semilla); c = Capa()
    loma = [(x, base - alto * (0.5 + 0.5 * math.sin(x / 47 + semilla))) for x in range(x0, x1 + 1, 6)]
    c.add([(x0, 250)] + loma + [(x1, 250)], color, semilla)
    x = x0
    while x < x1:
        y = base - alto * (0.5 + 0.5 * math.sin(x / 47 + semilla))
        rr = radio * r.uniform(0.8, 1.2)
        c.add(elipse(x, y, rr, rr * r.uniform(0.9, 1.3)), color if r.random() < 0.6 else color2, semilla + int(x) + 300)
        x += rr * 1.3
    return c

fondo('cerro-lejano', copas(130, 26, 12, mezcla(LAPIS, CELESTE, 0.35), mezcla(LAPIS, CELESTE, 0.5), 610))
fondo('bosque-cercano', copas(165, 30, 16, VERDE_OSC, mezcla(VERDE, LAPIS, 0.4), 620))
c = Capa(); c.add([(-10, 250)] + [(x, 198 + 3 * math.sin(x / 13)) for x in range(-10, 251, 6)] + [(250, 250)], VERDE, 630)
for k in range(14):
    x = 8 + k * 17
    c.add(elipse(x, 204 + (k % 3) * 8, 7, 3), mezcla(VERDE, AMARILLO, 0.35), 640 + k)
fondo('suelo', c)
print('bocetos en', os.path.normpath(SALIDA))
