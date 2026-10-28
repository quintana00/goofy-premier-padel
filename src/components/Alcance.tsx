import Link from "next/link";
import type { Mundo } from "@/lib/tipos";

// Pestañas: cada temporada y el histórico.
export function Alcance({ m, ver, ruta }: { m: Mundo; ver: string; ruta: string }) {
  const temporadas = [...m.temporadas].reverse();
  return (
    <div className="pestanas">
      {temporadas.map((t) => (
        <Link key={t.id} href={`${ruta}?ver=${t.id}`} aria-current={ver === String(t.id) ? "page" : undefined}>
          {t.nombre}
        </Link>
      ))}
      <Link href={`${ruta}?ver=historico`} aria-current={ver === "historico" ? "page" : undefined}>
        📜 Histórico
      </Link>
    </div>
  );
}
