"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Navigation complete — fill to 100 then fade out
  useEffect(() => {
    clear();
    setWidth(100);
    const t = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 350);
    timersRef.current.push(t);
  }, [pathname]);

  // Intercept internal link clicks — start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Skip external, hash-only, or same page links
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      clear();
      setVisible(true);
      setWidth(25);
      const t1 = setTimeout(() => setWidth(55), 200);
      const t2 = setTimeout(() => setWidth(75), 600);
      const t3 = setTimeout(() => setWidth(88), 1200);
      timersRef.current.push(t1, t2, t3);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] pointer-events-none">
      <div
        className="h-[2px] bg-accent"
        style={{
          width: `${width}%`,
          transition: width === 100
            ? "width 200ms ease-out, opacity 200ms ease 250ms"
            : "width 400ms cubic-bezier(0.22, 1, 0.36, 1)",
          opacity: width === 100 ? 0 : 1,
          boxShadow: "0 0 8px rgba(212,130,10,0.6)",
        }}
      />
    </div>
  );
}
