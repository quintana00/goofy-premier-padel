import { cookies } from "next/headers";
import { Marca } from "@/components/Marca";
import { hayBaseDeDatos } from "@/lib/db";
import { cargarMundo } from "@/lib/datos";
import { COOKIE_GRUPO, codigoGrupo, grupoValido } from "@/lib/sesion";
import { ElegirJugador, FormGrupo } from "./Formularios";

export default async function Entrar() {
  const c = await cookies();
  const configurado = hayBaseDeDatos && codigoGrupo();
  const conGrupo = configurado && grupoValido(c.get(COOKIE_GRUPO)?.value);
  const jugadores = conGrupo ? (await cargarMundo()).jugadores : [];

  return (
    <main className="contenedor" style={{ paddingBottom: 40 }}>
      <div className="cabecera">
        <Marca />
      </div>
      <div className="pila" style={{ gap: 6, margin: "10px 0 24px" }}>
        <h1 style={{ fontSize: 38 }}>
          ¿Quién es el <span style={{ color: "var(--bola)" }}>padre</span> de la pista?
        </h1>
        <p className="suave" style={{ margin: 0 }}>
          Ranking ELO, piques, medallas de broma y la lista negra de morosos de La Tropa Goofy.
        </p>
      </div>
      {!configurado ? (
        <div className="tarjeta peligro">
          <b>Falta configurar la app.</b>
          <p className="suave">
            Define <code>DATABASE_URL</code> y <code>GROUP_CODE</code> en las variables de entorno (mira el README).
          </p>
        </div>
      ) : !conGrupo ? (
        <FormGrupo />
      ) : (
        <ElegirJugador jugadores={jugadores} />
      )}
    </main>
  );
}
