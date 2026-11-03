// Guarda un archivo generado en el celular. Dentro de claude.ai (Artifact) las descargas pasan por
// la capacidad «downloads»; en el sitio publicado se usa compartir (galería del teléfono) o un enlace.
interface Descargas { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
interface ClaudeVisor { use: (nombre: string) => Promise<unknown> }

export async function guardarArchivo(blob: Blob, nombre: string): Promise<void> {
  const visor = (window as unknown as { claude?: ClaudeVisor }).claude;
  if (visor?.use) {
    const descargas = (await visor.use('downloads').catch(() => null)) as Descargas | null;
    if (descargas) { await descargas.save({ filename: nombre, data: blob }); return; }
  }
  const archivo = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare?.({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo] }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
