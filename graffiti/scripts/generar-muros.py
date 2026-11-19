#!/usr/bin/env python3
"""Genera los muros de Graffiti y Tags como SVG pixel, en horizontal 2:1 (plan 009 §3: la pared, no un cuadrado).

- ladrillo y hormigón: generados aquí (generado: true), en una cuadrícula de 160 × 80 celdas.
- cortina: la capa «Láminas» de la cortina metálica de la libreta Pixel en Figma (906:8320), recortada a 2:1.
- vagon: vista de cerca de un carro del metro Pixel de la web (docs/equipo/referencias/metro-web-pixel.png, T-009),
  dibujada celda a celda (generado: true).
Uso: python3 graffiti/scripts/generar-muros.py
"""
import random
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




def cortina():
    # Láminas de la cortina metálica (Figma 906:8320, 1080 × 1200): se recorta a 1080 × 540 (2:1); cada lámina mide 50.
    laminas = []
    for y in range(0, 540, 50):
        laminas += [f'<rect y="{y}" width="1080" height="50" fill="#8FCCF7"/>', f'<rect y="{y}" width="1080" height="8" fill="#F4EEE3"/>',
                    f'<rect y="{y + 32}" width="1080" height="12" fill="#0063BF"/>', f'<rect y="{y + 44}" width="1080" height="6" fill="#000000"/>']
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 540" width="1080" height="540" shape-rendering="crispEdges">'
            + "".join(laminas) + "</svg>\n")


def vagon():
    """Vista de cerca de un carro del metro Pixel de la web (docs/equipo/referencias/metro-web-pixel.png, T-009).

    Se dibuja celda a celda en la misma grilla de 160 × 80 que ladrillo y hormigón, con los colores muestreados de esa
    referencia: túnel con cable y equipos de techo; cuerpo hueso con contorno negro, ventanas moradas con brillo celeste,
    franja roja (con su sombra) y línea morada; dos puertas dobles con marco negro; bogies, riel y balasto. A la izquierda
    asoma el final del carro anterior con el fuelle entre los dos. Detalles de Línea 1 (fotos de Amaro): rejilla bajo la
    ventana central y franjas amarillas y negras en el umbral de las puertas.
    """
    C = {"negro": "#000000", "tunel": "#1A1424", "tunel2": "#241C30", "cable": "#2A2622", "gris": "#8C8578",
         "gris_osc": "#5E584E", "gris_cl": "#B9B2A4", "techo": "#D9CDB8", "blanco": "#FFFFFF", "hueso": "#F4EEE3",
         "bajo": "#D9CDB8", "rojo": "#E2001A", "rojo_osc": "#A80014", "morado": "#7A2E8E", "vidrio": "#3E1449",
         "vidrio_cl": "#5B2370", "celeste": "#7FC8F8", "amarillo": "#FFC20E", "ambar": "#5A4520", "tierra": "#4A3426",
         "tierra_cl": "#6E5240", "tierra_osc": "#2E2018"}
    m = [["tunel"] * W for _ in range(H)]

    def r(x, y, w, h, c):
        for yy in range(max(y, 0), min(y + h, H)):
            for xx in range(max(x, 0), min(x + w, W)):
                m[yy][xx] = c

    # Túnel: pilares tenues y cable con grapas
    for x in range(12, W, 40):
        r(x, 0, 2, 64, "tunel2")
    r(0, 3, W, 1, "cable")
    for x in range(6, W, 20):
        r(x, 2, 2, 3, "gris_osc")

    def ventana(x, y, w, h):
        r(x, y, w, h, "negro")                       # marco negro de 2 celdas
        r(x + 2, y + 2, w - 4, h - 4, "vidrio")
        r(x + 2, y + h - 6, w - 4, 4, "vidrio_cl")   # reflejo de abajo
        r(x + 3, y + 3, 4, 2, "celeste")             # brillo en L arriba a la izquierda
        r(x + 3, y + 5, 2, 2, "celeste")

    def bandas(x, w, alto_bajo=8):
        r(x, 12, w, 24, "hueso")
        r(x, 36, w, 5, "rojo")
        r(x, 41, w, 2, "rojo_osc")
        r(x, 43, w, 3, "hueso")
        r(x, 46, w, 2, "morado")
        r(x, 48, w, alto_bajo, "bajo")

    def cuerpo(x0, x1, borde_izq, borde_der):
        # x0..x1 (exclusivo) es la caja del carro con su contorno
        r(x0, 6, x1 - x0, 52, "negro")
        ix0, ix1 = x0 + (2 if borde_izq else 0), x1 - (2 if borde_der else 0)
        r(ix0, 8, ix1 - ix0, 3, "techo")
        r(ix0, 11, ix1 - ix0, 1, "blanco")
        bandas(ix0, ix1 - ix0)
        if borde_izq:  # esquinas de arriba escalonadas
            r(x0, 6, 2, 2, "tunel"); r(x0 + 2, 8, 1, 1, "negro")
        if borde_der:
            r(x1 - 2, 6, 2, 2, "tunel"); r(x1 - 3, 8, 1, 1, "negro")

    # Carro anterior (asoma a la izquierda) y fuelle entre los dos
    cuerpo(-20, 6, False, True)
    r(6, 14, 6, 40, "gris_osc")
    for y in range(15, 54, 3):
        r(6, y, 6, 1, "cable")
    r(6, 14, 6, 1, "negro"); r(6, 53, 6, 1, "negro")

    # Carro de cerca: empieza en x = 12 y sigue fuera de la pared
    cuerpo(12, W + 4, True, False)
    for x in (28, 104):  # equipos del techo: cajas grises con contorno
        r(x, 1, 22, 6, "negro"); r(x + 2, 2, 18, 4, "gris")
        for dx in (4, 9, 14):
            r(x + dx, 3, 2, 2, "gris_osc")
    for x in (20, 96):  # luces del túnel
        r(x, 3, 6, 2, "amarillo"); r(x + 6, 3, 2, 2, "ambar")
    for x in (36, 136):  # luces de techo del carro
        r(x, 8, 6, 2, "amarillo")

    # Ventanas: las de punta angostas; las del medio, anchas como en la referencia
    ventana(16, 14, 12, 19)
    ventana(64, 14, 26, 19)
    ventana(94, 14, 26, 19)
    ventana(W - 4, 14, 12, 19)  # se corta en el borde: el carro sigue

    # Puertas dobles: marco negro, dos hojas con ventana angosta y junta negra al centro
    for x in (32, 124):
        r(x, 12, 28, 46, "negro")
        for hx in (x + 2, x + 15):
            bandas(hx, 11, 6)
            ventana(hx + 2, 15, 7, 17)
            for i in range(0, 11, 2):  # umbral con franjas amarillas y negras (Línea 1)
                r(hx + i, 54, 1, 2, "amarillo")
                r(hx + i + 1, 54, 1, 2, "negro")
        r(x + 13, 12, 2, 46, "negro")

    # Rejilla bajo la ventana central y tirador en la franja
    r(98, 43, 18, 3, "negro")
    for x in range(99, 115, 2):
        r(x, 44, 1, 1, "gris_osc")
    r(76, 43, 4, 2, "negro")

    # Bastidor, bogies y ruedas
    r(16, 58, W - 16, 3, "negro"); r(18, 58, W - 18, 2, "gris_osc")
    for x in (20, 96):
        r(x, 61, 44, 3, "negro"); r(x + 2, 61, 40, 2, "gris")            # placa del bogie
        for rx in (x + 3, x + 29):                                        # ruedas con buje
            r(rx, 63, 12, 10, "negro"); r(rx + 1, 64, 10, 8, "cable"); r(rx + 5, 67, 2, 2, "gris")
        r(x + 15, 66, 14, 3, "negro"); r(x + 15, 67, 14, 1, "gris_osc")    # eje
    r(0, 58, 6, 3, "negro"); r(0, 58, 4, 2, "gris_osc")                   # bajos del carro anterior
    r(0, 61, 10, 3, "negro"); r(0, 61, 8, 2, "gris")
    r(0, 63, 6, 10, "negro"); r(0, 64, 5, 8, "cable"); r(1, 67, 2, 2, "gris")

    # Riel, durmientes y balasto
    r(0, 73, W, 1, "blanco")
    r(0, 74, W, 2, "gris_cl")
    r(0, 76, W, 1, "gris_osc")
    for x in range(0, W, 10):
        r(x, 77, 6, 1, "cable"); r(x + 6, 77, 4, 1, "gris")
    r(0, 78, W, 2, "tierra")
    rnd = random.Random(19)
    for _ in range(70):
        r(rnd.randrange(W), rnd.choice([78, 79]), rnd.choice([1, 2]), 1, rnd.choice(["tierra_cl", "tierra_osc"]))

    # Una ruta por color con las corridas de cada fila (SVG liviano)
    rutas = {}
    for y in range(H):
        x = 0
        while x < W:
            c = m[y][x]
            x1 = x
            while x1 < W and m[y][x1] == c:
                x1 += 1
            if c != "tunel":
                rutas.setdefault(C[c], []).append(f"M{x} {y}h{x1 - x}v1h-{x1 - x}z")
            x = x1
    cuerpo_svg = "".join(f'<path fill="{c}" d="{"".join(d)}"/>' for c, d in rutas.items())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 6}" height="{H * 6}" '
            f'shape-rendering="crispEdges"><rect width="{W}" height="{H}" fill="{C["tunel"]}"/>{cuerpo_svg}</svg>\n')


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "ladrillo.svg").write_text(ladrillo())
    (SALIDA / "hormigon.svg").write_text(hormigon())
    (SALIDA / "cortina.svg").write_text(cortina())
    (SALIDA / "vagon.svg").write_text(vagon())
    print("ok:", *sorted(p.name for p in SALIDA.glob("*.svg")))
