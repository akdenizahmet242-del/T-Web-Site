"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderStatusLabels } from "@/features/orders/status";
import type { OrderStatus } from "@/generated/prisma/enums";

import { changeOrderStatusAction, refundOrderAction, type OrderActionState } from "./actions";

function Feedback({ state }: { state: OrderActionState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="text-sm text-brass">
        {state.ok}
      </p>
    );
  return null;
}

export function OrderStatusActions({
  orderId,
  transitions,
}: {
  orderId: string;
  transitions: OrderStatus[];
}) {
  const [state, action, pending] = useActionState(changeOrderStatusAction, {});

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">Bu durumda başka işlem yapılamaz.</p>;
  }

  return (
    <div className="space-y-5">
      {transitions.map((to) => (
        <form
          key={to}
          action={action}
          className="space-y-3 rounded-lg border p-4"
          onSubmit={(event) => {
            if (
              to === "CANCELLED" &&
              !window.confirm(
                "Sipariş iptal edilsin mi? Ödeme alınmışsa iade edilir, stok geri eklenir.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="to" value={to} />
          {to === "SHIPPED" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="carrier">Kargo firması</Label>
                <Input id="carrier" name="carrier" placeholder="Yurtiçi Kargo" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trackingNumber">Takip numarası</Label>
                <Input id="trackingNumber" name="trackingNumber" required />
              </div>
            </div>
          ) : null}
          {to === "CANCELLED" ? (
            <Input
              name="note"
              placeholder="İptal nedeni (isteğe bağlı)"
              aria-label="İptal nedeni"
            />
          ) : null}
          <Button
            type="submit"
            size="sm"
            variant={to === "CANCELLED" ? "destructive" : "default"}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {to === "CANCELLED"
              ? "Siparişi iptal et"
              : `“${orderStatusLabels[to]}” olarak işaretle`}
          </Button>
        </form>
      ))}
      <Feedback state={state} />
    </div>
  );
}

export function RefundForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(refundOrderAction, {});
  return (
    <form
      action={action}
      className="space-y-3 rounded-lg border border-destructive/30 p-4"
      onSubmit={(event) => {
        if (!window.confirm("Tutarın tamamı müşteriye iade edilsin mi?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm font-medium">Ürün iadesi</p>
      <Input name="note" placeholder="İade nedeni (isteğe bağlı)" aria-label="İade nedeni" />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="restock"
          defaultChecked
          className="size-4 accent-[var(--brass)]"
        />
        Ürünleri stoğa geri al
      </label>
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Tutarı iade et
      </Button>
      <Feedback state={state} />
    </form>
  );
}
