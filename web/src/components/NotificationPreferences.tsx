import { useState } from "react";
import type {
  NotificationType,
  NotificationPreferences,
} from "@/types/notifications";
import {
  notificationLabels,
  notificationDescriptions,
} from "@/types/notifications";
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
} from "@/lib/notificationPreferences";

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    loadPreferences()
  );

  const handleToggle = (type: NotificationType) => {
    const updated = {
      ...preferences,
      [type]: !preferences[type],
    };
    setPreferences(updated);
    savePreferences(updated);
  };

  const handleReset = () => {
    const defaults = resetPreferences();
    setPreferences(defaults);
  };

  const notificationTypes: NotificationType[] = [
    "transfer_requested",
    "transfer_confirmed",
    "transfer_rejected",
    "batch_status",
    "attendance",
    "info",
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          Notification Preferences
        </h2>
      </div>
      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-600">
          Choose which types of notifications you want to receive. Changes take
          effect immediately.
        </p>

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div
              key={type}
              className="flex items-start justify-between space-x-4 rounded-lg border p-4"
            >
              <div className="flex-1 space-y-1">
                <label
                  htmlFor={type}
                  className="text-base font-medium cursor-pointer"
                >
                  {notificationLabels[type]}
                </label>
                <p className="text-sm text-gray-600">
                  {notificationDescriptions[type]}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id={type}
                  checked={preferences[type]}
                  onChange={() => handleToggle(type)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="inline-flex items-center gap-2">
              <span>🔄</span>
              Reset to Defaults
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
