import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/api/analytics";
import { BarChartCard } from "@/components/BarChartCard";
import { StatCard } from "@/components/StatCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Download,
  CalendarIcon,
  RefreshCw,
  Users,
  Clock,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import type {
  AnalyticsOverview,
  HandlerPerformance,
  DiscrepanciesResponse,
  ExamStatisticsResponse,
  TransferStatus,
  ApiError,
} from "@/types";

type DateRange = {
  from: Date;
  to: Date;
};

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  // Analytics data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [handlerPerformance, setHandlerPerformance] = useState<
    HandlerPerformance[]
  >([]);
  const [discrepancies, setDiscrepancies] =
    useState<DiscrepanciesResponse | null>(null);
  const [examStats, setExamStats] = useState<ExamStatisticsResponse | null>(
    null
  );

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      };

      const [overviewData, performanceData, discrepanciesData, statsData] =
        await Promise.all([
          analyticsApi.getOverview(filters),
          analyticsApi.getHandlerPerformance(filters),
          analyticsApi.getDiscrepancies(filters),
          analyticsApi.getExamStats(filters),
        ]);

      setOverview(overviewData);
      setHandlerPerformance(performanceData);
      setDiscrepancies(discrepanciesData);
      setExamStats(statsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data", {
        description:
          (error as ApiError)?.error || (error as Error)?.message || "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success("Analytics refreshed");
  };

  const handleExport = async (reportType: string) => {
    try {
      toast.info(`Generating ${exportFormat.toUpperCase()} report...`);
      const blob = await analyticsApi.exportReport({
        format: exportFormat,
        reportType: reportType as
          | "overview"
          | "handlers"
          | "discrepancies"
          | "exams",
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });

      const filename = `${reportType}_report_${format(
        dateRange.from,
        "yyyy-MM-dd"
      )}_to_${format(dateRange.to, "yyyy-MM-dd")}.${
        exportFormat === "pdf" ? "pdf" : "xlsx"
      }`;
      analyticsApi.downloadReport(blob, filename);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export report", {
        description:
          (error as ApiError)?.error || (error as Error)?.message || "Unknown error occurred",
      });
    }
  };

  const getStatusBadgeVariant = (
    status: TransferStatus
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "CONFIRMED":
        return "default";
      case "PENDING":
        return "secondary";
      case "DISCREPANCY_REPORTED":
        return "destructive";
      case "RESOLVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Analytics Dashboard</CardTitle>
              <CardDescription>
                System-wide analytics and performance metrics
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM d")} -{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              from: subDays(new Date(), 7),
                              to: new Date(),
                            })
                          }
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              from: subDays(new Date(), 30),
                              to: new Date(),
                            })
                          }
                        >
                          Last 30 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              from: subDays(new Date(), 90),
                              to: new Date(),
                            })
                          }
                        >
                          Last 90 days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDateRange({
                              from: new Date(new Date().getFullYear(), 0, 1),
                              to: new Date(),
                            })
                          }
                        >
                          This year
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>

              {/* Export Controls */}
              <Select
                value={exportFormat}
                onValueChange={(value: string) =>
                  setExportFormat(value as "pdf" | "excel")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => handleExport("overview")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Exams"
            value={overview.overview.totalExams}
            description="All exam sessions"
            icon={BookOpen}
          />
          <StatCard
            title="Exams This Month"
            value={overview.overview.examsThisMonth}
            description="Current month sessions"
            icon={Activity}
          />
          <StatCard
            title="Active Batches"
            value={overview.overview.activeBatches}
            description="Currently in progress"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Handlers"
            value={overview.overview.totalHandlers}
            description="System users handling transfers"
            icon={Users}
          />
        </div>
      )}

      {/* Secondary Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Discrepancies"
            value={overview.overview.totalDiscrepancies}
            description="Reported issues"
            icon={AlertTriangle}
          />
          <StatCard
            title="Discrepancy Rate"
            value={`${overview.overview.discrepancyRate.toFixed(1)}%`}
            description="Percentage of transfers with issues"
            icon={AlertTriangle}
          />
          <StatCard
            title="Avg Transfer Time"
            value={`${(overview.overview.avgTransferTimeHours * 60).toFixed(
              0
            )}m`}
            description="Average response time"
            icon={Clock}
          />
        </div>
      )}

      {/* Exams by Day Trend */}
      {overview &&
        overview.trends.examsByDay &&
        Object.keys(overview.trends.examsByDay).length > 0 && (
          <BarChartCard
            title="Exams by Day"
            description="Daily exam session activity"
            data={Object.entries(overview.trends.examsByDay).map(
              ([date, count]) => ({
                name: format(new Date(date), "MMM d"),
                exams: count as number,
              })
            )}
            dataKeys={[
              {
                key: "exams",
                color: "#3b82f6",
                name: "Exams",
              },
            ]}
            height={300}
          />
        )}

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Handler Performance</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          <TabsTrigger value="exams">Exam Statistics</TabsTrigger>
        </TabsList>

        {/* Handler Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Performance Chart */}
          {handlerPerformance.length > 0 && (
            <BarChartCard
              title="Handler Performance Comparison"
              description="Transfer volumes and response times by handler"
              data={handlerPerformance.map((h) => ({
                name: h.handler.name,
                sent: h.metrics.transfersInitiated,
                received: h.metrics.transfersReceived,
                custody: h.metrics.currentCustody,
              }))}
              dataKeys={[
                {
                  key: "sent",
                  color: "#3b82f6",
                  name: "Sent",
                },
                {
                  key: "received",
                  color: "#10b981",
                  name: "Received",
                },
                {
                  key: "custody",
                  color: "#f59e0b",
                  name: "In Custody",
                },
              ]}
              height={350}
            />
          )}

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Handler Metrics</CardTitle>
              <CardDescription>
                Comprehensive handler performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Handler</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">In Custody</TableHead>
                      <TableHead className="text-right">
                        Avg Response (min)
                      </TableHead>
                      <TableHead className="text-right">
                        Discrepancies
                      </TableHead>
                      <TableHead className="text-right">
                        Discrepancy Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {handlerPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-muted-foreground py-8"
                        >
                          No handler performance data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      handlerPerformance.map((item) => (
                        <TableRow key={item.handler.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.handler.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.handler.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.handler.role.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.metrics.totalTransfers}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.metrics.transfersInitiated}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.metrics.transfersReceived}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {item.metrics.currentCustody}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {(item.metrics.avgResponseTimeHours * 60).toFixed(
                              1
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.metrics.discrepancies}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                item.metrics.discrepancyRate > 10
                                  ? "destructive"
                                  : item.metrics.discrepancyRate > 5
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {item.metrics.discrepancyRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discrepancies Tab */}
        <TabsContent value="discrepancies" className="space-y-4">
          {/* Discrepancy Summary Stats */}
          {discrepancies && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Discrepancies"
                value={discrepancies.summary.total}
                icon={AlertTriangle}
              />
              <StatCard
                title="Resolved"
                value={discrepancies.summary.resolved}
                icon={Activity}
              />
              <StatCard
                title="Unresolved"
                value={discrepancies.summary.unresolved}
                icon={AlertTriangle}
              />
              <StatCard
                title="Resolution Rate"
                value={`${discrepancies.summary.resolutionRate.toFixed(0)}%`}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Discrepancy Trend Chart */}
          {discrepancies && Object.keys(discrepancies.trend).length > 0 && (
            <BarChartCard
              title="Discrepancies Over Time"
              description="Daily discrepancy reports"
              data={Object.entries(discrepancies.trend).map(
                ([date, count]) => ({
                  name: format(new Date(date), "MMM d"),
                  discrepancies: count,
                })
              )}
              dataKeys={[
                {
                  key: "discrepancies",
                  color: "#ef4444",
                  name: "Discrepancies",
                },
              ]}
              height={300}
            />
          )}

          {/* Discrepancy Breakdown Charts */}
          {discrepancies && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>By Status</CardTitle>
                  <CardDescription>
                    Discrepancy status breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(discrepancies.breakdown.byStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between"
                        >
                          <Badge
                            variant={
                              status === "CONFIRMED"
                                ? "default"
                                : status === "PENDING"
                                ? "secondary"
                                : status === "DISCREPANCY_REPORTED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Department</CardTitle>
                  <CardDescription>
                    Discrepancies per department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(discrepancies.breakdown.byDepartment).map(
                      ([dept, count]) => (
                        <div
                          key={dept}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{dept}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Discrepancies Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Discrepancy Reports</CardTitle>
                <CardDescription>
                  Latest transfer discrepancies in the selected period
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("discrepancies")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!discrepancies ||
                    discrepancies.recentDiscrepancies.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No discrepancies reported in this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      discrepancies.recentDiscrepancies.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transfer.examSession.courseCode}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transfer.examSession.courseName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{`${transfer.fromHandler.firstName} ${transfer.fromHandler.lastName}`}</TableCell>
                          <TableCell>{`${transfer.toHandler.firstName} ${transfer.toHandler.lastName}`}</TableCell>
                          <TableCell className="text-right">
                            {transfer.examsExpected}
                          </TableCell>
                          <TableCell className="text-right">
                            {transfer.examsReceived || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(transfer.status)}
                            >
                              {transfer.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(transfer.requestedAt),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Statistics Tab */}
        <TabsContent value="exams" className="space-y-4">
          {/* Summary Stats */}
          {examStats && (
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard
                title="Total Exams"
                value={examStats.summary.totalExams}
                icon={BookOpen}
              />
              <StatCard
                title="Completed"
                value={examStats.summary.completedExams}
                icon={Activity}
              />
              <StatCard
                title="Completion Rate"
                value={`${examStats.summary.completionRate.toFixed(0)}%`}
                icon={TrendingUp}
              />
              <StatCard
                title="Avg Processing Time"
                value={`${examStats.summary.avgProcessingTimeDays.toFixed(1)}d`}
                icon={Clock}
              />
              <StatCard
                title="Avg Students/Exam"
                value={examStats.summary.avgStudentsPerExam.toFixed(0)}
                icon={Users}
              />
            </div>
          )}

          {/* Exams by Month Chart */}
          {examStats && Object.keys(examStats.breakdown.byMonth).length > 0 && (
            <BarChartCard
              title="Exams by Month"
              description="Monthly exam session distribution"
              data={Object.entries(examStats.breakdown.byMonth).map(
                ([month, count]) => ({
                  name: format(new Date(month + "-01"), "MMM yyyy"),
                  exams: count,
                })
              )}
              dataKeys={[
                {
                  key: "exams",
                  color: "#8b5cf6",
                  name: "Exams",
                },
              ]}
              height={300}
            />
          )}

          {/* Breakdowns */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Exams by Status</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examStats &&
                      Object.keys(examStats.breakdown.byStatus).length > 0 ? (
                        Object.entries(examStats.breakdown.byStatus).map(
                          ([status, count]) => (
                            <TableRow key={status}>
                              <TableCell>
                                <Badge variant="outline">
                                  {status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {count}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground py-8"
                          >
                            No exam data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exams by Department</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examStats &&
                      Object.keys(examStats.breakdown.byDepartment).length >
                        0 ? (
                        Object.entries(examStats.breakdown.byDepartment).map(
                          ([dept, count]) => (
                            <TableRow key={dept}>
                              <TableCell className="font-medium">
                                {dept}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {count}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground py-8"
                          >
                            No exam data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exams by Faculty</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Faculty</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examStats &&
                      Object.keys(examStats.breakdown.byFaculty).length > 0 ? (
                        Object.entries(examStats.breakdown.byFaculty).map(
                          ([faculty, count]) => (
                            <TableRow key={faculty}>
                              <TableCell className="font-medium">
                                {faculty}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {count}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground py-8"
                          >
                            No exam data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
