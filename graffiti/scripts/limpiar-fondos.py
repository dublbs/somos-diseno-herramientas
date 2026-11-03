#!/usr/bin/env python3
"""Quita de los SVG exportados de Figma los fondos de los contenedores padres
(lienzo #1E1E1E, sección #171717, hoja de stickers #7FC8F8, tarjeta de la tipografía),
para que stickers y tag se estampen con su troquel y fondo transparente.

Uso: python3 graffiti/scripts/limpiar-fondos.py   (se puede correr varias veces)
"""
import re
from pathlib import Path

FIGMA = Path(__file__).resolve().parent.parent / "public" / "figma"
FONDOS = [
    r'<rect width="\d+" height="\d+" fill="#1E1E1E"/>\n?',                      # lienzo de la página
    r'<rect width="2640" height="7060" transform="[^"]*" fill="#171717"/>\n?',  # sección Pixel · Sistema
    r'<rect width="2320" height="1280" transform="[^"]*" fill="#7FC8F8"/>\n?',  # hoja de stickers
    r'<path d="M-7\d\d [^"]*" fill="#171717"/>\n?',                             # sección "Lo urbano" (tag)
    r'<path d="M-708 -360V[^"]*" fill="[^"]*"/>\n?',                            # borde de esa sección
    r'<rect width="580" height="420" rx="16" fill="#F4EEE3"/>\n?',              # tarjeta de la tipografía
]

for svg in sorted([*FIGMA.glob("stickers/*.svg"), *FIGMA.glob("tag/*.svg")]):
    texto = svg.read_text()
    limpio = texto
    for patron in FONDOS:
        limpio = re.sub(patron, "", limpio)
    if limpio != texto:
        svg.write_text(limpio)
        print("limpio:", svg.relative_to(FIGMA))
