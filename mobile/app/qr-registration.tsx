import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { router } from "expo-router";
import { apiClient } from "@/lib/api-client";
import { saveAuth } from "@/utils/storage";
import { useAuthStore } from "@/store/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert as AlertComponent } from "@/components/ui/alert";
import { Text } from "@/components/ui/typography";
import Toast from "react-native-toast-message";
import { Role } from "@/types";

interface QRData {
  type: "REGISTRATION";
  token: string;
  expiresAt: string;
}

interface RegistrationResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    department: string;
    role: Role;
    isSuperAdmin: boolean;
    isActive: boolean;
    passwordChanged: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export default function QRRegistrationScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    department: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const parsedData: QRData = JSON.parse(data);

      if (parsedData.type !== "REGISTRATION") {
        Alert.alert("Invalid QR Code", "This QR code is not for registration.");
        setScanned(false);
        return;
      }

      // Check if expired
      if (new Date() > new Date(parsedData.expiresAt)) {
        Alert.alert("Expired QR Code", "This QR code has expired.");
        setScanned(false);
        return;
      }

      setQrData(parsedData);
      setShowForm(true);
    } catch {
      Alert.alert("Invalid QR Code", "Unable to read QR code data.");
      setScanned(false);
    }
  };

  const handleRegister = async () => {
    if (!qrData) return;

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.password ||
      !formData.department
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^(\+233|0)[0-9]{9}$/.test(formData.phone)) {
      setError(
        "Please enter a valid phone number (e.g., 0241234567 or +233241234567)"
      );
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.post<RegistrationResponse>(
        "/registration/register",
        {
          qrToken: qrData.token,
          ...formData,
        }
      );

      // Save auth data
      await saveAuth(response.token, response.refreshToken, response.user);
      setUser(response.user);

      Toast.show({
        type: "success",
        text1: "Registration Successful",
        text2: `Welcome, ${response.user.name}!`,
      });

      // Navigate to app selector
      router.replace("/app-selector");
    } catch (error: any) {
      setError(error.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setQrData(null);
    setShowForm(false);
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
      department: "",
    });
    setError("");
  };

  if (hasPermission === null) {
    return (
      <AuthLayout
        title="QR Registration"
        subtitle="Requesting camera permission..."
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </AuthLayout>
    );
  }

  if (hasPermission === false) {
    return (
      <AuthLayout title="QR Registration" subtitle="Camera access required">
        <Card elevation="md">
          <View style={styles.cardContent}>
            <Text style={styles.errorText}>
              Camera permission is required to scan QR codes.
            </Text>
            <Text style={styles.instructionText}>
              Please enable camera access in your device settings and try again.
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                variant="outline"
                onPress={() => router.back()}
                style={styles.button}
              >
                <Text>Go Back</Text>
              </Button>
            </View>
          </View>
        </Card>
      </AuthLayout>
    );
  }

  if (showForm) {
    return (
      <AuthLayout title="Complete Registration" subtitle="Enter your details">
        <Card elevation="md">
          <View style={styles.cardContent}>
            {error && (
              <View style={styles.alertContainer}>
                <AlertComponent variant="destructive">{error}</AlertComponent>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, firstName: text }))
                }
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, lastName: text }))
                }
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Phone Number"
                placeholder="0241234567 or +233241234567"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Department"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, department: text }))
                }
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Password"
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, password: text }))
                }
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                variant="default"
                size="lg"
                onPress={handleRegister}
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Complete Registration</Text>
                )}
              </Button>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={resetScanner} disabled={isLoading}>
                <Text style={styles.linkText}>Scan Different QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="QR Registration"
      subtitle="Scan the registration QR code"
    >
      <Card elevation="md">
        <View style={styles.cardContent}>
          <Text style={styles.instructionText}>
            Point your camera at the registration QR code provided by your
            administrator.
          </Text>

          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              style={styles.camera}
            />
            {scanned && (
              <View style={styles.overlay}>
                <Text style={styles.scannedText}>QR Code Detected!</Text>
              </View>
            )}
          </View>

          {scanned && (
            <View style={styles.buttonContainer}>
              <Button
                variant="outline"
                onPress={resetScanner}
                style={styles.button}
              >
                <Text>Scan Again</Text>
              </Button>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 24,
  },
  instructionText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  cameraContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannedText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 16,
  },
  alertContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  button: {
    width: "100%",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    color: "#3b82f6",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
