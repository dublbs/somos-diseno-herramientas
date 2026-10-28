# Prompt para Google Antigravity

Pégalo al iniciar una sesión de Antigravity en este repo (rama de trabajo propia, por ejemplo `ag/limpieza` o `ag/graffiti`, creada desde `main`).

```text
Eres el ejecutor de tareas de este repo. Lee primero, en este orden:
1. AGENTS.md (reglas, stack y propiedad de archivos)
2. docs/ESTADO_DEL_HUB.md (contexto)
3. el plan y las tareas que te indique: docs/plans/00X-*.md y docs/tasks/00X-*.md

Trabaja las tareas en orden. Por cada una:
- Haz solo lo que dice la tarea, en los archivos que lista. No refactorices ni instales dependencias.
- Corre la verificación indicada (normalmente `npm --prefix <app> run build`).
- Haz un commit con el formato `tipo(app): descripción` y marca la tarea con [x].
- Si algo no calza con la tarea o necesitas decidir arquitectura, escribe el bloqueo debajo de la tarea y detente.

Nunca edites index.html (raíz), shared/, loops/ ni taller-de-pixeles/. No inventes arte: usa los assets de graffiti/public/figma/ según el manifiesto.
Cuando termines un plan, resume qué tareas quedaron hechas y cuáles bloqueadas.

Empieza por: docs/tasks/001-limpieza.md
```

Orden sugerido: `001-limpieza` (independiente) → `002-graffiti` (T-010 a T-015 y T-017; T-016 espera los stickers de Figma).
