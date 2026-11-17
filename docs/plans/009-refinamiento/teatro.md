# Teatro de Papel · After Effects (keyframes)

Es de Pipe y ya tiene su auditoría: **plan 008** (PR #12, 18 hallazgos y 19 tareas). Aquí solo se suma lo que salió de
la medición común y lo que cambió en `shared/` desde entonces.

## De la medición común
| # | Gravedad | Qué | Dónde |
|---|---|---|---|
| T-1 | Media | El botón «Reproducir el loop» mide 32 × 48 en 1024 × 768 (regla: ≥ 44) | Línea de tiempo |
| T-2 | Media | La ayuda de la barra superior se corta en 1180 × 820 y 1280 × 720 | Barra superior |

## Lo que cambió en `shared/` y le sirve (para cuando Pipe lo indique)
- **«Llévatela»** (`shared/ui/Llevatela.tsx`, plan 011): reemplaza «Tarjeta» y «Grabar loop» por un solo «Llévatelo»
  que manda la tarjeta o el video por QR. La página de descarga ya reconoce `?app=teatro`.
- **Jugar sin credencial** y el timbre por experiencia: llegan solos al recompilar `loops/dist`.
