import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Typography, Alert, Stack } from "@mui/material";
import { Warning2, Lock, TrendUp } from "iconsax-react";

interface LimitInfo {
	resourceType: string;
	plan: string;
	limit: number;
	used: number;
}

interface FeatureInfo {
	feature: string;
	plan: string;
	availableIn: string[];
}

interface LimitErrorModalProps {
	open: boolean;
	onClose: () => void;
	message: string;
	limitInfo?: LimitInfo;
	featureInfo?: FeatureInfo;
	upgradeRequired?: boolean;
}

export const LimitErrorModal: React.FC<LimitErrorModalProps> = ({
	open,
	onClose,
	message,
	limitInfo,
	featureInfo,
	upgradeRequired = false,
}) => {
	const navigate = useNavigate();

	const handleUpgrade = () => {
		onClose();
		navigate("/plans");
	};

	const isLimitError = !!limitInfo;
	const isFeatureError = !!featureInfo;

	const getIcon = () => {
		if (upgradeRequired || isFeatureError) {
			return <Lock size={48} color="#ff9800" />;
		}
		return <Warning2 size={48} color="#d32f2f" />;
	};

	const getTitle = () => {
		if (isFeatureError) {
			return "Función no disponible";
		}
		if (isLimitError) {
			return "Límite alcanzado";
		}
		return "Restricción del plan";
	};

	const getContentMessage = () => {
		if (isLimitError && limitInfo) {
			return (
				<>
					<Typography variant="body1" gutterBottom>
						{message}
					</Typography>
					<Box sx={{ mt: 2, p: 2, bgcolor: "background.neutral", borderRadius: 1 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Detalles del límite:
						</Typography>
						<Stack spacing={1} sx={{ mt: 1 }}>
							<Typography variant="body2">
								<strong>Recurso:</strong> {limitInfo.resourceType}
							</Typography>
							<Typography variant="body2">
								<strong>Plan actual:</strong> {limitInfo.plan}
							</Typography>
							<Typography variant="body2">
								<strong>Límite:</strong> {limitInfo.limit}
							</Typography>
							<Typography variant="body2">
								<strong>Usado:</strong> {limitInfo.used}
							</Typography>
						</Stack>
					</Box>
				</>
			);
		}

		if (isFeatureError && featureInfo) {
			return (
				<>
					<Typography variant="body1" gutterBottom>
						{message}
					</Typography>
					<Box sx={{ mt: 2, p: 2, bgcolor: "background.neutral", borderRadius: 1 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Información de la función:
						</Typography>
						<Stack spacing={1} sx={{ mt: 1 }}>
							<Typography variant="body2">
								<strong>Función:</strong> {featureInfo.feature}
							</Typography>
							<Typography variant="body2">
								<strong>Tu plan:</strong> {featureInfo.plan}
							</Typography>
							{featureInfo.availableIn.length > 0 && (
								<Typography variant="body2">
									<strong>Disponible en:</strong> {featureInfo.availableIn.join(", ")}
								</Typography>
							)}
						</Stack>
					</Box>
				</>
			);
		}

		return <Typography variant="body1">{message}</Typography>;
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="limit-error-dialog-title">
			<DialogTitle id="limit-error-dialog-title">
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					{getIcon()}
					<Typography variant="h6">{getTitle()}</Typography>
				</Box>
			</DialogTitle>
			<DialogContent>
				<Box sx={{ mt: 2 }}>
					{getContentMessage()}

					{upgradeRequired && (
						<Alert severity="info" sx={{ mt: 3 }} icon={<TrendUp />}>
							Para acceder a esta función necesitas actualizar tu plan.
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions sx={{ p: 3 }}>
				<Button onClick={onClose} color="inherit">
					Cerrar
				</Button>
				<Button onClick={handleUpgrade} variant="contained" color="primary" startIcon={<TrendUp size={18} />}>
					Ver planes disponibles
				</Button>
			</DialogActions>
		</Dialog>
	);
};
