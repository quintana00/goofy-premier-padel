"use client";

import { useActionState, useState } from "react";
import { reclamar } from "@/app/acciones";
import { setsValidos } from "@/lib/motor";
import type { Formato, Marcador } from "@/lib/tipos";

const FORMATOS: { valor: Formato; texto: string }[] = [
  { valor: "mejor3", texto: "Mejor de 3" },
  { valor: "1set", texto: "1 set" },
  { valor: "inacabado", texto: "Inacabado" },
];

// El rival dice cuál fue el resultado de verdad. Arranca con el que se apuntó, para cambiar solo lo que está mal.
export function Reclamar({ id, sets, formato, parejaA, parejaB }: { id: number; sets: Marcador[]; formato: Formato; parejaA: string; parejaB: string }) {
  const [estado, accion, enviando] = useActionState(reclamar, null);
  const [noSeJugo, setNoSeJugo] = useState(false);
  const [f, setF] = useState<Formato>(formato);
  const [filas, setFilas] = useState<string[][]>([0, 1, 2].map((i) => (sets[i] ? sets[i].map(String) : ["", ""])));
  const visibles = f === "1set" ? filas.slice(0, 1) : filas;
  const marcador: Marcador[] = visibles.filter(([x, y]) => x !== "" && y !== "").map(([x, y]) => [Number(x), Number(y)]);
  const error = !noSeJugo && marcador.length ? setsValidos(marcador, f) : null;

  return (
    <details className="tarjeta alerta">
      <summary>🙋 ¿Está mal? Reclamar resultado</summary>
      <form action={accion} className="pila" style={{ marginTop: 12 }}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="sets" value={JSON.stringify(marcador)} />
        <input type="hidden" name="formato" value={f} />
        {noSeJugo && <input type="hidden" name="noSeJugo" value="si" />}
        <label className="fila" style={{ display: "flex", fontWeight: 700 }}>
          <input type="checkbox" checked={noSeJugo} onChange={(e) => setNoSeJugo(e.target.checked)} style={{ width: 22, minHeight: 22 }} />
          Este partido no se jugó
        </label>
        {!noSeJugo && (
          <>
            <b className="pequeno">El resultado bueno fue:</b>
            <select value={f} onChange={(e) => setF(e.target.value as Formato)} aria-label="Formato">
              {FORMATOS.map((x) => (
                <option key={x.valor} value={x.valor}>
                  {x.texto}
                </option>
              ))}
            </select>
            <div className="sets-form">
              <span />
              <span className="pequeno" style={{ textAlign: "center", color: "var(--bola)", fontWeight: 800 }}>
                {parejaA}
              </span>
              <span className="pequeno" style={{ textAlign: "center", color: "var(--rosa)", fontWeight: 800 }}>
                {parejaB}
              </span>
              {visibles.map((fila, i) => (
                <Fila key={i} i={i} fila={fila} cambiar={(n) => setFilas(filas.map((x, k) => (k === i ? n : x)))} />
              ))}
            </div>
          </>
        )}
        <textarea name="motivo" maxLength={300} required placeholder="¿Qué está mal? (p. ej. «el segundo set fue 7-5, no 6-4»)" />
        {error && <p className="error">{error}</p>}
        {estado?.error && <p className="error">{estado.error}</p>}
        {estado?.ok && <p className="ok">{estado.ok}</p>}
        <button className="boton" disabled={enviando || Boolean(error) || (!noSeJugo && !marcador.length)}>
          Reclamar
        </button>
        <p className="suave pequeno" style={{ margin: 0 }}>
          Mientras esté reclamado no cuenta. Lo resuelve la pareja que lo apuntó: acepta tu corrección o lo manda al
          tribunal.
        </p>
      </form>
    </details>
  );
}

function Fila({ i, fila, cambiar }: { i: number; fila: string[]; cambiar: (f: string[]) => void }) {
  return (
    <>
      <span className="suave pequeno" style={{ fontWeight: 800 }}>
        Set {i + 1}
      </span>
      {[0, 1].map((k) => (
        <input
          key={k}
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          value={fila[k]}
          onChange={(e) => cambiar(k === 0 ? [e.target.value, fila[1]] : [fila[0], e.target.value])}
          aria-label={`Set ${i + 1}, pareja ${k + 1}`}
        />
      ))}
    </>
  );
}
