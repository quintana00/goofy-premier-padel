"use client";

import { useActionState, useState } from "react";
import { fijarParejas } from "@/app/acciones";

// Con los cuatro dentro, se elige quién va con quién. Al fijarlas se abren las apuestas.
export function FijarParejas({ id, jugadores }: { id: number; jugadores: { id: number; nombre: string }[] }) {
  const [estado, accion, enviando] = useActionState(fijarParejas, null);
  const [companero, setCompanero] = useState<number | null>(null);
  const [formato, setFormato] = useState<"mejor3" | "1set">("mejor3");
  const primero = jugadores[0];
  const resto = jugadores.filter((j) => j.id !== primero.id && j.id !== companero);
  return (
    <form action={accion} className="pila parejas-form" style={{ gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="primero" value={primero.id} />
      <input type="hidden" name="companero" value={companero ?? ""} />
      <input type="hidden" name="formato" value={formato} />
      <b className="pequeno">🎰 Fijad las parejas para abrir las apuestas</b>
      <span className="suave pequeno">¿Con quién va {primero.nombre}?</span>
      <div className="elegir">
        {jugadores.slice(1).map((j) => (
          <button key={j.id} type="button" aria-pressed={companero === j.id} onClick={() => setCompanero(j.id)}>
            {j.nombre}
          </button>
        ))}
      </div>
      {companero && (
        <span className="pequeno">
          <b style={{ color: "var(--bola)" }}>
            {primero.nombre} y {jugadores.find((j) => j.id === companero)?.nombre}
          </b>{" "}
          vs <b style={{ color: "var(--rosa)" }}>{resto.map((j) => j.nombre).join(" y ")}</b>
        </span>
      )}
      <div className="pestanas" style={{ margin: 0 }}>
        {(["mejor3", "1set"] as const).map((f) => (
          <a key={f} href="#" role="button" aria-current={formato === f ? "page" : undefined} onClick={(e) => (e.preventDefault(), setFormato(f))}>
            {f === "mejor3" ? "Mejor de 3" : "A 1 set"}
          </a>
        ))}
      </div>
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton mini" disabled={enviando || !companero}>
        Fijar parejas
      </button>
    </form>
  );
}
