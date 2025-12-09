import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/theme-provider";
import {
  useSessions,
  useRevokeSession,
  useLogoutAllSessions,
} from "@/hooks/useSessions";
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
  User,
  Bell,
  Shield,
  Palette,
  RotateCcw,
  Save,
  Upload,
  Monitor,
  AlertTriangle,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  // Sessions data and mutations
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAllSessions();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: user?.department || "",
    bio: "",
  });

  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    loadPreferences()
  );

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = () => {
    // TODO: Implement profile save API call
    console.log("Saving profile:", profileData);
  };

  const handleNotificationToggle = (type: NotificationType) => {
    const updated = {
      ...preferences,
      [type]: !preferences[type],
    };
    setPreferences(updated);
    savePreferences(updated);
  };

  const handleNotificationReset = () => {
    const defaults = resetPreferences();
    setPreferences(defaults);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
      setSessionToRevoke(null);
    } catch (error) {
      console.error("Failed to revoke session:", error);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll.mutateAsync();
      setConfirmLogoutAll(false);
    } catch (error) {
      console.error("Failed to logout all sessions:", error);
    }
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
    <div className="container max-w-6xl sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* Horizontal Tab List */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-muted h-auto p-1">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="sessions"
            className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="flex items-center gap-2 px-3 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div>
          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.[0]}
                      {user?.name?.split(" ")?.[1]?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        handleProfileChange("name", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) =>
                        handleProfileChange("department", e.target.value)
                      }
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) =>
                        handleProfileChange("bio", e.target.value)
                      }
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>
                </div>

                <Separator />

                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Role</Label>
                      <p className="text-foreground font-medium mt-1">
                        {user?.role}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="text-foreground font-medium mt-1">
                        {user?.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Account Created
                      </Label>
                      <p className="text-foreground font-medium mt-1">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Last Updated
                      </Label>
                      <p className="text-foreground font-medium mt-1">
                        {user?.updatedAt
                          ? new Date(user.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleProfileSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      Active Sessions
                    </CardTitle>
                    <CardDescription>
                      Manage your active login sessions across all devices
                    </CardDescription>
                  </div>
                  {sessionsData?.sessions &&
                    sessionsData.sessions.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmLogoutAll(true)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout All
                      </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading sessions...</p>
                  </div>
                ) : sessionsData?.sessions &&
                  sessionsData.sessions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionsData.sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {session.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(session.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(session.expiresAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSessionToRevoke(session.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No active sessions found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which types of notifications you want to receive.
                  Changes take effect immediately.
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
                          onCheckedChange={() => handleNotificationToggle(type)}
                        />
                      </div>
                      {index < notificationTypes.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email as well
                    </p>
                  </div>
                  <Switch id="email-notifications" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleNotificationReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        Enable 2FA
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        System Theme
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Use system preference for light or dark mode
                      </p>
                    </div>
                    <Switch
                      id="system-theme"
                      checked={theme === "system"}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "system" : "light")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        Compact Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing and padding for a denser layout
                      </p>
                    </div>
                    <Switch id="compact-mode" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  {/* Theme Info */}
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Current theme:{" "}
                      </span>
                      {theme === "system"
                        ? "System (Auto)"
                        : theme === "dark"
                        ? "Dark"
                        : "Light"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Revoke Session Dialog */}
      <Dialog
        open={!!sessionToRevoke}
        onOpenChange={() => setSessionToRevoke(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this session? You will be logged
              out from that device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                sessionToRevoke && handleRevokeSession(sessionToRevoke)
              }
              disabled={revokeSession.isPending}
            >
              {revokeSession.isPending ? "Revoking..." : "Revoke Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout All Sessions Dialog */}
      <Dialog open={confirmLogoutAll} onOpenChange={setConfirmLogoutAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Logout All Sessions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to logout from all sessions? You will need
              to log in again on all devices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLogoutAll(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={logoutAll.isPending}
            >
              {logoutAll.isPending ? "Logging out..." : "Logout All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
