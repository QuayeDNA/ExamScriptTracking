import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";

export const MobileLoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending, error } = useLogin(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!identifier || !password) {
      return;
    }

    if (loginMethod === "email" && !identifier.includes("@")) {
      return;
    }

    if (loginMethod === "phone" && !/^(\+233|0)[0-9]{9}$/.test(identifier)) {
      return;
    }

    login({ identifier, password });
  };

  return (
    <>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <LogIn className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">ELMS</h1>
          <p className="text-muted-foreground">Handler Login Portal</p>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">Sign In</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Login Method Toggle */}
            <div className="flex rounded-lg border border-border mb-6 overflow-hidden bg-muted">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  loginMethod === "email"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                disabled={isPending}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  loginMethod === "phone"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                disabled={isPending}
              >
                Phone Login
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error?.error ||
                      error?.message ||
                      "Login failed. Please check your credentials."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-foreground">
                  {loginMethod === "email" ? "Email Address" : "Phone Number"}
                </Label>
                <Input
                  id="identifier"
                  type={loginMethod === "email" ? "email" : "tel"}
                  placeholder={
                    loginMethod === "email"
                      ? "you@example.com"
                      : "+233XXXXXXXXX or 0XXXXXXXXX"
                  }
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isPending}
                  autoComplete="username"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    autoComplete="current-password"
                    className="pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/mobile/qr-registration")}
                className="text-sm text-primary hover:text-primary/80 underline"
                disabled={isPending}
              >
                Register with QR Code
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use Desktop Version
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
