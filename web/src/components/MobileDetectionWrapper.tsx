import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";

export function MobileDetectionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
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

      // Check user agent
      const isMobileDevice = mobileKeywords.some((keyword) =>
        userAgent.includes(keyword)
      );

      // Check screen width (mobile breakpoint)
      const isSmallScreen = window.innerWidth < 768;

      // Check touch capability
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || (isSmallScreen && hasTouch));
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isMobile) {
      // Show message after a brief delay to avoid flash on desktop
      timeoutRef.current = setTimeout(() => {
        setShowMessage(true);
        timeoutRef.current = null;
      }, 500);
    }
    // Note: Hiding is handled by useLayoutEffect below

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isMobile]);

  // Handle immediate hiding when not mobile
  useLayoutEffect(() => {
    if (!isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowMessage(false);
    }
  }, [isMobile]);

  if (showMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Desktop Only Application</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This application is designed for desktop use only. Please access
              it from a desktop or laptop computer for the best experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Mobile access is not supported</span>
            </div>
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMessage(false)}
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

  return <>{children}</>;
}
