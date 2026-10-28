"use client";

import { useState } from "react";

export function Compartir({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<string | null>(null);

  async function compartir() {
    setEstado("Preparando la imagen…");
    try {
      const res = await fetch("/resumen/imagen");
      const blob = await res.blob();
      const archivo = new File([blob], "resumen-goofy-premier-padel.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], text: texto });
        setEstado(null);
        return;
      }
      // Sin compartir nativo (ordenador): descargar la imagen y abrir WhatsApp con el texto.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = archivo.name;
      a.click();
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
      setEstado("Imagen descargada: adjúntala en WhatsApp.");
    } catch {
      setEstado(null);
    }
  }

  return (
    <div className="pila">
      <button className="boton ancho" onClick={compartir} style={{ background: "#25d366", color: "#062b14" }}>
        📲 Compartir en WhatsApp
      </button>
      {estado && <p className="suave pequeno" style={{ margin: 0, textAlign: "center" }}>{estado}</p>}
    </div>
  );
}
