"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { track } from "./tracker";

/** App Router'da istemci tarafı gezinmelerde de PageView üretir. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track("page_view", { path: pathname, title: document.title });
  }, [pathname]);

  return null;
}
