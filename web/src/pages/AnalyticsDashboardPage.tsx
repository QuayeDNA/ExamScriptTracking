import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/api/analytics";
import { BarChartCard } from "@/components/BarChartCard";
import { StatCard } from "@/components/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/@/components/ui/card";
import { Button } from "@/@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/@/components/ui/select";
import { Skeleton } from "@/@/components/ui/skeleton";
import { Badge } from "@/@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/@/components/ui/table";
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Download,
  CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import type {
  AnalyticsOverview,
  HandlerPerformance,
  DiscrepancyReport,
  ExamStatistics,
  TransferStatus,
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
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyReport[]>([]);
  const [examStats, setExamStats] = useState<ExamStatistics[]>([]);

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
      setHandlerPerformance(performanceData.handlers);
      setDiscrepancies(discrepanciesData.discrepancies);
      setExamStats(statsData.exams);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
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
      toast.error("Failed to export report");
    }
  };

  const getStatusBadgeVariant = (status: TransferStatus) => {
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
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide analytics and performance metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "MMM d")} -{" "}
                {format(dateRange.to, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Select</label>
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

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sessions"
            value={overview.totalSessions}
            description="Exam sessions in period"
            icon={BookOpen}
            trend={{
              value: overview.trends.sessions,
              isPositive: overview.trends.sessions >= 0,
            }}
          />
          <StatCard
            title="Active Transfers"
            value={overview.activeTransfers}
            description="Currently in progress"
            icon={Activity}
            trend={{
              value: overview.trends.transfers,
              isPositive: overview.trends.transfers >= 0,
            }}
          />
          <StatCard
            title="Completed Transfers"
            value={overview.completedTransfers}
            description="Successfully completed"
            icon={TrendingUp}
          />
          <StatCard
            title="Discrepancies"
            value={overview.discrepancies}
            description="Reported issues"
            icon={AlertTriangle}
            trend={{
              value: overview.trends.discrepancies,
              isPositive: overview.trends.discrepancies <= 0,
            }}
          />
        </div>
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
          <BarChartCard
            title="Handler Performance Comparison"
            description="Transfer volumes and response times by handler"
            data={handlerPerformance.map((h) => ({
              name: h.handlerName,
              sent: h.sentTransfers,
              received: h.receivedTransfers,
            }))}
            dataKeys={[
              { key: "sent", color: "hsl(var(--chart-1))", name: "Sent" },
              {
                key: "received",
                color: "hsl(var(--chart-2))",
                name: "Received",
              },
            ]}
            height={350}
          />

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Handler Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Handler</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">
                      Avg Response (min)
                    </TableHead>
                    <TableHead className="text-right">
                      Discrepancy Rate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handlerPerformance.map((handler) => (
                    <TableRow key={handler.handlerId}>
                      <TableCell className="font-medium">
                        {handler.handlerName}
                      </TableCell>
                      <TableCell className="text-right">
                        {handler.sentTransfers}
                      </TableCell>
                      <TableCell className="text-right">
                        {handler.receivedTransfers}
                      </TableCell>
                      <TableCell className="text-right">
                        {handler.avgResponseTime.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            handler.discrepancyRate > 10
                              ? "destructive"
                              : handler.discrepancyRate > 5
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {handler.discrepancyRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discrepancies Tab */}
        <TabsContent value="discrepancies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Discrepancy Reports</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("discrepancies")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
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
                  {discrepancies.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No discrepancies reported in this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    discrepancies.map((disc) => (
                      <TableRow key={disc.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{disc.courseCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {disc.courseName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{disc.fromHandlerName}</TableCell>
                        <TableCell>{disc.toHandlerName}</TableCell>
                        <TableCell className="text-right">
                          {disc.scriptsExpected}
                        </TableCell>
                        <TableCell className="text-right">
                          {disc.scriptsReceived}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(disc.status)}>
                            {disc.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(disc.reportedAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Statistics Tab */}
        <TabsContent value="exams" className="space-y-4">
          {/* Completion Rate Chart */}
          <BarChartCard
            title="Exam Completion Rates"
            description="Script submission rates by exam session"
            data={examStats.slice(0, 10).map((exam) => ({
              name: exam.courseCode,
              completionRate: exam.completionRate,
            }))}
            dataKeys={[
              {
                key: "completionRate",
                color: "hsl(var(--chart-3))",
                name: "Completion %",
              },
            ]}
            height={350}
          />

          {/* Exam Stats Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Exam Session Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("exams")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Total Students</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                    <TableHead className="text-right">
                      Completion Rate
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examStats.map((exam) => (
                    <TableRow key={exam.examSessionId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.courseCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {exam.courseName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {exam.totalStudents}
                      </TableCell>
                      <TableCell className="text-right">
                        {exam.presentStudents}
                      </TableCell>
                      <TableCell className="text-right">
                        {exam.submittedScripts}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            exam.completionRate >= 90
                              ? "default"
                              : exam.completionRate >= 75
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {exam.completionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(exam.examDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exam.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
