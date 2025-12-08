import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-2xl">
            <Card className="shadow-lg border-error">
              <CardHeader className="space-y-1">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-error" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-error">
                      Something went wrong
                    </CardTitle>
                    <CardDescription>
                      An unexpected error occurred in the application
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {this.state.error && (
                  <Alert variant="destructive">
                    <AlertTitle className="font-mono text-sm">
                      {this.state.error.name}
                    </AlertTitle>
                    <AlertDescription className="font-mono text-xs mt-2 break-all">
                      {this.state.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {process.env.NODE_ENV === "development" &&
                  this.state.errorInfo && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground mb-2">
                        View stack trace
                      </summary>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-[10px] leading-tight">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}

                <p className="text-sm text-muted-foreground">
                  Please try refreshing the page or returning to the dashboard.
                  If the problem persists, contact support.
                </p>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
