"use client";

import { useId, useRef } from "react";

type AuditDateInputProps = {
  name: string;
  defaultValue?: string;
};

export default function AuditDateInput({ name, defaultValue }: AuditDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <div className="relative">
      <input
        id={`${generatedId}-${name}`}
        ref={inputRef}
        type="date"
        name={name}
        defaultValue={defaultValue}
        className="audit-date-input w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 pr-10 text-sm outline-none transition focus:border-cyan-400"
      />
      <button
        type="button"
        aria-label={`Open ${name} date picker`}
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-100 hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>
  );
}
