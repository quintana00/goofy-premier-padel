"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", icono: "🏆", texto: "Ranking" },
  { href: "/partidos", icono: "🎾", texto: "Partidos" },
  { href: "/piques", icono: "🔥", texto: "Piques" },
  { href: "/deudas", icono: "💸", texto: "Deudas" },
  { href: "/yo", icono: "😎", texto: "Yo" },
];

export function Nav() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));
  return (
    <nav className="nav">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} aria-current={activa(e.href) ? "page" : undefined}>
          <span>{e.icono}</span>
          <span>{e.texto}</span>
        </Link>
      ))}
    </nav>
  );
}
