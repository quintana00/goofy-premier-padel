import { Nav } from "@/components/Nav";
import { yo } from "@/lib/datos";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await yo();
  return (
    <>
      <main className="contenedor">{children}</main>
      <Nav />
    </>
  );
}
