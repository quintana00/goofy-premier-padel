"use client";

import { useActionState, useState } from "react";
import { cambiarPin, guardarFoto, nuevaTemporada } from "@/app/acciones";
import { FotoCabezon } from "@/components/FotoCabezon";

export function FormFoto() {
  const [estado, accion, enviando] = useActionState(guardarFoto, null);
  const [foto, setFoto] = useState<string | null>(null);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>📸 Tu cabezón</h2>
      <FotoCabezon alCambiar={setFoto} />
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      {foto && (
        <button className="boton" disabled={enviando}>
          Guardar cabezón
        </button>
      )}
    </form>
  );
}

export function FormPin() {
  const [estado, accion, enviando] = useActionState(cambiarPin, null);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>🔑 Cambiar PIN</h2>
      <input name="pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="Nuevo PIN (4 números)" required />
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton secundario" disabled={enviando}>
        Cambiar
      </button>
    </form>
  );
}

export function FormTemporada({ actual }: { actual: string }) {
  const [estado, accion, enviando] = useActionState(nuevaTemporada, null);
  return (
    <details className="tarjeta">
      <summary>📅 Empezar temporada nueva</summary>
      <form action={accion} className="pila" style={{ marginTop: 12 }}>
        <p className="suave pequeno" style={{ margin: 0 }}>
          Ahora mismo: <b>{actual}</b>. Al empezar una nueva, el ranking de temporada vuelve a 1000 para todos. El histórico
          se queda como está. Ponedlo de acuerdo en el grupo antes de darle.
        </p>
        <input name="nombre" placeholder="Temporada Primavera 2027" maxLength={40} required />
        {estado?.error && <p className="error">{estado.error}</p>}
        {estado?.ok && <p className="ok">{estado.ok}</p>}
        <button className="boton secundario" disabled={enviando}>
          Empezar temporada
        </button>
      </form>
    </details>
  );
}
