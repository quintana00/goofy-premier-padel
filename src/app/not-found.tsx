import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="contenedor" style={{ textAlign: "center", paddingTop: 80 }}>
      <div className="grande">🎾💨</div>
      <h1>Bola fuera</h1>
      <p className="suave">Esto no existe. Como el revés de algunos.</p>
      <Link href="/" className="boton">
        Volver al ranking
      </Link>
    </main>
  );
}
