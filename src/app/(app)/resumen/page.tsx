import { headers } from "next/headers";
import { Compartir } from "./Compartir";
import { alcance, cargarMundo } from "@/lib/datos";
import { euros } from "@/lib/motor";
import { resumenSemanal } from "@/lib/resumen";

export default async function Resumen() {
  const m = await cargarMundo();
  const r = resumenSemanal(m, alcance(m, undefined).desde);
  const nom = (id: number) => m.jugadores.find((j) => j.id === id)?.nombre ?? "?";
  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const lineas = [
    `🎾 *GOOFY PREMIER PADEL* · Resumen semanal`,
    `${r.partidos} partido${r.partidos === 1 ? "" : "s"} esta semana`,
    r.lider && `👑 Líder: ${nom(r.lider)}`,
    r.subidon && `🚀 Subidón: ${nom(r.subidon.id)} (+${Math.round(r.subidon.delta)})`,
    r.batacazo && `📉 Batacazo: ${nom(r.batacazo.id)} (${Math.round(r.batacazo.delta)})`,
    r.hundido && `🚑 ${nom(r.hundido.id)} lleva ${-r.hundido.racha} derrotas seguidas`,
    r.enLlamas && `🔥 ${nom(r.enLlamas.id)} lleva ${r.enLlamas.racha} victorias seguidas`,
    r.moroso && `🎩 Moroso del mes: ${nom(r.moroso.id)} (${euros(r.moroso.debe)})`,
    `👉 ${url}`,
  ].filter(Boolean);

  return (
    <>
      <div className="cabecera">
        <h1>Resumen semanal</h1>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>Lo mejor (y lo peor) de los últimos 7 días, listo para el grupo.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/resumen/imagen"
        alt="Resumen semanal"
        style={{ width: "100%", borderRadius: 18, border: "2px solid #000", boxShadow: "0 6px 0 #000", marginBottom: 16 }}
      />
      <Compartir texto={lineas.join("\n")} />
      <details className="tarjeta" style={{ marginTop: 16 }}>
        <summary>Ver el texto</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "12px 0 0" }}>{lineas.join("\n")}</pre>
      </details>
    </>
  );
}
