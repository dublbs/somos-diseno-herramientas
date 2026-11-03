#!/usr/bin/env python3
"""Genera las plantillas de stencil del Graffiti (2 capas) desde los SVG pixel de Figma y la fuente pixel.

Capa 1 (base): la silueta completa. Capa 2 (detalle): contorno y los colores de detalle de cada figura.
«Diseño» sale de shared/pixelfont.ts: capa 1 es la letra engrosada una celda (el bloque), capa 2 la letra.

Salida:
- graffiti/src/data/stencils.ts (máscaras; GENERADO, no editar a mano)
- graffiti/public/figma/stencils/<id>.svg (vista previa con las dos capas)
Además, la textura del rodillo: el patrón P12 «Trazos de rodillo» (Figma 510:1200) en una grilla de 24 × 24,
donde el hueso es la veta que el rodillo deja sin pintar.
Uso: python3 graffiti/scripts/generar-stencils.py
"""
import html, os, re
import xml.etree.ElementTree as ET

RAIZ = os.path.join(os.path.dirname(__file__), '..', '..')
SVG = '{http://www.w3.org/2000/svg}'

# id, nombre, SVG de Figma, nodo, tamaño de celda en el SVG, ids que van a la capa 2.
FIGURAS = [
    ('alien', 'Alien', 'graffiti/public/figma/stickers/personaje.svg', '510:1273 FA10 · Personaje', 8, {'contorno', 'color hueso'}),
    ('lata', 'Lata', 'graffiti/public/figma/stickers/spray.svg', '510:1266 FA09 · Spray', 8, {'contorno', 'color rosa'}),
    ('metro', 'Metro', 'hub-estacion/public/figma/metro/linea1-frente.svg', 'FA08 · Metro / Línea 1 · frente', 10, {'contorno', 'color negro', 'color amarillo'}),
]

def texto(s):
    s = html.unescape(s)
    try: return s.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError): return s

def poligonos(d):
    """Subcaminos de un path rectilíneo absoluto (M H V L Z de Figma) como listas de vértices."""
    toks = re.findall(r'[MHVLZmhvlz]|-?\d*\.?\d+', d)
    polys, cur, x, y, cmd, i = [], [], 0.0, 0.0, None, 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            if t in 'Zz' and cur: polys.append(cur); cur = []
            i += 1; continue
        if cmd == 'M': x, y = float(t), float(toks[i + 1]); i += 2; cur = [(x, y)]; cmd = 'L'
        elif cmd == 'L': x, y = float(t), float(toks[i + 1]); i += 2; cur.append((x, y))
        elif cmd == 'H': x = float(t); i += 1; cur.append((x, y))
        elif cmd == 'V': y = float(t); i += 1; cur.append((x, y))
        else: raise SystemExit(f'comando no soportado: {cmd}')
    if cur: polys.append(cur)
    return polys

def dentro(px, py, polys):
    # Par-impar sobre todos los subcaminos (los huecos de Figma quedan huecos).
    n = 0
    for p in polys:
        for (x1, y1), (x2, y2) in zip(p, p[1:] + p[:1]):
            if (y1 > py) != (y2 > py) and px < x1 + (py - y1) * (x2 - x1) / (y2 - y1): n += 1
    return n % 2 == 1

def figura(ruta, celda, detalle):
    raiz = ET.parse(os.path.join(RAIZ, ruta)).getroot()
    fig = next(g for g in raiz.iter(SVG + 'g') if texto(g.get('id', '')) == 'Figura')
    capas = []  # (es_detalle, polígonos)
    def recorrer(e, grupo):
        idb = re.sub(r'_\d+$', '', texto(e.get('id', ''))) or grupo
        tag = e.tag.replace(SVG, '')
        if tag == 'g':
            for h in e: recorrer(h, idb)
        elif tag == 'path':
            capas.append((idb in detalle, poligonos(e.get('d'))))
        elif tag == 'rect':
            x, y, w, h = (float(e.get(k, 0)) for k in ('x', 'y', 'width', 'height'))
            capas.append((idb in detalle, [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]]))
    for h in fig: recorrer(h, '')
    n = 240 // celda
    m = [[0] * n for _ in range(n)]
    for fy in range(n):
        for fx in range(n):
            cx, cy = (fx + .5) * celda, (fy + .5) * celda
            for es_det, polys in capas:
                if dentro(cx, cy, polys): m[fy][fx] |= 1 | (2 if es_det else 0)
    return recortar(m)

def recortar(m):
    filas = [y for y, f in enumerate(m) if any(f)]
    cols = [x for x in range(len(m[0])) if any(f[x] for f in m)]
    return [f[cols[0]:cols[-1] + 1] for f in m[filas[0]:filas[-1] + 1]]

def palabra(t):
    fuente = open(os.path.join(RAIZ, 'shared', 'pixelfont.ts'), encoding='utf-8').read()
    glifos = {}
    for k, v in re.findall(r'^\s+"?([^":\s]+)"?: "([01 ]+)",', fuente, re.M): glifos[k] = v.split(' ')
    ancho = len(t) * 6 - 1
    letra = [[0] * (ancho + 2) for _ in range(9)]
    for i, ch in enumerate(t):
        for y, fila in enumerate(glifos[ch]):
            for x, b in enumerate(fila):
                if b == '1': letra[y + 1][i * 6 + x + 1] = 1
    m = [[0] * (ancho + 2) for _ in range(9)]
    for y in range(9):
        for x in range(ancho + 2):
            if letra[y][x]: m[y][x] = 3
            elif any(letra[yy][xx] for yy in range(max(0, y - 1), min(9, y + 2)) for xx in range(max(0, x - 1), min(ancho + 2, x + 2))): m[y][x] = 1
    return m

def textura_rodillo():
    raiz = ET.parse(os.path.join(RAIZ, 'graffiti/public/figma/muros/trazos-rodillo.svg')).getroot()
    vetas = [poligonos(e.get('d')) for e in raiz.iter(SVG + 'path') if (e.get('fill') or '').upper() == '#F4EEE3']
    return [''.join('0' if any(dentro((x + .5) * 10, (y + .5) * 10, v) for v in vetas) else '1' for x in range(24)) for y in range(24)]

def vista(m):
    h, w = len(m), len(m[0]); s = 8
    rects = {1: [], 2: []}
    for y, f in enumerate(m):
        for x, v in enumerate(f):
            if v: rects[2 if v & 2 else 1].append(f'M{x * s} {y * s}h{s}v{s}h-{s}z')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * s}" height="{h * s}" viewBox="0 0 {w * s} {h * s}" shape-rendering="crispEdges">'
            f'<path id="capa-1" fill="#2B4BD8" d="{"".join(rects[1])}"/><path id="capa-2" fill="#FFC20E" d="{"".join(rects[2])}"/></svg>\n')

if __name__ == '__main__':
    plantillas = [(i, nom, org, figura(ruta, celda, det)) for i, nom, ruta, org, celda, det in FIGURAS]
    plantillas.insert(1, ('diseno', 'Diseño', 'shared/pixelfont.ts', palabra('DISEÑO')))
    carpeta = os.path.join(RAIZ, 'graffiti', 'public', 'figma', 'stencils'); os.makedirs(carpeta, exist_ok=True)
    with open(os.path.join(RAIZ, 'graffiti', 'src', 'data', 'stencils.ts'), 'w', encoding='utf-8') as f:
        f.write('// GENERADO por graffiti/scripts/generar-stencils.py (no editar a mano).\n')
        f.write('// Cada fila: 0 = cubierto, 1 = hueco de la capa 1 (base), 3 = hueco de las capas 1 y 2 (detalle).\n')
        f.write('export interface Plantilla { id: string; nombre: string; origen: string; filas: string[] }\n')
        f.write('export const PLANTILLAS: Plantilla[] = [\n')
        for i, nom, org, m in plantillas:
            filas = ', '.join("'" + ''.join(str(v) for v in fila) + "'" for fila in m)
            f.write(f"  {{ id: '{i}', nombre: '{nom}', origen: '{org}', filas: [{filas}] }},\n")
            with open(os.path.join(carpeta, f'{i}.svg'), 'w') as s: s.write(vista(m))
            print(i, f'{len(m[0])}×{len(m)}', 'capa 1:', sum(v > 0 for r in m for v in r), 'capa 2:', sum(v & 2 > 0 for r in m for v in r))
        f.write('];\n')
        f.write('// Rodillo: 1 = pinta, 0 = veta (P12 · Trazos de rodillo, 510:1200). Se repite cada 24 celdas.\n')
        f.write('export const TEXTURA_RODILLO = [' + ', '.join(f"'{r}'" for r in textura_rodillo()) + '];\n')
