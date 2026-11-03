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
# El hombro va sobre la mitad delantera del lomo (no en la cadera) y el ala sube desde ahí, apenas inclinada hacia atrás.
# El mismo punto es el pivote de las alas en src/escenario/piezas.ts (HOMBROS).
HOMBROS = {'condor': (128, 116), 'gaviota': (126, 117), 'picaflor': (128, 116), 'carpintero': (126, 119)}

def ala(hombro, largo, ancho, inclinacion, dedos=0, largo_dedo=0.0, afinar=0.55, punta=0.0):
    """Ala levantada vista de lado. Sube desde el hombro inclinada `inclinacion` grados hacia atrás;
    el borde de ataque queda adelante. Con `dedos` termina en primarias separadas (cóndor, carpintero)."""
    a = math.radians(inclinacion)
    ux, uy = -math.sin(a), -math.cos(a)        # a lo largo del ala (arriba y un poco atrás)
    vx, vy = math.cos(a), -math.sin(a)         # hacia el borde de ataque (adelante)
    hx, hy = hombro
    n = 14
    ataque, fuga = [], []
    for i in range(n + 1):
        t = i / n
        cx, cy = hx + ux * largo * t, hy + uy * largo * t
        cuerda = ancho * (1 - afinar * t) * (1 - punta * t ** 3)
        ataque.append((cx + vx * cuerda * 0.32 * (1 + 0.35 * math.sin(math.pi * t)), cy + vy * cuerda * 0.32 * (1 + 0.35 * math.sin(math.pi * t))))
        fuga.append((cx - vx * cuerda * 0.68, cy - vy * cuerda * 0.68))
    pts = ataque[:]
    if dedos:
        # primarias: puntas que salen del extremo, abiertas en abanico hacia atrás
        ex, ey = hx + ux * largo, hy + uy * largo
        cuerda = ancho * (1 - afinar)
        for k in range(dedos):
            f = k / max(1, dedos - 1)
            bx = ex + vx * cuerda * (0.3 - 0.95 * f); by = ey + vy * cuerda * (0.3 - 0.95 * f)
            ang = a + math.radians(-8 + 34 * f)
            dx, dy = -math.sin(ang), -math.cos(ang)
            L = ancho * largo_dedo * (1 - 0.25 * abs(f - 0.35))
            w = cuerda / dedos * 0.42
            pts += [(bx + vx * w, by + vy * w), (bx + dx * L, by + dy * L), (bx - vx * w, by - vy * w)]
    pts += fuga[::-1]
    return pts

def franja_fuga(hombro, largo, ancho, inclinacion, desde, hasta, grosor, afinar=0.55):
    """Banda clara a lo largo del borde de fuga (las secundarias blancas del cóndor, el borde de la gaviota)."""
    a = math.radians(inclinacion)
    ux, uy = -math.sin(a), -math.cos(a); vx, vy = math.cos(a), -math.sin(a)
    hx, hy = hombro
    afuera, adentro = [], []
    for i in range(11):
        t = desde + (hasta - desde) * i / 10
        cx, cy = hx + ux * largo * t, hy + uy * largo * t
        cuerda = ancho * (1 - afinar * t)
        afuera.append((cx - vx * cuerda * 0.68, cy - vy * cuerda * 0.68))
        adentro.append((cx - vx * cuerda * (0.68 - grosor), cy - vy * cuerda * (0.68 - grosor)))
    return afuera + adentro[::-1]

def ave(pieza, cuerpo, sup, oscuro=None, semilla=1):
    """cuerpo: lista de (puntos, color) de atrás hacia adelante; sup: lista de (puntos, color) del ala de arriba.
    El ala de abajo es la de arriba reflejada en el hombro y un poco más oscura (queda detrás del cuerpo)."""
    hy = HOMBROS[pieza][1]
    c_cuerpo, c_sup, c_inf = Capa(), Capa(), Capa()
    for k, (pts, col) in enumerate(cuerpo): c_cuerpo.add(pts, col, semilla + k)
    hx = HOMBROS[pieza][0]
    for k, (pts, col) in enumerate(sup):
        c_sup.add(pts, col, semilla + 20 + k)
        # el ala lejana: reflejada en el hombro y un poco más chica, para que se lea detrás del cuerpo
        lejana = [(hx + (x - hx) * 0.84, hy + (y - hy) * 0.84) for x, y in espejo_y(pts, hy)]
        c_inf.add(lejana, oscuro.get(col, col) if oscuro else col, semilla + 40 + k)
    guardar(pieza, {'ala-inferior': c_inf, 'cuerpo': c_cuerpo, 'ala-superior': c_sup})

def pico_garfio(x, y, largo, alto, color):
    """Pico ganchudo de rapaz (cóndor): sale recto y la punta cae."""
    return ([(x, y - alto * 0.5), (x + largo * 0.7, y - alto * 0.45), (x + largo, y - alto * 0.1), (x + largo * 0.96, y + alto * 0.55),
             (x + largo * 0.82, y + alto * 0.2), (x + largo * 0.6, y + alto * 0.45), (x, y + alto * 0.5)], color)

# Cóndor (macho): negro, collar blanco esponjoso, cabeza desnuda con cresta (carúncula), primarias como dedos
# y las secundarias blancas en el borde de fuga del ala.
PIEL = mezcla(ROSA, MORADO, 0.35); CRESTA = mezcla(ROSA, MORADO, 0.62)
h = HOMBROS['condor']
ave('condor', [
    ([(82, 118), (52, 110), (46, 118), (50, 128), (82, 132)], NEGRO),                               # cola en abanico corto
    (elipse(116, 124, 42, 15, -3), NEGRO),                                                           # cuerpo
    (elipse(152, 118, 11, 12), HUESO),                                                              # collar
    (trazo([(154, 116), (162, 110)], 9), PIEL),                                                      # cuello desnudo
    (elipse(168, 108, 10, 8, -8), PIEL),                                                            # cabeza
    (elipse(166, 101, 8, 4.5, -10), CRESTA), (elipse(160, 103, 4, 3.5), CRESTA),                     # carúncula (cresta carnosa)
    pico_garfio(175, 110, 12, 7, HUESO),
    (elipse(170, 106, 1.8, 1.8), NEGRO),
], [
    (ala(h, 70, 40, 18, dedos=5, largo_dedo=0.72, afinar=0.5), NEGRO),
    (franja_fuga(h, 70, 40, 18, 0.1, 0.7, 0.32, afinar=0.5), HUESO),
], oscuro={NEGRO: NEGRO, HUESO: mezcla(HUESO, NEGRO, 0.35)}, semilla=11)

# Gaviota dominicana: cuerpo blanco grisáceo, manto y alas negras largas y en punta con borde de fuga blanco, pico amarillo.
GRIS_GAV = mezcla(HUESO, CELESTE, 0.3)
h = HOMBROS['gaviota']
ave('gaviota', [
    ([(90, 118), (66, 114), (64, 128), (90, 130)], GRIS_GAV),
    (elipse(118, 124, 36, 13, -3), GRIS_GAV),
    (elipse(152, 114, 12, 11), GRIS_GAV),
    ([(162, 111), (180, 113), (182, 117), (177, 119), (163, 118)], AMARILLO),
    (elipse(156, 111, 1.7, 1.7), NEGRO),
], [
    (ala(h, 78, 30, 28, afinar=0.62, punta=0.85), NEGRO),
    (franja_fuga(h, 78, 30, 28, 0.06, 0.62, 0.3, afinar=0.62), HUESO),
], oscuro={NEGRO: NEGRO, HUESO: mezcla(HUESO, NEGRO, 0.3)}, semilla=21)

# Picaflor de Arica: chiquito, lomo verde, pecho claro y garganta magenta; pico largo y apenas curvo;
# alas angostas que nacen del hombro y vibran.
h = HOMBROS['picaflor']
ave('picaflor', [
    ([(108, 136), (92, 156), (98, 160), (104, 152), (106, 162), (114, 142)], VERDE_OSC),            # cola
    (elipse(122, 128, 21, 11, -32), VERDE),                                                         # cuerpo inclinado (suspendido)
    (elipse(126, 134, 12, 7, -32), HUESO),                                                          # vientre claro
    (elipse(138, 116, 8, 7, -32), MORADO),                                                          # garganta
    (elipse(142, 108, 10, 9), VERDE),                                                               # cabeza
    (trazo([(150, 106), (166, 103), (180, 103), (190, 106)], [3.2, 2.4, 1.8, 1.2]), NEGRO),         # pico apenas curvo
    (elipse(145, 106, 1.6, 1.6), NEGRO),
], [
    (ala(h, 50, 14, 6, afinar=0.4, punta=0.6), mezcla(CELESTE, HUESO, 0.2)),
], oscuro={mezcla(CELESTE, HUESO, 0.2): mezcla(CELESTE, AZUL, 0.35)}, semilla=31)

# Carpintero negro (macho): negro, cabeza roja con copete hacia atrás, parche blanco en el ala, pico claro y recto.
CABEZA_ROJA = mezcla(ROSA, MORADO, 0.25)
h = HOMBROS['carpintero']
ave('carpintero', [
    ([(90, 126), (60, 134), (60, 142), (92, 136)], NEGRO),
    (elipse(120, 128, 32, 14, -6), NEGRO),
    (elipse(150, 114, 12, 12), CABEZA_ROJA),
    ([(142, 108), (128, 98), (138, 97), (132, 88), (147, 95), (157, 104)], CABEZA_ROJA),           # copete hacia atrás
    ([(160, 112), (182, 114), (160, 119)], mezcla(NEGRO, HUESO, 0.45)),
    (elipse(154, 111, 2.4, 2.4), HUESO), (elipse(154, 111, 1.2, 1.2), NEGRO),
], [
    (ala(h, 58, 34, 14, dedos=4, largo_dedo=0.4, afinar=0.45), NEGRO),
    (franja_fuga(h, 58, 34, 14, 0.15, 0.55, 0.3, afinar=0.45), HUESO),
], oscuro={NEGRO: NEGRO, HUESO: mezcla(HUESO, NEGRO, 0.35)}, semilla=41)

# Chucao: ave de suelo del bosque; espalda negra, pecho amarillo (en vez de rufo) y cola levantada. Salta.
cola_ch, cuerpo_ch = Capa(), Capa()
cola_ch.add([(104, 168), (88, 132), (82, 128), (84, 136), (96, 172)], NEGRO, 51)
cuerpo_ch.add(trazo([(118, 188), (114, 206)], 3), NEGRO, 52).add(trazo([(130, 188), (128, 206)], 3), NEGRO, 53)
cuerpo_ch.add(elipse(122, 172, 26, 18, -10), NEGRO, 54).add(elipse(134, 178, 15, 12, -10), AMARILLO, 55)
cuerpo_ch.add(elipse(144, 154, 11, 10), NEGRO, 56).add(elipse(148, 152, 3, 3), HUESO, 57).add(elipse(148, 152, 1.4, 1.4), NEGRO, 58)
cuerpo_ch.add([(154, 154), (164, 157), (154, 159)], NEGRO, 59, 0.3)
guardar('chucao', {'cola': cola_ch, 'cuerpo': cuerpo_ch})

# ---------- mamíferos (4 patas que giran en la cadera, como el pudú) ----------
# Las caderas (x de cada pata e y) son los pivotes de src/escenario/piezas.ts.
def pezuna(x, y):
    return [(x - 4, y - 6), (x + 4, y - 6), (x + 5.5, y), (x - 5.5, y)]

def cuadrupedo(pieza, color, color_lejano, patas_x, cadera_y, suelo_y, partes, pata_ancho=8, semilla=60, bajar=0):
    capas = {}
    for i, x in enumerate(patas_x):
        c = Capa()
        lejana = i in (1, 3)  # la 2 y la 4 quedan del otro lado del cuerpo
        c.add(trazo([(x, cadera_y), (x + 1.5, (cadera_y + suelo_y) / 2), (x, suelo_y - 5)], [pata_ancho + 3, pata_ancho, pata_ancho - 1.5]),
              color_lejano if lejana else color, semilla + i)
        c.add(pezuna(x, suelo_y), NEGRO, semilla + 10 + i, 0.3)
        capas[f'pata{i + 1}'] = c
    cuerpo = Capa()
    for k, (pts, col) in enumerate(partes): cuerpo.add(mover(pts, 0, bajar), col, semilla + 20 + k)
    guardar(pieza, {'pata1': capas['pata1'], 'pata2': capas['pata2'], 'pata3': capas['pata3'], 'pata4': capas['pata4'], 'cuerpo': cuerpo})

# Huemul (macho): ciervo del sur, robusto y de patas cortas. Orejas largas «de burro» con el interior claro,
# mancha oscura en Y sobre el hocico, garganta clara y astas que se bifurcan una sola vez (la punta de atrás más larga).
ASTA = mezcla(AMARILLO, HUESO, 0.35)
MORADO_LEJ = mezcla(MORADO, NEGRO, 0.25)
astas = []
for dx in (0, 7):
    astas += [(trazo([(168 + dx, 88), (169 + dx, 74), (168 + dx, 64)], [3.6, 3.2, 3]), ASTA),
              (trazo([(168 + dx, 66), (162 + dx, 52), (160 + dx, 40)], [3, 2.6, 2]), ASTA),
              (trazo([(168.5 + dx, 70), (176 + dx, 60), (179 + dx, 53)], [2.8, 2.4, 1.8]), ASTA)]
cuadrupedo('huemul', MORADO, MORADO_LEJ, [92, 104, 136, 148], 160, 206, [
    ([(80, 126), (72, 120), (70, 130), (76, 138)], MORADO),                                        # cola corta
    ([(76, 132), (72, 126), (74, 136)], HUESO),
    (elipse(120, 138, 44, 21, -3), MORADO),                                                        # cuerpo robusto
    (elipse(122, 154, 30, 5), mezcla(MORADO, HUESO, 0.45)),                                        # vientre
    ([(146, 126), (156, 104), (164, 94), (176, 100), (170, 116), (162, 134)], MORADO),            # cuello grueso
    (elipse(168, 116, 6, 4, -40), HUESO),                                                          # garganta clara
    *astas[3:],                                                                                    # el asta de atrás queda detrás de la oreja
    (elipse(160, 84, 13, 5, -55), MORADO_LEJ),                                                     # oreja de atrás
    ([(160, 96), (170, 88), (180, 92), (194, 103), (196, 109), (190, 113), (176, 110), (164, 106)], MORADO),  # cabeza, hocico afinado
    (elipse(194, 108, 3.2, 2.6), NEGRO),                                                           # nariz
    (trazo([(191, 106), (182, 99), (175, 93)], 2.2), NEGRO), (trazo([(182, 99), (182, 91)], 2), NEGRO),  # la Y
    (elipse(176, 97, 2.1, 2.1), NEGRO),
    *astas[:3],
    (elipse(166, 82, 14, 5.5, -70), MORADO), (elipse(166, 82, 9, 2.6, -70), HUESO),             # oreja larga
], pata_ancho=9, semilla=61, bajar=10)

# Guanaco: narigón, cuello largo y curvo, vientre blanco, cara gris; orejas en punta y cola que cae.
AMARILLO_LEJ = mezcla(AMARILLO, MORADO, 0.2)
cuadrupedo('guanaco', AMARILLO, AMARILLO_LEJ, [84, 96, 128, 140], 146, 210, [
    (trazo([(74, 124), (68, 130), (67, 140)], [7, 5.5, 3.5]), AMARILLO_LEJ),                       # cola que cae
    (elipse(110, 132, 42, 18, -2), AMARILLO),                                                      # cuerpo
    (elipse(114, 144, 30, 5.5), HUESO),                                                            # vientre blanco
    ([(132, 124), (138, 100), (144, 78), (150, 62), (164, 62), (160, 82), (154, 106), (150, 128)], AMARILLO),  # cuello
    (elipse(156, 45, 9, 3.4, -78), AMARILLO_LEJ), (elipse(162, 44, 9, 3.4, -96), AMARILLO),       # orejas
    ([(150, 60), (158, 50), (170, 51), (180, 56), (187, 62), (185, 70), (172, 71), (160, 68)], AMARILLO),  # cabeza
    ([(168, 54), (180, 56), (187, 62), (185, 70), (172, 71), (166, 64)], mezcla(NEGRO, HUESO, 0.5)),  # cara gris
    (elipse(184, 65, 5.5, 5), NEGRO),                                                              # la nariz grande
    (elipse(165, 56, 1.9, 1.9), NEGRO),
], pata_ancho=6.5, semilla=71)

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

# Concha de loco: forma de oreja (como un abalón), con el ápice enrollado atrás, costillas que salen del ápice,
# líneas de crecimiento concéntricas y el labio claro de la abertura ancha por debajo.
CAFE = mezcla(MORADO, AMARILLO, 0.45); CAFE_OSC = mezcla(CAFE, NEGRO, 0.3)
c = Capa()
borde = [(78, 170), (92, 154), (112, 146), (134, 146), (156, 154), (170, 168), (174, 186), (166, 202), (146, 211), (118, 213), (94, 208), (80, 196), (73, 182)]
c.add(borde, CAFE, 170)
c.add([(84, 200), (100, 208), (126, 212), (150, 210), (166, 202), (160, 212), (130, 218), (98, 215), (82, 206)], mezcla(HUESO, ROSA, 0.25), 171)  # labio
apice = (84, 168)
for k in (0.42, 0.7):
    arco = [(apice[0] + (x - apice[0]) * k, apice[1] + (y - apice[1]) * k) for x, y in borde[1:-1]]
    c.add(trazo(arco, 2.2), CAFE_OSC, 172 + int(k * 10))
for k, (x, y) in enumerate(borde[2:-1]):
    c.add(trazo([(apice[0] + (x - apice[0]) * 0.12, apice[1] + (y - apice[1]) * 0.12), (x - (x - apice[0]) * 0.05, y - (y - apice[1]) * 0.05)], [1.4, 3.2]), HUESO, 180 + k)
c.add(elipse(84, 168, 9, 7, -20), CAFE_OSC, 195).add(elipse(86, 167, 4.5, 3.5, -20), CAFE, 196)  # ápice enrollado
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

# Alerce: árbol muy alto y columnar del sur. Tronco recto de corteza rojiza y fibrosa (vetas verticales),
# sin ramas abajo; arriba ramas cortas con follaje denso en matas y una copa achatada.
c = Capa()
CORTEZA = mezcla(MORADO, ROSA, 0.25)
c.add(trazo([(120, 220), (120, 150), (121, 90), (120, 44)], [17, 14, 11, 7]), CORTEZA, 210)
for k, x in enumerate([-4, 0, 4]):
    c.add(trazo([(120 + x, 216), (120 + x * 0.9, 160), (120 + x * 0.7, 110)], 1.3), mezcla(CORTEZA, NEGRO, 0.3), 212 + k, 0.3)
r = random.Random(215)
for k, (y, lado, largo) in enumerate([(58, 1, 18), (72, -1, 24), (86, 1, 28), (100, -1, 30), (114, 1, 30), (128, -1, 26), (142, 1, 20)]):
    xf = 120 + lado * largo
    c.add(trazo([(120, y + 6), (xf, y)], 3.4), CORTEZA, 220 + k)
    for j in range(3):
        cx = 120 + lado * (largo * (0.35 + 0.33 * j)); cy = y - 2 + r.uniform(-3, 3)
        c.add(elipse(cx, cy, r.uniform(11, 15), r.uniform(7, 9), r.uniform(-15, 15)), VERDE_OSC if (k + j) % 2 else VERDE, 230 + k * 3 + j)
for k, (x, y, rx, ry) in enumerate([(112, 44, 16, 9), (130, 42, 14, 8), (120, 34, 12, 7)]):
    c.add(elipse(x, y, rx, ry), VERDE if k % 2 else VERDE_OSC, 260 + k)
una('alerce', c)

# Copihue: enredadera que se enrosca, hojas coriáceas en punta con nervio central y campanas colgantes
# de seis tépalos gruesos (se ven tres puntas), rojo rosado con motas claras y un cáliz verde arriba.
COPI = mezcla(ROSA, MORADO, 0.12); COPI_OSC = mezcla(ROSA, MORADO, 0.5)
def hoja(x, y, largo, ancho, ang):
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); vx, vy = -uy, ux
    pts = []
    for i in range(9):
        t = i / 8; w = math.sin(math.pi * t) ** 0.8 * ancho
        pts.append((x + ux * largo * t + vx * w, y + uy * largo * t + vy * w))
    for i in range(8, -1, -1):
        t = i / 8; w = math.sin(math.pi * t) ** 0.8 * ancho
        pts.append((x + ux * largo * t - vx * w, y + uy * largo * t - vy * w))
    return pts
c = Capa()
tallo = [(44 + t * 156, 46 + math.sin(t * 9) * 6 + t * 10) for t in (i / 30 for i in range(31))]
c.add(trazo(tallo, 3.2), VERDE_OSC, 230)
for k, (t, ang) in enumerate([(0.08, -40), (0.22, 35), (0.38, -35), (0.55, 40), (0.72, -30), (0.9, 30)]):
    x, y = tallo[int(t * 30)]
    c.add(hoja(x, y, 26, 7, ang), VERDE if k % 2 else VERDE_OSC, 231 + k)
    a = math.radians(ang)
    c.add(trazo([(x, y), (x + math.cos(a) * 20, y + math.sin(a) * 20)], 1), mezcla(VERDE, HUESO, 0.3), 237 + k, 0.2)
def campana(x, y, alto, semilla):
    c.add(trazo([(x - 1, y - 16), (x + 2, y - 8), (x, y)], 2), VERDE_OSC, semilla)                       # pedicelo
    c.add([(x - 5, y), (x - 11, y + alto * 0.35), (x - 16, y + alto * 0.8), (x - 13, y + alto), (x - 6, y + alto * 0.86),
           (x, y + alto * 1.05), (x + 6, y + alto * 0.86), (x + 13, y + alto), (x + 16, y + alto * 0.8), (x + 11, y + alto * 0.35), (x + 5, y)], COPI, semilla + 1)
    for dx in (-6, 6):
        c.add(trazo([(x + dx * 0.4, y + 3), (x + dx, y + alto * 0.85)], 1.4), COPI_OSC, semilla + 2 + dx, 0.2)  # junta de tépalos
    for k, (dx, f) in enumerate([(-8, 0.45), (-3, 0.62), (5, 0.4), (9, 0.7), (1, 0.8), (-10, 0.75)]):
        c.add(elipse(x + dx, y + alto * f, 1.3, 1.3), HUESO, semilla + 10 + k, 0.1)                  # motas
    c.add([(x - 6, y + 2), (x - 3, y - 6), (x, y + 2), (x + 3, y - 6), (x + 6, y + 2)], VERDE, semilla + 20)  # cáliz
for k, (t, alto) in enumerate([(0.3, 44), (0.5, 52), (0.8, 40)]):
    x, y = tallo[int(t * 30)]
    campana(x + 2, y + 22, alto, 245 + k * 30)
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
