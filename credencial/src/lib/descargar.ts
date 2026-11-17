// Guarda un archivo generado en el celular. Dentro de claude.ai (Artifact) las descargas pasan por
// la capacidad «downloads»; en el sitio publicado se usa compartir (galería del teléfono) o un enlace.
interface Descargas { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
interface ClaudeVisor { use: (nombre: string) => Promise<unknown> }

// Devuelve false si la persona cerró el menú de compartir sin guardar (para no dar por guardado lo que no se guardó).
export async function guardarArchivo(blob: Blob, nombre: string): Promise<boolean> {
  const visor = (window as unknown as { claude?: ClaudeVisor }).claude;
  if (visor?.use) {
    const descargas = (await visor.use('downloads').catch(() => null)) as Descargas | null;
    if (descargas) { await descargas.save({ filename: nombre, data: blob }); return true; }
  }
  const archivo = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare?.({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo] }); return true; } catch (e) { if ((e as Error).name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
