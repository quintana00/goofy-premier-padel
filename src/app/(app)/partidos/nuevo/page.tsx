import { alcance, cargarMundo, yo } from "@/lib/datos";
import { estadisticas } from "@/lib/motor";
import { FormPartido } from "./FormPartido";

export default async function NuevoPartido({ searchParams }: PageProps<"/partidos/nuevo">) {
  const q = await searchParams;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const torneos = m.torneos.slice(0, 10).map((t) => ({ id: t.id, nombre: t.nombre }));
  const inicial = torneos.find((t) => String(t.id) === q.torneo)?.id ?? null;
  // Jugadores ya elegidos: viene de una convocatoria de «¿Hay pádel?» o de una revancha.
  const ids = (claves: string[]) =>
    claves.map((k) => Number(q[k])).filter((id) => m.jugadores.some((j) => j.id === id));
  const a = ids(["a1", "a2"]);
  const b = ids(["b1", "b2"]);
  const quedada = m.quedadas.find((x) => String(x.id) === q.quedada && !x.partidoId);
  const t = alcance(m, undefined);
  const elos = Object.fromEntries([...estadisticas(m, t.desde, t.hasta).fichas].map(([id, f]) => [id, Math.round(f.elo)]));
  return (
    <>
      <div className="cabecera">
        <h1>Nuevo resultado</h1>
      </div>
      <FormPartido
        jugadores={m.jugadores}
        yoId={me.id}
        hoy={m.hoy}
        torneos={torneos}
        torneoInicial={inicial}
        inicial={a.length === 2 ? { a, b: b.length === 2 ? b : [] } : undefined}
        elos={elos}
        quedada={quedada?.id ?? null}
        formatoInicial={quedada?.formato === "1set" ? "1set" : "mejor3"}
      />
    </>
  );
}
