import { z } from "zod";

export const cartSyncRequestSchema = z.object({
  /** merge: girişten hemen sonra misafir sepetini birleştir · replace: sonraki değişiklikler */
  mode: z.enum(["merge", "replace"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100),
});

export type CartSyncRequest = z.infer<typeof cartSyncRequestSchema>;
