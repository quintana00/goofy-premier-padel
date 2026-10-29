import { MedallasNuevas } from "@/components/Animaciones";
import { EscenaMedalla } from "@/components/EscenaMedalla";
import { Nav } from "@/components/Nav";
import { cargarMundo, yo } from "@/lib/datos";
import { escenaDeMedalla } from "@/lib/escenasMedalla";
import { estadisticas, medallas } from "@/lib/motor";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await yo();
  const m = await cargarMundo();
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  // Las medallas que tienes ahora; el móvil recuerda cuáles ya te ha enseñado.
  const mias = medallas(m, estadisticas(m))
    .filter((md) => md.jugadorId === me.id)
    .map((md) => {
      const datos = escenaDeMedalla(m, md);
      return {
        clave: md.clave,
        emoji: md.emoji,
        nombre: md.nombre,
        texto: md.texto,
        escena: datos ? <EscenaMedalla md={md} datos={datos} jugadores={jugadores} /> : undefined,
      };
    });
  return (
    <>
      <main className="contenedor">{children}</main>
      <Nav />
      <MedallasNuevas jugadorId={me.id} medallas={mias} />
    </>
  );
}
