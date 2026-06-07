"use client";

import * as React from "react";
import { animate, useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils";

export function Counter({
  to,
  format = true,
  suffix = "",
}: {
  to: number;
  format?: boolean;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {format ? formatNumber(Math.round(value)) : Math.round(value).toLocaleString()}
      {suffix}
    </span>
  );
}
