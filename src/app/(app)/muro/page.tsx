import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { cargarMundo } from "@/lib/datos";
import { muroDeLaVerguenza } from "@/lib/motor";

export default async function Muro() {
  const m = await cargarMundo();
  // Lo repetido se agrupa: «dijo que la pareja se la impusieron ×3».
  const grupos = new Map<string, ReturnType<typeof muroDeLaVerguenza>[number] & { veces: number }>();
  for (const v of muroDeLaVerguenza(m)) {
    const k = `${v.jugadorId}|${v.emoji}|${v.texto}`;
    const g = grupos.get(k);
    if (g) g.veces++;
    else grupos.set(k, { ...v, veces: 1 });
  }
  const muro = [...grupos.values()];
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  // El que más veces sale, arriba del todo.
  const cuenta = new Map<number, number>();
  for (const v of muro) cuenta.set(v.jugadorId, (cuenta.get(v.jugadorId) ?? 0) + v.veces);
  const lider = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
  const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <>
      <div className="cabecera">
        <h1>Muro de la vergüenza</h1>
        <Link href="/piques" className="boton secundario mini">
          🔥 Piques
        </Link>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>
        Lo que nadie quiere que se recuerde. Aquí se recuerda.
      </p>

      {lider && (
        <div className="tarjeta peligro fila" style={{ marginBottom: 16 }}>
          <Avatar j={jugadores.get(lider[0])!} tam={56} />
          <span>
            <b>🏆 Rey del muro: {jugadores.get(lider[0])?.nombre}</b>
            <br />
            <span className="suave pequeno">Sale {lider[1]} veces. Enhorabuena.</span>
          </span>
        </div>
      )}

      {muro.length === 0 ? (
        <div className="vacio">
          <span className="emoji">😇</span>
          El muro está vacío. De momento.
        </div>
      ) : (
        <div className="pila" style={{ gap: 8 }}>
          {muro.map((v, i) => {
            const j = jugadores.get(v.jugadorId);
            if (!j) return null;
            const contenido = (
              <>
                <span style={{ fontSize: 26 }}>{v.emoji}</span>
                <Avatar j={j} tam={34} />
                <span style={{ flex: 1 }}>
                  <b>{j.nombre}</b> {v.texto}
                  {v.veces > 1 && <span className="chapa rojo" style={{ marginLeft: 6 }}>×{v.veces}</span>}
                  <br />
                  <span className="suave pequeno">{fecha(v.fecha)}</span>
                </span>
              </>
            );
            return v.partidoId ? (
              <Link key={i} href={v.veces > 1 ? `/jugador/${v.jugadorId}` : `/partidos/${v.partidoId}`} className="tarjeta fila" style={{ padding: 10 }}>
                {contenido}
              </Link>
            ) : (
              <div key={i} className="tarjeta fila" style={{ padding: 10 }}>
                {contenido}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
