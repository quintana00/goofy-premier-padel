"use client";

import { useActionState, useState } from "react";
import { nuevoGasto } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import type { Jugador } from "@/lib/tipos";

const CONCEPTOS = ["🎾 Pista", "🟡 Pelotas", "🍺 Cañas", "🚗 Gasolina", "Otro"];

export function FormGasto({ jugadores, yoId, hoy }: { jugadores: Jugador[]; yoId: number; hoy: string }) {
  const [estado, accion, enviando] = useActionState(nuevoGasto, null);
  const [pagador, setPagador] = useState(yoId);
  const [gente, setGente] = useState<number[]>([yoId]);
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState(CONCEPTOS[0]);
  const total = Number(importe.replace(",", ".")) || 0;
  const parte = gente.length ? total / gente.length : 0;

  return (
    <form action={accion} className="tarjeta pila">
      <h2>🧾 Apuntar un pago</h2>
      <input type="hidden" name="pagador" value={pagador} />
      {gente.map((id) => (
        <input key={id} type="hidden" name="participantes" value={id} />
      ))}
      <label>
        ¿Quién pagó?
        <select value={pagador} onChange={(e) => setPagador(Number(e.target.value))}>
          {jugadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre}
            </option>
          ))}
        </select>
      </label>
      <div className="fila">
        <label style={{ flex: 1.3 }}>
          ¿Qué?
          <select name="concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)}>
            {CONCEPTOS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Total €
          <input name="importe" inputMode="decimal" placeholder="24" value={importe} onChange={(e) => setImporte(e.target.value)} required />
        </label>
      </div>
      <label>
        Fecha
        <input type="date" name="fecha" defaultValue={hoy} max={hoy} required />
      </label>
      <div className="pila" style={{ gap: 8 }}>
        <b style={{ fontSize: 14 }}>¿Entre quién se reparte? (incluye al que pagó si jugó)</b>
        <div className="elegir">
          {jugadores.map((j) => {
            const dentro = gente.includes(j.id);
            return (
              <button
                type="button"
                key={j.id}
                aria-pressed={dentro}
                onClick={() => setGente(dentro ? gente.filter((x) => x !== j.id) : [...gente, j.id])}
              >
                <Avatar j={j} tam={28} /> {j.nombre}
              </button>
            );
          })}
        </div>
      </div>
      {parte > 0 && gente.length > 1 && (
        <p className="suave" style={{ margin: 0 }}>
          Sale a <b style={{ color: "var(--texto)" }}>{parte.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</b> por cabeza.
        </p>
      )}
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton" disabled={enviando}>
        Apuntar deuda
      </button>
    </form>
  );
}
