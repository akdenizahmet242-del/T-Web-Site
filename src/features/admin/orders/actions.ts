"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/guards";
import {
  changeOrderStatus,
  OrderError,
  refundOrder,
  releaseExpiredOrders,
} from "@/features/orders/service";
import { OrderStatus } from "@/generated/prisma/enums";

export type OrderActionState = { ok?: string; error?: string };

const statusSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum(OrderStatus),
  carrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  note: z.string().trim().max(500).optional(),
});

const optional = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.trim() ? value : undefined;

export async function changeOrderStatusAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await requireAdmin();
  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    to: formData.get("to"),
    carrier: optional(formData.get("carrier")),
    trackingNumber: optional(formData.get("trackingNumber")),
    note: optional(formData.get("note")),
  });
  if (!parsed.success) return { error: "Geçersiz istek." };

  try {
    await changeOrderStatus({ ...parsed.data, actor: session.user.email });
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/siparisler/${parsed.data.orderId}`);
  return { ok: "Sipariş güncellendi." };
}

export async function refundOrderAction(
  _previous: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  try {
    await refundOrder({
      orderId,
      actor: session.user.email,
      restockItems: formData.get("restock") === "on",
      note: optional(formData.get("note")),
    });
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/admin/siparisler/${orderId}`);
  return { ok: "İade tamamlandı." };
}

export async function releaseExpiredAction(): Promise<OrderActionState> {
  await requireAdmin();
  const { released } = await releaseExpiredOrders();
  revalidatePath("/admin/siparisler");
  return {
    ok: released ? `${released} siparişin rezervasyonu bırakıldı.` : "Süresi dolan sipariş yok.",
  };
}
