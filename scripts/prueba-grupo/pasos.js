// Pauta de la prueba en grupo (19 nov). Cada paso: qué hacer, qué debería pasar y qué necesita.
// Lo comparten la página y docs/qa/prueba-en-grupo-pasos.md (se genera desde aquí).
var SECCIONES = [
  { id: 'P', nombre: 'Preparación', quien: 'Staff', donde: 'PC madre, tablets, Flip', intro: 'Antes de abrir la prueba. Si algo de aquí falla, lo de abajo también.' },
  { id: 'C', nombre: 'Visitante · celular', quien: 'Visitante', donde: 'Su celular (credencial)', intro: 'La credencial de punta a punta: crearla, jugar, la cacería, el flyer y el canje.' },
  { id: 'T', nombre: 'Visitante · tablet', quien: 'Visitante', donde: 'Tablets Lenovo', intro: 'Lo común a todas las tablets: el menú, entrar con la credencial, «Llévatelo» y el quiosco.' },
  { id: 'F', nombre: 'Fotomatón', quien: 'Visitante', donde: 'Tablet', intro: 'Los tres lenguajes · imagen e identidad.' },
  { id: 'M', nombre: 'Taller de Mosaicos', quien: 'Visitante', donde: 'Tablet', intro: 'Geométrica · sistemas y patrones.' },
  { id: 'L', nombre: 'Teatro de Papel', quien: 'Visitante', donde: 'Tablet', intro: 'Orgánica · animación.' },
  { id: 'G', nombre: 'Graffiti y Tags', quien: 'Visitante', donde: 'Tablet', intro: 'Pixel · ilustración y lettering.' },
  { id: 'H', nombre: 'Hora punta', quien: 'Visitante', donde: 'Tablet', intro: 'Pixel · juego en 3 niveles.' },
  { id: 'A', nombre: 'Estación Audioreactiva', quien: 'Visitante', donde: 'Tablet', intro: 'Geométrica · motion.' },
  { id: 'R', nombre: 'Taller de Grabado', quien: 'Visitante', donde: 'Tablet', intro: 'Orgánica · hecho a mano.' },
  { id: 'U', nombre: 'HUB en la Flip', quien: 'Público', donde: 'Pantalla Flip', intro: 'La pantalla grande: qué aparece, cuándo y si coincide con el PC madre.' },
  { id: 'E', nombre: 'Encargado de mesa', quien: 'Staff en la mesa', donde: 'Tablet + celular del visitante', intro: 'Lo que hace la persona del equipo junto a las tablets.' },
  { id: 'S', nombre: 'Staff · PC madre', quien: 'Staff', donde: 'PC madre (…/admin/dist/)', intro: 'Cada vista del panel del staff.' },
  { id: 'X', nombre: 'A la vez', quien: 'Grupo', donde: 'Varios equipos', intro: 'Lo que solo se ve con varias personas al mismo tiempo. Coordinen: «uno, dos, tres, ¡ya!».' },
  { id: 'Z', nombre: 'Cierre', quien: 'Staff', donde: 'PC madre', intro: 'Al terminar la prueba, antes de abrir al público.' },
];

// [id, título, cómo, qué debería pasar, requiere (opcional)]
var PASOS = [
  // ---------- Preparación ----------
  ['P01', 'Correr las migraciones pendientes', 'Supabase → proyecto somos-diseno → SQL Editor → New query. Pegar y correr, una por una y en orden: 008-config-mesas.sql, 009-jugar-con-qr.sql, 010-gestion-pc-madre.sql y 011-qa-base.sql (carpeta shared/supabase/migraciones).', 'Cada una termina con «Success. No rows returned» (o similar) y sin texto rojo. Anotar fecha y quién en shared/supabase/migraciones/README.md.', '011 viene en el PR #51'],
  ['P02', 'Unir los PR pendientes', 'En GitHub: revisar y unir #51 (códigos y base), #43 (HUB sin personas de prueba) y #48 (terminar y liberar la mesa) si se aprueban. #49 se puede cerrar: #51 lo incluye.', 'GitHub Pages publica en 1–2 min (Actions → «pages build and deployment» en verde).', ''],
  ['P03', 'Entrar al PC madre', 'Abrir https://dublbs.github.io/somos-diseno-herramientas/admin/dist/ y entrar con correo y contraseña del staff.', 'Abre en «Resumen». A la izquierda: Resumen, Personas, Canje, Mesas, Pantalla HUB, Avisos y Configuración. Abajo, tu nombre y rol.', ''],
  ['P04', 'Estado de la base sin faltantes', 'PC madre → Resumen → tabla «Estado de la base».', 'Todas las migraciones dicen «Corrida». Si alguna dice «Falta», arriba aparece un recuadro rojo con el archivo a correr.', 'P01'],
  ['P05', 'Definir el PIN del canje', 'PC madre → Configuración → «PIN del canje» → escribir 4 a 8 números → «Guardar PIN».', 'Aviso negro: «PIN guardado…». El mismo PIN abre ?staff en las tablets. Compartirlo solo con el staff.', ''],
  ['P06', 'Cargar el premio y su stock', 'PC madre → Canje → recuadro «Premio»: nombre, Stock y «Límite por día (0 = sin límite)» → «Guardar».', 'Aviso «Premio guardado.» Los números quedan al recargar la página.', 'Cuenta admin'],
  ['P07', 'Encender el modo juego en todas las tablets', 'PC madre → Mesas → marcar «Modo juego: las tablets piden el código de la credencial».', 'Aviso «Modo juego encendido en todas las tablets.» Se ve el «Código de la estación 2» y si hay PIN.', 'Migración 008'],
  ['P08', 'Código de la estación 2 = QR impresos', 'Comparar el código que muestra PC madre → Mesas con el que traen los QR/sellos impresos de la estación 2.', 'Coinciden letra por letra. Si no, el timbre a mano en las mesas no va a funcionar.', ''],
  ['P09', 'Tablets en el menú y fijadas', 'En cada tablet: Chrome → https://dublbs.github.io/somos-diseno-herramientas/ → pantalla completa. Ajustes → Seguridad → Fijar aplicaciones (con PIN para soltar) → Recientes → Chrome → Fijar.', 'Se ven solo las 7 experiencias. No se puede salir de Chrome sin el PIN de Android.', ''],
  ['P10', 'La Flip con el HUB en vivo', 'En la Flip abrir https://dublbs.github.io/somos-diseno-herramientas/hub-estacion/dist/?prueba=0 y tocar ⛶ (pantalla completa).', 'Abajo dice «En vivo» y NO dice «con personas de prueba». Sin flecha ← arriba.', ''],
  ['P11', 'QR de la entrada', 'Escanear el QR impreso de la entrada con la cámara de un celular.', 'Abre https://dublbs.github.io/somos-diseno-herramientas/credencial/dist/ en la pantalla «Crear».', ''],
  ['P12', 'Afiches de la cacería colgados', 'Recorrer la sede: los 5 afiches A3 impresos y colgados, cada uno con su sello y el código bajo el sello.', 'Los 5 están, se ven bien con luz del lugar y el código se lee.', ''],
  ['P13', 'Red en todos los equipos', 'Tablets, Flip y PC madre con wifi; celulares de prueba con datos y con wifi.', 'Todos cargan la página sin errores. Anotar el nombre de la red y si hay portal cautivo.', ''],

  // ---------- Celular ----------
  ['C01', 'Abrir la credencial desde el QR', 'Escanear el QR de la entrada con la cámara del celular (sin apps extra).', 'Se abre la credencial en «Crear»: vista previa del marco, pasos «1 · Marco» y «2 · Foto o personaje», campo «Tu nombre».', ''],
  ['C02', 'Elegir el marco', 'Tocar cada marco disponible.', 'La vista previa cambia de marco y la pantalla toma sus colores. Nada se corta ni se sale de la pantalla.', ''],
  ['C03', 'Escribir el nombre', 'Escribir un nombre. Probar uno de 15 letras y dejarlo vacío y tocar «Crear».', 'Acepta hasta 14 letras. Vacío: «Escribe tu nombre para la credencial.»', ''],
  ['C04', 'Foto con la cámara', 'Paso 2 → «Foto» → permitir la cámara → «Sacar». Probar «Otra foto» y elegir una de la galería.', 'Abre la cámara frontal. La selfie queda dentro del marco. Si niegas el permiso, aparece un mensaje que lo explica.', ''],
  ['C05', 'Personaje en vez de foto', 'Paso 2 → «Personaje» → elegir uno.', 'El personaje queda dentro del marco.', ''],
  ['C06', 'Crear la credencial', 'Tocar «Crear».', '«Creando…» y luego la credencial con tu nombre y un código SD-XXXXX bajo el nombre. Aviso «Credencial lista: ya tienes el timbre de Inscripción.» ANOTAR EL CÓDIGO en el registro.', ''],
  ['C07', 'Código fácil de leer', 'Mirar el código de la credencial creada.', 'Con el PR #51: sin 0, O, 1 ni I. Sin #51 puede traer 0 o 1 (ver T06).', '#51 + migración 011'],
  ['C08', '¿Cómo se juega?', 'Ver la bienvenida (o tocar «¿Cómo se juega?» en Jugar). Avanzar con «Siguiente», deslizando y con «Saltar».', 'Tres pantallas: «Crea en las tablets», «Caza 3 afiches», «Arma tu flyer y canjea tu bolsa». Termina con «¡Vamos!». Muestra tu código.', ''],
  ['C09', 'Girar la credencial', 'Tocar o deslizar la credencial para ver el reverso.', 'Atrás está el álbum de timbres: Inscripción, Creación, Cacería y Flyer, con cómo se gana cada uno. La Inscripción ya está timbrada.', ''],
  ['C10', 'Guardar la imagen', 'Tocar «Guardar».', 'Se descarga o comparte la imagen de la credencial. Revisar que quedó en Fotos/Descargas y se ve completa.', ''],
  ['C11', 'Recibir avisos', 'Tocar «Recibir avisos del evento» y aceptar las notificaciones.', '«Listo: te avisaremos lo que pase en el evento.» Si se bloquean: «Los avisos están bloqueados en el navegador.» En iPhone solo funciona si la credencial está agregada a la pantalla de inicio.', 'Secretos VAPID en Supabase'],
  ['C12', 'Volver más tarde', 'Cerrar el navegador y abrir de nuevo el QR de la entrada.', 'Abre directo TU credencial (no pide crear otra).', ''],
  ['C13', 'Sin salida a las experiencias', 'Buscar en la credencial una flecha o enlace al menú de las tablets.', 'No hay. El celular solo tiene la credencial (plan 016).', ''],
  ['C14', 'Abrir «Jugar»', 'En la credencial tocar «Jugar».', 'Se ve: «Cacería de afiches» (0 de 3) con «Buscar afiches», «Inventario de creación» (0 de 4) con las 7 experiencias, «Tu flyer» cerrado y abajo «Credencial», «Código» y «¿Cómo se juega?».', ''],
  ['C15', 'Fotomatón desde el celular', 'En Jugar → «Abrir el Fotomatón aquí» → sacarse una foto → «Generar QR».', 'Abre el Fotomatón ya con tu código (no lo pide). La flecha ← vuelve a Jugar. La foto aparece en el inventario.', ''],
  ['C16', 'Cacería con la cámara', 'Jugar → «Buscar afiches» → permitir la cámara → apuntar a un afiche completo y de frente.', '«Abriendo la cámara…», guía «Encuadra el afiche completo, de frente». Al reconocerlo suma 1 de 3 y muestra la miniatura del afiche. Anotar cuánto tardó y con qué luz.', 'Migración 007'],
  ['C17', 'El mismo afiche dos veces', 'Volver a apuntar al mismo afiche.', '«Ya tenías ese afiche.» No suma de nuevo.', ''],
  ['C18', 'Cacería con el código', 'Jugar → «Código» → escribir el código que está bajo el sello del afiche → «Timbrar».', 'Suma el afiche. Con un código inventado: «Ese código no es de un afiche de la cacería.» o un mensaje equivalente.', ''],
  ['C19', 'Tercer afiche: timbre Cacería', 'Encontrar 3 afiches distintos.', 'Animación de timbre y el timbre 3 (Cacería) queda marcado en el álbum.', ''],
  ['C20', 'QR de un afiche con la cámara normal', 'Escanear el QR de un afiche con la cámara del celular (fuera de la credencial).', 'Abre la credencial: «Sumando el afiche…» y vuelve al juego. En un celular sin credencial: «Aún no tienes credencial en este navegador» + «Crear mi credencial».', ''],
  ['C21', 'El inventario se llena solo', 'Con la credencial abierta en Jugar, crear algo en una tablet con tu código y tocar «Llévatelo».', 'En unos segundos aparece la miniatura en el inventario. Anotar cuántos segundos tardó.', ''],
  ['C22', 'Cuatro creaciones: timbre Creación', 'Crear en 4 experiencias distintas con el mismo código.', 'Al cuarto: timbre 2 (Creación). En Jugar dice «Timbre listo».', ''],
  ['C23', 'El flyer cerrado', 'Tocar «Tu flyer» sin creaciones o sin afiches.', 'No abre y dice qué falta, por ejemplo «Te falta crear algo en una tablet y encontrar un afiche.»', ''],
  ['C24', 'Armar el flyer', 'Con al menos 1 creación y 1 afiche: «Tu flyer» → elegir lenguaje (Pixel, Geométrica, Orgánica), afiche, creación, escribir tu frase, probar «Mezclar» → «Guardar mi flyer».', '«Guardando…» → «¡Flyer guardado! Ganaste el timbre Flyer.» Se descarga la imagen del flyer. El timbre 4 queda marcado.', ''],
  ['C25', 'Credencial completa', 'Con los 4 timbres, volver a la credencial.', '«¡Credencial completa! Canjea tu premio con el equipo.» y aparece el botón «Canjear».', ''],
  ['C26', 'Canjear desde el celular', '«Canjear» → la persona del staff escribe el PIN.', '«¡Canjeado!» y «Gracias por recorrer la Semana del Diseño con nosotros.» La credencial dice «Canjeado». PIN malo: mensaje de PIN incorrecto. Incompleta: «Todavía te faltan timbres…».', 'PIN (P05) y stock (P06)'],
  ['C27', 'Timbre con el QR de la estación', 'Jugar → «Código» → apuntar al QR del timbre de la estación o escribir el «Código del sello» (4 letras o números) → «Timbrar».', '«Timbrando…» y el timbre queda. Repetido: «Ese timbre ya está en tu credencial.» Código mal: «El código tiene 4 letras o números.»', ''],
  ['C28', 'La credencial de otra persona', 'Abrir en otro celular https://dublbs.github.io/somos-diseno-herramientas/credencial/dist/#/c/ + el código de alguien.', 'Hoy se ve (no hay contraseña). Anotar si al grupo le parece un problema.', ''],
  ['C29', 'Código que no existe en la dirección', 'Abrir …/credencial/dist/#/c/SD-ZZZZZ.', '«No encontramos esa credencial» y «Crear mi credencial».', ''],
  ['C30', 'Celular sin red', 'Con la credencial abierta, poner modo avión y tocar «Jugar» y «Código».', 'Anotar qué muestra. No debe quedar en blanco ni perder la credencial al volver la red.', ''],

  // ---------- Tablet común ----------
  ['T01', 'El menú de las tablets', 'Abrir el menú (https://dublbs.github.io/somos-diseno-herramientas/).', 'Solo 7 experiencias: Fotomatón, Taller de Mosaicos, Teatro de Papel, Graffiti y Tags, Hora punta, Estación Audioreactiva y Taller de Grabado. Sin «Credencial» ni «Pantalla HUB».', ''],
  ['T02', 'Pantalla para entrar a jugar', 'Abrir cualquier experiencia con el modo juego encendido.', '«Escanea para jugar con tu credencial» con un QR, el campo del código, «Entrar», «Jugar sin credencial», «Staff» y «← Experiencias».', 'P07'],
  ['T03', 'Entrar escaneando el QR de la tablet', 'En el celular: credencial → Jugar → «Código» → apuntar al QR de la tablet.', 'Celular: «Conectando con la mesa…» → «¡Listo! Ya juegas en … con tu credencial.» La tablet entra sola en pocos segundos. Anotar cuántos.', 'Migración 009'],
  ['T04', 'QR de la tablet sin credencial', 'Escanear el QR de la tablet con la cámara de un celular que no tiene credencial.', 'Lleva a crear la credencial. Al crearla queda jugando en esa tablet.', 'Migración 009'],
  ['T05', 'Entrar escribiendo el código', 'Escribir el código de la credencial → «Entrar».', 'Entra a la experiencia. Probar también en minúsculas y con espacios: debe entrar igual.', ''],
  ['T06', 'Código con 0 o 1', 'Si alguien tiene un código con 0 o 1 (de antes de la 011), escribirlo.', 'Con #51: entra. Sin #51: «El código tiene la forma SD-XXXXX…» (falla conocida).', '#51'],
  ['T07', 'Código mal escrito', 'Escribir «SD-12» y luego un código con la forma correcta que no exista (ej. SD-ZZZZ9).', 'El primero: «El código tiene la forma SD-XXXXX y está en tu credencial.» El segundo, con #51: «No encontramos la credencial SD-ZZZZ9…». Sin #51 deja jugar y no suma nada (falla conocida).', '#51'],
  ['T08', 'Jugar sin credencial', '«Jugar sin credencial» → crear algo → «Llévatelo».', 'Se juega igual y se lleva la creación por QR. No suma timbres ni aparece en ninguna credencial.', ''],
  ['T09', 'Tutorial de la experiencia', 'Entrar a una experiencia por primera vez en la sesión.', 'Aparece el tutorial con el nombre y el lenguaje, y un botón para empezar. La segunda vez en la misma sesión no aparece.', ''],
  ['T10', 'Quiosco: vuelve solo al inicio', 'Dejar la tablet sin tocar 90 segundos con alguien jugando.', 'A los ~80 s avisa (10 s de cuenta). Si nadie toca, vuelve al inicio y pide el código otra vez. Si alguien toca durante el aviso, sigue.', ''],
  ['T11', '«Llévatelo»: QR de 24 h', 'Crear algo → «Llévatelo» → escanear el QR con un celular.', 'Vista previa y luego un QR. El celular abre la página de descarga y baja la imagen (o video en Teatro). Anotar si funciona en iPhone y Android.', ''],
  ['T12', '«Llévatelo» suma Creación', 'Con código: «Llévatelo».', 'Aparece el aviso del timbre (avance x de 4) y llega al inventario del celular.', ''],
  ['T13', 'Dos veces en la misma experiencia', 'Con el mismo código, «Llévatelo» dos veces en la misma experiencia.', 'Solo cuenta una vez para el timbre Creación.', ''],
  ['T14', 'Botón QR del encargado', 'Tocar el botón QR de la tablet (arriba).', 'Muestra el QR para jugar en esta estación y la opción «Crear mi credencial».', ''],
  ['T15', 'Panel del staff en la tablet', 'Abrir la experiencia con ?staff al final de la dirección → escribir el PIN del PC madre.', 'Abre el panel: dice que la tablet «sigue al PC madre» y muestra su identificador de mesa (4 letras). El PIN 0000 no entra si hay PIN.', 'Migración 008'],
  ['T16', 'El PC madre apaga y enciende el juego', 'PC madre → Mesas → desmarcar «Modo juego» y esperar 30 s. Luego volver a marcarlo.', 'Sin modo juego la tablet deja de pedir el código. Al encenderlo lo vuelve a pedir (máx. 30 s).', 'Migración 008'],
  ['T17', 'Reiniciar desde el PC madre', 'Con alguien jugando: PC madre → Mesas → «Reiniciar esta mesa» (o «todas»).', 'En ≤30 s la tablet borra el código y vuelve a pedirlo.', 'Migración 008'],
  ['T18', 'Tablet sin red', 'Desactivar el wifi de la tablet a mitad de una creación → «Llévatelo». Volver a activarlo y repetir.', 'Sin red: se puede crear; el QR queda en el equipo. Con red de vuelta: el timbre se vuelve a intentar al exportar (con #51).', ''],
  ['T19', 'Volver al menú', 'Tocar «← Experiencias».', 'Vuelve al menú de las 7 experiencias.', ''],

  // ---------- Fotomatón ----------
  ['F01', 'Abrir la cámara', 'Fotomatón → «Abrir la cámara» / «Activar la cámara» → permitir. Probar «Frontal» y «Trasera».', 'Se ve la cámara en vivo con el marco. Si se niega el permiso: mensaje y «Reintentar» o «Subir una foto».', ''],
  ['F02', 'Elegir lenguaje, marco y tinta', 'Panel derecho: Lenguaje (Pixel, Geométrica, Orgánica), Marco y las placas de impresión (tinta CMYK).', 'La vista previa cambia al momento. Solo el panel tiene scroll; la página no.', ''],
  ['F03', 'Sacar la foto', '«Sacar foto». Probar «Otra foto» / «Sacar otra foto».', 'Se revela la tarjeta con la trama elegida.', ''],
  ['F04', 'Subir una foto', '«Subir una foto» y elegir una imagen.', 'La imagen entra al marco igual que la de la cámara.', ''],
  ['F05', 'Generar el QR', '«Generar QR» → escanearlo con un celular.', 'El celular descarga la tarjeta (1080 × 1350 con la franja negra). Con código: suma Creación, sale en el HUB y en el inventario.', ''],
  ['F06', 'Terminar y empezar de nuevo', '«Terminar» o «Restablecer».', 'Vuelve al inicio, limpio para la siguiente persona.', ''],

  // ---------- Mosaicos ----------
  ['M01', 'Empezar', 'Taller de Mosaicos → «Empezar a diseñar».', 'Se ve la grilla, la barra flotante abajo y el panel derecho (Módulo, Paleta, Lienzo, Biblioteca).', ''],
  ['M02', 'Poner, girar, reflejar y borrar', 'Elegir un módulo de la biblioteca y tocar la grilla con «Poner», «Girar», «Reflejar» y «Borrar».', 'Cada toque cambia solo esa celda. Los toques responden al primer intento.', ''],
  ['M03', 'Multiplicar', 'Probar «Repetir en todo el lienzo», «Simetría en 4», «Escalonar», «Reflejar hacia la derecha/abajo», «Girar el área 90°» y «Borrar el área».', 'El patrón se aplica como dice cada botón.', ''],
  ['M04', 'Color y formato', 'Paletas de color, «Invertir colores», «Mostrar grilla», «Formato de diseño» y «Sorpréndeme».', 'El mosaico cambia y nada se sale de la pantalla.', ''],
  ['M05', 'Deshacer y rehacer', '↶ y ↷ arriba; con 2 dedos deshace y con 3 rehace.', 'Vuelve atrás y adelante sin perder el trabajo.', ''],
  ['M06', 'Llevarse el mosaico', '«Llévatelo» → «Tu mosaico está listo» → QR.', 'Descarga en el celular. Con código: suma Creación, aparece en el HUB y en el inventario.', ''],

  // ---------- Teatro ----------
  ['L01', 'Empezar', 'Teatro de Papel → «Armar mi escena».', 'Se ve el escenario y el panel con Escena, Transformar, Animación y Línea de tiempo.', ''],
  ['L02', 'Armar la escena', 'Arrastrar personajes y piezas al escenario. Elegir escenario o fondo.', 'Las piezas se mueven con el dedo. «Soltar la pieza» la deja donde quedó.', ''],
  ['L03', 'Transformar', 'Con una pieza elegida: «Agrandar», «Achicar», «Voltear», «Al frente», «Al fondo», «Quitar», «Color» y «Borde».', 'Cada botón hace lo que dice, solo en esa pieza.', ''],
  ['L04', 'Animar', 'Trayecto «De A a B» o «Quieto», «Invertir el trayecto», «Tiempo del loop» y «Cuadros por segundo». «Sorpréndeme».', 'La escena se anima en bucle. Los botones no tapan el escenario.', ''],
  ['L05', 'Llevarse la escena', '«Llévatelo» → esperar «Avance de la carga» → QR. Probar también «Descargar la tarjeta PNG».', 'El celular descarga la animación o la tarjeta. Con código: suma Creación (Teatro no aparece en el HUB).', ''],

  // ---------- Graffiti ----------
  ['G01', 'Empezar', 'Graffiti y Tags → «Empezar a pintar» → elegir muro y color.', 'Se ve el muro y la barra con Spray, Plumón, Rodillo, Stencil, Sticker y Borrar.', ''],
  ['G02', 'Pintar', 'Spray con goteo («Sin goteo», «Poco», «Mucho»), Plumón, Rodillo (ancho del rodillo) y Borrar.', 'El trazo sigue al dedo sin saltos. El goteo cae como se eligió.', ''],
  ['G03', 'Stencil', '«Stencil» → elegir plantilla → «Capa 1 · silueta» y «Capa 2 · detalle» → moverla, «Girar 90°», pintar encima → «Quitar plantilla».', 'Al quitar la plantilla queda la forma pintada.', ''],
  ['G04', 'Stickers', '«Sticker» → pegar, mover, «Duplicar», «Traer al frente», «Eliminar sticker».', 'Cada sticker se maneja solo.', ''],
  ['G05', 'Vaciar el muro y deshacer', '«Vaciar el muro»; ↶ y ↷.', 'El muro queda vacío (anotar si pide confirmar). Deshacer lo recupera.', ''],
  ['G06', 'Llevarse el muro', '«Llévatelo» → «Tu muro está listo» → QR.', 'Descarga en el celular. Con código: suma Creación, aparece en el HUB y en el inventario.', ''],

  // ---------- Hora punta ----------
  ['H01', 'Empezar a jugar', 'Hora punta → «Jugar».', 'Arranca el nivel 1. Controles: Izquierda, Derecha, Moverse y Acciones.', ''],
  ['H02', 'Jugar los 3 niveles', 'Jugar hasta el final. Mirar «Lo que llevas» y «Color recuperado».', 'Los niveles avanzan. Los micros llevan la pintura de la red de transporte. Los controles responden al toque.', ''],
  ['H03', 'Tu mural', 'Al terminar: «Tu mural está listo» → QR. Probar «Otra vez».', 'Descarga el mural. Con código: suma Creación y el mural va al HUB. «Otra vez» reinicia.', ''],

  // ---------- Audioreactiva ----------
  ['A01', 'Con micrófono', 'Estación Audioreactiva → «Empezar con micrófono» → permitir.', 'La escena reacciona al sonido del lugar (hablar, aplaudir).', ''],
  ['A02', 'Con música', '«Probar con música» / «Música demo». Pistas Batería, Bajo, Acordes y Melodía. Tempo. «Toca para que suene».', 'Se escucha por los parlantes de la tablet y la imagen sigue el ritmo. Anotar el volumen.', ''],
  ['A03', 'Escenas', 'Cambiar de escena.', 'Cambia la visual sin cortarse el sonido.', ''],
  ['A04', 'Llevarse un cuadro', '«Foto» → «Llevarte un cuadro como imagen» → QR.', 'Descarga la imagen. Con código: suma Creación y la escena llega al HUB.', ''],

  // ---------- Grabado ----------
  ['R01', 'Empezar', 'Taller de Grabado → «Empezar a estampar».', 'Se ve el papel y el panel con Tacos, Tinta, Papel, Capas, Marco y Ajustes.', ''],
  ['R02', 'Estampar', 'Elegir un taco, tinta y estampar sobre el papel. «Girar 90°». Capas «Se mezcla» y «Tapa». «Registro corrido».', 'Cada estampa queda donde se toca, con la tinta elegida.', ''],
  ['R03', 'Marco y papel', 'Probar marcos, «Sin marco» y tipos de papel.', 'Cambia el afiche sin perder lo estampado.', ''],
  ['R04', 'Llevarse el afiche', '«Hacer mi afiche» → «Tu afiche está listo» → QR.', 'Descarga en el celular. Con código: suma Creación, aparece en el HUB y en el inventario.', ''],

  // ---------- HUB ----------
  ['U01', 'En vivo, sin personas de prueba', 'Mirar la Flip al empezar la prueba.', 'Dice «En vivo». No hay personas inventadas (con #43 sin ?prueba=0; sin #43, usar ?prueba=0).', '#43 o ?prueba=0'],
  ['U02', 'Llega una persona nueva', 'Crear una credencial en un celular y mirar la Flip.', 'Aparece la persona con su personaje (o su foto si la autorizó). Anotar cuántos segundos tarda.', ''],
  ['U03', 'Llega una creación', 'Hacer «Llévatelo» con código en Mosaicos, Grabado, Graffiti, Fotomatón, Hora punta o Audioreactiva.', 'La creación aparece en el HUB. Anotar dónde (plaza, mezanina, andén) y cuánto tarda.', ''],
  ['U04', 'Los contadores', 'Comparar PERSONAS, TIMBRES y COMPLETAS de la Flip con PC madre → Resumen.', 'Coinciden (o se acercan en segundos).', ''],
  ['U05', 'Hora y movimiento', 'Mirar el cielo, el reloj y los trenes.', 'La hora es la real. Los trenes pasan sin trabarse.', ''],
  ['U06', 'Sin flecha de salida', 'Buscar la flecha ← arriba a la izquierda.', 'No está (plan 016). Con ?staff sí aparece.', ''],
  ['U07', 'Modo galería de respaldo', 'Abrir …/hub-estacion/dist/?galeria.', 'Muestra la galería de respaldo (plan 014).', ''],
  ['U08', 'Quitar algo desde el PC madre', 'PC madre → Pantalla HUB → «Quitar del HUB» en una creación.', 'En ≤30 s la Flip se recarga sola y eso ya no aparece.', 'Migración 010'],
  ['U09', 'Borrar una persona', 'PC madre → Personas → borrar una credencial de prueba.', 'En ≤30 s la persona desaparece de la Flip.', 'Migración 010'],
  ['U10', 'Una hora prendido', 'Dejar la Flip encendida toda la prueba.', 'Sigue fluida, sin congelarse ni recargarse sola sin motivo. Anotar la hora si falla.', ''],

  // ---------- Encargado ----------
  ['E01', 'Ayudar a entrar', 'Mostrar a la persona cómo escanear el QR de la tablet desde Jugar → «Código».', 'La persona entra sin tener que escribir el código.', ''],
  ['E02', 'Timbrar a mano si algo falla', 'En el celular de la persona: Jugar → «Código» → código de la estación 2 (el de PC madre → Mesas).', 'Suma la experiencia. Repetida en la misma estación: no suma dos veces.', ''],
  ['E03', 'Persona sin credencial', 'Botón QR de la tablet → «Crear mi credencial» → que la persona lo escanee.', 'Crea la credencial y queda jugando en esa tablet.', ''],
  ['E04', 'Liberar la mesa', 'Cuando la persona se va: esperar el quiosco (90 s), o reiniciar desde PC madre → Mesas (o «Terminar y liberar la mesa» si #48 está unido).', 'La siguiente persona no queda jugando con el código de la anterior.', ''],
  ['E05', 'La mesa en el PC madre', 'PC madre → Mesas.', 'La tablet aparece con su identificador, la experiencia y el código de quien juega.', ''],

  // ---------- PC madre ----------
  ['S01', 'Crear una cuenta nueva', 'Pantalla de entrada → «Crear cuenta» → nombre, correo y contraseña (6 o más).', 'Queda en «Cuenta pendiente» hasta que un admin la apruebe. Si el proyecto pide confirmar el correo, llega un mail.', ''],
  ['S02', 'Aprobar la cuenta', 'Admin → Configuración → «Cuentas del staff» → elegir rol (mesa o admin) → «Aprobar».', 'La persona sale y vuelve a entrar y ya ve el panel.', ''],
  ['S03', 'Resumen en vivo', 'Resumen con la prueba andando.', 'Credenciales, completas, premios entregados y stock, tablets jugando, celulares con avisos, timbres por estación y la última hora del HUB. Se actualiza solo.', 'Migración 010'],
  ['S04', 'Buscar personas', 'Personas → buscar por código y por nombre.', 'Filtra al escribir. La tabla muestra timbres 1–4, Creación x/4, Cacería x/3, Avisos, Canje y Hora.', ''],
  ['S05', 'Ficha de una persona', 'Tocar el código de una persona.', 'Se abre la ficha: experiencias hechas, afiches encontrados y lo que publicó en el HUB (con «Quitar del HUB»).', 'Migración 010'],
  ['S06', 'Cambiar un nombre', 'Tocar el nombre (lápiz) → escribir → «OK».', '«Nombre guardado.» En la credencial del celular se ve el nombre nuevo al recargar.', ''],
  ['S07', 'Dar y quitar timbres', 'Tocar el 1, 2, 3 o 4 de una persona.', 'Se marca o desmarca. En la credencial del celular se ve en unos segundos.', ''],
  ['S08', 'Borrar una credencial', 'Admin → papelera de una fila → confirmar.', '«Credencial borrada.» Desaparece de la tabla y del HUB.', ''],
  ['S09', 'Exportar CSV', 'Personas → «CSV».', 'Se descarga somos-diseno-personas-AAAA-MM-DD.csv y abre bien en Excel/Sheets (tildes y ñ incluidas).', ''],
  ['S10', 'Canjear en el PC madre', 'Canje → escribir el código → «Buscar» → «Entregar premio».', 'Solo si está completa. «Canjeado. Quedan N · hoy M.» Incompleta: dice qué falta. Ya canjeada: «Ya canjeado».', ''],
  ['S11', 'Editar el premio', 'Canje → Premio → cambiar stock → «Guardar». Probar con una cuenta «mesa».', 'Admin: «Premio guardado.» Mesa: los campos están bloqueados.', ''],
  ['S12', 'Mesas', 'Mesas: modo juego, código de la estación 2, PIN, «Reiniciar todas las tablets», «Reiniciar esta mesa» y «Últimas sesiones».', 'Cada tablet que jugó aparece con su código. Los reinicios llegan en ≤30 s.', 'Migración 008'],
  ['S13', 'Pantalla HUB', 'Pantalla HUB: filtros «Todo», «Personas» y «Dibujos y fotos». «Quitar del HUB». «Recargar el HUB».', 'Muestra lo último que llegó con su hora y código. Lo quitado sale de la Flip en ≤30 s.', 'Migración 010'],
  ['S14', 'Mandar un aviso', 'Avisos → título, mensaje y enlace → «Todos» o «Una credencial» → «Enviar aviso».', '«Enviado a N celulares.» Llega la notificación a un celular suscrito (C11). Queda en «Enviados».', 'Secretos VAPID'],
  ['S15', 'Cuenta «mesa»', 'Entrar con una cuenta de rol mesa.', 'Puede dar timbres, canjear y mandar avisos. No ve la papelera ni puede cambiar PIN, premio, modo juego ni empezar de cero.', ''],
  ['S16', 'Salir', '«Salir» abajo a la izquierda.', 'Vuelve a la pantalla de entrada.', ''],

  // ---------- A la vez ----------
  ['X01', 'Muchas credenciales a la vez', '5 o más personas tocan «Crear» al mismo tiempo.', 'Todas se crean con códigos distintos. Ninguna ve un error.', '#51 + migración 011'],
  ['X02', 'La misma persona en 4 tablets', 'Una persona entra con su código en 4 tablets y hacen «Llévatelo» casi al mismo tiempo.', 'El timbre Creación se entrega una sola vez y el inventario muestra las 4.', 'Migración 011'],
  ['X03', 'Dos celulares, el mismo QR de tablet', 'Dos personas escanean el QR de la misma tablet a la vez.', 'Una entra. La otra: «Esa mesa ya está jugando con otra credencial. Pide en la tablet un QR nuevo.»', 'Migración 011'],
  ['X04', 'Canje doble', 'La misma persona canjea a la vez desde su celular y en el PC madre.', 'Uno dice «Canjeado» y el otro «Ese premio ya se canjeó». El stock baja 1.', 'Migración 011'],
  ['X05', 'El último premio', 'Stock en 1. Dos personas completas canjean a la vez.', 'Una se lo lleva. La otra ve que no hay stock.', ''],
  ['X06', 'Tres afiches a la vez', 'Tres personas del grupo escanean afiches para la misma credencial al mismo tiempo (o una persona muy rápido).', 'Al tercer afiche se entrega el timbre Cacería.', 'Migración 011'],
  ['X07', 'Borrar a alguien que está jugando', 'PC madre borra la credencial de alguien que juega en una tablet; esa persona hace «Llévatelo».', 'No suma ni aparece en el HUB. La tablet no se cae.', 'Migración 011'],
  ['X08', 'Hora pico', 'Todo el grupo usa todas las tablets y celulares 10 minutos seguidos.', 'Ninguna pantalla se traba. El HUB y el PC madre siguen al día. Anotar lentitudes con la hora.', ''],
  ['X09', 'Volver a la credencial a mitad del juego', 'Cerrar el navegador del celular a mitad del juego y reabrir.', 'Conserva todo el avance.', ''],

  // ---------- Cierre ----------
  ['Z01', 'Guardar el registro', 'PC madre → Personas → «CSV». Revisar Resumen.', 'Queda el archivo de la prueba antes de borrar.', ''],
  ['Z02', 'Empezar de cero', 'Admin → Configuración → «Empezar de cero» → escribir BORRAR TODO → «Borrar todo» → confirmar.', '«Listo: se borraron N credenciales y M cosas del HUB.» Tablets y HUB se reinician solos en ≤30 s. Siguen el staff, el PIN, el premio y su stock.', 'Migración 010'],
  ['Z03', 'Las credenciales de prueba ya no abren', 'Abrir en un celular una credencial de la prueba.', '«No encontramos esa credencial». El celular ofrece crear una nueva.', ''],
];

// ---------- Roles: cada persona toma uno (o dos si son pocos) ----------
function rango(l, a, b) { var o = []; for (var i = a; i <= b; i++) o.push(l + (i < 10 ? '0' : '') + i); return o; }
var ROLES = [
  { id: 'coord', nombre: 'Coordinación · PC madre', equipo: 'PC madre (y su celular para avisos)',
    tarea: 'Prepara todo antes de empezar, dirige las fases («uno, dos, tres, ¡ya!» en las pruebas a la vez), prueba cada vista del PC madre y cierra la prueba.',
    pasos: [].concat(rango('P', 1, 13), rango('S', 1, 16), rango('Z', 1, 3)) },
  { id: 'iphone', nombre: 'Visitante con iPhone', equipo: 'Su iPhone + las tablets',
    tarea: 'Hace todo el recorrido de un visitante en iPhone: crea su credencial, juega en Fotomatón y Mosaicos, caza afiches, arma el flyer y canjea.',
    pasos: [].concat(rango('C', 1, 30), rango('T', 1, 5), rango('T', 9, 13), ['T19'], rango('F', 1, 6), rango('M', 1, 6)) },
  { id: 'android', nombre: 'Visitante con Android', equipo: 'Su Android + las tablets',
    tarea: 'El mismo recorrido en Android (lo que cambia entre teléfonos sale aquí). Juega en Teatro, Graffiti y Hora punta.',
    pasos: [].concat(rango('C', 1, 27), rango('T', 1, 5), rango('T', 9, 13), ['T19'], rango('L', 1, 5), rango('G', 1, 6), rango('H', 1, 3)) },
  { id: 'borde', nombre: 'Visitante de casos raros', equipo: 'Cualquier celular + las tablets',
    tarea: 'Intenta romperlo: códigos mal escritos, jugar sin credencial, sin red, credenciales ajenas. Juega en Audioreactiva y Grabado.',
    pasos: [].concat(['T06', 'T07', 'T08', 'T18'], rango('C', 28, 30), rango('A', 1, 4), rango('R', 1, 4), ['X09']) },
  { id: 'mesa', nombre: 'Encargado de mesa', equipo: 'Junto a las tablets',
    tarea: 'Hace lo que hará el staff en las mesas: ayudar a entrar, timbrar a mano, liberar la mesa y revisar los reinicios desde el PC madre.',
    pasos: [].concat(rango('E', 1, 5), ['T10', 'T14', 'T15', 'T16', 'T17']) },
  { id: 'hub', nombre: 'Ojo en el HUB', equipo: 'Frente a la Flip (con un celular para registrar)',
    tarea: 'Mira la Flip toda la prueba: anota cuánto tarda en aparecer cada cosa, si los contadores coinciden con el PC madre y si algo se traba.',
    pasos: rango('U', 1, 10) },
];
// Las pruebas «a la vez» son de todos.
var TODOS = rango('X', 1, 8);

// ---------- El orden de la prueba ----------
var FASES = [
  { n: 0, nombre: 'Preparación', min: 20, quien: 'Coordinación', que: 'Dejar todo listo. El resto del grupo elige su rol y escribe su equipo.', pasos: rango('P', 1, 13) },
  { n: 1, nombre: 'Llegada: la credencial', min: 10, quien: 'Visitantes · Ojo en el HUB', que: 'Cada visitante escanea el QR de la entrada y crea su credencial. El HUB anota cuándo aparece cada persona.', pasos: [].concat(rango('C', 1, 14), ['U01', 'U02']) },
  { n: 2, nombre: 'Tablets: entrar y crear', min: 35, quien: 'Visitantes · Encargado de mesa · Ojo en el HUB', que: 'Cada visitante entra a sus experiencias (por QR y por código) y se lleva lo creado. El encargado ayuda y prueba los reinicios. El HUB mira las creaciones.', pasos: [].concat(rango('T', 1, 19), rango('F', 1, 6), rango('M', 1, 6), rango('L', 1, 5), rango('G', 1, 6), rango('H', 1, 3), rango('A', 1, 4), rango('R', 1, 4), rango('E', 1, 5), ['C15', 'C21', 'C22', 'U03', 'U04', 'U05']) },
  { n: 3, nombre: 'Cacería y flyer', min: 15, quien: 'Visitantes', que: 'Encontrar los afiches por la sede (con cámara y con código) y armar el flyer.', pasos: [].concat(rango('C', 16, 20), rango('C', 23, 24)) },
  { n: 4, nombre: 'Canje y PC madre', min: 15, quien: 'Coordinación · Visitantes', que: 'Canjear con PIN en el celular y en el PC madre. Coordinación recorre todas las vistas del panel.', pasos: [].concat(rango('C', 25, 27), rango('S', 1, 16), ['U08', 'U09']) },
  { n: 5, nombre: 'Todos a la vez', min: 15, quien: 'Todo el grupo', que: 'Coordinación cuenta «uno, dos, tres, ¡ya!» y todos hacen lo mismo al mismo tiempo.', pasos: rango('X', 1, 9) },
  { n: 6, nombre: 'Casos raros', min: 10, quien: 'Visitante de casos raros · Ojo en el HUB', que: 'Lo que no debería pasar en el evento, pero va a pasar.', pasos: [].concat(rango('C', 28, 30), ['U06', 'U07', 'U10']) },
  { n: 7, nombre: 'Cierre', min: 15, quien: 'Coordinación · todos', que: 'Exportar el CSV, revisar juntos los hallazgos abiertos y dejar la base en cero para el evento.', pasos: rango('Z', 1, 3) },
];
if (typeof module !== 'undefined') module.exports = { SECCIONES: SECCIONES, PASOS: PASOS, ROLES: ROLES, FASES: FASES, TODOS: TODOS };
