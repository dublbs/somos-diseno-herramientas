#!/usr/bin/env python3
"""Convierte los 15 marcos exportados de Figma (SVG) en shared/marcos-figma.ts.

Figma («Figraphic», Yo9o3ZG2lyaEGcyxoxs89R): cada marco tiene las capas Fondo, Figura y la zona de foto
(«Foto», «Foto · fondo» o «Foto (relleno de imagen)»). La silueta de muestra («Persona de muestra»,
«silueta (reemplazar por foto)», «Foto · figura», y en Orgánica «Hombros», «Cuello», «Cabeza») no se copia.
Lo que en Figma va después de la zona de foto (contornos, enredaderas) queda en `encima`: se dibuja sobre la foto.

Uso: python3 scripts/marcos-desde-figma.py <carpeta con GM01.svg … PM06.svg>
Exportar cada componente como SVG (download_assets del MCP de Figma, formato svg) con el nombre del id.
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

NODOS = {
    'GM01': ('Geométrica', 'M01', '647:113589'), 'GM02': ('Geométrica', 'M02', '647:113590'), 'GM04': ('Geométrica', 'M04', '647:113591'),
    'GM05': ('Geométrica', 'M05', '647:113592'), 'GM06': ('Geométrica', 'M06', '647:113593'),
    'OM01': ('Orgánica', 'M01', '647:1379'), 'OM02': ('Orgánica', 'M02', '647:1380'), 'OM04': ('Orgánica', 'M04', '647:1381'),
    'OM05': ('Orgánica', 'M05', '647:1382'), 'OM06': ('Orgánica', 'M06', '647:1383'),
    'PM01': ('Pixel', 'M01', '510:1121'), 'PM02': ('Pixel', 'M02', '510:1129'), 'PM04': ('Pixel', 'M04', '510:1137'),
    'PM05': ('Pixel', 'M05', '510:1146'), 'PM06': ('Pixel', 'M06', '510:1154'),
}
ZONA = {'Foto', 'Foto · fondo', 'Foto (relleno de imagen)', 'Hombros sobre el aro'}
# Pizarra y Señal no traen la zona como capa propia: es el celeste del fondo más la silueta morada.
ZONA_POR_MARCO = {'PM01': {'color celeste', 'color morado'}, 'PM06': {'color celeste', 'color morado'},
                  'PM02': {'Foto (relleno de imagen)', 'Hombros sobre el aro', 'color lapislázuli'},
                  # En el Panel escalonado orgánico la foto va en el panel morado (la «Foto» celeste queda tapada debajo).
                  'OM04': {'Panel escalonado'}}
ULTIMA_CAPA_ES_ZONA = {'OM05'}
MUESTRA = {'Persona de muestra', 'silueta (reemplazar por foto)', 'Foto · figura', 'Máscara', 'Hombros', 'Cuello', 'Cabeza'}
SVG = '{http://www.w3.org/2000/svg}'

def texto(s):
    # Figma exporta los id con UTF-8 codificado dos veces («GeomÃ©trica»).
    try: return s.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError): return s

def base(i):
    return re.sub(r'_\d+$', '', i)

def rect_a_d(e):
    x, y = float(e.get('x', 0)), float(e.get('y', 0)); w, h = float(e.get('width')), float(e.get('height'))
    return f'M{x:g} {y:g}H{x + w:g}V{y + h:g}H{x:g}Z'

def caja(d):
    """Caja de un path absoluto (M L H V C … de Figma); en curvas cuenta los puntos de control (caja un poco holgada)."""
    toks = re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?', d)
    xs, ys, cmd, i = [], [], None, 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha(): cmd = t; i += 1; continue
        if cmd == 'H': xs.append(float(t)); i += 1
        elif cmd == 'V': ys.append(float(t)); i += 1
        else: xs.append(float(toks[i])); ys.append(float(toks[i + 1])); i += 2
    return [round(min(xs), 2), round(min(ys), 2), round(max(xs) - min(xs), 2), round(max(ys) - min(ys), 2)]

def convertir(ruta, mid):
    arbol = ET.parse(ruta).getroot()
    visual, code, _ = NODOS[mid]
    marco = next(g for g in arbol.iter(SVG + 'g') if texto(g.get('id', '')).startswith(f'{visual} / {code}'))
    nombre = texto(marco.get('id')).split(' · ', 1)[1]
    zona_ids = ZONA_POR_MARCO.get(mid, ZONA)
    bg, figura, zona, encima = None, [], [], []
    def recorrer(e, en_fondo, saltar, en_zona=False):
        nonlocal bg
        tag = e.tag.replace(SVG, '')
        if tag in ('defs', 'mask', 'clipPath', 'filter'): return
        idb = base(texto(e.get('id', '')))
        if idb in MUESTRA and not (idb == 'Hombros' and 'aro' in texto(e.get('id', ''))): saltar = True
        if tag == 'g':
            for h in e: recorrer(h, en_fondo or idb == 'Fondo', saltar, en_zona or idb in zona_ids)
            return
        es_zona = en_zona or idb in zona_ids or texto(e.get('id', '')) in zona_ids
        if (saltar and not es_zona) or tag not in ('path', 'rect'): return
        d = e.get('d') if tag == 'path' else rect_a_d(e)
        relleno = e.get('fill')
        if not d or not relleno or relleno == 'none' or relleno.startswith('url'): return
        relleno = {'black': '#000000', 'white': '#FFFFFF'}.get(relleno, relleno.upper())
        es_lienzo = tag == 'rect' and e.get('width') == '240' and e.get('height') == '240' or idb == 'Fondo' and en_fondo and d.replace(' ', '').startswith('M0') and bg is None
        if en_fondo and bg is None and (es_lienzo or idb == 'Celda'):
            bg = relleno; return
        if es_zona:
            zona.append(d); return
        (encima if zona else figura).append([d, relleno])
    for h in marco: recorrer(h, False, False)
    if mid in ULTIMA_CAPA_ES_ZONA:
        # Los anillos del túnel son cuadrados llenos apilados: la foto va en el último (el más chico), que tapa la «Foto».
        figura, zona = figura + encima[:-1], [encima[-1][0]]; encima = []
    if not zona: raise SystemExit(f'{mid}: no encontré la zona de foto')
    z = ''.join(zona)
    return {'id': mid, 'visual': visual, 'code': code, 'name': nombre, 'bg': bg or '#F4EEE3', 'zona': z, 'caja': caja(z), 'paths': figura, 'encima': encima}

if __name__ == '__main__':
    carpeta = sys.argv[1]
    marcos = [convertir(os.path.join(carpeta, f'{m}.svg'), m) for m in NODOS]
    salida = os.path.join(os.path.dirname(__file__), '..', 'shared', 'marcos-figma.ts')
    with open(salida, 'w') as f:
        f.write('// GENERADO por scripts/marcos-desde-figma.py desde los SVG de Figma (no editar a mano).\n')
        f.write('// Componentes «B · Marcos para foto y texto» de Yo9o3ZG2lyaEGcyxoxs89R: ' + ', '.join(f'{k} {v[2]}' for k, v in NODOS.items()) + '.\n')
        f.write('export const MARCOS_FIGMA = ' + json.dumps(marcos, ensure_ascii=False, separators=(',', ':')).replace('},{', '},\n{') + ' as const;\n')
    for m in marcos: print(m['id'], m['name'], 'bg', m['bg'], 'capas', len(m['paths']), 'encima', len(m['encima']))
