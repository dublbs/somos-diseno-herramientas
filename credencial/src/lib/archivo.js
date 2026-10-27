// Entrega un archivo al usuario. Dentro de un artifact de Claude usa su capacidad de descargas;
// en el sitio normal, un enlace de descarga.
export async function guardarArchivo(nombre, datos) {
  const blob = datos instanceof Blob ? datos : new Blob([datos], { type: "application/json" });
  try {
    const descargas = window.claude?.use ? await window.claude.use("downloads") : null;
    if (descargas) {
      await descargas.save({ filename: nombre, data: blob });
      return "guardado";
    }
  } catch (e) {
    if (e?.code === "declined") return "cancelado";
    if (e?.code === "rate_limited") return "ocupado";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "guardado";
}
