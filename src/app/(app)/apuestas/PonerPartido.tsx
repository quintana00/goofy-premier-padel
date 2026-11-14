"use client";

import { useActionState, useState } from "react";
import { anunciarPartido, type Estado } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import type { Jugador } from "@/lib/tipos";

const SITIOS = ["One Pádel", "K7", "Bamvolea", "Family Sport", "Sportcity"];
const MINUTOS = [5, 10, 15, 30];

// Poner un partido que va a empezar ya: lo puede hacer cualquiera, aunque no juegue.
export function PonerPartido({ jugadores, abierto }: { jugadores: Jugador[]; abierto: boolean }) {
  const [a, setA] = useState<number[]>([]);
  const [b, setB] = useState<number[]>([]);
  // Al ponerlo, el formulario se vacía para el siguiente.
  const [estado, accion, enviando] = useActionState(async (previo: Estado, fd: FormData) => {
    const r = await anunciarPartido(previo, fd);
    if (r?.ok) {
      setA([]);
      setB([]);
    }
    return r;
  }, null);
  const [sitio, setSitio] = useState(SITIOS[0]);
  const [minutos, setMinutos] = useState(10);
  const [formato, setFormato] = useState<"mejor3" | "1set">("mejor3");
  const nombre = (ids: number[]) => ids.map((id) => jugadores.find((j) => j.id === id)?.nombre).join(" y ");
  const listo = a.length === 2 && b.length === 2;

  const selector = (elegidos: number[], otros: number[], cambiar: (ids: number[]) => void, clase?: string) => (
    <div className="elegir">
      {jugadores.map((j) => {
        const dentro = elegidos.includes(j.id);
        return (
          <button
            type="button"
            key={j.id}
            className={clase}
            aria-pressed={dentro}
            disabled={otros.includes(j.id) || (!dentro && elegidos.length >= 2)}
            onClick={() => cambiar(dentro ? elegidos.filter((x) => x !== j.id) : [...elegidos, j.id])}
          >
            <Avatar j={j} tam={28} /> {j.nombre}
          </button>
        );
      })}
    </div>
  );
  const chips = <T extends string | number>(valores: T[], actual: T, cambiar: (v: T) => void, texto: (v: T) => string) => (
    <div className="pestanas" style={{ margin: 0 }}>
      {valores.map((v) => (
        <a key={v} href="#" role="button" aria-current={actual === v ? "page" : undefined} onClick={(e) => (e.preventDefault(), cambiar(v))}>
          {texto(v)}
        </a>
      ))}
    </div>
  );

  return (
    <details className="tarjeta poner" open={abierto || undefined}>
      <summary>
        <span className="poner-mas">＋</span>
        <span>
          <b>Poner un partido</b>
          <br />
          <span className="suave pequeno">¿Van a jugar ya? Ponlo tú, aunque no juegues, y abre las apuestas</span>
        </span>
      </summary>
      <form action={accion} className="pila" style={{ gap: 14, marginTop: 14 }}>
        <input type="hidden" name="a1" value={a[0] ?? ""} />
        <input type="hidden" name="a2" value={a[1] ?? ""} />
        <input type="hidden" name="b1" value={b[0] ?? ""} />
        <input type="hidden" name="b2" value={b[1] ?? ""} />
        <input type="hidden" name="minutos" value={minutos} />
        <input type="hidden" name="formato" value={formato} />
        <div className="pila" style={{ gap: 8 }}>
          <b style={{ color: "var(--bola)" }}>Pareja 1</b>
          {selector(a, b, setA)}
        </div>
        <div className="pila" style={{ gap: 8 }}>
          <b style={{ color: "var(--rosa)" }}>Pareja 2</b>
          {selector(b, a, setB, "b")}
        </div>
        <div className="pila" style={{ gap: 6 }}>
          <b className="pequeno">¿Dónde?</b>
          {chips(SITIOS, sitio, setSitio, (v) => v)}
          <input name="sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} maxLength={40} required aria-label="Sitio" />
        </div>
        <div className="pila" style={{ gap: 6 }}>
          <b className="pequeno">Empieza en… (hasta entonces se puede apostar)</b>
          {chips(MINUTOS, minutos, setMinutos, (v) => `${v} min`)}
        </div>
        {chips(["mejor3", "1set"] as const, formato, setFormato, (v) => (v === "mejor3" ? "Mejor de 3" : "A 1 set"))}
        {listo && (
          <span className="pequeno">
            <b style={{ color: "var(--bola)" }}>{nombre(a)}</b> vs <b style={{ color: "var(--rosa)" }}>{nombre(b)}</b> · {sitio} · apuestas abiertas {minutos} min
          </span>
        )}
        {estado?.error && <p className="error">{estado.error}</p>}
        {estado?.ok && <p className="ok">{estado.ok}</p>}
        <button className="boton" disabled={enviando || !listo}>
          🎰 Poner partido y abrir apuestas
        </button>
      </form>
    </details>
  );
}
