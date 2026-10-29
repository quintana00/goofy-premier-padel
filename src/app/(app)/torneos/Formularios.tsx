"use client";

import { useActionState, useState } from "react";
import { nuevoAmericano, nuevoTorneo, resultadoAmericano, resultadoTorneo } from "@/app/acciones";
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

export function FormAmericano({ jugadores, yoId, hoy }: { jugadores: Jugador[]; yoId: number; hoy: string }) {
  const [estado, accion, enviando] = useActionState(nuevoAmericano, null);
  const [elegidos, setElegidos] = useState<number[]>([yoId]);
  const n = elegidos.length;
  const pistas = Math.floor(n / 4);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>🔀 Torneo cruzado (americano)</h2>
      <p className="suave pequeno" style={{ margin: 0 }}>
        Las parejas rotan cada ronda: todos juegan con todos y sale un ranking individual por juegos ganados. La app hace
        los cruces sola.
      </p>
      {elegidos.map((id) => (
        <input key={id} type="hidden" name="jugadores" value={id} />
      ))}
      <label>
        Nombre
        <input name="nombre" placeholder="Americano de la Tropa" maxLength={60} required />
      </label>
      <div className="fila">
        <label style={{ flex: 1 }}>
          Fecha
          <input type="date" name="fecha" defaultValue={hoy} required />
        </label>
        <label style={{ flex: 1 }}>
          Cada partido a
          <select name="juegos" defaultValue={16}>
            <option value={6}>6 juegos</option>
            <option value={16}>16 puntos</option>
            <option value={24}>24 puntos</option>
            <option value={32}>32 puntos</option>
          </select>
        </label>
      </div>
      <b className="pequeno">¿Quién juega? ({n})</b>
      <div className="elegir">
        {jugadores.map((j) => {
          const dentro = elegidos.includes(j.id);
          return (
            <button
              type="button"
              key={j.id}
              aria-pressed={dentro}
              onClick={() => setElegidos(dentro ? elegidos.filter((x) => x !== j.id) : [...elegidos, j.id])}
            >
              {j.nombre}
            </button>
          );
        })}
      </div>
      {n >= 4 && (
        <p className="suave pequeno" style={{ margin: 0 }}>
          {pistas} pista{pistas > 1 ? "s" : ""} por ronda
          {n % 4 ? ` · descansan ${n - pistas * 4} por ronda, por turnos` : ""} · {n % 4 === 0 ? n - 1 : n} rondas
        </p>
      )}
      {estado?.error && <p className="error">{estado.error}</p>}
      <button className="boton" disabled={enviando || n < 4}>
        Generar cruces
      </button>
    </form>
  );
}

export function FormPista({ torneo, ronda, pista, ja, jb }: { torneo: number; ronda: number; pista: number; ja: number | null; jb: number | null }) {
  const [estado, accion, enviando] = useActionState(resultadoAmericano, null);
  return (
    <form action={accion} className="fila" style={{ gap: 6 }}>
      <input type="hidden" name="torneo" value={torneo} />
      <input type="hidden" name="ronda" value={ronda} />
      <input type="hidden" name="pista" value={pista} />
      <input name="ja" type="number" inputMode="numeric" min={0} max={99} defaultValue={ja ?? ""} required aria-label="Juegos pareja 1" style={{ width: 64, textAlign: "center", fontWeight: 850 }} />
      <span className="suave">-</span>
      <input name="jb" type="number" inputMode="numeric" min={0} max={99} defaultValue={jb ?? ""} required aria-label="Juegos pareja 2" style={{ width: 64, textAlign: "center", fontWeight: 850 }} />
      <button className="boton mini" disabled={enviando}>
        {estado?.ok ? "✓" : "Guardar"}
      </button>
      {estado?.error && <span className="error">{estado.error}</span>}
    </form>
  );
}
