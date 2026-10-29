"use client";

import { useActionState, useState } from "react";
import { cambiarPin, fijarFinTemporada, guardarFoto, nuevaTemporada } from "@/app/acciones";
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

export function FormTemporada({ actual, fin, hoy }: { actual: string; fin: string | null; hoy: string }) {
  const [estado, accion, enviando] = useActionState(nuevaTemporada, null);
  const [estadoFin, accionFin, enviandoFin] = useActionState(fijarFinTemporada, null);
  return (
    <details className="tarjeta">
      <summary>📅 Temporadas</summary>
      <form action={accionFin} className="pila" style={{ marginTop: 12 }}>
        <b className="pequeno">¿Cuándo acaba {actual}?</b>
        <div className="fila">
          <input type="date" name="fin" defaultValue={fin ?? ""} min={hoy} required />
          <button className="boton secundario mini" disabled={enviandoFin}>
            Guardar
          </button>
        </div>
        {estadoFin?.error && <p className="error">{estadoFin.error}</p>}
        {estadoFin?.ok && <p className="ok">{estadoFin.ok}</p>}
      </form>
      <form action={accion} className="pila" style={{ marginTop: 18 }}>
        <b className="pequeno">Cerrar {actual} y empezar otra</b>
        <p className="suave pequeno" style={{ margin: 0 }}>
          {actual} se cierra con su ceremonia y el ranking de temporada vuelve a 1000 para todos. El histórico se queda
          como está. Ponedlo de acuerdo en el grupo antes de darle.
        </p>
        <input name="nombre" placeholder="Temporada 2" maxLength={40} required />
        <label>
          Acaba el (opcional)
          <input type="date" name="fin" min={hoy} />
        </label>
        {estado?.error && <p className="error">{estado.error}</p>}
        {estado?.ok && <p className="ok">{estado.ok}</p>}
        <button className="boton secundario" disabled={enviando}>
          Cerrar y empezar temporada
        </button>
      </form>
    </details>
  );
}
