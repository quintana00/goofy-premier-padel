"use client";

import { useActionState, useState } from "react";
import { entrarGrupo, entrarJugador, registrar } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import { FotoCabezon } from "@/components/FotoCabezon";
import type { Jugador } from "@/lib/tipos";

export function FormGrupo() {
  const [estado, accion, enviando] = useActionState(entrarGrupo, null);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>🔒 Solo para la Tropa</h2>
      <label>
        Código del grupo
        <input name="codigo" autoComplete="off" autoCapitalize="none" placeholder="Te lo pasan por WhatsApp" required />
      </label>
      {estado?.error && <p className="error">{estado.error}</p>}
      <button className="boton ancho" disabled={enviando}>
        Entrar
      </button>
    </form>
  );
}

function CampoPin({ autoFocus }: { autoFocus?: boolean }) {
  return (
    <input
      name="pin"
      type="password"
      inputMode="numeric"
      pattern="\d{4}"
      maxLength={4}
      placeholder="••••"
      autoComplete="off"
      required
      autoFocus={autoFocus}
      style={{ fontSize: 28, letterSpacing: "0.5em", textAlign: "center" }}
    />
  );
}

export function ElegirJugador({ jugadores }: { jugadores: Jugador[] }) {
  const [elegido, setElegido] = useState<Jugador | null>(null);
  const [nuevo, setNuevo] = useState(jugadores.length === 0);
  const [estado, accion, enviando] = useActionState(entrarJugador, null);

  if (nuevo) return <Registro volver={jugadores.length ? () => setNuevo(false) : undefined} />;

  if (elegido)
    return (
      <form action={accion} className="tarjeta pila" style={{ justifyItems: "center", textAlign: "center" }}>
        <input type="hidden" name="id" value={elegido.id} />
        <Avatar j={elegido} tam={110} />
        <h2>¿De verdad eres {elegido.nombre}?</h2>
        <label style={{ width: "100%" }}>
          Tu PIN de 4 números
          <CampoPin autoFocus />
        </label>
        {estado?.error && <p className="error">{estado.error}</p>}
        <button className="boton ancho" disabled={enviando}>
          Entrar
        </button>
        <button type="button" className="boton secundario mini" onClick={() => setElegido(null)}>
          No soy yo
        </button>
      </form>
    );

  return (
    <div className="pila">
      <h2>¿Quién eres?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
        {jugadores.map((j) => (
          <button
            key={j.id}
            onClick={() => setElegido(j)}
            className="tarjeta"
            style={{ display: "grid", justifyItems: "center", gap: 8, color: "inherit", font: "inherit", cursor: "pointer" }}
          >
            <Avatar j={j} tam={64} />
            <b style={{ fontSize: 14 }}>{j.nombre}</b>
          </button>
        ))}
      </div>
      <button className="boton secundario ancho" onClick={() => setNuevo(true)}>
        ✋ Soy nuevo, apuntadme
      </button>
    </div>
  );
}

function Registro({ volver }: { volver?: () => void }) {
  const [estado, accion, enviando] = useActionState(registrar, null);
  const [foto, setFoto] = useState<string | null>(null);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>🆕 Fichaje nuevo</h2>
      <label>
        Tu nombre (como te llaman en el grupo)
        <input name="nombre" maxLength={24} placeholder="José, Borja, Isma…" required />
      </label>
      <label>
        Elige un PIN de 4 números
        <CampoPin />
      </label>
      <div className="pila" style={{ gap: 8 }}>
        <b style={{ fontSize: 14 }}>Tu cabezón para las escenas</b>
        <FotoCabezon alCambiar={setFoto} />
      </div>
      {estado?.error && <p className="error">{estado.error}</p>}
      <button className="boton ancho" disabled={enviando}>
        {foto ? "¡Fichar!" : "Fichar sin foto (cobarde)"}
      </button>
      {volver && (
        <button type="button" className="boton secundario mini" onClick={volver}>
          Volver
        </button>
      )}
    </form>
  );
}
