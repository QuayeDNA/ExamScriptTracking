import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  getTransferById,
  confirmTransfer,
  rejectTransfer,
} from "@/api/batchTransfers";
import { toast } from "sonner";
import { format } from "date-fns";

export const MobileConfirmTransferPage = () => {
  const navigate = useNavigate();
  const { transferId } = useParams<{ transferId: string }>();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: transferData, isLoading } = useQuery({
    queryKey: ["transfer", transferId],
    queryFn: () =>
      transferId
        ? getTransferById(transferId)
        : Promise.reject("No transfer ID"),
    enabled: !!transferId,
  });

  const transfer = transferData?.transfer;

  const confirmTransferMutation = useMutation({
    mutationFn: (transferId: string) =>
      confirmTransfer(transferId, { examsReceived: 0 }),
    onSuccess: () => {
      toast.success("Transfer confirmed successfully");
      navigate("/mobile");
    },
    onError: (error: unknown) => {
      toast.error("Failed to confirm transfer", {
        description: (error as { error?: string }).error || "An error occurred",
      });
    },
  });

  const rejectTransferMutation = useMutation({
    mutationFn: ({
      transferId,
      reason,
    }: {
      transferId: string;
      reason: string;
    }) => rejectTransfer(transferId, reason),
    onSuccess: () => {
      toast.success("Transfer rejected");
      navigate("/mobile");
    },
    onError: (error: unknown) => {
      toast.error("Failed to reject transfer", {
        description: (error as { error?: string }).error || "An error occurred",
      });
    },
  });

  const handleConfirm = () => {
    if (!transfer) return;
    confirmTransferMutation.mutate(transfer.id);
  };

  const handleReject = () => {
    if (!transfer || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    rejectTransferMutation.mutate({
      transferId: transfer.id,
      reason: rejectionReason,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Transfer Not Found</h2>
            <p className="text-gray-600 mb-4">
              The requested transfer could not be found or has already been
              processed.
            </p>
            <Button onClick={() => navigate("/mobile")}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/mobile")}
              className="text-white hover:bg-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">Confirm Transfer</h1>
              <p className="text-blue-100 text-sm">
                Review and confirm batch transfer
              </p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Transfer Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    Pending Confirmation
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {format(new Date(transfer.requestedAt), "MMM dd, HH:mm")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Batch Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Batch QR Code
                    </p>
                    <p className="font-semibold">
                      {transfer.examSession.batchQrCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge variant="outline">{transfer.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Course</p>
                    <p>
                      {transfer.examSession.courseCode} -{" "}
                      {transfer.examSession.courseName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Venue</p>
                    <p>{transfer.examSession.venue}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Students
                    </p>
                    <p>{transfer.examsExpected}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scripts</p>
                    <p>{transfer.examsExpected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">From</p>
                    <p className="font-medium">
                      {transfer.fromHandler.firstName}{" "}
                      {transfer.fromHandler.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transfer.fromHandler.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">To</p>
                    <p className="font-medium">
                      {transfer.toHandler.firstName}{" "}
                      {transfer.toHandler.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transfer.toHandler.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Handover Venue
                    </p>
                    <p>{transfer.location || "Not specified"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Reason
                  </p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {transfer.resolutionNote || "No additional notes"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!showRejectForm ? (
              <div className="space-y-3">
                <Button
                  onClick={handleConfirm}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={confirmTransferMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {confirmTransferMutation.isPending
                    ? "Confirming..."
                    : "Confirm Transfer"}
                </Button>

                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Transfer
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">
                    Reject Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rejection-reason">
                      Reason for Rejection *
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this transfer..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowRejectForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      className="flex-1"
                      disabled={
                        rejectTransferMutation.isPending ||
                        !rejectionReason.trim()
                      }
                    >
                      {rejectTransferMutation.isPending
                        ? "Rejecting..."
                        : "Reject Transfer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
