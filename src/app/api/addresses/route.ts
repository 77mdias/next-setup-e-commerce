import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: {
        city: true,
        complement: true,
        country: true,
        id: true,
        isDefault: true,
        label: true,
        neighborhood: true,
        number: true,
        state: true,
        street: true,
        zipCode: true,
      },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
