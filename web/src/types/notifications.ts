export type NotificationType =
  | "transfer_requested"
  | "transfer_confirmed"
  | "transfer_rejected"
  | "batch_status"
  | "attendance"
  | "info";

export interface NotificationPreferences {
  transfer_requested: boolean;
  transfer_confirmed: boolean;
  transfer_rejected: boolean;
  batch_status: boolean;
  attendance: boolean;
  info: boolean;
}

export const defaultPreferences: NotificationPreferences = {
  transfer_requested: true,
  transfer_confirmed: true,
  transfer_rejected: true,
  batch_status: true,
  attendance: true,
  info: true,
};

export const notificationLabels: Record<NotificationType, string> = {
  transfer_requested: "Transfer Requests",
  transfer_confirmed: "Transfer Confirmations",
  transfer_rejected: "Transfer Rejections",
  batch_status: "Batch Status Updates",
  attendance: "Attendance Changes",
  info: "General Information",
};

export const notificationDescriptions: Record<NotificationType, string> = {
  transfer_requested: "Notifications when new batch transfers are requested",
  transfer_confirmed: "Notifications when transfers are confirmed by receivers",
  transfer_rejected: "Notifications when transfers are rejected",
  batch_status: "Updates about exam batch creation and status changes",
  attendance: "Notifications about student attendance changes",
  info: "General system information and announcements",
};
