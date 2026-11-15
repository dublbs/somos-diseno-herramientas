#!/usr/bin/env python3
"""Genera los muros de Graffiti y Tags como SVG pixel, en horizontal 2:1 (plan 009 §3: la pared, no un cuadrado).

- ladrillo y hormigón: generados aquí (generado: true), en una cuadrícula de 160 × 80 celdas.
- cortina: la capa «Láminas» de la cortina metálica de la libreta Pixel en Figma (906:8320), recortada a 2:1.
- vagon: el lateral de la Línea 1 de Figma (vagon/public/figma/metro/linea1-lateral.svg, 522:2179) repetido dos veces.
Uso: python3 graffiti/scripts/generar-muros.py
"""
import random
import re
from pathlib import Path

W, H = 160, 80
SALIDA = Path(__file__).resolve().parent.parent / "public" / "figma" / "muros"


def svg(fondo, celdas):
    # Cada celda es un rectángulo de 1 × 1; shape-rendering evita bordes borrosos.
    cuerpo = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>' for x, y, w, h, c in celdas)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 6}" height="{H * 6}" '
            f'shape-rendering="crispEdges"><rect width="{W}" height="{H}" fill="{fondo}"/>{cuerpo}</svg>\n')


def ladrillo():
    r = random.Random(7)
    tonos = ["#D9CDB7", "#CFC0A5", "#E0D5C0", "#C9B99C"]
    celdas = []
    for fila in range(0, H, 7):
        desfase = 8 if (fila // 7) % 2 else 0
        for col in range(-16, W, 16):
            x = col + desfase
            if x + 15 <= 0 or x >= W:
                continue
            tono = r.choice(tonos)
            celdas.append((max(x, 0), fila, min(x + 15, W) - max(x, 0), 6, tono))
            for _ in range(9):  # granulado de pixeles dentro del ladrillo
                px, py = r.randint(max(x, 0), min(x + 14, W - 1)), fila + r.randint(0, 5)
                celdas.append((px, py, 1, 1, r.choice(["#BDAE91", "#E8DFCC"])))
    return svg("#B5A68A", celdas)  # el fondo es el mortero


def hormigon():
    r = random.Random(11)
    celdas = []
    for _ in range(1500):  # manchas y poros
        celdas.append((r.randint(0, W - 1), r.randint(0, H - 1), r.choice([1, 1, 2]), 1, r.choice(["#A9A9A4", "#C4C4BE", "#B4B4AE", "#8F8F8A"])))
    for x in (0, 53, 106):  # juntas de paneles
        celdas.append((x, 0, 1, H, "#8F8F8A"))
    for y in (0, 40):
        celdas.append((0, y, W, 1, "#8F8F8A"))
    for y in (5, 34, 45, 74):  # pernos de los paneles
        for x in (4, 48, 57, 101, 110, 154):
            celdas.append((x, y, 2, 2, "#7C7C77"))
    return svg("#B9B9B3", celdas)


RAIZ = Path(__file__).resolve().parent.parent.parent


def cortina():
    # Láminas de la cortina metálica (Figma 906:8320, 1080 × 1200): se recorta a 1080 × 540 (2:1); cada lámina mide 50.
    laminas = []
    for y in range(0, 540, 50):
        laminas += [f'<rect y="{y}" width="1080" height="50" fill="#8FCCF7"/>', f'<rect y="{y}" width="1080" height="8" fill="#F4EEE3"/>',
                    f'<rect y="{y + 32}" width="1080" height="12" fill="#0063BF"/>', f'<rect y="{y + 44}" width="1080" height="6" fill="#000000"/>']
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 540" width="1080" height="540" shape-rendering="crispEdges">'
            + "".join(laminas) + "</svg>\n")


def vagon():
    # El lateral de la Línea 1 es un patrón de 240 × 240 (carro con franja y puerta): dos seguidos dan la pared 2:1.
    lateral = (RAIZ / "vagon" / "public" / "figma" / "metro" / "linea1-lateral.svg").read_text()
    interior = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", lateral.strip())
    return ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 480 240" width="960" height="480">'
            + f'<svg x="0" y="0" width="240" height="240" viewBox="0 0 240 240">{interior}</svg>'
            + f'<svg x="240" y="0" width="240" height="240" viewBox="0 0 240 240">{interior}</svg></svg>\n')


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "ladrillo.svg").write_text(ladrillo())
    (SALIDA / "hormigon.svg").write_text(hormigon())
    (SALIDA / "cortina.svg").write_text(cortina())
    (SALIDA / "vagon.svg").write_text(vagon())
    print("ok:", *sorted(p.name for p in SALIDA.glob("*.svg")))
