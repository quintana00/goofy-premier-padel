import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { ImageResponse } from "next/og";
import { colorDe, iniciales } from "@/lib/avatar";
import { db } from "@/lib/db";
import { alcance, cargarMundo } from "@/lib/datos";
import { estadisticas, euros, textoSets } from "@/lib/motor";
import { resumenSemanal } from "@/lib/resumen";

// Imagen vertical para mandar al grupo de WhatsApp.
export async function GET() {
  const m = await cargarMundo();
  const temporada = alcance(m, undefined);
  const r = resumenSemanal(m, temporada.desde);
  const top = estadisticas(m, temporada.desde).ranking.filter((f) => f.jugados > 0).slice(0, 5);
  const sql = await db();
  const fotos = new Map<number, string>(
    (await sql`select id, avatar from jugadores where avatar is not null`).map((x) => [x.id, x.avatar]),
  );
  const nom = (id: number) => m.jugadores.find((j) => j.id === id)?.nombre ?? "?";

  const Cara = ({ id, tam }: { id: number; tam: number }) => (
    <div
      style={{
        display: "flex",
        width: tam,
        height: tam,
        borderRadius: tam,
        border: "5px solid #000",
        background: colorDe(id),
        alignItems: "center",
        justifyContent: "center",
        fontSize: tam * 0.38,
        fontWeight: 900,
        overflow: "hidden",
        color: "#111",
      }}
    >
      {fotos.get(id) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotos.get(id)} width={tam} height={tam} alt="" style={{ objectFit: "cover" }} />
      ) : (
        iniciales(nom(id))
      )}
    </div>
  );

  const Dato = ({ emoji, titulo, id, texto, color }: { emoji: string; titulo: string; id: number; texto: string; color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 22, background: "#15204a", borderRadius: 28, padding: "14px 24px", border: `4px solid ${color}` }}>
      <div style={{ display: "flex", fontSize: 56 }}>{emoji}</div>
      <Cara id={id} tam={76} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 26, color: "#a8b3dc", fontWeight: 700 }}>{titulo}</div>
        <div style={{ display: "flex", fontSize: 38, fontWeight: 900 }}>{nom(id)}</div>
        <div style={{ display: "flex", fontSize: 26, color }}>{texto}</div>
      </div>
    </div>
  );

  // Caben tres tarjetas; van por orden de cachondeo.
  const datos = [
    r.subidon && <Dato key="s" emoji="🚀" titulo="Subidón de la semana" id={r.subidon.id} texto={`+${Math.round(r.subidon.delta)} puntos`} color="#3ee08f" />,
    r.hundido && <Dato key="h" emoji="🚑" titulo="A la UVI" id={r.hundido.id} texto={`${-r.hundido.racha} derrotas seguidas`} color="#ff4d4d" />,
    r.moroso && <Dato key="m" emoji="🎩" titulo="Moroso del mes" id={r.moroso.id} texto={`debe ${euros(r.moroso.debe)}`} color="#ff5fa2" />,
    r.batacazo && <Dato key="b" emoji="📉" titulo="Batacazo de la semana" id={r.batacazo.id} texto={`${Math.round(r.batacazo.delta)} puntos`} color="#ff4d4d" />,
    r.enLlamas && <Dato key="f" emoji="🔥" titulo="On fire" id={r.enLlamas.id} texto={`${r.enLlamas.racha} victorias seguidas`} color="#ffae3d" />,
  ].filter(Boolean);

  const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  const dibujo = (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#0c1530", color: "#f3f5ff", padding: 56, gap: 26 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: "#d9ff3d", letterSpacing: 3 }}>🎾 GOOFY PREMIER PADEL</div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 900 }}>Resumen semanal</div>
        <div style={{ display: "flex", fontSize: 28, color: "#a8b3dc" }}>
          {fecha(r.desde)} – {fecha(r.hasta)} · {r.partidos} partido{r.partidos === 1 ? "" : "s"}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#13306b", borderRadius: 28, padding: 24 }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 900, marginBottom: 6 }}>🏆 Top 5 · {temporada.etiqueta}</div>
        {top.length === 0 && <div style={{ display: "flex", fontSize: 28, color: "#a8b3dc" }}>Sin partidos todavía</div>}
        {top.map((f, i) => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", width: 50, fontSize: 34, fontWeight: 900 }}>{i === 0 ? "👑" : `${i + 1}`}</div>
            <Cara id={f.id} tam={54} />
            <div style={{ display: "flex", flex: 1, fontSize: 34, fontWeight: 800 }}>{nom(f.id)}</div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#d9ff3d" }}>{Math.round(f.elo)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {datos.slice(0, 3)}
      </div>

      {r.paliza && (
        <div style={{ display: "flex", fontSize: 28, color: "#a8b3dc" }}>
          🔨 Paliza de la semana: {r.paliza.partido.a.map(nom).join(" y ")} vs{" "}
          {r.paliza.partido.b ? r.paliza.partido.b.map(nom).join(" y ") : r.paliza.partido.bExterna} ({textoSets(r.paliza.partido.sets)})
        </div>
      )}
    </div>
  );

  // Los emojis se descargan de internet al dibujar; si fallan, mejor una imagen sin emojis que ninguna.
  for (const version of [dibujo, sinEmojis(dibujo)]) {
    try {
      const png = await new ImageResponse(version as ReactElement, { width: 1080, height: 1350 }).arrayBuffer();
      return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
    } catch (e) {
      console.error("Resumen semanal:", e);
    }
  }
  return new Response("No se pudo generar la imagen", { status: 500 });
}

const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function sinEmojis(n: ReactNode): ReactNode {
  if (typeof n === "string") return n.replace(EMOJI, "").trim();
  if (Array.isArray(n)) return n.map(sinEmojis);
  if (!isValidElement(n)) return n;
  const props = n.props as Record<string, unknown>;
  const nuevas: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k === "children" || typeof v === "string") nuevas[k] = sinEmojis(v as ReactNode);
  }
  return cloneElement(n, nuevas);
}
