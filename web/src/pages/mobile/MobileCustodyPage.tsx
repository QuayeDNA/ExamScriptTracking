import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
} from "lucide-react";
import { examSessionsApi, type ExamSession } from "@/api/examSessions";
import { format } from "date-fns";

type FilterType = "ALL" | "IN_CUSTODY" | "PENDING" | "TRANSFERRED";

interface Transfer {
  id: string;
  status: string;
  // Add other properties as needed based on your API
}

interface BatchWithCustody {
  id: string;
  batchQrCode: string;
  courseCode: string;
  courseName: string;
  venue: string;
  examDate: string;
  status: string;
  custodyStatus:
    | "IN_CUSTODY"
    | "PENDING_RECEIPT"
    | "TRANSFER_INITIATED"
    | "TRANSFERRED";
  latestTransfer?: Transfer;
  pendingTransferCount?: number;
}

export const MobileCustodyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: batches,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["mobile-custody", user?.id],
    queryFn: async () => {
      // Get exam sessions in user's custody
      const sessions = await examSessionsApi.getExamSessions({});

      // Transform to match mobile app format
      return sessions.examSessions.map((session: ExamSession) => ({
        id: session.id,
        batchQrCode: session.batchQrCode,
        courseCode: session.courseCode,
        courseName: session.courseName,
        venue: session.venue,
        examDate: session.examDate,
        status: session.status,
        custodyStatus: "IN_CUSTODY" as const, // Simplified for now
        latestTransfer: undefined,
        pendingTransferCount: 0,
      })) as BatchWithCustody[];
    },
  });

  const filteredBatches = (batches || []).filter((batch) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "IN_CUSTODY" && batch.custodyStatus === "IN_CUSTODY") ||
      (filter === "PENDING" && batch.custodyStatus === "PENDING_RECEIPT") ||
      (filter === "TRANSFERRED" && batch.custodyStatus === "TRANSFERRED");

    const matchesSearch =
      !searchQuery ||
      batch.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchQrCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getCustodyStatusColor = (status: string) => {
    switch (status) {
      case "IN_CUSTODY":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING_RECEIPT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "TRANSFER_INITIATED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "TRANSFERRED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCustodyStatusIcon = (status: string) => {
    switch (status) {
      case "IN_CUSTODY":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING_RECEIPT":
        return <Clock className="w-4 h-4" />;
      case "TRANSFER_INITIATED":
        return <RefreshCw className="w-4 h-4" />;
      case "TRANSFERRED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">My Custody</h1>
              <p className="text-blue-100 text-sm">Exam batches in your care</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="bg-blue-500 hover:bg-blue-400"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by course code, name, or QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={filter}
                onValueChange={(value: FilterType) => setFilter(value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Batches</SelectItem>
                  <SelectItem value="IN_CUSTODY">In Custody</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBatches.length > 0 ? (
              <div className="space-y-4">
                {filteredBatches.map((batch) => (
                  <Card
                    key={batch.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      navigate(`/mobile/batch-details/${batch.id}`)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {batch.courseCode}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {batch.courseName}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {batch.venue}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(batch.examDate), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getCustodyStatusColor(batch.custodyStatus)}
                        >
                          <div className="flex items-center gap-1">
                            {getCustodyStatusIcon(batch.custodyStatus)}
                            {batch.custodyStatus.replace("_", " ")}
                          </div>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          QR: {batch.batchQrCode}
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {batch.pendingTransferCount &&
                        batch.pendingTransferCount > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-center text-yellow-800 text-sm">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {batch.pendingTransferCount} pending transfer
                              {batch.pendingTransferCount > 1 ? "s" : ""}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No batches found
                </h3>
                <p className="text-gray-500">
                  {searchQuery || filter !== "ALL"
                    ? "Try adjusting your filters"
                    : "You don't have any exam batches in custody"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
