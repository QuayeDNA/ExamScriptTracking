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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, RotateCcw } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which types of notifications you want to receive. Changes take
          effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {notificationTypes.map((type, index) => (
            <div key={type}>
              <div className="flex items-center justify-between space-x-4 py-3">
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={type}
                    className="text-base font-medium cursor-pointer"
                  >
                    {notificationLabels[type]}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notificationDescriptions[type]}
                  </p>
                </div>
                <Switch
                  id={type}
                  checked={preferences[type]}
                  onCheckedChange={() => handleToggle(type)}
                />
              </div>
              {index < notificationTypes.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </CardFooter>
    </Card>
  );
}
