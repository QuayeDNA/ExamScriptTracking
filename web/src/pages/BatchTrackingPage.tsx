import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as examSessionsApi from "../api/examSessions";
import * as batchTransfersApi from "../api/batchTransfers";
import type { ExamSession } from "../api/examSessions";
import type { BatchTransfer } from "../api/batchTransfers";

export default function BatchTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<ExamSession | null>(null);

  // Fetch all exam sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["examSessions"],
    queryFn: () => examSessionsApi.examSessionsApi.getExamSessions({}),
  });

  // Fetch transfer history for selected batch
  const { data: transferData, isLoading: transfersLoading } = useQuery({
    queryKey: ["transferHistory", selectedBatch?.id],
    queryFn: () =>
      selectedBatch
        ? batchTransfersApi.getTransferHistory(selectedBatch.id)
        : Promise.resolve(null),
    enabled: !!selectedBatch,
  });

  // Filter sessions based on search and status
  const filteredSessions = sessionsData?.examSessions.filter(
    (session: ExamSession) => {
      const matchesSearch =
        session.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.batchQrCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      SUBMITTED: "bg-green-100 text-green-800",
      IN_TRANSIT: "bg-yellow-100 text-yellow-800",
      WITH_LECTURER: "bg-purple-100 text-purple-800",
      UNDER_GRADING: "bg-indigo-100 text-indigo-800",
      GRADED: "bg-teal-100 text-teal-800",
      RETURNED: "bg-orange-100 text-orange-800",
      COMPLETED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTransferStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      DISCREPANCY_REPORTED: "bg-red-100 text-red-800",
      RESOLVED: "bg-indigo-100 text-indigo-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getCurrentHandler = (transfers: BatchTransfer[] | undefined) => {
    if (!transfers || transfers.length === 0) return null;

    // Get the most recent confirmed transfer
    const confirmedTransfers = transfers.filter(
      (t) => t.status === "CONFIRMED" || t.status === "RESOLVED"
    );

    if (confirmedTransfers.length === 0) return null;

    const latest = confirmedTransfers[confirmedTransfers.length - 1];
    return latest.toHandler;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Batch Tracking Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time tracking of exam script batches and chain of custody
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by course code, name, or batch QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="WITH_LECTURER">With Lecturer</option>
              <option value="UNDER_GRADING">Under Grading</option>
              <option value="GRADED">Graded</option>
              <option value="RETURNED">Returned</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batches List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Batches ({filteredSessions?.length || 0})
              </h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {sessionsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading batches...</p>
                </div>
              ) : filteredSessions && filteredSessions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredSessions.map((session: ExamSession) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedBatch(session)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedBatch?.id === session.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {session.courseCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.courseName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {session.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Batch: {session.batchQrCode}</p>
                        <p>Venue: {session.venue}</p>
                        <p>
                          Date:{" "}
                          {new Date(session.examDate).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No batches found</p>
                  <p className="text-sm mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Batch Details & Transfer History */}
          <div className="bg-white rounded-lg shadow-sm">
            {selectedBatch ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Batch Details
                  </h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {/* Batch Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Batch Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch QR:</span>
                        <span className="font-medium text-gray-900">
                          {selectedBatch.batchQrCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium text-gray-900">
                          {selectedBatch.courseCode} -{" "}
                          {selectedBatch.courseName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lecturer:</span>
                        <span className="font-medium text-gray-900">
                          {selectedBatch.lecturerName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-gray-900">
                          {selectedBatch.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                            selectedBatch.status
                          )}`}
                        >
                          {selectedBatch.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Handler */}
                  {transferData?.transfers && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        📍 Current Location
                      </h3>
                      {(() => {
                        const handler = getCurrentHandler(
                          transferData.transfers
                        );
                        return handler ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {handler.firstName} {handler.lastName}
                            </p>
                            <p className="text-gray-600">{handler.role}</p>
                            <p className="text-gray-600">{handler.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            No transfers recorded yet
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  {/* Transfer History */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Chain of Custody
                    </h3>
                    {transfersLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : transferData?.transfers &&
                      transferData.transfers.length > 0 ? (
                      <div className="space-y-4">
                        {transferData.transfers.map((transfer, index) => {
                          const hasDiscrepancy =
                            transfer.scriptsExpected !==
                            transfer.scriptsReceived;
                          return (
                            <div
                              key={transfer.id}
                              className="relative pl-8 pb-4"
                            >
                              {/* Timeline connector */}
                              {index < transferData.transfers.length - 1 && (
                                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-300"></div>
                              )}

                              {/* Timeline dot */}
                              <div
                                className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 ${
                                  transfer.status === "CONFIRMED" ||
                                  transfer.status === "RESOLVED"
                                    ? "bg-green-500 border-green-600"
                                    : transfer.status === "DISCREPANCY_REPORTED"
                                    ? "bg-red-500 border-red-600"
                                    : "bg-yellow-500 border-yellow-600"
                                }`}
                              ></div>

                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-sm">
                                    <p className="font-medium text-gray-900">
                                      {transfer.fromHandler.firstName}{" "}
                                      {transfer.fromHandler.lastName}
                                    </p>
                                    <p className="text-gray-600">
                                      {transfer.fromHandler.role}
                                    </p>
                                  </div>
                                  <span className="text-gray-400 mx-2">→</span>
                                  <div className="text-sm text-right">
                                    <p className="font-medium text-gray-900">
                                      {transfer.toHandler.firstName}{" "}
                                      {transfer.toHandler.lastName}
                                    </p>
                                    <p className="text-gray-600">
                                      {transfer.toHandler.role}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Scripts Expected:</span>
                                    <span className="font-medium">
                                      {transfer.scriptsExpected}
                                    </span>
                                  </div>
                                  {transfer.scriptsReceived !== null && (
                                    <div className="flex justify-between">
                                      <span>Scripts Received:</span>
                                      <span
                                        className={`font-medium ${
                                          hasDiscrepancy
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        {transfer.scriptsReceived}
                                      </span>
                                    </div>
                                  )}
                                  {transfer.location && (
                                    <div className="flex justify-between">
                                      <span>Location:</span>
                                      <span className="font-medium">
                                        {transfer.location}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Requested:</span>
                                    <span className="font-medium">
                                      {new Date(
                                        transfer.requestedAt
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  {transfer.confirmedAt && (
                                    <div className="flex justify-between">
                                      <span>Confirmed:</span>
                                      <span className="font-medium">
                                        {new Date(
                                          transfer.confirmedAt
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded ${getTransferStatusColor(
                                      transfer.status
                                    )}`}
                                  >
                                    {transfer.status.replace(/_/g, " ")}
                                  </span>
                                </div>

                                {transfer.discrepancyNote && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                    <p className="text-xs text-red-800">
                                      <span className="font-semibold">
                                        ⚠️ Discrepancy:
                                      </span>{" "}
                                      {transfer.discrepancyNote}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                        <p>No transfer history yet</p>
                        <p className="text-sm mt-1">
                          Transfers will appear here once initiated
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg font-medium">Select a batch</p>
                <p className="text-sm mt-2">
                  Click on a batch from the list to view its tracking details
                  and transfer history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
