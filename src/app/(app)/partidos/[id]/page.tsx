import Link from "next/link";
import { notFound } from "next/navigation";
import { aceptarReclamacion, borrarMiPartido, mantenerResultado, retirarReclamacion, votar, votarMegafono } from "@/app/acciones";
import { BotonBorrar, Reaccion, SelloActa } from "@/components/Animaciones";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { cargarMundo, yo } from "@/lib/datos";
import { apuestasVistas, describir, premio } from "@/lib/apuestas";
import { SORPRESA, partidosAnulados, confirmadores, defensores, enActa, enPartido, enPlazo, estadisticas, ganador, reclamableHasta, textoSets, veredicto } from "@/lib/motor";
import { Denunciar } from "./Denunciar";
import { Reclamar } from "./Reclamar";

export default async function DetallePartido({ params, searchParams }: PageProps<"/partidos/[id]">) {
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const p = m.partidos.find((x) => x.id === Number(id));
  if (!p) notFound();
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const nombre = (jid: number | null) => (jid ? (jugadores.get(jid)?.nombre ?? "?") : "");
  const quienes = confirmadores(p);
  const plazo = enPlazo(p);
  const acta = enActa(p);
  const hasta = new Date(reclamableHasta(p)).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
  const rec = p.reclamacion;
  const denuncia = m.denuncias.find((d) => d.partidoId === p.id);
  const v = denuncia ? veredicto(denuncia, p) : null;
  const juego = enPartido(p).includes(me.id);
  const miVoto = denuncia?.votos.find((x) => x.jugadorId === me.id);
  const cambios = estadisticas(m).cambios.filter((c) => c.partidoId === p.id);
  const torneo = p.torneoId ? m.torneos.find((t) => t.id === p.torneoId) : null;
  const decidido = p.estado === "confirmado" && p.formato !== "inacabado";
  const ganadores: number[] = ganador(p.sets) === "a" ? p.a : (p.b ?? []);
  const resultado = decidido && juego ? (ganadores.includes(me.id) ? "gana" : "pierde") : null;
  const est = estadisticas(m);
  const prob = est.pronosticos.get(p.id);
  const perdedores: number[] = ganador(p.sets) === "a" ? (p.b ?? []) : p.a;
  const rosco = decidido && p.sets.some(([x, y]) => Math.min(x, y) === 0 && Math.max(x, y) === 6);
  const revancha = p.b ? `/partidos/nuevo?a1=${p.a[0]}&a2=${p.a[1]}&b1=${p.b[0]}&b2=${p.b[1]}` : null;
  const apostado = apuestasVistas(m, partidosAnulados(m)).filter((a) => a.quedada.partidoId === p.id);
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

      {nuevo && plazo && (
        <div className="tarjeta alerta" style={{ marginBottom: 12 }}>
          ✅ Apuntado, y ya cuenta. {quienes.length > 0 && <>{quienes.map(nombre).join(" o ")} tiene{quienes.length > 1 ? "n" : ""} hasta el {hasta} para reclamarlo si está mal.</>}
        </div>
      )}

      <Reaccion resultado={resultado} clave={`${p.id}-${me.id}`} avatar={<Avatar j={me} tam={64} />} />

      <div className={acta ? "con-sello" : undefined}>
        {acta && <SelloActa id={p.id} />}
        <TarjetaPartido p={p} jugadores={jugadores} etiqueta={torneo ? <span className="chapa">🏟️ {torneo.nombre}</span> : null} />
      </div>

      {plazo && (
        <div className="pila" style={{ marginTop: 12 }}>
          <span className="suave pequeno">
            ⏳ Apuntado por {nombre(p.creadoPor)}. {quienes.length > 0 ? `${quienes.map(nombre).join(" o ")} puede${quienes.length > 1 ? "n" : ""} reclamarlo` : "Se puede reclamar"} hasta el {hasta}. Después queda en acta.
          </span>
          {quienes.includes(me.id) && (
            <Reclamar
              id={p.id}
              sets={p.sets}
              formato={p.formato}
              parejaA={p.a.map(nombre).join(" y ")}
              parejaB={p.b ? p.b.map(nombre).join(" y ") : (p.bExterna ?? "Rivales")}
            />
          )}
          {p.creadoPor === me.id && (
            <form action={borrarMiPartido}>
              <input type="hidden" name="id" value={p.id} />
              <button className="boton secundario mini">🗑️ Me he equivocado, borrar</button>
            </form>
          )}
        </div>
      )}

      {p.estado === "reclamado" && rec && (
        <div className="tarjeta peligro pila" style={{ marginTop: 12 }}>
          <b>⚠️ Resultado reclamado: ahora mismo no cuenta</b>
          <span>
            <b>{nombre(rec.por)}</b> dice que{" "}
            {rec.sets ? (
              <>
                fue {p.a.map(nombre).join(" y ")} <b>{textoSets(rec.sets)}</b> {p.b ? p.b.map(nombre).join(" y ") : p.bExterna}
              </>
            ) : (
              <b>no se jugó</b>
            )}
            :
            <br />
            <i>«{rec.motivo}»</i>
          </span>
          {defensores(p).includes(me.id) && (
            <div className="fila envolver">
              <form action={aceptarReclamacion} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={p.id} />
                <button className="boton ancho">✅ {rec.sets ? "Aceptar corrección" : "Vale, borrarlo"}</button>
              </form>
              <form action={mantenerResultado} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={p.id} />
                <button className="boton rojo ancho">⚖️ El mío es el bueno</button>
              </form>
            </div>
          )}
          {defensores(p).includes(me.id) && (
            <span className="suave pequeno">Si mantienes tu resultado, vuelve a contar y lo decide el tribunal.</span>
          )}
          {rec.por === me.id && (
            <form action={retirarReclamacion}>
              <input type="hidden" name="id" value={p.id} />
              <button className="boton secundario mini">↩️ Retirar reclamación</button>
            </form>
          )}
          {!defensores(p).includes(me.id) && rec.por !== me.id && (
            <span className="suave pequeno">Lo tiene que resolver {defensores(p).map(nombre).join(" o ")}.</span>
          )}
        </div>
      )}

      {decidido && prob !== undefined && (
        <div className="pila" style={{ marginTop: 12 }}>
          <span className={`chapa ${prob < SORPRESA ? "rosa" : ""}`} style={{ justifySelf: "start", whiteSpace: "normal" }}>
            {prob < SORPRESA
              ? `🤯 Sorpresón: las casas de apuestas solo les daban un ${Math.round(prob * 100)} %`
              : prob > 0.65
                ? `🎰 Lo esperado: eran favoritos con un ${Math.round(prob * 100)} %`
                : `⚖️ Estaba igualado: ${Math.round(prob * 100)} % para los que ganaron`}
          </span>
          {rosco && perdedores[0] && jugadores.get(perdedores[0]) && (
            <Escena
              tipo="red"
              x={jugadores.get(ganadores[0]) ?? null}
              y={jugadores.get(perdedores.includes(me.id) ? me.id : perdedores[0])!}
              titulo={`🕸️ Rosco: ${perdedores.map(nombre).join(" y ")}, por debajo de la red`}
              texto="«Quien pierda, por debajo de la red». Son las normas."
            />
          )}
          {!rosco && prob < SORPRESA && jugadores.get(ganadores[0]) && (
            <Escena
              tipo="tirachinas"
              x={jugadores.get(perdedores[0]) ?? null}
              y={jugadores.get(ganadores.includes(me.id) ? me.id : ganadores[0])!}
              titulo={`🪃 ${ganadores.map(nombre).join(" y ")}, matagigantes`}
              texto="Nadie daba un duro por ellos. Con el dedillo por el triángulo de la pala."
            />
          )}
        </div>
      )}

      {revancha && p.estado === "confirmado" && juego && (
        <Link href={revancha} className="boton secundario ancho" style={{ marginTop: 12 }}>
          🔁 Revancha (mismas parejas)
        </Link>
      )}

      {apostado.length > 0 && (
        <div className="seccion">
          <h2 style={{ marginBottom: 10 }}>🎰 Apuestas de este partido</h2>
          <div className="pila" style={{ gap: 6 }}>
            {apostado.map((a) => (
              <div key={a.id} className="fila entre pequeno">
                <span className="fila" style={{ minWidth: 0 }}>
                  <Avatar j={jugadores.get(a.jugadorId)!} tam={26} />
                  <span>
                    <b>{nombre(a.jugadorId)}</b>: {describir(a, (a.quedada.a ?? []).map(nombre).join(" y "), (a.quedada.b ?? []).map(nombre).join(" y "))}
                  </span>
                </span>
                <b className={a.estado === "ganada" ? "ok" : a.estado === "perdida" ? "error" : "suave"} style={{ whiteSpace: "nowrap" }}>
                  {a.estado === "ganada" ? `+${premio(a) - a.importe}` : a.estado === "perdida" ? `-${a.importe}` : a.estado === "nula" ? "devuelta" : "en el aire"}
                </b>
              </div>
            ))}
          </div>
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

      {acta && juego && (
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
