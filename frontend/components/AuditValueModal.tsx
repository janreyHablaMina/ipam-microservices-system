"use client";

import { useMemo, useState } from "react";

import type { AuditAction } from "@/types/audit";

type AuditValues = Record<string, unknown>;

type ValueChangeLine = {
  field: string;
  oldValue?: string;
  newValue?: string;
};

type AuditValueModalProps = {
  action: AuditAction;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
};

function toObjectRecord(value: unknown): AuditValues {
  if (!value) return {};

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as AuditValues;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as AuditValues;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function valuesAreEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toLabel(field: string): string {
  return field
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildValueChangeLines(
  action: AuditAction,
  oldValues: unknown,
  newValues: unknown
): ValueChangeLine[] {
  const oldRecord = toObjectRecord(oldValues);
  const newRecord = toObjectRecord(newValues);

  if (action === "create") {
    return Object.keys(newRecord).map((field) => ({
      field,
      newValue: formatValue(newRecord[field]),
    }));
  }

  if (action === "delete") {
    return Object.keys(oldRecord).map((field) => ({
      field,
      oldValue: formatValue(oldRecord[field]),
    }));
  }

  if (action === "update") {
    const allKeys = Array.from(new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]));

    return allKeys
      .filter((field) => !valuesAreEqual(oldRecord[field], newRecord[field]))
      .map((field) => ({
        field,
        oldValue: formatValue(oldRecord[field]),
        newValue: formatValue(newRecord[field]),
      }));
  }

  return [];
}

export default function AuditValueModal({ action, oldValues, newValues }: AuditValueModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const changeLines = useMemo(
    () => buildValueChangeLines(action, oldValues, newValues),
    [action, oldValues, newValues]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
      >
        Show values
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-100">Audit Value Changes</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-auto rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-100">
              {changeLines.length === 0 ? (
                <p className="text-slate-400">No field-level changes available for this action.</p>
              ) : (
                changeLines.map((line) => {
                  const label = toLabel(line.field);
                  if (action === "create") {
                    return (
                      <p key={line.field}>
                        {label}: {line.newValue}
                      </p>
                    );
                  }

                  if (action === "delete") {
                    return (
                      <p key={line.field}>
                        {label}: {line.oldValue}
                      </p>
                    );
                  }

                  return (
                    <p key={line.field}>
                      {label}: {line.oldValue} -&gt; {line.newValue}
                    </p>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
