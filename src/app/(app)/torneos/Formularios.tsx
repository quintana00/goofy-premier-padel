"use client";

import { useActionState } from "react";
import { nuevoTorneo, resultadoTorneo } from "@/app/acciones";
import { PUESTOS } from "@/lib/motor";
import type { Jugador } from "@/lib/tipos";

export function FormTorneo({ hoy }: { hoy: string }) {
  const [estado, accion, enviando] = useActionState(nuevoTorneo, null);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>🏟️ Ha habido torneo</h2>
      <label>
        Nombre
        <input name="nombre" placeholder="Torneo de Navidad del club…" maxLength={60} required />
      </label>
      <label>
        Fecha
        <input type="date" name="fecha" defaultValue={hoy} required />
      </label>
      {estado?.error && <p className="error">{estado.error}</p>}
      <button className="boton" disabled={enviando}>
        Crear torneo
      </button>
    </form>
  );
}

export function FormPuesto({ torneo, jugadores, yoId }: { torneo: number; jugadores: Jugador[]; yoId: number }) {
  const [estado, accion, enviando] = useActionState(resultadoTorneo, null);
  return (
    <form action={accion} className="tarjeta pila">
      <input type="hidden" name="torneo" value={torneo} />
      <b>¿Cómo quedasteis?</b>
      <div className="fila">
        {(["j1", "j2"] as const).map((campo, i) => (
          <select key={campo} name={campo} defaultValue={i === 0 ? yoId : ""} required>
            <option value="" disabled>
              Compañero
            </option>
            {jugadores.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nombre}
              </option>
            ))}
          </select>
        ))}
      </div>
      <select name="puesto" required defaultValue="">
        <option value="" disabled>
          Puesto
        </option>
        {PUESTOS.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton" disabled={enviando}>
        Guardar
      </button>
    </form>
  );
}
