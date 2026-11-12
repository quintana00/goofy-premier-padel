import { MedallasNuevas } from "@/components/Animaciones";
import { EscenaMedalla } from "@/components/EscenaMedalla";
import { Nav } from "@/components/Nav";
import { cargarMundo, yo } from "@/lib/datos";
import { escenaDeMedalla } from "@/lib/escenasMedalla";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { apuestasVistas, carteras } from "@/lib/apuestas";
import { estadisticas, medallas, partidosAnulados } from "@/lib/motor";

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
  const cartera = carteras(m, apuestasVistas(m, partidosAnulados(m))).find((c) => c.id === me.id);
  return (
    <>
      <header className="cabezal">
        <div className="cabezal-dentro">
          <Link href="/" className="cabezal-marca" aria-label="Goofy Premier Padel, inicio">
            <span className="cabezal-logo">GP</span>
            <span>
              Goofy <b>Premier Padel</b>
            </span>
          </Link>
          <span className="fila" style={{ gap: 8 }}>
            <Link href="/apuestas" className="monedero" aria-label={`${cartera?.saldo ?? 0} monedas`}>
              <i aria-hidden /> {(cartera?.saldo ?? 0).toLocaleString("es-ES")}
            </Link>
            <Link href="/yo" aria-label="Mi perfil" className="cabezal-avatar">
              <Avatar j={me} tam={34} />
            </Link>
          </span>
        </div>
      </header>
      <main className="contenedor">{children}</main>
      <Nav />
      <MedallasNuevas jugadorId={me.id} medallas={mias} />
    </>
  );
}
