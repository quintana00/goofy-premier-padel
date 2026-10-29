"use client";

import { useActionState, useState } from "react";
import { nuevoPartido } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import { ganador, setsValidos } from "@/lib/motor";
import type { Formato, Jugador, Marcador } from "@/lib/tipos";

const FORMATOS: { valor: Formato; texto: string; ayuda: string }[] = [
  { valor: "mejor3", texto: "Mejor de 3", ayuda: "Gana quien se lleva 2 sets" },
  { valor: "1set", texto: "1 set", ayuda: "Partido a un solo set: cuenta como victoria" },
  { valor: "inacabado", texto: "⏸️ Inacabado", ayuda: "Se paró a medias: suma juegos y sets, pero no victoria ni derrota" },
];

// ¿Quién iba a la derecha? Para acabar con lo de "es que yo iba a la derecha".
function Derecha({ ids, valor, cambiar, jugadores }: { ids: number[]; valor: number | null; cambiar: (v: number | null) => void; jugadores: Jugador[] }) {
  if (ids.length !== 2) return null;
  return (
    <div className="fila envolver pequeno" style={{ gap: 6 }}>
      <span className="suave">A la derecha:</span>
      {ids.map((id) => (
        <button
          type="button"
          key={id}
          className={`chapa ${valor === id ? "verde" : ""}`}
          style={{ border: 0, cursor: "pointer", font: "inherit", fontWeight: 800, color: valor === id ? undefined : "var(--texto)" }}
          onClick={() => cambiar(valor === id ? null : id)}
        >
          {jugadores.find((j) => j.id === id)?.nombre}
        </button>
      ))}
      {valor === null && <span className="suave">(toca uno)</span>}
    </div>
  );
}

function Selector({
  jugadores,
  elegidos,
  bloqueados,
  cambiar,
  clase,
}: {
  jugadores: Jugador[];
  elegidos: number[];
  bloqueados: number[];
  cambiar: (ids: number[]) => void;
  clase?: string;
}) {
  return (
    <div className="elegir">
      {jugadores.map((j) => {
        const dentro = elegidos.includes(j.id);
        return (
          <button
            type="button"
            key={j.id}
            className={clase}
            aria-pressed={dentro}
            disabled={bloqueados.includes(j.id) || (!dentro && elegidos.length >= 2)}
            onClick={() => cambiar(dentro ? elegidos.filter((x) => x !== j.id) : [...elegidos, j.id])}
          >
            <Avatar j={j} tam={30} /> {j.nombre}
          </button>
        );
      })}
    </div>
  );
}

export function FormPartido({
  jugadores,
  yoId,
  hoy,
  torneos,
  torneoInicial,
}: {
  jugadores: Jugador[];
  yoId: number;
  hoy: string;
  torneos: { id: number; nombre: string }[];
  torneoInicial: number | null;
}) {
  const [estado, accion, enviando] = useActionState(nuevoPartido, null);
  const [a, setA] = useState<number[]>([yoId]);
  const [b, setB] = useState<number[]>([]);
  const [torneo, setTorneo] = useState<number | null>(torneoInicial);
  const [fuera, setFuera] = useState(false);
  const [sets, setSets] = useState<string[][]>([["", ""], ["", ""], ["", ""]]);
  const [formato, setFormato] = useState<Formato>("mejor3");
  const [derechaA, setDerechaA] = useState<number | null>(null);
  const [derechaB, setDerechaB] = useState<number | null>(null);
  const [impuesta, setImpuesta] = useState(false);

  const filas = formato === "1set" ? sets.slice(0, 1) : sets;
  const marcador: Marcador[] = filas
    .filter(([x, y]) => x !== "" && y !== "")
    .map(([x, y]) => [Number(x), Number(y)]);
  const errorSets = marcador.length ? setsValidos(marcador, formato) : null;
  const juegoYo = a.includes(yoId) || b.includes(yoId);
  const nombre = (ids: number[]) => ids.map((id) => jugadores.find((j) => j.id === id)?.nombre).join(" y ");
  const listos = a.length === 2 && (fuera || b.length === 2);

  return (
    <form action={accion} className="pila" style={{ gap: 18 }}>
      <input type="hidden" name="a1" value={a[0] ?? ""} />
      <input type="hidden" name="a2" value={a[1] ?? ""} />
      <input type="hidden" name="b1" value={fuera ? "" : (b[0] ?? "")} />
      <input type="hidden" name="b2" value={fuera ? "" : (b[1] ?? "")} />
      <input type="hidden" name="sets" value={JSON.stringify(marcador)} />
      <input type="hidden" name="formato" value={formato} />
      <input type="hidden" name="aDerecha" value={a.includes(derechaA ?? 0) ? (derechaA ?? "") : ""} />
      <input type="hidden" name="bDerecha" value={!fuera && b.includes(derechaB ?? 0) ? (derechaB ?? "") : ""} />
      {impuesta && juegoYo && <input type="hidden" name="impuesta" value="1" />}

      <div className="fila" style={{ gap: 10 }}>
        <label style={{ flex: 1 }}>
          Fecha
          <input type="date" name="fecha" defaultValue={hoy} max={hoy} required />
        </label>
        {torneos.length > 0 && (
          <label style={{ flex: 1 }}>
            ¿De un torneo?
            <select name="torneoId" value={torneo ?? ""} onChange={(e) => setTorneo(e.target.value ? Number(e.target.value) : null)}>
              <option value="">No, amistoso</option>
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="pila" style={{ gap: 8 }}>
        <b style={{ color: "var(--bola)" }}>🟡 Pareja 1</b>
        <Selector jugadores={jugadores} elegidos={a} bloqueados={b} cambiar={setA} />
        <Derecha ids={a} valor={derechaA} cambiar={setDerechaA} jugadores={jugadores} />
      </div>

      <div className="pila" style={{ gap: 8 }}>
        <div className="fila entre">
          <b style={{ color: "var(--rosa)" }}>🩷 Pareja 2</b>
          <button type="button" className="boton secundario mini" onClick={() => setFuera(!fuera)}>
            {fuera ? "👥 Son del grupo" : "🌍 Son de fuera"}
          </button>
        </div>
        {fuera ? (
          <input name="bExterna" placeholder="Nombre de la pareja rival (p. ej. «Los de Elche»)" maxLength={40} required />
        ) : (
          <>
            <Selector jugadores={jugadores} elegidos={b} bloqueados={a} cambiar={setB} clase="b" />
            <Derecha ids={b} valor={derechaB} cambiar={setDerechaB} jugadores={jugadores} />
          </>
        )}
      </div>

      <div className="pila" style={{ gap: 8 }}>
        <b>Formato</b>
        <div className="pestanas" style={{ margin: 0 }}>
          {FORMATOS.map((f) => (
            <a
              key={f.valor}
              href="#"
              role="button"
              aria-current={formato === f.valor ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setFormato(f.valor);
              }}
            >
              {f.texto}
            </a>
          ))}
        </div>
        <span className="suave pequeno">{FORMATOS.find((f) => f.valor === formato)?.ayuda}</span>
      </div>

      <div className="pila" style={{ gap: 8 }}>
        <b>Resultado</b>
        <div className="sets-form">
          <span />
          <span className="pequeno" style={{ textAlign: "center", color: "var(--bola)", fontWeight: 800 }}>
            Pareja 1
          </span>
          <span className="pequeno" style={{ textAlign: "center", color: "var(--rosa)", fontWeight: 800 }}>
            Pareja 2
          </span>
          {filas.map((fila, i) => (
            <Fila key={i} i={i} fila={fila} cambiar={(nueva) => setSets(sets.map((f, k) => (k === i ? nueva : f)))} />
          ))}
        </div>
        <p className="suave pequeno" style={{ margin: 0 }}>
          {formato === "inacabado"
            ? "Pon cómo iba cada set cuando se paró (el último puede quedar a medias, p. ej. 3-1)."
            : formato === "1set"
              ? "Un solo set."
              : "El tercer set solo si hizo falta. Si fue super tie-break, pon el resultado tal cual (10-8)."}
        </p>
      </div>

      {juegoYo && (
        <label className="fila" style={{ display: "flex", fontWeight: 700 }}>
          <input type="checkbox" checked={impuesta} onChange={(e) => setImpuesta(e.target.checked)} style={{ width: 22, minHeight: 22 }} />
          🙄 La pareja me la impusieron
        </label>
      )}

      {listos && marcador.length > 0 && !errorSets && (
        <div className="tarjeta" style={{ textAlign: "center" }}>
          {formato === "inacabado" ? (
            <>⏸️ Inacabado: suma juegos y sets, pero ni victoria ni derrota</>
          ) : (
            <>
              🏆 Ganan <b>{ganador(marcador) === "a" ? nombre(a) : fuera ? "los de fuera" : nombre(b)}</b>
            </>
          )}
        </div>
      )}
      {errorSets && <p className="error">{errorSets}</p>}
      {estado?.error && <p className="error">{estado.error}</p>}
      <button className="boton ancho" disabled={enviando || !listos || !marcador.length || Boolean(errorSets)}>
        Apuntar resultado
      </button>
      <p className="suave pequeno" style={{ margin: 0, textAlign: "center" }}>
        Los rivales tendrán que confirmarlo para que cuente. Nada de inventarse victorias.
      </p>
    </form>
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
