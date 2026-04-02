"use client";

import { FormEvent, useEffect, useState } from "react";

type IpAddress = {
  id: number;
  ip_address: string;
  ip_version: "ipv4" | "ipv6";
  label: string;
  comment: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
};

type PaginatedIpResponse = {
  data: IpAddress[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type EditingState = {
  id: number;
  label: string;
  comment: string;
  ip_address: string;
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export default function UserIpManager() {
  const [items, setItems] = useState<IpAddress[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedIpResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    ip_address: "",
    label: "",
    comment: "",
  });

  async function loadData(targetPage: number) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ip-addresses?page=${targetPage}&per_page=10`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as PaginatedIpResponse | unknown;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Failed to load records (${response.status})`));
      }

      const result = payload as PaginatedIpResponse;
      setItems(result.data);
      setMeta(result.meta);
      setPage(result.meta.page);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load IP addresses";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData(1);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/ip-addresses", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip_address: createForm.ip_address,
          label: createForm.label,
          comment: createForm.comment || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Create failed (${response.status})`));
      }

      setCreateForm({ ip_address: "", label: "", comment: "" });
      setSuccess("IP address created successfully.");
      await loadData(1);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Create failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/ip-addresses/${editing.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip_address: editing.ip_address,
          label: editing.label,
          comment: editing.comment || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Update failed (${response.status})`));
      }

      setEditing(null);
      setSuccess("IP address updated successfully.");
      await loadData(page);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Update failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this IP address?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/ip-addresses/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Delete failed (${response.status})`));
      }

      setSuccess("IP address deleted successfully.");
      await loadData(page);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Delete failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="IP address"
          value={createForm.ip_address}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, ip_address: e.target.value }))}
          required
          className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Label"
          value={createForm.label}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, label: e.target.value }))}
          required
          className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Comment (optional)"
          value={createForm.comment}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, comment: e.target.value }))}
          className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
        >
          Add IP
        </button>
      </form>

      {error ? <p className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/80 text-left text-slate-300">
            <tr>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Comment</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td className="px-3 py-6 text-slate-300" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-300" colSpan={5}>
                  No IP addresses yet. Add your first record above.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.ip_address}</td>
                  <td className="px-3 py-2">{item.ip_version}</td>
                  <td className="px-3 py-2">{item.label}</td>
                  <td className="px-3 py-2">{item.comment ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            id: item.id,
                            ip_address: item.ip_address,
                            label: item.label,
                            comment: item.comment ?? "",
                          })
                        }
                        className="rounded border border-white/20 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta ? (
        <div className="flex items-center justify-between text-sm text-slate-300">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => void loadData(page - 1)}
            className="rounded border border-white/20 bg-white/5 px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {meta.page} of {meta.total_pages}
          </span>
          <button
            type="button"
            disabled={meta.page >= meta.total_pages || isLoading}
            onClick={() => void loadData(page + 1)}
            className="rounded border border-white/20 bg-white/5 px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      {editing ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
          <h2 className="mb-3 text-base font-semibold">Edit IP #{editing.id}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={editing.ip_address}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, ip_address: e.target.value } : prev))}
              className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={editing.label}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, label: e.target.value } : prev))}
              className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={editing.comment}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, comment: e.target.value } : prev))}
              className="rounded border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleUpdate()}
              className="rounded bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
