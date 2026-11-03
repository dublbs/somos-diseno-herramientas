// Descarga un archivo en el navegador de la tablet (sin dependencias externas).
export async function guardarArchivo(nombre: string, blob: Blob): Promise<'guardado' | 'cancelado' | 'ocupado'> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'guardado';
}
