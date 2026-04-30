"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = `${e.clientX - 200}px`;
        ref.current.style.top = `${e.clientY - 200}px`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0 hidden md:block"
      style={{
        background: "radial-gradient(circle, hsl(239 84% 67% / 0.06) 0%, transparent 70%)",
      }}
    />
  );
}
