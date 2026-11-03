# Prompt para Figma · pendientes de arte de la Credencial

Pegar tal cual en Claude Code con el MCP de Figma (o en una sesión de Figma). Contexto: `docs/plans/006-credencial-y-nuevas-experiencias.md`.

---

Trabaja en el archivo de Figma de Somos Diseño (sistema Pixel / Geométrica / Orgánica, paleta «Línea azul»: Hueso #F4EEE3, Negro #000000, Azul #0062B8, Lapislázuli #2B4BD8, Celeste #7FC8F8, Amarillo #FFC20E, Verde #00A651, Rosa #FF8FB1, Morado #7A2E8E). Crea una página nueva «Credencial · refinamiento» y entrega arte listo para exportar como SVG a `credencial/public/figma/`. No inventes estilos: reutiliza los componentes y piezas existentes (Teatro de Papel para Orgánica, stickers de Vagón para Pixel, módulos de Mosaicos y Audioreactiva para Geométrica) y respeta el lenguaje de cada uno.

**1. Personajes (12 en total, 4 por lenguaje).** Cada uno en un cuadro de 240 × 240, centrado, fondo transparente, sin sombra desfasada.
- Orgánica: Pingüino (existente), Pudú, Cóndor, Chucao. Toma las piezas de Teatro de Papel y recórtalas como sticker de papel.
- Pixel: Invasor (existente, **versión sin la sombra crema desfasada**), Zapatilla, Spray, Tarro de pintura (stickers de Vagón, en grilla pixel consistente).
- Geométrica: Glifo (existente), Ojo, Escalera, Fuelle, construidos con los módulos geométricos del sistema.
Nómbralos `personaje-<lenguaje>-<nombre>`.

**2. Timbres (molde único de sello de goma).** 4 estaciones × 3 lenguajes × 2 versiones = 24, cada uno de 240 × 240.
- Forma por lenguaje: círculo (Orgánica), cuadrado (Geométrica), escalonado (Pixel).
- Tinta de un solo color, **sin sombra ni borde desfasado**, con el nombre de la estación en el contorno (Inscripción, Creación, Portales, Hallazgo) y la ilustración del lenguaje adentro.
- Nómbralos `timbre-<lenguaje>-<estación 1..4>-<v1|v2>`.

**3. Marco Estallido.**
- Orgánica M02: aro crema de 3 px en el borde del círculo de la foto para que no corte duro contra los rayos, y un patrón de fondo de un solo tono (sin amarillo y rosa mezclados con el azul).
- Geométrica M02: revisa el contraste del círculo celeste con el morado y propón el ajuste.
- Verifica contraste ≥ 4.5:1 entre texto y fondo de cada marco con su patrón.

**4. Entrega.** Un resumen con los nombres de capa/exportación, qué reutilizaste de dónde y qué decisiones quedaron abiertas. Si algo del arte existente no alcanza, dilo en vez de inventar.
