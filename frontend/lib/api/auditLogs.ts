import { cookies } from "next/headers";

import type { AuditLogFilters, PaginatedAuditLogsResponse } from "@/types/audit";

const BACKEND_API_BASE_URL = process.env.BACKEND_API_BASE_URL;

export class MissingAuthTokenError extends Error {
  constructor() {
    super("Missing auth token");
    this.name = "MissingAuthTokenError";
  }
}

function buildQuery(filters: AuditLogFilters): string {
  const params = new URLSearchParams();

  if (filters.action) params.set("action", filters.action);
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.entity_id) params.set("entity_id", filters.entity_id);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page) params.set("page", filters.page);
  if (filters.per_page) params.set("per_page", filters.per_page);

  return params.toString();
}

export async function fetchAuditLogs(
  filters: AuditLogFilters
): Promise<PaginatedAuditLogsResponse> {
  if (!BACKEND_API_BASE_URL) {
    throw new Error("BACKEND_API_BASE_URL is not configured");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new MissingAuthTokenError();
  }

  const query = buildQuery(filters);
  const url = `${BACKEND_API_BASE_URL}/api/audit-logs${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs (${response.status})`);
  }

  return (await response.json()) as PaginatedAuditLogsResponse;
}
