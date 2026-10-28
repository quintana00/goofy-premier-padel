import { cargarMundo, yo } from "@/lib/datos";
import { FormPartido } from "./FormPartido";

export default async function NuevoPartido({ searchParams }: PageProps<"/partidos/nuevo">) {
  const { torneo } = await searchParams;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const torneos = m.torneos.slice(0, 10).map((t) => ({ id: t.id, nombre: t.nombre }));
  const inicial = torneos.find((t) => String(t.id) === torneo)?.id ?? null;
  return (
    <>
      <div className="cabecera">
        <h1>Nuevo resultado</h1>
      </div>
      <FormPartido jugadores={m.jugadores} yoId={me.id} hoy={m.hoy} torneos={torneos} torneoInicial={inicial} />
    </>
  );
}
