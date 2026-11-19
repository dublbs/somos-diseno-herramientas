# QA del PC madre · 19 nov (mañana del evento)

Pedido: «revisa el PC madre en busca de faltantes y errores». Correcciones: [`docs/tasks/016-correcciones-pc-madre.md`](../tasks/016-correcciones-pc-madre.md).

## Cómo se probó
- El `admin/dist` publicado en `main` (1dcab51), contra una base `qa` montada desde cero con toda la cadena de migraciones
  (001–011) y datos de un evento: 12 personas en distintos estados, 2 completas, eventos del HUB, 2 tablets con
  sesión, un aviso enviado, una cuenta pendiente, PIN y stock 10.
- Playwright en 1366×768, con una cuenta **admin** y otra **mesa**, pasando por todas las vistas. También se revisó el ancho en 1280×720 y 1024×768.
- No se probó contra el Supabase real (sin acceso), ni el envío real de avisos (función `notificar`).

## Funciona (las dos cuentas)
| Vista | Comprobado |
|---|---|
| Resumen | Credenciales y completas coinciden con la base; «Estado de la base» lista 006–011 como corridas |
| Personas | 12 filas; búsqueda por parte del código, código en minúsculas y nombre; ficha con experiencias y afiches; dar y quitar timbres; CSV; papelera solo para admin |
| Canje | Incompleta dice qué falta; código inexistente; entregar baja el stock; segunda vez «Ya canjeado»; stock editable solo para admin |
| Mesas | Muestra las tablets con sesión y el código de la estación 2; el modo juego y los reinicios los guarda solo el admin |
| Pantalla HUB | Lista lo último y «Quitar del HUB» borra el evento |
| Avisos | Muestra el historial |
| Configuración | Detecta el PIN; el admin ve las cuentas pendientes y «Empezar de cero», y la cuenta mesa no |
| General | Sin errores de página en ninguna vista |

## Hallazgos
| # | Qué pasa | Gravedad |
|---|---|---|
| Q1 | **Los avisos no pueden llegar a nadie.** La credencial publicada se compiló sin `VITE_VAPID_PUBLIC_KEY` (su `.env.local` solo tiene la URL y la clave de Supabase). Por eso ningún celular puede activar «Recibir avisos», «Suscritos ahora» queda en 0 y la vista Avisos envía a nadie. Para activarlo hacen falta las claves VAPID: los secretos de la función `notificar`, la clave pública en `credencial/.env.local` y recompilar | Alta (para usar avisos hoy) |
| Q2 | **Con más de 300 personas, Personas se queda corto.** La tabla trae como máximo 300 (`limit(300)`) y la cabecera cuenta sobre esa lista. Lo que no aparece se encuentra igual con la búsqueda, y el Resumen sí cuenta bien | Media |
| Q3 | Si falla el envío de un aviso, el staff ve el mensaje técnico en inglés de Supabase («Edge Function returned a non-2xx status code») | Baja |
| Q4 | En 1024×768, la tabla de Personas se sale del ancho y aparece scroll horizontal en la página (1222 px). En 1280×720 o más se ve bien | Baja |

## Sin comprobar
- Con el Supabase real: crear cuenta y su confirmación por correo, el tiempo real del panel, y que las migraciones 008–011 estén corridas.
- El envío real de un aviso y su llegada a un celular.
