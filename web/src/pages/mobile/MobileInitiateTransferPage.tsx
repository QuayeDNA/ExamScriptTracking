import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  User,
  Search,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  type ExamSession as Batch,
  type User as UserType,
} from "@/types/mobile";
import { toast } from "sonner";

export const MobileInitiateTransferPage = () => {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<UserType | null>(
    null
  );
  const [transferReason, setTransferReason] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["available-batches"],
    queryFn: () =>
      Promise.resolve([
        {
          id: "1",
          batchQrCode: "BATCH-001",
          courseCode: "CS101",
          courseName: "Computer Science",
          lecturerId: "lecturer1",
          lecturerName: "Dr. Sarah Johnson",
          department: "Computer Science",
          faculty: "Engineering",
          venue: "Room 101",
          examDate: "2024-01-15",
          status: "WITH_LECTURER" as const,
          createdById: "admin1",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          batchQrCode: "BATCH-002",
          courseCode: "MATH101",
          courseName: "Mathematics",
          lecturerId: "lecturer2",
          lecturerName: "Prof. Michael Chen",
          department: "Mathematics",
          faculty: "Science",
          venue: "Room 205",
          examDate: "2024-01-16",
          status: "IN_TRANSIT" as const,
          createdById: "admin1",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ]),
  });

  const { data: recipients, isLoading: recipientsLoading } = useQuery({
    queryKey: ["available-recipients"],
    queryFn: () =>
      Promise.resolve([
        {
          id: "1",
          email: "sarah.johnson@university.edu",
          name: "Dr. Sarah Johnson",
          department: "Computer Science",
          role: "LECTURER" as const,
          isSuperAdmin: false,
          isActive: true,
          passwordChanged: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          email: "michael.chen@university.edu",
          name: "Prof. Michael Chen",
          department: "Mathematics",
          role: "LECTURER" as const,
          isSuperAdmin: false,
          isActive: true,
          passwordChanged: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ]),
  });

  const initiateTransferMutation = useMutation({
    mutationFn: (_data: {
      batchId: string;
      recipientId: string;
      reason: string;
      handoverVenue: string;
    }) => Promise.resolve({ message: "Transfer initiated successfully" }),
    onSuccess: () => {
      toast.success("Transfer initiated successfully");
      navigate("/mobile");
    },
    onError: (error: any) => {
      toast.error("Failed to initiate transfer", {
        description: error.error || "An error occurred",
      });
    },
  });

  const filteredRecipients =
    recipients?.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        recipient.email.toLowerCase().includes(recipientSearch.toLowerCase())
    ) || [];

  const handleInitiateTransfer = () => {
    if (!selectedBatch || !selectedRecipient || !transferReason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const handoverVenue = prompt("Enter handover venue:");
    if (!handoverVenue) return;

    initiateTransferMutation.mutate({
      batchId: selectedBatch.id,
      recipientId: selectedRecipient.id,
      reason: transferReason,
      handoverVenue,
    });
  };

  if (batchesLoading || recipientsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <h1 className="text-lg font-bold">Initiate Transfer</h1>
              <p className="text-blue-100 text-sm">Transfer batch custody</p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Select Batch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Batch</CardTitle>
              </CardHeader>
              <CardContent>
                {batches && batches.length > 0 ? (
                  <div className="space-y-3">
                    {batches.map((batch) => (
                      <div
                        key={batch.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBatch?.id === batch.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedBatch(batch)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">
                                {batch.batchQrCode}
                              </span>
                              <Badge variant="outline">{batch.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {batch.courseName} - {batch.courseCode}
                            </p>
                            <p className="text-xs text-gray-500">
                              {batch.lecturerName} • {batch.venue}
                            </p>
                          </div>
                          {selectedBatch?.id === batch.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No batches available for transfer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Select Recipient */}
            {selectedBatch && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Recipient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search recipients..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {filteredRecipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRecipient?.id === recipient.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedRecipient(recipient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{recipient.name}</p>
                              <p className="text-sm text-gray-600">
                                {recipient.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {recipient.role}
                              </p>
                            </div>
                          </div>
                          {selectedRecipient?.id === recipient.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredRecipients.length === 0 && recipientSearch && (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        No recipients found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transfer Reason */}
            {selectedBatch && selectedRecipient && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason for Transfer *</Label>
                    <textarea
                      id="reason"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={3}
                      placeholder="Please provide a reason for this batch transfer..."
                      required
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Transfer Summary
                    </h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <strong>Batch:</strong> {selectedBatch.batchQrCode}
                      </p>
                      <p>
                        <strong>Recipient:</strong> {selectedRecipient.name}
                      </p>
                      <p>
                        <strong>Course:</strong> {selectedBatch.courseName}
                      </p>
                      <p>
                        <strong>Venue:</strong> {selectedBatch.venue}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleInitiateTransfer}
                    className="w-full"
                    disabled={
                      initiateTransferMutation.isPending ||
                      !transferReason.trim()
                    }
                  >
                    {initiateTransferMutation.isPending
                      ? "Initiating Transfer..."
                      : "Initiate Transfer"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
