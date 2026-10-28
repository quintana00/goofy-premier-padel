import { db } from "@/lib/db";

// Las fotos se guardan en la base de datos ya procesadas; aquí se sirven como imagen normal.
// La URL lleva ?v=N, así que se pueden cachear para siempre.
export async function GET(_: Request, ctx: RouteContext<"/api/avatar/[id]">) {
  const { id } = await ctx.params;
  const sql = await db();
  const [j] = await sql`select avatar from jugadores where id = ${Number(id) || 0}`;
  const m = j?.avatar && /^data:(image\/[a-z]+);base64,(.+)$/.exec(j.avatar);
  if (!m) return new Response("Sin foto", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
