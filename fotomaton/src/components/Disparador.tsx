// Lo único de la barra inferior (plan 012): el botón redondo para capturar.
export function Disparador({ texto, etiqueta, disabled, onClick }: { texto: string; etiqueta: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="disparador" onClick={onClick} disabled={disabled} aria-label={etiqueta}>
      <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>
      <span className="disparador-texto">{texto}</span>
    </button>
  );
}
