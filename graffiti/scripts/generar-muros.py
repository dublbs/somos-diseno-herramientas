#!/usr/bin/env python3
"""Genera los muros de fondo de Graffiti y Tags como SVG pixel (generado: true, no vienen de Figma).

Cuadrícula de 60 × 60 celdas (cuadrada: 1080 × 1080 en la tarjeta, 18 px por celda; debajo va la franja negra común de 270 px).
Uso: python3 graffiti/scripts/generar-muros.py
"""
import random
from pathlib import Path

W, H = 60, 60
SALIDA = Path(__file__).resolve().parent.parent / "public" / "figma" / "muros"


def svg(fondo, celdas):
    # Cada celda es un rectángulo de 1 × 1; shape-rendering evita bordes borrosos.
    cuerpo = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>' for x, y, w, h, c in celdas)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 8}" height="{H * 8}" '
            f'shape-rendering="crispEdges"><rect width="{W}" height="{H}" fill="{fondo}"/>{cuerpo}</svg>\n')


def ladrillo():
    r = random.Random(7)
    tonos = ["#D9CDB7", "#CFC0A5", "#E0D5C0", "#C9B99C"]
    celdas = []
    for fila in range(0, H, 5):
        desfase = 6 if (fila // 5) % 2 else 0
        for col in range(-12, W, 12):
            x = col + desfase
            if x + 11 <= 0 or x >= W:
                continue
            tono = r.choice(tonos)
            celdas.append((max(x, 0), fila, min(x + 11, W) - max(x, 0), 4, tono))
            for _ in range(5):  # granulado de pixeles dentro del ladrillo
                px, py = r.randint(max(x, 0), min(x + 10, W - 1)), fila + r.randint(0, 3)
                celdas.append((px, py, 1, 1, r.choice(["#BDAE91", "#E8DFCC"])))
    return svg("#B5A68A", celdas)  # el fondo es el mortero


def hormigon():
    r = random.Random(11)
    celdas = []
    for _ in range(420):  # manchas y poros
        celdas.append((r.randint(0, W - 1), r.randint(0, H - 1), r.choice([1, 1, 2]), 1, r.choice(["#A9A9A4", "#C4C4BE", "#B4B4AE", "#8F8F8A"])))
    for x in (0, 30):  # juntas de paneles
        celdas.append((x, 0, 1, H, "#8F8F8A"))
    for y in (0, 20, 40):
        celdas.append((0, y, W, 1, "#8F8F8A"))
    for y in (6, 26, 46):  # pernos de los paneles
        for x in (3, 27, 33, 57):
            celdas.append((x, y, 2, 2, "#7C7C77"))
    return svg("#B9B9B3", celdas)


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "ladrillo.svg").write_text(ladrillo())
    (SALIDA / "hormigon.svg").write_text(hormigon())
    print("ok:", *sorted(p.name for p in SALIDA.glob("*.svg")))
