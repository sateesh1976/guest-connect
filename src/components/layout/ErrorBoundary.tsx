import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console; in production this could ship to an observability service.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-background p-6"
      >
        <div className="max-w-md w-full rounded-lg border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error occurred. You can try again or return home.
          </p>
          {this.state.error?.message && (
            <pre className="mb-6 max-h-32 overflow-auto rounded bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
            <Button onClick={this.handleReload}>Go home</Button>
          </div>
        </div>
      </div>
    );
  }
}
