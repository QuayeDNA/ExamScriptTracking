import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { studentsApi } from "@/api/students";
import type { Student } from "@/types";
import { AlertCircle, Download, User, GraduationCap, Hash } from "lucide-react";

export default function StudentQRLookup() {
  const [indexNumber, setIndexNumber] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    if (!indexNumber.trim()) {
      setError("Please enter an index number");
      return;
    }

    setLoading(true);
    setError("");
    setStudent(null);

    try {
      const studentData = await studentsApi.getStudentQR(indexNumber.trim());
      setStudent(studentData);
    } catch (error: any) {
      setError(error.error || "Student not found or QR code not available");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!student) return;

    // Create a canvas with the QR code and student info
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 500;

    // Fill background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Add title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Student QR Code", canvas.width / 2, 40);

    // Add student info
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    let yPos = 80;

    ctx.fillText(`Name: ${student.firstName} ${student.lastName}`, 30, yPos);
    yPos += 25;
    ctx.fillText(`Index Number: ${student.indexNumber}`, 30, yPos);
    yPos += 25;
    if (student.program) {
      ctx.fillText(`Program: ${student.program}`, 30, yPos);
      yPos += 25;
    }
    if (student.level) {
      ctx.fillText(`Level: ${student.level}`, 30, yPos);
      yPos += 25;
    }

    // QR Code would be added here in a real implementation
    // For now, just add a placeholder
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(100, yPos + 20, 200, 200);
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("QR Code", canvas.width / 2, yPos + 120);

    // Download the image
    const link = document.createElement("a");
    link.download = `student-qr-${student.indexNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student QR Code Lookup
          </h1>
          <p className="text-gray-600">
            Enter your index number to view and download your QR code
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Lookup QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indexNumber">Index Number</Label>
              <Input
                id="indexNumber"
                placeholder="e.g., 12345678"
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLookup()}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLookup}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Searching..." : "Lookup QR Code"}
            </Button>
          </CardContent>
        </Card>

        {student && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Name:</span>
                    <span>
                      {student.firstName} {student.lastName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Index Number:</span>
                    <Badge variant="secondary">{student.indexNumber}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {student.program && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Program:</span>
                      <span>{student.program}</span>
                    </div>
                  )}

                  {student.level && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Level:</span>
                      <Badge variant="outline">Level {student.level}</Badge>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* QR Code Section */}
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Your QR Code</h3>
                <p className="text-sm text-gray-600">
                  Use this QR code for attendance scanning
                </p>

                <div className="flex justify-center">
                  <QRCodeDisplay
                    data={JSON.stringify({
                      type: "STUDENT",
                      indexNumber: student.indexNumber,
                      name: `${student.firstName} ${student.lastName}`,
                      program: student.program,
                      level: student.level,
                    })}
                    size={200}
                  />
                </div>

                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
