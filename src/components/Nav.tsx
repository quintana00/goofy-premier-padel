"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Iconos de trazo, todos con la misma rejilla de 24 px.
const ICONOS: Record<string, React.ReactNode> = {
  ranking: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8.5 20h7M10 17h4" />
    </>
  ),
  partidos: (
    <>
      <ellipse cx="10" cy="9" rx="5.2" ry="6.2" transform="rotate(-35 10 9)" />
      <path d="m13.6 14.2 5.4 5.6M8.2 5.6l4.6 6.4M5.8 8.4l4.6 6.2" />
      <circle cx="19" cy="6" r="1.8" />
    </>
  ),
  apuestas: (
    <>
      <ellipse cx="9" cy="7" rx="5.5" ry="2.6" />
      <path d="M3.5 7v4c0 1.4 2.5 2.6 5.5 2.6M3.5 11v4c0 1.4 2.5 2.6 5.5 2.6" />
      <ellipse cx="15.5" cy="14" rx="5" ry="2.4" />
      <path d="M10.5 14v3.6c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4V14" />
    </>
  ),
  piques: <path d="M12 3c.6 3.2 4.6 5 4.6 9.6A4.6 4.6 0 0 1 12 17.4a4.6 4.6 0 0 1-4.6-4.8c0-1.6.8-2.8 1.8-3.8.2 1.4.9 2.2 1.8 2.6C10.400 8.400 10.900 5.200 12 3ZM9 21h6" />,
  deudas: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M15.500 14.500h2.500" />
    </>
  ),
};

const ENLACES = [
  { href: "/", icono: "ranking", texto: "Ranking" },
  { href: "/partidos", icono: "partidos", texto: "Partidos", tambien: ["/hay-padel", "/torneos"] },
  { href: "/apuestas", icono: "apuestas", texto: "Apuestas" },
  { href: "/piques", icono: "piques", texto: "Piques", tambien: ["/vs", "/muro"] },
  { href: "/deudas", icono: "deudas", texto: "Deudas" },
];

export function Nav() {
  const ruta = usePathname();
  const activa = (e: (typeof ENLACES)[number]) =>
    e.href === "/" ? ruta === "/" : [e.href, ...(e.tambien ?? [])].some((r) => ruta.startsWith(r));
  return (
    <nav className="nav" aria-label="Secciones">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} aria-current={activa(e) ? "page" : undefined}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {ICONOS[e.icono]}
          </svg>
          <span>{e.texto}</span>
        </Link>
      ))}
    </nav>
  );
}
