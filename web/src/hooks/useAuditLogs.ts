import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import type { AuditLogFilters } from "@/types";

export const useAuditLogs = (filters?: AuditLogFilters) => {
  return useQuery({
    queryKey: ["auditLogs", filters],
    queryFn: () => authApi.getAuditLogs(filters),
    staleTime: 30000, // 30 seconds
  });
};
