"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface MenuPosition {
  x: number;
  y: number;
}

const VIEWPORT_MARGIN = 8;

export function ContextMenu({
  position,
  onClose,
  children,
}: {
  position: MenuPosition;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number }>({
    left: position.x,
    top: position.y,
  });

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

  // 碰撞检测：菜单贴近视口右/下边缘时翻转，保证始终完整可见。
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x;
    let top = position.y;

    if (rect.right + VIEWPORT_MARGIN > viewportWidth) {
      left = Math.max(VIEWPORT_MARGIN, position.x - rect.width);
    }
    if (rect.bottom + VIEWPORT_MARGIN > viewportHeight) {
      top = Math.max(VIEWPORT_MARGIN, position.y - rect.height);
    }

    setPlacement({ left, top });
  }, [position]);

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
        ref={menuRef}
        role="menu"
        className="fixed z-50 min-w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        style={placement}
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
