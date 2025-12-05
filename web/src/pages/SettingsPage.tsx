import { NotificationPreferences } from "@/components/NotificationPreferences";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your application preferences and notification settings.
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
