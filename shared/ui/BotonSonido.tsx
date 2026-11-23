import React, { useEffect, useState } from 'react';
import { BotonIcono } from './Herramienta';
import { alCambiarSonido, ponerSonido, sonidoActivo } from '../sonido';

// Botón de la barra superior para silenciar los efectos en este equipo (plan 018). Queda guardado en la tablet.
export const BotonSonido: React.FC = () => {
  const [on, setOn] = useState(sonidoActivo);
  useEffect(() => alCambiarSonido(setOn), []);
  return (
    <BotonIcono icono={on ? 'volume_up' : 'volume_off'} etiqueta={on ? 'Silenciar los efectos de sonido' : 'Activar los efectos de sonido'}
      variante="fantasma" activo={on} onClick={() => ponerSonido(!on)} />
  );
};
