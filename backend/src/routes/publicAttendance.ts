/**
 * PUBLIC ATTENDANCE ROUTES
 * No authentication required - validates using attendance link tokens
 * For student self-service attendance portal
 */

import { Router } from "express";
import {
  lookupStudent,
  recordManual,
  recordQR,
  recordBiometric,
} from "../controllers/publicAttendanceController";

const router = Router();

/**
 * Lookup student by index number (public - validates token)
 * POST /api/public/attendance/lookup-student
 * Body: { token, indexNumber }
 */
router.post("/lookup-student", lookupStudent);

/**
 * Record attendance via manual index number entry (public)
 * POST /api/public/attendance/record-manual
 * Body: { token, indexNumber, location? }
 */
router.post("/record-manual", recordManual);

/**
 * Record attendance via QR code (public)
 * POST /api/public/attendance/record-qr
 * Body: { token, indexNumber, qrData, location? }
 */
router.post("/record-qr", recordQR);

/**
 * Record attendance via biometric (public)
 * POST /api/public/attendance/record-biometric
 * Body: { token, indexNumber, biometricHash, biometricConfidence, deviceId, location? }
 */
router.post("/record-biometric", recordBiometric);

export default router;
