import { z } from "zod";

const text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, message);

export const addressSchema = z.object({
  fullName: text(3, 80, "Ad soyad girin."),
  line1: text(8, 200, "Açık adresi girin."),
  district: text(2, 60, "İlçe girin."),
  city: text(2, 60, "İl girin."),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, "Posta kodu 5 haneli olmalı.")
    .optional(),
  country: z.literal("TR").default("TR"),
});

export type Address = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  email: z.email("Geçerli bir e-posta girin.").transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^(\+90|0)?5\d{9}$/, "Telefonu 05xx xxx xx xx biçiminde girin.")),
  address: addressSchema,
  note: z.string().trim().max(500).optional(),
  acceptTerms: z.literal("on", { error: "Sözleşmeleri onaylamanız gerekiyor." }),
  idempotencyKey: z.uuid(),
  items: z
    .array(
      z.object({ productId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(99) }),
    )
    .min(1, "Sepetiniz boş.")
    .max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** FormData → düz nesne (adres alanları "address.city" gibi adlandırılır). */
export function checkoutFormToObject(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  let items: unknown = [];
  try {
    items = JSON.parse(get("items") ?? "[]");
  } catch {
    items = [];
  }
  return {
    email: get("email") ?? "",
    phone: get("phone") ?? "",
    address: {
      fullName: get("address.fullName") ?? "",
      line1: get("address.line1") ?? "",
      district: get("address.district") ?? "",
      city: get("address.city") ?? "",
      postalCode: get("address.postalCode") || undefined,
    },
    note: get("note") || undefined,
    acceptTerms: get("acceptTerms"),
    idempotencyKey: get("idempotencyKey") ?? "",
    items,
  };
}
