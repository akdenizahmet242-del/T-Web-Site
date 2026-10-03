import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Oluşturuldu",
  AWAITING_PAYMENT: "Ödeme bekleniyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Ödenmedi",
  AUTHORIZED: "Provizyon",
  CAPTURED: "Tahsil edildi",
  FAILED: "Başarısız",
  REFUNDED: "İade edildi",
  PARTIALLY_REFUNDED: "Kısmi iade",
};

/** Panelde izin verilen durum geçişleri (durum makinesi). */
export const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  AWAITING_PAYMENT: ["CANCELLED"],
  PENDING: ["CANCELLED"],
};

export const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
