import type { Prisma } from "@prisma/client";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const toNumber = (v: Prisma.Decimal | number | null | undefined) => (v == null ? 0 : Number(v));
