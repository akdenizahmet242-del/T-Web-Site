"use client";

import { Loader2, TimerReset } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { releaseExpiredAction, type OrderActionState } from "./actions";

export function ReleaseExpiredButton() {
  const [state, action, pending] = useActionState<OrderActionState>(releaseExpiredAction, {});
  return (
    <form action={action} className="flex items-center gap-3">
      {state.ok ? <span className="text-xs text-muted-foreground">{state.ok}</span> : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <TimerReset />}
        Süresi dolan rezervasyonları bırak
      </Button>
    </form>
  );
}
