import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import UserIpManager from "@/components/UserIpManager";
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
  if (action === "create") return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
  if (action === "update") return "bg-amber-500/20 text-amber-200 border-amber-400/30";
  if (action === "delete") return "bg-rose-500/20 text-rose-200 border-rose-400/30";
  return "bg-slate-500/20 text-slate-200 border-slate-400/30";
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const sp = await searchParams;
  const currentView = getFirst(sp.view) === "ips" ? "ips" : "audit";

  if (currentView === "ips") {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-slate-300">
                Manage all IP records across user and super_admin accounts.
              </p>
            </div>
            <LogoutButton />
          </header>

          <nav className="mb-4 flex flex-wrap gap-2">
            <Link
              href="/admin/audit-logs"
              className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm transition hover:bg-white/10"
            >
              Audit Logs
            </Link>
            <Link
              href="/admin/audit-logs?view=ips"
              className="rounded-md border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-sm font-medium text-cyan-200"
            >
              IP Management
            </Link>
          </nav>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            You are viewing all IP addresses, including records created by regular users.
          </div>

          <UserIpManager />
        </div>
      </main>
    );
  }

  const filters: AuditLogFilters = {
    action: getFirst(sp.action) as AuditLogFilters["action"],
    user_id: getFirst(sp.user_id),
    entity_id: getFirst(sp.entity_id),
    from: getFirst(sp.from),
    to: getFirst(sp.to),
    q: getFirst(sp.q),
    sort: (getFirst(sp.sort) as AuditLogFilters["sort"]) ?? "latest",
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

    errorMessage = error instanceof Error ? error.message : "Unable to load audit logs right now.";
  }

  if (errorMessage || !result) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-rose-100">Audit Logs Unavailable</h1>
          <p className="mt-3 text-sm text-rose-200">{errorMessage ?? "Unknown error"}</p>
          <p className="mt-2 text-sm text-slate-300">
            Confirm `ip-service` is running and `/api/audit-logs` is reachable.
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
  const hasActiveFilters = Boolean(
    filters.action ||
      filters.user_id ||
      filters.entity_id ||
      filters.from ||
      filters.to ||
      filters.q ||
      filters.sort === "oldest"
  );

  const baseParams = new URLSearchParams();
  if (filters.action) baseParams.set("action", filters.action);
  if (filters.user_id) baseParams.set("user_id", filters.user_id);
  if (filters.entity_id) baseParams.set("entity_id", filters.entity_id);
  if (filters.from) baseParams.set("from", filters.from);
  if (filters.to) baseParams.set("to", filters.to);
  if (filters.q) baseParams.set("q", filters.q);
  if (filters.sort) baseParams.set("sort", filters.sort);
  if (filters.per_page) baseParams.set("per_page", filters.per_page);

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(prevPage));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(nextPage));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-slate-300">
                Track create, update, delete, and login activity across services.
              </p>
            </div>
            <LogoutButton />
          </div>

          <nav className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/audit-logs"
              className="rounded-md border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-sm font-medium text-cyan-200"
            >
              Audit Logs
            </Link>
            <Link
              href="/admin/audit-logs?view=ips"
              className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm transition hover:bg-white/10"
            >
              IP Management
            </Link>
          </nav>

          <form method="get" className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-8">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search value/entity"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400 lg:col-span-2"
            />

            <select
              name="action"
              defaultValue={filters.action ?? ""}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            >
              <option value="">All Actions</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
              <option value="login">login</option>
            </select>

            <input
              name="user_id"
              defaultValue={filters.user_id}
              placeholder="User ID"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <input
              name="entity_id"
              defaultValue={filters.entity_id}
              placeholder="Entity ID"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <input
              type="date"
              name="from"
              defaultValue={filters.from}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <input
              type="date"
              name="to"
              defaultValue={filters.to}
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
            />

            <div className="flex gap-2">
              <select
                name="sort"
                defaultValue={filters.sort ?? "latest"}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-400"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <input name="per_page" defaultValue={filters.per_page} type="hidden" />
              <button
                type="submit"
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Apply
              </button>
            </div>
          </form>

          {hasActiveFilters ? (
            <div className="mt-3">
              <Link
                href="/admin/audit-logs"
                className="inline-flex rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
              >
                Clear Filters
              </Link>
            </div>
          ) : null}
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-800/80 text-left text-xs uppercase tracking-[0.08em] text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold md:px-5">Action</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Role</th>
                  <th className="px-4 py-3 font-semibold md:px-5">User ID</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Entity Type</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Entity ID</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Old / New Values</th>
                  <th className="px-4 py-3 font-semibold md:px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="mx-auto max-w-md">
                        <p className="text-lg font-semibold text-slate-200">No audit logs found</p>
                        <p className="mt-2 text-sm text-slate-400">
                          Try adjusting your filters or clear them to load more records.
                        </p>
                        {hasActiveFilters ? (
                          <div className="mt-4">
                            <Link
                              href="/admin/audit-logs"
                              className="inline-flex rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                            >
                              Clear Filters
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((log) => {
                    const role =
                      typeof log.meta?.role === "string"
                        ? log.meta.role
                        : typeof log.meta?.user_role === "string"
                          ? log.meta.user_role
                          : "-";

                    return (
                      <tr key={log.id} className="align-top hover:bg-white/5">
                        <td className="px-4 py-3 md:px-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getActionBadgeClasses(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200 md:px-5">{role}</td>
                        <td className="px-4 py-3 font-medium md:px-5">{log.user_id}</td>
                        <td className="px-4 py-3 text-slate-200 md:px-5">{log.entity_type}</td>
                        <td className="px-4 py-3 text-slate-200 md:px-5">{log.entity_id ?? "-"}</td>
                        <td className="px-4 py-3 md:px-5">
                          <details className="rounded-md border border-white/10 bg-black/20 p-2">
                            <summary className="cursor-pointer text-xs text-slate-300">
                              Show values
                            </summary>
                            <div className="mt-2 grid gap-2">
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                  Old
                                </p>
                                <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-950/70 p-2 text-[11px] text-slate-200">
                                  {stringifyValue(log.old_values)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                  New
                                </p>
                                <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-950/70 p-2 text-[11px] text-slate-200">
                                  {stringifyValue(log.new_values)}
                                </pre>
                              </div>
                            </div>
                          </details>
                        </td>
                        <td className="px-4 py-3 text-slate-300 md:px-5">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm md:px-5">
            {currentPage > 1 ? (
              <Link
                href={`/admin/audit-logs?${prevParams.toString()}`}
                className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-slate-500">
                Previous
              </span>
            )}
            <span className="text-slate-300">
              Page {meta.page} of {meta.total_pages}
            </span>
            {currentPage < meta.total_pages ? (
              <Link
                href={`/admin/audit-logs?${nextParams.toString()}`}
                className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-slate-500">
                Next
              </span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
