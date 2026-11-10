import Link from "next/link";
import type { Titular } from "@/lib/motor";

// «El Goofy Deportivo»: titulares que pasan como en un teletipo. Se para al tocarlo.
export function Teletipo({ titulares }: { titulares: Titular[] }) {
  if (!titulares.length) return null;
  const tira = (oculto: boolean) => (
    <div className="teletipo-tira" aria-hidden={oculto || undefined}>
      {titulares.map((t, i) => (
        <Link key={i} href={t.partidoId ? `/partidos/${t.partidoId}` : t.jugadorId ? `/jugador/${t.jugadorId}` : "/piques"} tabIndex={oculto ? -1 : undefined}>
          <span>{t.emoji}</span> {t.texto}
        </Link>
      ))}
    </div>
  );
  return (
    <div className="teletipo" style={{ ["--dur" as string]: `${Math.max(24, titulares.length * 9)}s` }}>
      <b className="teletipo-marca">
        ÚLTIMA
        <br />
        HORA
      </b>
      <div className="teletipo-ventana">
        {tira(false)}
        {tira(true)}
      </div>
    </div>
  );
}
