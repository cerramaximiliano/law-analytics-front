import { useEffect, useState } from "react";
import { Grid, Typography, Box, Chip, Stack } from "@mui/material";
import MainCard from "components/MainCard";
import { styled } from "@mui/material/styles";

// Types
interface ServiceStatus {
	name: string;
	url: string;
	ip: string;
	baseUrl: string;
	status: "online" | "offline" | "checking";
	timestamp?: string;
	message?: string;
}

// Styled components
const StatusIndicator = styled(Box)<{ status: "online" | "offline" | "checking" }>(({ theme, status }) => ({
	width: 12,
	height: 12,
	borderRadius: "50%",
	backgroundColor:
		status === "online" ? theme.palette.success.main : status === "offline" ? theme.palette.error.main : theme.palette.warning.main,
	marginRight: theme.spacing(1),
	animation: status === "checking" ? "pulse 1.5s infinite" : "none",
	"@keyframes pulse": {
		"0%": {
			opacity: 1,
		},
		"50%": {
			opacity: 0.4,
		},
		"100%": {
			opacity: 1,
		},
	},
}));

const ServerStatus = () => {
	const [services, setServices] = useState<ServiceStatus[]>([
		{
			name: "API de Tasas de Interés",
			url: "https://admin.lawanalytics.app/api",
			ip: "15.229.93.121",
			baseUrl: "https://admin.lawanalytics.app",
			status: "checking",
		},
		{
			name: "API de Causas",
			url: "https://api.lawanalytics.app/api",
			ip: "98.85.31.199",
			baseUrl: "https://api.lawanalytics.app",
			status: "checking",
		},
		{
			name: "Servidor de Marketing",
			url: "https://mkt.lawanalytics.app",
			ip: "15.229.93.121",
			baseUrl: "https://mkt.lawanalytics.app",
			status: "checking",
		},
		{
			name: "Servidor Principal",
			url: "https://server.lawanalytics.app",
			ip: "15.229.93.121",
			baseUrl: "https://server.lawanalytics.app",
			status: "checking",
		},
	]);

	useEffect(() => {
		const checkServices = async () => {
			const updatedServices = await Promise.all(
				services.map(async (service) => {
					try {
						const response = await fetch(service.url);
						const data = await response.json();

						if (response.ok && (data.status === "success" || data.status === "ok")) {
							return {
								...service,
								status: "online" as const,
								timestamp: data.timestamp || new Date().toISOString(),
								message: data.message,
							};
						} else {
							return {
								...service,
								status: "offline" as const,
								timestamp: new Date().toISOString(),
							};
						}
					} catch (error) {
						return {
							...service,
							status: "offline" as const,
							timestamp: new Date().toISOString(),
						};
					}
				}),
			);

			setServices(updatedServices);
		};

		// Check immediately
		checkServices();

		// Set up interval to check every 30 seconds
		const interval = setInterval(checkServices, 30000);

		return () => clearInterval(interval);
	}, []);

	const formatTimestamp = (timestamp?: string) => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		return date.toLocaleString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<MainCard title="Estado del Servidor">
					<Stack spacing={3}>
						{services.map((service, index) => (
							<Box key={index} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
								<Box display="flex" alignItems="center" mb={1}>
									<StatusIndicator status={service.status} />
									<Typography variant="h6" sx={{ flexGrow: 1 }}>
										{service.name}
									</Typography>
									<Chip
										label={service.status === "online" ? "En línea" : service.status === "offline" ? "Fuera de línea" : "Verificando..."}
										color={service.status === "online" ? "success" : service.status === "offline" ? "error" : "warning"}
										size="small"
									/>
								</Box>
								<Box sx={{ mt: 1 }}>
									<Typography variant="body2" color="text.secondary">
										URL: {service.baseUrl}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										IP: {service.ip}
									</Typography>
									{service.timestamp && service.status === "online" && (
										<Typography variant="body2" color="text.secondary">
											Última actualización: {formatTimestamp(service.timestamp)}
										</Typography>
									)}
								</Box>
							</Box>
						))}
					</Stack>
				</MainCard>
			</Grid>
		</Grid>
	);
};

export default ServerStatus;
