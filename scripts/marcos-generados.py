#!/usr/bin/env python3
"""Genera shared/marcos-generados.ts: los marcos rehechos en la ronda 2 (plan 012, decisión D4: arte generado aquí).

Tienen prioridad sobre shared/marcos-figma.ts (que sigue saliendo de Figma con scripts/marcos-desde-figma.py y no se
edita a mano). Mismo formato: lienzo de 240, fondo, capas bajo la foto (`paths`), zona de foto y capas sobre la foto
(`encima`). Todos traen la zona de foto estándar: 150 × 150 al centro (45..195), así no necesitan la tabla AJUSTES.

Paleta Línea azul. Pixel: grilla de 2,5 u (los escalones grandes van de a 5 u), contorno negro.
Geométrica: figuras planas. Orgánica: bordes con pulso de tijera (papel recortado), como los de Figma.

Uso: python3 scripts/marcos-generados.py
Manifiesto: docs/plans/012-ui-herramientas/assets-fotomaton.manifest.md
"""
import json, math, os, random, re

HUESO, NEGRO, AZUL, LAPIS, CELESTE = '#F4EEE3', '#000000', '#0062B8', '#2B4BD8', '#7FC8F8'
AMARILLO, VERDE, ROSA, MORADO = '#FFC20E', '#00A651', '#FF8FB1', '#7A2E8E'
Z0, Z1 = 45, 195  # zona de foto estándar
FOTO = 'FOTO'

def num(v):
    return f'{round(v, 2):g}'

# ---------------------------------------------------------------- Pixel: grilla de celdas
class Grilla:
    """Grilla de 96 × 96 celdas de 2,5 u. Cada celda tiene un color (gana el último que pinta)."""
    def __init__(self, u=2.5):
        self.u, self.n = u, int(240 / u)
        self.c = [[None] * self.n for _ in range(self.n)]

    def celda(self, i, j, col):
        if 0 <= i < self.n and 0 <= j < self.n:
            self.c[j][i] = col

    def rect(self, x0, y0, x1, y1, col):
        """Rectángulo en unidades del lienzo (x1, y1 exclusivos)."""
        u = self.u
        for j in range(round(y0 / u), round(y1 / u)):
            for i in range(round(x0 / u), round(x1 / u)):
                self.celda(i, j, col)

    def donde(self, prueba, col, paso=5):
        """Pinta los bloques de `paso` u cuyo centro cumple la prueba (escalones parejos)."""
        k = round(paso / self.u)
        for bj in range(0, self.n, k):
            for bi in range(0, self.n, k):
                cx, cy = (bi + k / 2) * self.u, (bj + k / 2) * self.u
                if prueba(cx, cy):
                    for j in range(bj, bj + k):
                        for i in range(bi, bi + k):
                            self.celda(i, j, col)

    def sprite(self, x, y, filas, colores, escala=1):
        """Dibujo de texto: cada carácter es una celda (o escala × escala celdas). Espacio o '.' = vacío."""
        for j, f in enumerate(filas):
            for i, ch in enumerate(f):
                if ch in colores:
                    for dj in range(escala):
                        for di in range(escala):
                            self.celda(round(x / self.u) + i * escala + di, round(y / self.u) + j * escala + dj, colores[ch])

    def contorno(self, col=NEGRO, de=None, paso=1, fuera_de=None):
        """Contorno de `paso` celdas alrededor de las celdas `de` (por defecto, todas las pintadas)."""
        es = (lambda v: v is not None and v != FOTO) if de is None else (lambda v: v in de)
        base = [[es(v) for v in fila] for fila in self.c]
        for _ in range(paso):
            nuevo = [fila[:] for fila in base]
            for j in range(self.n):
                for i in range(self.n):
                    if base[j][i]:
                        continue
                    if any(0 <= i + di < self.n and 0 <= j + dj < self.n and base[j + dj][i + di] for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        if fuera_de is None or self.c[j][i] in fuera_de:
                            self.c[j][i] = col
                            nuevo[j][i] = True
            base = nuevo

    def paths(self, sin=()):
        """Un path por color, en orden de aparición, hecho de tramos horizontales."""
        orden, por = [], {}
        for j in range(self.n):
            i = 0
            while i < self.n:
                col = self.c[j][i]
                if col is None or col in sin:
                    i += 1
                    continue
                k = i
                while k < self.n and self.c[j][k] == col:
                    k += 1
                if col not in por:
                    por[col] = []
                    orden.append(col)
                u = self.u
                por[col].append(f'M{num(i * u)} {num(j * u)}H{num(k * u)}V{num((j + 1) * u)}H{num(i * u)}Z')
                i = k
        return [[''.join(por[c]), c] for c in orden]

FUENTE = {
    'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'C': ['###', '#..', '#..', '#..', '###'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'], 'G': ['###', '#..', '#.#', '#.#', '###'],
    'H': ['#.#', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'], 'I': ['###', '.#.', '.#.', '.#.', '###'], 'L': ['#..', '#..', '#..', '#..', '###'], 'Z': ['###', '..#', '.#.', '#..', '###'], 'J': ['..#', '..#', '..#', '#.#', '###'], 'K': ['#.#', '##.', '#..', '##.', '#.#'],
    'M': ['#.#', '###', '###', '#.#', '#.#'], 'N': ['###', '#.#', '#.#', '#.#', '#.#'], 'O': ['###', '#.#', '#.#', '#.#', '###'],
    'P': ['###', '#.#', '###', '#..', '#..'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'], 'S': ['###', '#..', '###', '..#', '###'],
    'T': ['###', '.#.', '.#.', '.#.', '.#.'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'], 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#.#', '#.#', '###', '###', '#.#'], 'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['###', '..#', '###', '#..', '###'], '6': ['###', '#..', '###', '#.#', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'], '8': ['###', '#.#', '###', '#.#', '###'], '3': ['###', '..#', '.##', '..#', '###'], '.': ['...', '...', '...', '...', '.#.'], '/': ['..#', '..#', '.#.', '#..', '#..'],
    ':': ['...', '.#.', '...', '.#.', '...'], '-': ['...', '...', '###', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
}

def texto(g, x, y, s, col, escala=1):
    for k, ch in enumerate(s):
        g.sprite(x + k * 4 * g.u * escala, y, FUENTE[ch], {'#': col}, escala)

def chico(t, x, y, s, col):
    """Texto en una grilla de 1,25 u (letras de 3,75 × 6,25 u)."""
    for k, ch in enumerate(s):
        t.sprite(x + k * 5, y, FUENTE[ch], {'#': col})

def ancho_chico(s):
    return len(s) * 5 - 1.25

def ancho_texto(s, u=2.5, escala=1):
    return (len(s) * 4 - 1) * u * escala

ZONA_CUADRO = f'M{Z0} {Z0}H{Z1}V{Z1}H{Z0}Z'

def marco(id_, visual, code, name, bg, paths, encima, zona=ZONA_CUADRO, reemplaza=''):
    return {'id': id_, 'visual': visual, 'code': code, 'name': name, 'bg': bg, 'zona': zona, 'caja': [Z0, Z0, Z1 - Z0, Z1 - Z0],
            'paths': paths, 'encima': encima, 'generado': True}

# ---------------------------------------------------------------- PM02 · Vinilo
def vinilo():
    g, sobre = Grilla(), Grilla()
    g.rect(0, 0, 240, 240, MORADO)
    # cuadros de la funda asomando en las esquinas
    for (x, y) in ((0, 0), (200, 0), (0, 200), (200, 200)):
        g.rect(x, y, x + 40, y + 40, MORADO)
    g.donde(lambda x, y: (x // 20 + y // 20) % 2 == 0 and math.hypot(x - 120, y - 120) > 122, LAPIS, 5)
    R = 119
    g.donde(lambda x, y: math.hypot(x - 120, y - 120) <= R, NEGRO, 5)
    # surcos: anillos finos un poco más claros (de a 2,5 u)
    for r in (86, 94, 102, 110):
        g.donde(lambda x, y, r=r: abs(math.hypot(x - 120, y - 120) - r) < 1.3, '#2A2A2A', 2.5)
    # brillos del disco: dos arcos en diagonal
    def brillo(x, y):
        d, a = math.hypot(x - 120, y - 120), math.degrees(math.atan2(y - 120, x - 120))
        return (abs(d - 98) < 1.3 or abs(d - 106) < 1.3) and (abs(a - (-135)) < 18 or abs(a - 45) < 18)
    g.donde(brillo, '#7A7A7A', 2.5)
    # borde de la etiqueta (amarillo) y la etiqueta = la foto
    g.donde(lambda x, y: math.hypot(x - 120, y - 120) <= 81, AMARILLO, 5)
    g.donde(lambda x, y: math.hypot(x - 120, y - 120) <= 76, FOTO, 5)
    zona = Grilla(); zona.c = [[FOTO if v == FOTO else None for v in fila] for fila in g.c]
    # brazo del tocadiscos (arriba a la derecha, sobre los surcos)
    sobre.rect(205, 10, 230, 35, '#BDB6AA')            # base
    sobre.rect(210, 15, 225, 30, HUESO)
    sobre.rect(215, 20, 220, 25, NEGRO)                # eje
    for k in range(5):                                 # brazo en diagonal hacia los surcos
        sobre.rect(207.5 - k * 2.5, 35 + k * 5, 212.5 - k * 2.5, 40 + k * 5, HUESO)
    sobre.rect(190, 57.5, 205, 67.5, HUESO)            # cápsula
    sobre.rect(192.5, 67.5, 197.5, 72.5, ROSA)         # aguja
    sobre.contorno(NEGRO)
    zona_d = ''.join(p for p, c in zona.paths() if c == FOTO)
    return marco('PM02', 'Pixel', 'M02', 'Vinilo', MORADO, g.paths(sin=(FOTO,)), sobre.paths(), zona=zona_d)

# ---------------------------------------------------------------- PM04 · Ventana web
def ventana():
    g, sobre = Grilla(), Grilla()
    # escritorio: celeste con una grilla de puntos hueso
    g.rect(0, 0, 240, 240, CELESTE)
    for y in range(0, 240, 20):
        for x in range(0, 240, 20):
            g.rect(x + 10, y + 10, x + 12.5, y + 12.5, HUESO)
    def caja(x0, y0, x1, y1, barra, sombra=True):
        if sombra:
            g.rect(x0 + 5, y0 + 5, x1 + 7.5, y1 + 7.5, NEGRO)   # sombra dura
        g.rect(x0 - 2.5, y0 - 2.5, x1 + 2.5, y1 + 2.5, NEGRO)
        g.rect(x0, y0, x1, y1, HUESO)
        g.rect(x0, y0, x1, y0 + 12.5, barra)
        g.rect(x0, y0 + 12.5, x1, y0 + 15, NEGRO)
    # dos ventanas de atrás, apiladas
    t = Grilla(1.25)
    caja(5, 2.5, 200, 195, AMARILLO)
    # ventana de adelante
    X0, X1, Y0, Y1 = 20, 230, 20, 225
    caja(X0, Y0, X1, Y1, AZUL)
    g.rect(X0, Y0, X1, 35, AZUL)                       # barra de pestañas (más alta)
    for k, col in enumerate((ROSA, AMARILLO, VERDE)):  # botones de la ventana
        g.rect(25 + k * 8.75, 25, 31.25 + k * 8.75, 31.25, col)
    g.rect(55, 22.5, 135, 35, HUESO)                   # pestaña activa
    g.rect(52.5, 22.5, 55, 35, NEGRO); g.rect(135, 22.5, 137.5, 35, NEGRO); g.rect(55, 20, 135, 22.5, NEGRO)
    chico(t, 60, 26.25, 'TU-FOTO.PNG', NEGRO)
    g.sprite(125, 26.25, ['#.#', '.#.', '#.#'], {'#': NEGRO})
    g.rect(140, 25, 192.5, 35, CELESTE)                # pestaña de atrás
    chico(t, 145, 27.5, 'SOMOS', AZUL)
    g.sprite(197.5, 26.25, ['.#.', '###', '.#.'], {'#': HUESO})  # nueva pestaña
    g.rect(X0, 35, X1, 37.5, NEGRO)
    # barra de dirección
    g.rect(X0, 37.5, X1, 45, HUESO)
    g.sprite(25, 38.75, ['.#', '##', '.#'], {'#': AZUL})
    g.sprite(32.5, 38.75, ['#.', '##', '#.'], {'#': '#BDB6AA'})
    g.rect(40, 37.5, 225, 45, '#FFFFFF')
    # texto chico (escala 1 de 2,5 u es muy alto para 7,5 u): la dirección va en celdas de la mitad
    for k, ch in enumerate('SOMOSDISENO.CL/TU-FOTO'):
        t.sprite(47.5 + k * 5, 38.75, FUENTE[ch], {'#': NEGRO})
    t.sprite(41.25, 38.75, ['.#.', '#.#', '###', '###', '###'], {'#': VERDE})
    # lado izquierdo: favoritos; derecho: barra de scroll
    for k, col in enumerate((AMARILLO, ROSA, VERDE, CELESTE, MORADO)):
        g.rect(25, 52.5 + k * 27.5, 40, 67.5 + k * 27.5, col)
        g.rect(25, 67.5 + k * 27.5, 40, 70 + k * 27.5, NEGRO)
    g.rect(205, 47.5, 222.5, 192.5, '#E4DDD0')
    g.rect(207.5, 50, 220, 57.5, '#BDB6AA'); g.rect(207.5, 182.5, 220, 190, '#BDB6AA')
    g.rect(207.5, 65, 220, 112.5, AZUL)
    # pie: me gusta y botón
    g.sprite(45, 205, ['.#.#.', '#####', '#####', '.###.', '..#..'], {'#': ROSA}, 1)
    chico(t, 57.5, 205, '128', NEGRO)
    g.rect(110, 200, 167.5, 215, AZUL); g.rect(110, 215, 170, 217.5, NEGRO); g.rect(167.5, 202.5, 170, 217.5, NEGRO)
    chico(t, 138.75 - ancho_chico('DESCARGAR') / 2, 205, 'DESCARGAR', HUESO)
    g.rect(Z0, Z0, Z1, Z1, FOTO)
    # puntero sobre el botón «Descargar», asomando a la foto
    puntero = ['#.......', '##......', '#o#.....', '#oo#....', '#ooo#...', '#oooo#..', '#ooooo#.', '#oo####.', '#o#o#...', '##.#o#..', '#...#o#.', '....##..']
    sobre.sprite(152.5, 207.5, puntero, {'#': NEGRO, 'o': '#FFFFFF'}, 1)
    # títulos de las ventanas de atrás (en lo que asoma de su barra)
    chico(t, 10, 5, 'DSGN.EXE', NEGRO)
    paths = g.paths(sin=(FOTO,)) + t.paths()
    return marco('PM04', 'Pixel', 'M04', 'Ventana web', CELESTE, paths, sobre.paths())

# ---------------------------------------------------------------- PM05 · Metro
ROJO = '#E2001A'  # el rojo de la franja del lateral de Figma (FA08 · Metro / Línea 1); no se recolorea
GRIS = '#5A5A5A'

def metro():
    """El frente de un tren de la Línea 1 (referencias de Amaro: el frente blanco del NS-93/NS-16 con la franja roja,
    parabrisas oscuro grande, letrero naranja de destino y número rojo arriba, dos faros redondos, paragolpes rojo),
    dibujado con el estilo Pixel de la web (contorno negro, carro hueso, franja roja y morada, vidrio morado con brillo
    celeste, luces amarillas) y los colores del lateral de Figma (juego-pixel/public/figma/metro-lateral.svg).
    La foto es el parabrisas. Sin el logo real del Metro: al centro, un rombo genérico."""
    g, sobre, t = Grilla(), Grilla(), Grilla(1.25)
    # túnel oscuro con luces de servicio amarillas y la vía abajo
    g.rect(0, 0, 240, 240, LAPIS)
    for y in range(0, 210, 30):
        g.rect(0, y + 12.5, 240, y + 15, AZUL)
    for x in (2.5, 230):
        for y in (25, 85, 145):
            g.rect(x, y, x + 7.5, y + 5, AMARILLO)
    g.rect(0, 227.5, 240, 240, NEGRO)
    g.rect(0, 230, 240, 232.5, GRIS); g.rect(0, 236.25, 240, 238.75, GRIS)
    # carrocería hueso con las esquinas de arriba redondeadas en escalones
    X0, X1, Y0, Y1 = 15, 225, 5, 227.5
    def tren(x, y):
        if not (X0 <= x < X1 and Y0 <= y < Y1):
            return False
        dx = min(x - X0, X1 - x); dy = y - Y0
        return not (dx < 20 and dy < 20 and (20 - dx) + (20 - dy) > 21)
    g.donde(tren, HUESO, 2.5)
    # techo oscuro (como el del frente real)
    g.donde(lambda x, y: tren(x, y) and y < 15, NEGRO, 2.5)
    # franja roja que viene del lateral y enmarca el frente por los costados
    g.rect(X0, 20, 25, 205, ROJO); g.rect(215, 20, X1, 205, ROJO)
    # parabrisas: vidrio oscuro con filo morado; arriba el letrero de destino; la foto ocupa el resto
    # (el vidrio va oscuro, como el real: así se lee como parabrisas en todas las paletas; el morado queda de filo)
    g.rect(32.5, 15, 207.5, Z1 + 5, MORADO)
    g.rect(35, 17.5, 205, Z1 + 2.5, NEGRO)
    g.rect(40, 22.5, 145, 37.5, '#2A2A2A')                               # letrero naranja (ámbar)
    chico(t, 92.5 - ancho_chico('SOMOS DISENO') / 2, 26.875, 'SOMOS DISENO', AMARILLO)
    g.rect(162.5, 20, 200, 40, ROJO)                                     # número de la línea, en rojo
    texto(g, 181.25 - ancho_texto('L1') / 2, 23.75, 'L1', HUESO)
    g.rect(Z0, Z0, Z1, Z1, FOTO)
    # brillo celeste del vidrio (sobre la foto). Sin limpiaparabrisas: la diagonal negra se leía como un error (B-011)
    sobre.rect(Z0, Z0, Z0 + 15, Z0 + 2.5, CELESTE); sobre.rect(Z0, Z0, Z0 + 2.5, Z0 + 12.5, CELESTE)
    # panel bajo: faros redondos (aro negro, luz amarilla y brillo) y un rombo genérico al centro
    for cx in (52.5, 187.5):
        g.donde(lambda x, y, cx=cx: math.hypot(x - cx, y - 211.25) <= 9, NEGRO, 2.5)
        g.donde(lambda x, y, cx=cx: math.hypot(x - cx, y - 211.25) <= 5.5, AMARILLO, 2.5)
        g.rect(cx - 2.5, 207.5, cx, 210, '#FFFFFF')
    g.donde(lambda x, y: abs(x - 120) + abs(y - 211.25) <= 7.5, ROJO, 2.5)
    g.donde(lambda x, y: abs(x - 120) + abs(y - 211.25) <= 2.5, HUESO, 2.5)
    # franja morada fina, paragolpes rojos en las esquinas, enganche y bajos negros
    g.rect(X0, 220, X1, 222.5, MORADO)
    g.rect(X0, 222.5, 50, 230, ROJO); g.rect(190, 222.5, X1, 230, ROJO)
    g.rect(50, 222.5, 190, 230, NEGRO)
    g.rect(105, 220, 135, 232.5, NEGRO); g.rect(112.5, 225, 127.5, 230, GRIS)
    g.contorno(NEGRO, de=(HUESO, ROJO, MORADO), fuera_de=(LAPIS, AZUL, AMARILLO))
    return marco('PM05', 'Pixel', 'M05', 'Metro', LAPIS, g.paths(sin=(FOTO,)) + t.paths(), sobre.paths())

# ---------------------------------------------------------------- PM06 · Señal
# Stickers de calle (ronda 3): como se ven pegados en un poste o una señal. «Slaps» con el borde blanco del troquel,
# unos encima de otros, medio arrancados (queda el papel blanco pegado con el borde roto), cinta de embalaje, el clásico
# «HELLO my name is» con un tag de plumón, un sticker de crew y un tag con plumón directo sobre la señal, con chorreo.
# Todo inventado (sin marcas reales), en grilla Pixel y paleta Línea azul.
PAPEL_PEGADO, CINTA = '#E4DDD0', '#ECE6DA'  # los dos quedan del color del papel en cada paleta

def pegar(dst, src):
    for j in range(dst.n):
        for i in range(dst.n):
            if src.c[j][i] is not None:
                dst.c[j][i] = src.c[j][i]

def slap(dst, pintar, borde=2, arrancado=None, semilla=1, contorno=True):
    """Un sticker: lo que dibuja `pintar`, el borde blanco del troquel y, si `arrancado(x, y)`, la parte que se
    arrancó: ahí queda el papel blanco pegado, con el borde roto (en dientes) y alguna fibra suelta."""
    s = Grilla(); pintar(s)
    s.contorno(HUESO, paso=borde)
    if arrancado:
        rnd = random.Random(semilla); u = s.u
        for j in range(s.n):
            for i in range(s.n):
                if s.c[j][i] is None:
                    continue
                x, y = (i + 0.5) * u, (j + 0.5) * u
                d = arrancado(x, y)  # > 0 dentro de lo arrancado (en unidades), < 0 fuera
                if d > rnd.uniform(-2.5, 3):
                    s.c[j][i] = PAPEL_PEGADO if d < 9 + rnd.uniform(0, 6) else None
    if contorno:
        s.contorno(NEGRO, paso=1)
    pegar(dst, s)

def recta(g, pts, col, grosor=1):
    """Trazo de plumón: une los puntos con celdas (grosor en celdas)."""
    u = g.u
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) / (u / 2)))
        for k in range(n + 1):
            x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n
            i, j = int(x / u), int(y / u)
            for di in range(grosor):
                for dj in range(grosor):
                    g.celda(i + di, j + dj, col)

def cinta(g, cx, cy, largo, ancho, ang, semilla=3):
    """Tira de cinta de embalaje girada, con los extremos cortados en dientes."""
    rnd = random.Random(semilla); a = math.radians(ang); co, si = math.cos(a), math.sin(a); u = g.u
    dientes = [rnd.uniform(0, 4) for _ in range(40)]
    for j in range(g.n):
        for i in range(g.n):
            x, y = (i + 0.5) * u - cx, (j + 0.5) * u - cy
            lu, lv = x * co + y * si, -x * si + y * co
            k = min(39, int((lv + ancho / 2) / 2.5)) if abs(lv) <= ancho / 2 else 0
            if abs(lv) <= ancho / 2 and abs(lu) <= largo / 2 - dientes[k]:
                g.c[j][i] = CINTA

def senal():
    g, sobre, t = Grilla(), Grilla(), Grilla(1.25)
    # muro de azulejos detrás (se ve en las esquinas)
    g.rect(0, 0, 240, 240, AZUL)
    for y in range(0, 240, 15):
        for x in range(-15 if (y // 15) % 2 else 0, 240, 30):
            g.rect(x + 2.5, y + 2.5, x + 27.5, y + 12.5, LAPIS)
    # la señal de advertencia, expandida: rombo amarillo con borde negro que se sale del cuadro
    g.donde(lambda x, y: abs(x - 120) + abs(y - 120) <= 178, NEGRO, 5)
    g.donde(lambda x, y: abs(x - 120) + abs(y - 120) <= 168, AMARILLO, 5)
    g.donde(lambda x, y: abs(x - 120) + abs(y - 120) <= 160, NEGRO, 5)
    g.donde(lambda x, y: abs(x - 120) + abs(y - 120) <= 155, AMARILLO, 5)
    # restos de stickers viejos ya arrancados, sobre la señal (papel blanco pegado)
    rnd = random.Random(11)
    for (x0, y0, x1, y1) in ((150, 12.5, 185, 35), (12.5, 105, 32.5, 140), (205, 120, 230, 150)):
        g.donde(lambda x, y, a=(x0, y0, x1, y1): a[0] <= x < a[2] and a[1] <= y < a[3] and rnd.random() > 0.18, PAPEL_PEGADO, 2.5)
    # tag con plumón directo sobre la señal (abajo a la derecha), con chorreo
    tag = [(198, 200), (204, 190), (208, 200), (212, 189), (216, 201), (222, 192), (226, 200)]
    recta(g, tag, NEGRO, 1); recta(g, [(196, 205), (228, 202)], NEGRO, 1)
    for x, y0, y1 in ((205, 205, 215), (217.5, 204, 220), (225, 203, 211)):
        recta(g, [(x, y0), (x, y1)], NEGRO, 1)
    # la foto es el pictograma: cuadro con borde negro
    g.rect(Z0 - 5, Z0 - 5, Z1 + 5, Z1 + 5, NEGRO)
    g.rect(Z0, Z0, Z1, Z1, FOTO)
    # tornillos de la señal
    for (x, y) in ((120, 15), (15, 120)):
        g.rect(x - 5, y - 5, x + 5, y + 5, '#BDB6AA'); g.rect(x - 2.5, y - 2.5, x + 2.5, y + 2.5, NEGRO)
    # letrero «ZONA DE DISENO» abajo, dentro del rombo
    g.rect(72.5, 202.5, 167.5, 215, NEGRO)
    chico(t, 120 - ancho_chico('ZONA DE DISENO') / 2, 205.625, 'ZONA DE DISENO', AMARILLO)

    # --- stickers pegados encima (asoman sobre las esquinas de la foto, sin tapar la cara)
    st = Grilla(1.25)
    # 1 · arriba a la derecha, abajo: uno viejo rosa medio arrancado; encima, un slap redondo amarillo con un ojo
    def viejo(s):
        s.rect(165, 40, 222.5, 75, ROSA)
        texto(s, 170, 50, 'XD', MORADO, 2)
    slap(sobre, viejo, arrancado=lambda x, y: (x - 165) * -0.7 + (y - 75) * 0.7 + 10, semilla=4)
    def ojo(s):
        s.donde(lambda x, y: math.hypot(x - 202.5, y - 32.5) <= 20, AMARILLO, 2.5)
        s.donde(lambda x, y: math.hypot((x - 202.5) / 1.5, y - 32.5) <= 7.5, HUESO, 2.5)
        s.donde(lambda x, y: math.hypot(x - 205, y - 32.5) <= 5, NEGRO, 2.5)
        s.rect(200, 27.5, 202.5, 30, HUESO)
    slap(sobre, ojo, semilla=5)
    # 2 · arriba a la izquierda: «HELLO my name is» con un tag de plumón, la esquina de abajo arrancada
    X0, X1, Y0 = 7.5, 87.5, 15
    def hello(s):
        s.rect(X0, Y0, X1, Y0 + 27.5, AZUL)
        texto(s, (X0 + X1) / 2 - ancho_texto('HELLO') / 2, Y0 + 2.5, 'HELLO', HUESO)
        s.rect(X0, Y0 + 27.5, X1, Y0 + 52.5, '#FFFFFF')
        s.rect(X0, Y0 + 52.5, X1, Y0 + 57.5, AZUL)
    slap(sobre, hello, borde=1, arrancado=lambda x, y: (x - X1) + (y - (Y0 + 57.5)) + 20, semilla=6)
    chico(st, (X0 + X1) / 2 - ancho_chico('MY NAME IS') / 2, Y0 + 18.75, 'MY NAME IS', HUESO)
    # el tag escrito con plumón en el blanco
    # (letras inclinadas, a mano: cada fila corrida media letra; subrayado con una cola)
    TAG = ['###..###..###.#..#',
           '#..#.#....#...##.#',
           '#..#..##..#.#.#.##',
           '#..#....#.#..##..#',
           '###..###..###.#..#']
    for k, fila in enumerate(TAG):
        sobre.sprite(17.5 + (4 - k) * 2.5, Y0 + 30 + k * 2.5, [fila], {'#': NEGRO})
    recta(sobre, [(15, Y0 + 47.5), (60, Y0 + 46), (70, Y0 + 42)], NEGRO, 1)
    # 3 · abajo a la izquierda: sticker de crew (rectángulo verde con estrella) sujeto con cinta
    def crew(s):
        s.rect(10, 165, 72.5, 200, VERDE)
        s.sprite(15, 172.5, ['..#..', '..#..', '#####', '.###.', '.#.#.'], {'#': AMARILLO}, 1)
        texto(s, 30, 172.5, 'CREW', HUESO)
        s.rect(15, 187.5, 65, 192.5, NEGRO)
        chico(st, 40 - ancho_chico('SOMOS 2026') / 2, 188.125, 'SOMOS 2026', HUESO)
    slap(sobre, crew, semilla=7)
    cinta(sobre, 62, 168, 34, 10, -38, semilla=8)
    # 4 · abajo a la derecha (borde de la foto): un sticker que alguien arrancó; queda el papel y un pedazo celeste
    def roto(s):
        s.rect(167.5, 160, 205, 195, CELESTE)
        texto(s, 172.5, 167.5, 'PX', AZUL, 2)
    slap(sobre, roto, arrancado=lambda x, y: (y - 160) * 0.9 - (x - 167.5) * 0.4 - 4, semilla=9)
    return marco('PM06', 'Pixel', 'M06', 'Señal', AZUL, g.paths(sin=(FOTO,)) + t.paths(), sobre.paths() + st.paths())

# ---------------------------------------------------------------- PM01 · propuestas de calle (T-012, en vez de «Pizarra»)
# Dos opciones para que Amaro elija (F-002: «quitarlo o cambiarlo por algo de la calle»). Ninguna entra a
# shared/marcos-generados.ts hasta que se elija: `python3 scripts/marcos-generados.py --propuestas <carpeta>` las dibuja
# como SVG con una foto de muestra. La elegida se suma a la lista de `__main__` con el id PM01 y se saca PM01 de
# RETIRADOS en shared/marcos.ts.

def tira_peligro(g, cx, cy, largo, ancho, ang, franja=7.5):
    """Cinta de peligro girada: franjas amarillas y negras a 45° de su eje."""
    a = math.radians(ang); co, si = math.cos(a), math.sin(a); u = g.u
    for j in range(g.n):
        for i in range(g.n):
            x, y = (i + 0.5) * u - cx, (j + 0.5) * u - cy
            lu, lv = x * co + y * si, -x * si + y * co
            if abs(lv) <= ancho / 2 and abs(lu) <= largo / 2:
                g.c[j][i] = AMARILLO if int((lu + lv + 1000) // franja) % 2 else NEGRO

def afiche():
    """Opción A · Afiche pegado: un afiche de papel engrudado en un muro de ladrillo, sobre otro viejo medio arrancado.
    La foto es la imagen del afiche; arriba el título, abajo las tiras para arrancar (como los avisos de los postes),
    dos ya arrancadas. Cinta de embalaje en las esquinas de arriba y la esquina de abajo despegada."""
    g, sobre, t = Grilla(), Grilla(), Grilla(1.25)
    # muro de ladrillos rosados con cantería morada
    g.rect(0, 0, 240, 240, MORADO)
    for k, y in enumerate(range(0, 240, 15)):
        for x in range(-20 if k % 2 else 0, 240, 40):
            g.rect(x + 2.5, y + 2.5, x + 37.5, y + 12.5, ROSA)
    # afiche viejo amarillo (asoma arriba a la derecha), arrancado: queda el papel pegado
    def viejo(s):
        s.rect(140, 0, 240, 110, AMARILLO)
        texto(s, 165, 10, 'XX', NEGRO, 2)
    slap(g, viejo, borde=0, arrancado=lambda x, y: (x - 150) * -0.5 + (y - 95) * 0.9 + 22, semilla=21, contorno=False)
    # el afiche: papel hueso con sombra negra
    g.rect(27.5, 10, 217.5, 237.5, NEGRO)
    g.rect(25, 7.5, 215, 235, HUESO)
    # título arriba y la imagen (la foto) con borde negro
    texto(g, 120 - ancho_texto('SOMOS DISENO') / 2, 25, 'SOMOS DISENO', NEGRO)
    g.rect(Z0 - 2.5, Z0 - 2.5, Z1 + 2.5, Z1 + 2.5, NEGRO)
    g.rect(Z0, Z0, Z1, Z1, FOTO)
    # tiras para arrancar: 8 tiras con texto chico; la 3 y la 6 ya no están
    g.rect(25, 200, 215, 202.5, NEGRO)
    for k in range(8):
        x0 = 25 + k * 23.75
        if k in (2, 5):
            g.rect(x0 + 2.5, 202.5, x0 + 23.75, 207.5, PAPEL_PEGADO)
            g.rect(x0 + 2.5, 207.5, x0 + 23.75, 235, ROSA)
            continue
        if k:
            g.rect(x0, 202.5, x0 + 2.5, 235, NEGRO)          # el corte entre tiras
        chico(t, x0 + 10, 207.5, 'S', AZUL); chico(t, x0 + 10, 216.25, 'D', AZUL); chico(t, x0 + 10, 225, '2', AZUL)
    g.contorno(NEGRO, de=(HUESO, PAPEL_PEGADO), fuera_de=(ROSA, MORADO))
    # cinta de embalaje en las esquinas de arriba (encima de todo)
    cinta(sobre, 30, 12, 34, 10, -40, semilla=22)
    cinta(sobre, 210, 12, 34, 10, 40, semilla=23)
    return marco('PM01', 'Pixel', 'M01', 'Afiche', MORADO, g.paths(sin=(FOTO,)) + t.paths(), sobre.paths())

def obra():
    """Opción B · Obra: la foto asoma por un hueco de una valla de obra (planchas de zinc pintadas), con una barrera
    de franjas y su baliza abajo, el letrero «ZONA EN OBRA» arriba y una cinta de peligro cruzando una esquina de la foto."""
    g, sobre = Grilla(), Grilla()
    # valla de zinc: ondas verticales azul y lapislázuli, con uniones y tornillos
    g.rect(0, 0, 240, 240, AZUL)
    for x in range(0, 240, 10):
        g.rect(x + 5, 0, x + 7.5, 240, LAPIS)
    for x in range(0, 240, 60):
        g.rect(x, 0, x + 2.5, 240, NEGRO)
        for y in (12.5, 117.5, 222.5):
            g.rect(x + 5, y, x + 7.5, y + 2.5, HUESO)
    # el hueco: borde negro y la foto
    g.rect(Z0 - 5, Z0 - 5, Z1 + 5, Z1 + 5, NEGRO)
    g.rect(Z0, Z0, Z1, Z1, FOTO)
    # letrero arriba: amarillo con borde negro
    g.rect(57.5, 10, 182.5, 37.5, NEGRO)
    g.rect(60, 12.5, 180, 35, AMARILLO)
    texto(g, 120 - ancho_texto('ZONA EN OBRA') / 2, 17.5, 'ZONA EN OBRA', NEGRO)
    # barrera abajo: tablón de franjas sobre dos patas, con una baliza amarilla
    for x in (40, 192.5):
        g.rect(x, 205, x + 7.5, 237.5, HUESO)
        g.rect(x - 7.5, 232.5, x + 15, 237.5, HUESO)
    bar = Grilla(); tira_peligro(bar, 120, 212.5, 220, 17.5, 0, franja=10)
    for j in range(bar.n):
        for i in range(bar.n):
            if bar.c[j][i] is not None:
                g.c[j][i] = bar.c[j][i]
    g.rect(200, 185, 215, 202.5, AMARILLO); g.rect(197.5, 200, 217.5, 205, NEGRO)  # baliza
    g.rect(202.5, 187.5, 205, 192.5, '#FFFFFF')
    g.contorno(NEGRO, de=(HUESO, AMARILLO), fuera_de=(AZUL, LAPIS))
    # cinta de peligro cruzando la esquina de abajo a la izquierda de la foto (encima)
    tira_peligro(sobre, 40, 168, 96, 12.5, 45)
    sobre.contorno(NEGRO)
    return marco('PM01', 'Pixel', 'M01', 'Obra', AZUL, g.paths(sin=(FOTO,)), sobre.paths())

def svg_muestra(m):
    """El marco como SVG con una foto de muestra (silueta) en la zona, para ver la propuesta."""
    capas = ''.join(f'<path d="{d}" fill="{c}"/>' for d, c in m['paths'])
    encima = ''.join(f'<path d="{d}" fill="{c}"/>' for d, c in m['encima'])
    foto = (f'<clipPath id="z"><path d="{m["zona"]}"/></clipPath><g clip-path="url(#z)">'
            f'<rect x="{Z0}" y="{Z0}" width="{Z1 - Z0}" height="{Z1 - Z0}" fill="{CELESTE}"/>'
            f'<circle cx="120" cy="105" r="28" fill="{AZUL}"/><ellipse cx="120" cy="200" rx="58" ry="52" fill="{AZUL}"/></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="720" height="720" shape-rendering="crispEdges">'
            f'<rect width="240" height="240" fill="{m["bg"]}"/>{capas}{foto}{encima}</svg>')

# ---------------------------------------------------------------- vectores (Geométrica y Orgánica)
def poli(pts):
    return 'M' + 'L'.join(f'{num(x)} {num(y)}' for x, y in pts) + 'Z'

def circulo(cx, cy, r, n=96):
    return poli([(cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)])

def sector(cx, cy, r0, r1, a0, a1, n=12):
    ext = [(cx + r1 * math.cos(a0 + (a1 - a0) * k / n), cy + r1 * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]
    inn = [(cx + r0 * math.cos(a1 - (a1 - a0) * k / n), cy + r0 * math.sin(a1 - (a1 - a0) * k / n)) for k in range(n + 1)]
    return poli(ext + inn)

# GM02 · Estallido: anillos de cuñas alternadas (damero polar) que nacen en el borde de la foto redonda.
# Antes el hueco cuadrado de Figma con el paspartú cortaba el tercer anillo; ahora cada anillo termina en un círculo.
def estallido():
    paths = []
    anillos = [(80, 100, 16, 0), (100, 128, 16, 0.5), (128, 175, 16, 0)]
    claras = []
    for r0, r1, n, desfase in anillos:
        for k in range(n):
            if k % 2:
                continue
            a0 = 2 * math.pi * (k + desfase) / n - math.pi / 2
            claras.append(sector(120, 120, r0, r1, a0, a0 + 2 * math.pi / n))
    paths.append([''.join(claras), CELESTE])
    # rayos rosados en las esquinas
    rayos = []
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        rayos.append(sector(120, 120, 140, 168, a - 0.1, a + 0.1, 4))
    paths.append([''.join(rayos), ROSA])
    paths.append([sector(120, 120, 75, 80.5, 0, 2 * math.pi, 96), ROSA])  # filo de la foto
    zona = circulo(120, 120, 75, 96)
    m = marco('GM02', 'Geométrica', 'M02', 'Estallido', MORADO, paths, [], zona=zona)
    return m

# GM06 · Diamante: una gema vista desde arriba. La foto es la mesa; las facetas bajan hacia un octógono que llena el
# cuadro, en claros y oscuros alternados; destellos de 4 puntas en las esquinas.
def diamante():
    A, B = 45, 195
    oct_ = [(70, 0), (170, 0), (240, 70), (240, 170), (170, 240), (70, 240), (0, 170), (0, 70)]
    mesa = [(A, A), (120, A), (B, A), (B, 120), (B, B), (120, B), (A, B), (A, 120)]
    # facetas: entre cada punto de la mesa y dos vértices del octógono
    tonos = [CELESTE, AZUL, LAPIS, CELESTE, AZUL, LAPIS, CELESTE, AZUL]
    capas = {CELESTE: [], AZUL: [], LAPIS: [], AMARILLO: []}
    # corona: triángulos mesa[i], oct[i], oct[i+1] y mesa[i], mesa[i+1], oct[i+1]
    for i in range(8):
        m0, m1 = mesa[i], mesa[(i + 1) % 8]
        o0, o1 = oct_[i], oct_[(i + 1) % 8]
    # reparto que se lee como gema: cada lado del cuadro tiene una faceta clara y una oscura
    pts_o = oct_
    caras = [
        ((A, A), (70, 0), (120, A), AMARILLO), ((120, A), (70, 0), (170, 0), CELESTE), ((120, A), (170, 0), (B, A), AZUL),
        ((B, A), (170, 0), (240, 70), LAPIS), ((B, A), (240, 70), (B, 120), CELESTE), ((B, 120), (240, 70), (240, 170), AZUL),
        ((B, 120), (240, 170), (B, B), LAPIS), ((B, B), (240, 170), (170, 240), AZUL), ((B, B), (170, 240), (120, B), LAPIS),
        ((120, B), (170, 240), (70, 240), AZUL), ((120, B), (70, 240), (A, B), LAPIS), ((A, B), (70, 240), (0, 170), AZUL),
        ((A, B), (0, 170), (A, 120), CELESTE), ((A, 120), (0, 170), (0, 70), AZUL), ((A, 120), (0, 70), (A, A), CELESTE),
        ((A, A), (0, 70), (70, 0), AMARILLO),
    ]
    for a, b, c, col in caras:
        capas[col].append(poli([a, b, c]))
    paths = [[''.join(v), k] for k, v in capas.items() if v]
    # aristas finas (hueso) entre facetas
    aristas = []
    for p in mesa:
        pass
    def linea(p, q, w=1.6):
        dx, dy = q[0] - p[0], q[1] - p[1]; L = math.hypot(dx, dy); nx, ny = -dy / L * w / 2, dx / L * w / 2
        return poli([(p[0] + nx, p[1] + ny), (q[0] + nx, q[1] + ny), (q[0] - nx, q[1] - ny), (p[0] - nx, p[1] - ny)])
    for a, b, c, _ in caras:
        aristas += [linea(a, b), linea(b, c)]
    paths.append([''.join(aristas), HUESO])
    # destellos de 4 puntas en las esquinas negras
    def destello(cx, cy, r):
        k = r * 0.22
        return poli([(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k), (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)])
    paths.append([destello(24, 24, 16) + destello(216, 216, 16) + destello(222, 30, 9) + destello(18, 214, 9), AMARILLO])
    # filo de la mesa
    paths.append([poli([(A - 4, A - 4), (B + 4, A - 4), (B + 4, B + 4), (A - 4, B + 4)]), HUESO])
    return marco('GM06', 'Geométrica', 'M06', 'Diamante', NEGRO, paths, [])

# OM06 · Diamante orgánico: se queda el rombo de Figma y las flores de las esquinas pasan a ser hojas de papel recortado.
def hoja_papel(cx, cy, largo, ancho, ang, rnd, n=40):
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        # hoja: punta aguda en ambos extremos
        x = math.cos(t) * largo / 2
        y = math.sin(t) * ancho / 2 * (1 - 0.35 * math.cos(t) ** 2)
        y *= 1 + (rnd.random() - 0.5) * 0.08
        x *= 1 + (rnd.random() - 0.5) * 0.03
        ca, sa = math.cos(ang), math.sin(ang)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return poli(pts)

def nervio(cx, cy, largo, ang, w=1.3):
    ca, sa = math.cos(ang), math.sin(ang)
    p = (cx - ca * largo * 0.38, cy - sa * largo * 0.38); q = (cx + ca * largo * 0.38, cy + sa * largo * 0.38)
    nx, ny = -sa * w, ca * w
    return poli([(p[0] + nx, p[1] + ny), (q[0], q[1]), (p[0] - nx, p[1] - ny)])

def blob(cx, cy, r, rnd, n=36, pulso=0.12):
    f1, f2 = rnd.random() * 6, rnd.random() * 6
    return poli([(cx + math.cos(2 * math.pi * k / n) * r * (1 + pulso * math.sin(3 * 2 * math.pi * k / n + f1) * 0.5 + pulso * 0.3 * math.sin(5 * 2 * math.pi * k / n + f2)),
                  cy + math.sin(2 * math.pi * k / n) * r * (1 + pulso * math.sin(3 * 2 * math.pi * k / n + f1) * 0.5 + pulso * 0.3 * math.sin(5 * 2 * math.pi * k / n + f2))) for k in range(n)])

def diamante_organico(figma):
    base = next(m for m in figma if m['id'] == 'OM06')
    rombo = base['paths'][-3:]  # el rombo escalonado (amarillo, rosa, negro); las 4 flores eran las capas anteriores
    rnd = random.Random(6)
    verdes, claros, semillas = [], [], []
    for (cx, cy, giro) in ((32, 32, 0), (208, 32, math.pi / 2), (208, 208, math.pi), (32, 208, -math.pi / 2)):
        # ramita: tres hojas que salen de la esquina, y una semilla
        for k, (dl, da) in enumerate(((0, -0.55), (6, 0), (0, 0.55))):
            ang = giro + math.pi / 4 + da
            hx, hy = cx - 14 * math.cos(giro + math.pi / 4) + math.cos(ang) * 16, cy - 14 * math.sin(giro + math.pi / 4) + math.sin(ang) * 16
            largo = 30 if k == 1 else 24
            verdes.append(hoja_papel(hx, hy, largo, 12, ang, rnd))
            claros.append(nervio(hx, hy, largo, ang))
        semillas.append(blob(cx + 8 * math.cos(giro + math.pi / 4), cy + 8 * math.sin(giro + math.pi / 4), 5, rnd, 20, 0.2))
    paths = [[''.join(verdes), VERDE], [''.join(claros), '#9BD7A8'], [''.join(semillas), CELESTE]] + [list(p) for p in rombo]
    m = dict(base); m.update({'paths': paths, 'generado': True, 'encima': base['encima']})
    m['zona'], m['caja'] = base['zona'], base['caja']
    m['ajustado'] = False  # usa el ajuste de Figma (rombo) de shared/marcos.ts
    return m

def leer_figma():
    ruta = os.path.join(os.path.dirname(__file__), '..', 'shared', 'marcos-figma.ts')
    s = open(ruta, encoding='utf-8').read()
    return json.loads(s[s.index('['):s.rindex(']') + 1])

if __name__ == '__main__':
    import sys
    if len(sys.argv) == 3 and sys.argv[1] == '--propuestas':  # T-012: dibuja las opciones de PM01 sin tocar el .ts
        for m in (afiche(), obra()):
            ruta = os.path.join(sys.argv[2], f"propuesta-{m['name'].lower()}.svg")
            open(ruta, 'w', encoding='utf-8').write(svg_muestra(m))
            print(ruta)
        sys.exit()
    figma = leer_figma()
    marcos = [estallido(), diamante(), diamante_organico(figma), vinilo(), ventana(), metro(), senal()]
    salida = os.path.join(os.path.dirname(__file__), '..', 'shared', 'marcos-generados.ts')
    with open(salida, 'w', encoding='utf-8') as f:
        f.write('// GENERADO por scripts/marcos-generados.py (plan 012, arte generado; no editar a mano).\n')
        f.write('// Tienen prioridad sobre shared/marcos-figma.ts. Manifiesto: docs/plans/012-ui-herramientas/assets-fotomaton.manifest.md\n')
        f.write('export const MARCOS_GENERADOS = ' + json.dumps(marcos, ensure_ascii=False, separators=(',', ':')).replace('},{', '},\n{') + ' as const;\n')
    for m in marcos:
        print(m['id'], m['name'], 'capas', len(m['paths']), 'encima', len(m['encima']), 'bytes', len(json.dumps(m)))
