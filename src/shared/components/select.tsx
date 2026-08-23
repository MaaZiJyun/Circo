"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type {
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { focusRing } from "./focus-ring";

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

function readOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") return [];
    const option = child.props as {
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    };
    return [
      {
        value: String(option.value ?? ""),
        label: option.children,
        disabled: option.disabled ?? false,
      },
    ];
  });
}

export function Select({
  className = "",
  children,
  value,
  defaultValue,
  onChange,
  disabled = false,
  name,
  id,
  required,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const options = readOptions(children);
  const initialValue = String(defaultValue ?? options[0]?.value ?? "");
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedValue = value === undefined ? uncontrolledValue : String(value);
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue,
  );
  const selectedOption = options[selectedIndex] ?? options[0];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const closeOnViewportChange = () => setOpen(false);
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  const emitChange = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    const event = {
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>;
    onChange?.(event);
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    emitChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActiveOption = (direction: 1 | -1) => {
    if (!options.length) return;
    let nextIndex = activeIndex;
    do {
      nextIndex = (nextIndex + direction + options.length) % options.length;
    } while (options[nextIndex]?.disabled && nextIndex !== activeIndex);
    setActiveIndex(nextIndex);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
        return;
      }
      moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : Math.max(options.length - 1, 0));
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      chooseOption(activeIndex);
    }
  };

  return (
    <span ref={rootRef} className="relative block w-full">
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        disabled={disabled}
      />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-required={required}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        className={`peer flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-950 shadow-sm transition-colors hover:border-zinc-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-700 ${focusRing} ${className}`}
        onClick={() => {
          if (!open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? ""}</span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-72 min-w-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              disabled={option.disabled}
              className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${index === activeIndex ? "bg-zinc-100 dark:bg-zinc-900" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"} ${option.value === selectedValue ? "font-medium text-zinc-950 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseOption(index)}
            >
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
