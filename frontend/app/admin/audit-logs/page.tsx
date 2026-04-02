import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import { fetchAuditLogs, MissingAuthTokenError } from "@/lib/api/auditLogs";
import type { AuditLogFilters } from "@/types/audit";

type SearchParams = Record<string, string | string[] | undefined>;

type AuditLogsPageProps = {
  searchParams: Promise<SearchParams>;
};

function getFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getActionBadgeClasses(action: string): string {
  if (action === "create") {
    return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
  }

  if (action === "update") {
    return "bg-amber-500/20 text-amber-200 border-amber-400/30";
  }

  if (action === "delete") {
    return "bg-rose-500/20 text-rose-200 border-rose-400/30";
  }

  return "bg-slate-500/20 text-slate-200 border-slate-400/30";
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const sp = await searchParams;

  const filters: AuditLogFilters = {
    action: getFirst(sp.action) as AuditLogFilters["action"],
    user_id: getFirst(sp.user_id),
    entity_id: getFirst(sp.entity_id),
    from: getFirst(sp.from),
    to: getFirst(sp.to),
    page: getFirst(sp.page) ?? "1",
    per_page: getFirst(sp.per_page) ?? "20",
  };

  let result;
  let errorMessage: string | null = null;

  try {
    result = await fetchAuditLogs(filters);
  } catch (error) {
    if (error instanceof MissingAuthTokenError) {
      redirect("/login");
    }

    errorMessage =
      error instanceof Error ? error.message : "Unable to load audit logs right now.";
  }

  if (errorMessage || !result) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-rose-100">Audit Logs Unavailable</h1>
          <p className="mt-3 text-sm text-rose-200">{errorMessage ?? "Unknown error"}</p>
          <p className="mt-2 text-sm text-slate-300">
            Confirm `ip-service` is running and the `/api/audit-logs` endpoint is reachable.
          </p>
          <div className="mt-5">
            <Link
              href="/admin/audit-logs"
              className="inline-flex rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
            >
              Retry
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data, meta } = result;

  const currentPage = Number(filters.page ?? "1");
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(meta.total_pages, currentPage + 1);

  const baseParams = new URLSearchParams();
  if (filters.action) baseParams.set("action", filters.action);
  if (filters.user_id) baseParams.set("user_id", filters.user_id);
  if (filters.entity_id) baseParams.set("entity_id", filters.entity_id);
  if (filters.from) baseParams.set("from", filters.from);
  if (filters.to) baseParams.set("to", filters.to);
  if (filters.per_page) baseParams.set("per_page", filters.per_page);

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(prevPage));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(nextPage));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Audit Logs</h1>
              <p className="mt-2 text-sm text-slate-300">
                Track create, update, delete, and login activity across services.
              </p>
            </div>
            <LogoutButton />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Total: {meta.total}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Per Page: {meta.per_page}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Sort: latest
            </span>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-800/80 text-left text-xs uppercase tracking-[0.08em] text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold md:px-5">Action</th>
                  <th className="px-4 py-3 font-semibold md:px-5">User ID</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Entity Type</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Entity ID</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      No audit logs found for current filters.
                    </td>
                  </tr>
                ) : (
                  data.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 md:px-5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionBadgeClasses(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium md:px-5">{log.user_id}</td>
                      <td className="px-4 py-3 text-slate-200 md:px-5">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-200 md:px-5">{log.entity_id ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-300 md:px-5">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm md:px-5">
            <Link
              href={`/admin/audit-logs?${prevParams.toString()}`}
              className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
            >
              Previous
            </Link>
            <span className="text-slate-300">
              Page {meta.page} of {meta.total_pages}
            </span>
            <Link
              href={`/admin/audit-logs?${nextParams.toString()}`}
              className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
            >
              Next
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
