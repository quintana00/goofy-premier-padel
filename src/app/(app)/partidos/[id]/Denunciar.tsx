"use client";

import { useActionState } from "react";
import { denunciar } from "@/app/acciones";

export function Denunciar({ id }: { id: number }) {
  const [estado, accion, enviando] = useActionState(denunciar, null);
  return (
    <details className="tarjeta peligro">
      <summary>🚨 Denunciar amaño o trampas</summary>
      <form action={accion} className="pila" style={{ marginTop: 12 }}>
        <input type="hidden" name="id" value={id} />
        <textarea
          name="motivo"
          maxLength={400}
          required
          placeholder="Cuenta qué pasó: bolas que eran buenas, marcador inventado, el cuñado de árbitro…"
        />
        {estado?.error && <p className="error">{estado.error}</p>}
        {estado?.ok && <p className="ok">{estado.ok}</p>}
        <button className="boton rojo" disabled={enviando}>
          Llevar al tribunal ⚖️
        </button>
        <p className="suave pequeno" style={{ margin: 0 }}>
          Votan los que no jugaron. Con 3 votos o más decide la mayoría. Si gana «amaño», el partido se anula y deja de
          contar. Si gana «limpio», te llevas la medalla de Llorón.
        </p>
      </form>
    </details>
  );
}
