import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Home,
  FileText,
  AlertCircle,
  User,
  Scan,
} from "lucide-react";

export function MobileLayout() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfDesktop = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        "android",
        "webos",
        "iphone",
        "ipad",
        "ipod",
        "blackberry",
        "windows phone",
      ];

      const isMobileDevice = mobileKeywords.some((keyword) =>
        userAgent.includes(keyword)
      );

      const isLargeScreen = window.innerWidth >= 768;
      const hasLimitedTouch = navigator.maxTouchPoints <= 1;

      setIsDesktop(!isMobileDevice && isLargeScreen && hasLimitedTouch);
    };

    checkIfDesktop();
    window.addEventListener("resize", checkIfDesktop);

    return () => window.removeEventListener("resize", checkIfDesktop);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset states when switching to mobile
    if (!isDesktop) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimerCompleted(false);
      setDismissed(false);
      return;
    }

    // Start timer when on desktop and not dismissed
    if (isDesktop && !dismissed) {
      timeoutRef.current = setTimeout(() => {
        setTimerCompleted(true);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isDesktop, dismissed]);

  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/mobile",
      active: location.pathname === "/mobile",
    },
    {
      id: "scanner",
      label: "Scanner",
      icon: Scan,
      path: "/mobile/scanner",
      active: location.pathname === "/mobile/scanner",
    },
    {
      id: "custody",
      label: "Custody",
      icon: FileText,
      path: "/mobile/custody",
      active: location.pathname === "/mobile/custody",
    },
    {
      id: "incidents",
      label: "Incidents",
      icon: AlertCircle,
      path: "/mobile/incidents",
      active: location.pathname === "/mobile/incidents",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/mobile/profile",
      active: location.pathname === "/mobile/profile",
    },
  ];

  const showMessage = isDesktop && timerCompleted && !dismissed;

  if (showMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Mobile Only Application</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This mobile application is designed for mobile devices only.
              Please access it from a smartphone or tablet for the best
              experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Monitor className="h-4 w-4" />
              <span>Desktop access is not supported</span>
            </div>
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => setDismissed(true)}
                className="w-full"
              >
                Continue Anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content - scrollable with padding for bottom nav */}
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>

      {/* Bottom Navigation - fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                  tab.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-1 ${
                    tab.active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    tab.active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
