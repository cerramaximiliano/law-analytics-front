import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Card, Typography, Stack } from "@mui/material";
import { Warning2 } from "iconsax-react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
		errorInfo: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: null };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);

		// Llamar callback si existe
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Enviar a servicio de monitoreo (ej: Sentry)
		if (typeof window !== "undefined" && (window as any).Sentry) {
			(window as any).Sentry.captureException(error, {
				contexts: {
					react: {
						componentStack: errorInfo.componentStack,
					},
				},
			});
		}

		this.setState({ errorInfo });
	}

	private handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	public render() {
		if (this.state.hasError) {
			// Fallback personalizado si se proporciona
			if (this.props.fallback) {
				return <>{this.props.fallback}</>;
			}

			// UI de error por defecto
			return (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						minHeight: "400px",
						p: 3,
					}}
				>
					<Card sx={{ maxWidth: 500, p: 4, textAlign: "center" }}>
						<Warning2 size={64} color="#FF4444" style={{ marginBottom: 16 }} />

						<Typography variant="h4" gutterBottom>
							¡Ups! Algo salió mal
						</Typography>

						<Typography variant="body1" color="text.secondary" paragraph>
							Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
						</Typography>

						{process.env.NODE_ENV === "development" && this.state.error && (
							<Box
								sx={{
									mt: 2,
									p: 2,
									bgcolor: "grey.100",
									borderRadius: 1,
									textAlign: "left",
								}}
							>
								<Typography variant="caption" component="pre" sx={{ overflow: "auto" }}>
									{this.state.error.toString()}
									{this.state.errorInfo && this.state.errorInfo.componentStack}
								</Typography>
							</Box>
						)}

						<Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
							<Button variant="contained" onClick={() => window.location.reload()}>
								Recargar Página
							</Button>
							<Button variant="outlined" onClick={this.handleReset}>
								Intentar de Nuevo
							</Button>
						</Stack>
					</Card>
				</Box>
			);
		}

		return this.props.children;
	}
}

// Hook para error handling
export const useErrorHandler = () => {
	const [error, setError] = React.useState<Error | null>(null);

	React.useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	const resetError = () => setError(null);
	const captureError = (error: Error) => setError(error);

	return { captureError, resetError };
};

// HOC para envolver componentes con ErrorBoundary
export const withErrorBoundary = <P extends object>(Component: React.ComponentType<P>, fallback?: ReactNode) => {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary fallback={fallback}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
};

export default ErrorBoundary;
