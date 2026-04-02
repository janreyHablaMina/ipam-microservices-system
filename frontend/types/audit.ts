export type AuditAction = "create" | "update" | "delete" | "login";

export type AuditLog = {
  id: number;
  user_id: number;
  action: AuditAction;
  entity_type: string;
  entity_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogFilters = {
  action?: "create" | "update" | "delete";
  user_id?: string;
  entity_id?: string;
  from?: string;
  to?: string;
  page?: string;
  per_page?: string;
};

export type PaginatedAuditLogsResponse = {
  data: AuditLog[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};
