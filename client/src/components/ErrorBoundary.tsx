import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });

    if (import.meta.env.PROD) {
      console.error("Production error details:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Произошла ошибка</CardTitle>
              </div>
              <CardDescription>
                Приложение столкнулось с непредвиденной ошибкой. Приносим извинения за неудобства.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Сообщение об ошибке:
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="p-4 bg-muted rounded-lg">
                  <summary className="text-sm font-medium cursor-pointer hover:text-primary">
                    Детали для разработчика (только в режиме разработки)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground">
                    {this.state.error?.stack}
                    {"\n\n"}
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={this.handleReload}
                  variant="default"
                  className="flex items-center gap-2"
                  data-testid="button-reload-page"
                >
                  <RefreshCw className="h-4 w-4" />
                  Перезагрузить страницу
                </Button>
                <Button
                  onClick={() => {
                    this.handleReset();
                    setTimeout(() => window.location.href = "/", 100);
                  }}
                  variant="outline"
                  data-testid="button-reset-app"
                >
                  Сбросить приложение
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Если проблема повторяется, обратитесь к администратору системы.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
