import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";

const ZIP_CODE_REGEX = /^\d{5}-?\d{3}$/;

const addressSelect = {
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
} satisfies Prisma.AddressSelect;

const createAddressSchema = z
  .object({
    city: z
      .string()
      .trim()
      .min(1, "Cidade é obrigatória")
      .max(80, "Cidade deve ter no máximo 80 caracteres"),
    complement: z
      .string()
      .trim()
      .max(120, "Complemento deve ter no máximo 120 caracteres")
      .optional(),
    country: z
      .string()
      .trim()
      .min(2, "País deve ter ao menos 2 caracteres")
      .max(60, "País deve ter no máximo 60 caracteres")
      .optional(),
    isDefault: z.boolean().optional(),
    label: z
      .string()
      .trim()
      .min(1, "Rótulo é obrigatório")
      .max(80, "Rótulo deve ter no máximo 80 caracteres"),
    neighborhood: z
      .string()
      .trim()
      .min(1, "Bairro é obrigatório")
      .max(80, "Bairro deve ter no máximo 80 caracteres"),
    number: z
      .string()
      .trim()
      .min(1, "Número é obrigatório")
      .max(20, "Número deve ter no máximo 20 caracteres"),
    state: z
      .string()
      .trim()
      .min(2, "Estado deve ter ao menos 2 caracteres")
      .max(3, "Estado deve ter no máximo 3 caracteres"),
    street: z
      .string()
      .trim()
      .min(1, "Rua é obrigatória")
      .max(120, "Rua deve ter no máximo 120 caracteres"),
    zipCode: z
      .string()
      .trim()
      .regex(ZIP_CODE_REGEX, "CEP deve estar no formato 00000-000"),
  })
  .strict();

const updateAddressSchema = createAddressSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "ID do endereço é obrigatório"),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const hasChanges =
      payload.city !== undefined ||
      payload.complement !== undefined ||
      payload.country !== undefined ||
      payload.isDefault !== undefined ||
      payload.label !== undefined ||
      payload.neighborhood !== undefined ||
      payload.number !== undefined ||
      payload.state !== undefined ||
      payload.street !== undefined ||
      payload.zipCode !== undefined;

    if (!hasChanges) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe ao menos um campo para atualização",
        path: ["payload"],
      });
    }
  });

const deleteAddressSchema = z
  .object({
    id: z.string().trim().min(1, "ID do endereço é obrigatório"),
  })
  .strict();

type CreateAddressPayload = z.infer<typeof createAddressSchema>;
type UpdateAddressPayload = z.infer<typeof updateAddressSchema>;

function normalizeZipCode(zipCode: string) {
  const digits = zipCode.replace(/\D/g, "");
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeOptionalField(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCountry(country: string | undefined) {
  const trimmed = country?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Brasil";
}

function mapValidationIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "payload",
    message: issue.message,
  }));
}

function unauthorizedResponse() {
  return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
}

function badRequestResponse(message: string, issues?: z.ZodIssue[]) {
  return NextResponse.json(
    {
      message,
      ...(issues ? { issues: mapValidationIssues(issues) } : {}),
    },
    { status: 400 },
  );
}

function notFoundResponse(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

function isPoolTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: unknown }).code === "P2024";
}

function overloadedResponse() {
  return NextResponse.json(
    { message: "Serviço temporariamente sobrecarregado. Tente novamente." },
    {
      status: 503,
      headers: {
        "Retry-After": "5",
      },
    },
  );
}

async function parseRequestBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function buildCreateAddressData(
  payload: CreateAddressPayload,
  userId: string,
  isDefault: boolean,
): Prisma.AddressUncheckedCreateInput {
  return {
    city: payload.city.trim(),
    complement: normalizeOptionalField(payload.complement),
    country: normalizeCountry(payload.country),
    isDefault,
    label: payload.label.trim(),
    neighborhood: payload.neighborhood.trim(),
    number: payload.number.trim(),
    state: payload.state.trim().toUpperCase(),
    street: payload.street.trim(),
    userId,
    zipCode: normalizeZipCode(payload.zipCode),
  };
}

function buildUpdateAddressData(
  payload: Omit<UpdateAddressPayload, "id" | "isDefault">,
): Prisma.AddressUpdateManyMutationInput {
  const updateData: Prisma.AddressUpdateManyMutationInput = {};

  if (payload.city !== undefined) {
    updateData.city = payload.city.trim();
  }

  if (payload.complement !== undefined) {
    updateData.complement = normalizeOptionalField(payload.complement);
  }

  if (payload.country !== undefined) {
    updateData.country = payload.country.trim();
  }

  if (payload.label !== undefined) {
    updateData.label = payload.label.trim();
  }

  if (payload.neighborhood !== undefined) {
    updateData.neighborhood = payload.neighborhood.trim();
  }

  if (payload.number !== undefined) {
    updateData.number = payload.number.trim();
  }

  if (payload.state !== undefined) {
    updateData.state = payload.state.trim().toUpperCase();
  }

  if (payload.street !== undefined) {
    updateData.street = payload.street.trim();
  }

  if (payload.zipCode !== undefined) {
    updateData.zipCode = normalizeZipCode(payload.zipCode);
  }

  return updateData;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: addressSelect,
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);

    if (isPoolTimeoutError(error)) {
      return overloadedResponse();
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const requestBody = await parseRequestBody(request);

    if (requestBody === null) {
      return badRequestResponse("Payload JSON inválido");
    }

    const parsedPayload = createAddressSchema.safeParse(requestBody);

    if (!parsedPayload.success) {
      return badRequestResponse(
        "Dados inválidos para endereço",
        parsedPayload.error.issues,
      );
    }

    const payload = parsedPayload.data;

    const address = await db.$transaction(async (tx) => {
      const existingAddressCount = await tx.address.count({
        where: { userId: user.id },
      });
      const shouldSetAsDefault =
        payload.isDefault === true || existingAddressCount === 0;

      if (shouldSetAsDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: buildCreateAddressData(payload, user.id, shouldSetAsDefault),
        select: addressSelect,
      });
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar endereço:", error);

    if (isPoolTimeoutError(error)) {
      return overloadedResponse();
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const requestBody = await parseRequestBody(request);

    if (requestBody === null) {
      return badRequestResponse("Payload JSON inválido");
    }

    const parsedPayload = updateAddressSchema.safeParse(requestBody);

    if (!parsedPayload.success) {
      return badRequestResponse(
        "Dados inválidos para atualização de endereço",
        parsedPayload.error.issues,
      );
    }

    const { id, isDefault, ...rawChanges } = parsedPayload.data;
    const updateData = buildUpdateAddressData(rawChanges);

    const updatedAddress = await db.$transaction(async (tx) => {
      const currentAddress = await tx.address.findFirst({
        where: {
          id,
          userId: user.id,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (!currentAddress) {
        return null;
      }

      let replacementAddressId: string | null = null;

      if (isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
            id: { not: id },
          },
          data: {
            isDefault: false,
          },
        });
      } else if (isDefault === false && currentAddress.isDefault) {
        const replacementAddress = await tx.address.findFirst({
          where: {
            userId: user.id,
            id: { not: id },
          },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
          },
        });

        replacementAddressId = replacementAddress?.id ?? null;

        if (replacementAddressId) {
          await tx.address.updateMany({
            where: {
              id: replacementAddressId,
              userId: user.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }

      const nextIsDefault =
        isDefault === true
          ? true
          : isDefault === false
            ? currentAddress.isDefault && !replacementAddressId
              ? true
              : false
            : currentAddress.isDefault;

      const updateResult = await tx.address.updateMany({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...updateData,
          isDefault: nextIsDefault,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      return tx.address.findFirst({
        where: {
          id,
          userId: user.id,
        },
        select: addressSelect,
      });
    });

    if (!updatedAddress) {
      return notFoundResponse("Endereço não encontrado");
    }

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);

    if (isPoolTimeoutError(error)) {
      return overloadedResponse();
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const parsedRequest = deleteAddressSchema.safeParse({
      id: request.nextUrl.searchParams.get("id") ?? "",
    });

    if (!parsedRequest.success) {
      return badRequestResponse(
        "Dados inválidos para remoção de endereço",
        parsedRequest.error.issues,
      );
    }

    const { id } = parsedRequest.data;

    const deleteResult = await db.$transaction(async (tx) => {
      const currentAddress = await tx.address.findFirst({
        where: {
          id,
          userId: user.id,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (!currentAddress) {
        return { deleted: false };
      }

      const deletedAddress = await tx.address.deleteMany({
        where: {
          id,
          userId: user.id,
        },
      });

      if (deletedAddress.count === 0) {
        return { deleted: false };
      }

      if (currentAddress.isDefault) {
        const replacementAddress = await tx.address.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
          },
        });

        if (replacementAddress) {
          await tx.address.updateMany({
            where: {
              userId: user.id,
            },
            data: {
              isDefault: false,
            },
          });

          await tx.address.updateMany({
            where: {
              id: replacementAddress.id,
              userId: user.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }

      return { deleted: true };
    });

    if (!deleteResult.deleted) {
      return notFoundResponse("Endereço não encontrado");
    }

    return NextResponse.json({ message: "Endereço removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover endereço:", error);

    if (isPoolTimeoutError(error)) {
      return overloadedResponse();
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
