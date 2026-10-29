import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmarPartido, rechazarPartido, votar, votarMegafono } from "@/app/acciones";
import { BotonBorrar, Reaccion, SelloActa } from "@/components/Animaciones";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { cargarMundo, yo } from "@/lib/datos";
import { confirmadores, enPartido, estadisticas, ganador, veredicto } from "@/lib/motor";
import { Denunciar } from "./Denunciar";

export default async function DetallePartido({ params, searchParams }: PageProps<"/partidos/[id]">) {
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const p = m.partidos.find((x) => x.id === Number(id));
  if (!p) notFound();
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const nombre = (jid: number | null) => (jid ? (jugadores.get(jid)?.nombre ?? "?") : "");
  const quienes = confirmadores(p);
  const puedoConfirmar = p.estado === "pendiente" && quienes.includes(me.id);
  const denuncia = m.denuncias.find((d) => d.partidoId === p.id);
  const v = denuncia ? veredicto(denuncia, p) : null;
  const juego = enPartido(p).includes(me.id);
  const miVoto = denuncia?.votos.find((x) => x.jugadorId === me.id);
  const cambios = estadisticas(m).cambios.filter((c) => c.partidoId === p.id);
  const torneo = p.torneoId ? m.torneos.find((t) => t.id === p.torneoId) : null;
  const decidido = p.estado === "confirmado" && p.formato !== "inacabado";
  const ganadores: number[] = ganador(p.sets) === "a" ? p.a : (p.b ?? []);
  const resultado = decidido && juego ? (ganadores.includes(me.id) ? "gana" : "pierde") : null;
  const intentos = m.eventos.filter((e) => e.tipo === "intento_borrado" && e.partidoId === p.id);
  const gritos = m.megafonos.filter((v) => v.partidoId === p.id);
  const miGrito = gritos.find((v) => v.votante === me.id)?.acusado ?? 0;

  return (
    <>
      <div className="cabecera">
        <h1>Partido</h1>
        <Link href="/partidos" className="boton secundario mini">
          ← Volver
        </Link>
      </div>

      {nuevo && p.estado === "pendiente" && (
        <div className="tarjeta alerta" style={{ marginBottom: 12 }}>
          ✅ Apuntado. Ahora {quienes.map(nombre).join(" o ")} tiene{quienes.length > 1 ? "n" : ""} que confirmarlo.
          Pásales el enlace por WhatsApp si tienen prisa.
        </div>
      )}

      <Reaccion resultado={resultado} clave={`${p.id}-${me.id}`} avatar={<Avatar j={me} tam={64} />} />

      <div className="con-sello">
        {p.estado === "confirmado" && <SelloActa id={p.id} />}
        <TarjetaPartido p={p} jugadores={jugadores} etiqueta={torneo ? <span className="chapa">🏟️ {torneo.nombre}</span> : null} />
      </div>

      {p.estado === "pendiente" && (
        <div className="tarjeta pila" style={{ marginTop: 12 }}>
          <b>⏳ Pendiente de confirmar</b>
          <span className="suave pequeno">
            Apuntado por {nombre(p.creadoPor)}. Tiene que confirmarlo: {quienes.map(nombre).join(" o ")}.
          </span>
          {puedoConfirmar && (
            <div className="fila">
              <form action={confirmarPartido} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={p.id} />
                <button className="boton ancho">✅ Confirmar</button>
              </form>
              <form action={rechazarPartido} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={p.id} />
                <button className="boton rojo ancho">❌ Fue mentira</button>
              </form>
            </div>
          )}
          {!puedoConfirmar && p.creadoPor === me.id && (
            <form action={rechazarPartido}>
              <input type="hidden" name="id" value={p.id} />
              <button className="boton secundario mini">🗑️ Me he equivocado, borrar</button>
            </form>
          )}
        </div>
      )}

      {p.estado === "confirmado" && (
        <div className="seccion">
          <h2>📈 Puntos ELO</h2>
          <div className="pila" style={{ gap: 6 }}>
            {cambios.length === 0 && (
              <p className="suave">
                {p.formato === "inacabado"
                  ? "⏸️ Inacabado: suma juegos y sets, pero ni victoria, ni derrota, ni puntos."
                  : "Este partido no cuenta para el ranking."}
              </p>
            )}
            {cambios.map((c) => (
              <div key={c.jugadorId} className="fila entre">
                <span className="fila">
                  <Avatar j={jugadores.get(c.jugadorId)!} tam={28} /> {nombre(c.jugadorId)}
                </span>
                <b className={c.delta >= 0 ? "ok" : "error"}>
                  {c.delta >= 0 ? "+" : ""}
                  {Math.round(c.delta)}
                </b>
              </div>
            ))}
          </div>
          {p.confirmadoPor && <p className="suave pequeno">Confirmado por {nombre(p.confirmadoPor)}.</p>}
        </div>
      )}

      {p.estado === "confirmado" && juego && (
        <div className="seccion tarjeta pila">
          <b>📣 ¿Alguien le gritó a su pareja?</b>
          <span className="suave pequeno">Votan los que jugaron. Con 2 votos al mismo, se lleva el Megáfono.</span>
          <form action={votarMegafono} className="elegir">
            <input type="hidden" name="id" value={p.id} />
            {enPartido(p)
              .filter((id) => id !== me.id)
              .map((id) => {
                const votos = gritos.filter((v) => v.acusado === id).length;
                return (
                  <button key={id} name="acusado" value={id} aria-pressed={miGrito === id}>
                    <Avatar j={jugadores.get(id)!} tam={26} /> {nombre(id)}
                    {votos > 0 && <span className="chapa rojo">{"📣".repeat(votos)}</span>}
                  </button>
                );
              })}
            <button name="acusado" value={0} aria-pressed={miGrito === 0}>
              🤐 Nadie
            </button>
          </form>
        </div>
      )}

      {intentos.length > 0 && (
        <div className="seccion tarjeta alerta pila" style={{ gap: 6 }}>
          <b>📜 Historial del acta</b>
          {intentos.map((e) => (
            <span key={e.id} className="pequeno">
              🥹 <b>{nombre(e.jugadorId)}</b> intentó borrar este partido el{" "}
              {new Date(e.creado).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}
            </span>
          ))}
        </div>
      )}

      {p.estado === "confirmado" && juego && (
        <div className="seccion fila entre">
          <span className="suave pequeno">¿Algo no cuadra? Llévalo al tribunal.</span>
          <BotonBorrar id={p.id} />
        </div>
      )}

      {p.estado === "confirmado" && !denuncia && (
        <div className="seccion">
          <Denunciar id={p.id} />
        </div>
      )}

      {denuncia && v && (
        <div className="seccion pila">
          <h2>⚖️ Tribunal de la Tropa</h2>
          {v.veredicto === "limpio" && (
            <Escena
              tipo="lloron"
              y={jugadores.get(denuncia.denunciante)!}
              titulo={`${nombre(denuncia.denunciante)} llora sin motivo`}
              texto="El tribunal dice que el partido fue limpio. Denuncia desestimada."
            />
          )}
          {v.veredicto === "amano" && (
            <div className="tarjeta peligro" style={{ textAlign: "center" }}>
              <div className="grande">🚫 AMAÑO</div>
              <p>El tribunal ha hablado: partido anulado. No cuenta para el ranking.</p>
            </div>
          )}
          <div className="tarjeta pila">
            <div className="fila">
              <Avatar j={jugadores.get(denuncia.denunciante)!} tam={36} />
              <span>
                <b>{nombre(denuncia.denunciante)}</b> denuncia:
                <br />
                <i>«{denuncia.motivo}»</i>
              </span>
            </div>
            <div className="fila entre">
              <span className="chapa rojo">Amaño: {v.amano}</span>
              <span className="chapa">{v.veredicto === "deliberando" ? "Deliberando…" : "Caso cerrado"}</span>
              <span className="chapa verde">Limpio: {v.limpio}</span>
            </div>
            {denuncia.votos
              .filter((x) => !enPartido(p).includes(x.jugadorId))
              .map((x) => (
                <div key={x.jugadorId} className="fila pequeno">
                  <Avatar j={jugadores.get(x.jugadorId)!} tam={24} />
                  <span>
                    <b>{nombre(x.jugadorId)}</b> vota {x.amano ? "🚨 amaño" : "✅ limpio"}
                    {x.comentario && <span className="suave"> — {x.comentario}</span>}
                  </span>
                </div>
              ))}
          </div>
          {juego ? (
            <p className="suave pequeno">Jugaste este partido, así que no puedes votar. Toca esperar al veredicto.</p>
          ) : (
            <form action={votar} className="tarjeta pila">
              <input type="hidden" name="denuncia" value={denuncia.id} />
              <b>{miVoto ? "Cambiar tu voto" : "Tu voto como jurado"}</b>
              <input name="comentario" maxLength={200} placeholder="Comentario (opcional, con maldad)" defaultValue={miVoto?.comentario} />
              <div className="fila">
                <button name="amano" value="si" className="boton rojo" style={{ flex: 1 }}>
                  🚨 Amaño
                </button>
                <button name="amano" value="no" className="boton" style={{ flex: 1 }}>
                  ✅ Limpio
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
