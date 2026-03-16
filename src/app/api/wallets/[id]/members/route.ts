import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if requester is owner/admin
  const membership = await prisma.walletMember.findUnique({
    where: { userId_walletId: { userId: session.user.id, walletId: params.id } },
  });
  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, role } = schema.parse(body);

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const member = await prisma.walletMember.create({
      data: { userId: userToAdd.id, walletId: params.id, role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
