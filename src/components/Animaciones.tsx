"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { intentarBorrar } from "@/app/acciones";

const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function leer(clave: string) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {}
}

// true solo la primera vez que este móvil ve algo (un partido confirmado, una medalla…).
function usePrimeraVez(clave: string, activo = true) {
  const [primera, setPrimera] = useState(false);
  useEffect(() => {
    if (!activo || leer(clave)) return;
    guardar(clave, "1");
    if (sinMovimiento()) return;
    const raf = requestAnimationFrame(() => setPrimera(true));
    return () => cancelAnimationFrame(raf);
  }, [clave, activo]);
  return primera;
}

// ---------- Sello de acta ----------

export function SelloActa({ id }: { id: number }) {
  const cae = usePrimeraVez(`acta-${id}`);
  return (
    <div className={`sello ${cae ? "cae" : ""}`} aria-label="Partido en acta">
      <b>EN ACTA</b>
      <span>Registrado. Aquí no se borra nada.</span>
    </div>
  );
}

// ---------- Victoria y derrota ----------

const COLORES = ["#d9ff3d", "#ff5fa2", "#3ee08f", "#5fb7ff", "#ffae3d"];

export function Reaccion({ resultado, clave, avatar }: { resultado: "gana" | "pierde" | null; clave: string; avatar: ReactNode }) {
  const primera = usePrimeraVez(`reaccion-${clave}`, resultado !== null);
  const [visible, setVisible] = useState(true);
  const [confeti, setConfeti] = useState<{ x: number; d: number; c: string; r: number }[]>([]);

  useEffect(() => {
    if (!primera) return;
    const raf = requestAnimationFrame(() =>
      setConfeti(
        Array.from({ length: 46 }, (_, i) => ({
          x: Math.random() * 100,
          d: Math.random() * 0.9,
          c: COLORES[i % COLORES.length],
          r: Math.random() * 360,
        })),
      ),
    );
    const t = setTimeout(() => setVisible(false), resultado === "gana" ? 3200 : 4500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [primera, resultado]);

  if (!primera || !visible) return null;
  if (resultado === "gana")
    return (
      <div className="celebracion" aria-hidden>
        {confeti.map((p, i) => (
          <i key={i} style={{ left: `${p.x}%`, background: p.c, animationDelay: `${p.d}s`, rotate: `${p.r}deg` }} />
        ))}
        <span className="pelota-bota" />
      </div>
    );
  return (
    <div className="nube-derrota" role="status">
      <div className="nube">
        <span />
        {[0, 1, 2, 3, 4].map((i) => (
          <em key={i} style={{ left: `${18 + i * 16}%`, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      {avatar}
      <small>Mañana será otro día ☔</small>
    </div>
  );
}

// ---------- Ranking que se recoloca ----------

// Cada fila sale desde donde estaba la última vez que este móvil vio el ranking y se desliza a su sitio.
export function RankingAnimado({ clave, children }: { clave: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const filas = [...(ref.current?.querySelectorAll<HTMLElement>("[data-id]") ?? [])];
    const ids = filas.map((f) => f.dataset.id!);
    const llave = `ranking-${clave}`;
    let antes: string[] = [];
    try {
      antes = JSON.parse(leer(llave) ?? "[]");
    } catch {}
    guardar(llave, JSON.stringify(ids));
    if (!antes.length || sinMovimiento()) return;
    filas.forEach((fila, nuevo) => {
      const viejo = antes.indexOf(fila.dataset.id!);
      if (viejo < 0 || viejo === nuevo) return;
      fila.dataset.mov = nuevo < viejo ? "sube" : "baja";
      const alto = fila.offsetHeight + 8;
      fila.animate([{ transform: `translateY(${(viejo - nuevo) * alto}px)` }, { transform: "none" }], {
        duration: 900,
        delay: 250,
        easing: "cubic-bezier(.2,.9,.25,1)",
        fill: "backwards",
      });
    });
  }, [clave]);
  return (
    <div ref={ref} className="ranking">
      {children}
    </div>
  );
}

// ---------- Medallas nuevas ----------

export type MedallaNueva = { clave: string; emoji: string; nombre: string; texto: string; escena?: ReactNode };

export function MedallasNuevas({ jugadorId, medallas }: { jugadorId: number; medallas: MedallaNueva[] }) {
  const [cola, setCola] = useState<MedallaNueva[]>([]);
  useEffect(() => {
    const llave = `medallas-${jugadorId}`;
    let vistas: string[] = [];
    try {
      vistas = JSON.parse(leer(llave) ?? "[]");
    } catch {}
    // Como mucho 3 de golpe; las demás salen la próxima vez.
    const nuevas = medallas.filter((m) => !vistas.includes(m.clave)).slice(0, 3);
    if (!nuevas.length) return;
    guardar(llave, JSON.stringify([...vistas, ...nuevas.map((m) => m.clave)]));
    const raf = requestAnimationFrame(() => setCola(nuevas));
    return () => cancelAnimationFrame(raf);
  }, [jugadorId, medallas]);

  const actual = cola[0];
  if (!actual) return null;
  return (
    <div className="medalla-popup" role="dialog" aria-label="Medalla nueva">
      <div className="medalla-popup-caja">
        <p className="suave pequeno" style={{ margin: 0, letterSpacing: "0.1em", fontWeight: 800 }}>
          🏅 MEDALLA NUEVA
        </p>
        {actual.escena ?? (
          <div className="rayos">
            <span>{actual.emoji}</span>
          </div>
        )}
        {!actual.escena && (
          <>
            <h2>
              {actual.emoji} {actual.nombre}
            </h2>
            <p className="suave" style={{ margin: 0 }}>
              {actual.texto}
            </p>
          </>
        )}
        <button className="boton ancho" onClick={() => setCola(cola.slice(1))}>
          {cola.length > 1 ? "Siguiente" : "¡Toma ya!"}
        </button>
      </div>
    </div>
  );
}

// ---------- Intentar borrar un partido en acta ----------

export function BotonBorrar({ id }: { id: number }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(intentarBorrar, null);
  return (
    <>
      <button type="button" className="boton secundario mini" onClick={() => setAbierto(true)}>
        🗑️ Borrar partido
      </button>
      {abierto && (
        <div className="medalla-popup" role="dialog" aria-label="Borrar partido">
          <div className="medalla-popup-caja">
            {estado?.error ? (
              <>
                <div className="lagrimita">🥹</div>
                <h2>Nope</h2>
                <p style={{ margin: 0 }}>{estado.error}</p>
                <button className="boton ancho" onClick={() => setAbierto(false)}>
                  Vale, lo acepto
                </button>
              </>
            ) : (
              <>
                <div className="lagrimita">🥹</div>
                <h2>¿Seguro?</h2>
                <p className="suave" style={{ margin: 0 }}>
                  El grupo se va a enterar 👀
                </p>
                <form action={accion} className="pila" style={{ width: "100%" }}>
                  <input type="hidden" name="id" value={id} />
                  <button className="boton rojo ancho" disabled={enviando}>
                    Sí, quiero borrarlo
                  </button>
                  <button type="button" className="boton secundario ancho" onClick={() => setAbierto(false)}>
                    Mejor no, que me ven
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
