"use client";

import { useEffect } from "react";

export interface MenuPosition {
  x: number;
  y: number;
}

export function ContextMenu({
  position,
  onClose,
  children,
}: {
  position: MenuPosition;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);
  return (
    <>
      <button
        aria-label="Close menu"
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        className="fixed z-50 min-w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        style={{ left: position.x, top: position.y }}
      >
        {children}
      </div>
    </>
  );
}

export function ContextMenuItem({
  danger = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      role="menuitem"
      className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm disabled:opacity-40 ${danger ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
      {...props}
    />
  );
}
