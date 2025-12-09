import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import type { AuditLogFilters } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  AlertCircle,
  Clock,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

// Action color mapping
const getActionBadgeVariant = (
  action: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (action.includes("LOGIN")) return "default";
  if (action.includes("CREATE") || action.includes("REACTIVATE"))
    return "secondary";
  if (
    action.includes("DELETE") ||
    action.includes("DEACTIVATE") ||
    action.includes("LOCKED")
  )
    return "destructive";
  if (action.includes("UPDATE") || action.includes("CHANGE")) return "outline";
  return "secondary";
};

const getActionIcon = (action: string) => {
  if (action.includes("LOGIN") || action.includes("LOGOUT"))
    return <User className="w-3 h-3" />;
  if (action.includes("LOCKED") || action.includes("UNLOCK"))
    return <Shield className="w-3 h-3" />;
  if (action.includes("PASSWORD")) return <Shield className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
  });

  const { data, isLoading, error } = useAuditLogs(filters);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 50 });
  };

  const hasActiveFilters =
    filters.userId ||
    filters.action ||
    filters.entity ||
    filters.dateFrom ||
    filters.dateTo;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              System activity and security audit trail
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-destructive">
                  Error loading audit logs
                </p>
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : "Unknown error"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                System activity and security audit trail
              </CardDescription>
            </div>
            {pagination && (
              <Badge variant="secondary" className="text-sm">
                {pagination.total} total logs
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="userId">User Email</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Filter by user..."
                value={filters.userId || ""}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={filters.action || undefined}
                onValueChange={(value) => handleFilterChange("action", value)}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">
                    Password Change
                  </SelectItem>
                  <SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
                  <SelectItem value="CREATE_USER">Create User</SelectItem>
                  <SelectItem value="UPDATE_USER">Update User</SelectItem>
                  <SelectItem value="DEACTIVATE_USER">
                    Deactivate User
                  </SelectItem>
                  <SelectItem value="REACTIVATE_USER">
                    Reactivate User
                  </SelectItem>
                  <SelectItem value="BULK_CREATE_USER">Bulk Create</SelectItem>
                  <SelectItem value="BULK_DEACTIVATE_USERS">
                    Bulk Deactivate
                  </SelectItem>
                  <SelectItem value="BULK_UPDATE_ROLE">
                    Bulk Update Role
                  </SelectItem>
                  <SelectItem value="UNLOCK_ACCOUNT">Unlock Account</SelectItem>
                  <SelectItem value="ADMIN_PASSWORD_RESET">
                    Admin Password Reset
                  </SelectItem>
                  <SelectItem value="FORCE_LOGOUT_USER">
                    Force Logout
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entity">Entity</Label>
              <Select
                value={filters.entity || undefined}
                onValueChange={(value) => handleFilterChange("entity", value)}
              >
                <SelectTrigger id="entity">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="ExamSession">Exam Session</SelectItem>
                  <SelectItem value="BatchTransfer">Batch Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              {hasActiveFilters && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <div>
                            <div>
                              {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.user.email}</p>
                          <div className="text-xs text-muted-foreground">
                            {log.user.firstName} {log.user.lastName} •{" "}
                            <Badge variant="outline" className="text-xs">
                              {log.user.role.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          <span className="flex items-center gap-1">
                            {getActionIcon(log.action)}
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.entity}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing page{" "}
                <span className="font-medium">{pagination.page}</span> of{" "}
                <span className="font-medium">{pagination.pages}</span> •{" "}
                <span className="font-medium">{pagination.total}</span> total
                logs
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
