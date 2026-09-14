import React from "react";
import {
	Box,
	Card,
	CardContent,
	Container,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
} from "@mui/material";

const EnvCheck = () => {
	// Obtener todas las variables de entorno que empiezan con VITE_
	const envVars = Object.keys(import.meta.env)
		.filter((key) => key.startsWith("VITE_"))
		.map((key) => ({
			key,
			value: import.meta.env[key],
			type: typeof import.meta.env[key],
		}));

	// Variables críticas que deberían estar definidas
	const criticalVars = ["VITE_AUTH0_GOOGLE_ID", "VITE_BASE_URL", "VITE_WS_URL", "VITE_ENVIRONMENT"];

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			<Card>
				<CardContent>
					<Typography variant="h4" gutterBottom>
						🔧 Variables de Entorno - Vite
					</Typography>

					<Box sx={{ mb: 3 }}>
						<Typography variant="h6" gutterBottom>
							Información del Build:
						</Typography>
						<Typography>
							<strong>Modo:</strong> {import.meta.env.MODE}
						</Typography>
						<Typography>
							<strong>Es Producción:</strong> {import.meta.env.PROD ? "Sí" : "No"}
						</Typography>
						<Typography>
							<strong>Es Desarrollo:</strong> {import.meta.env.DEV ? "Sí" : "No"}
						</Typography>
						<Typography>
							<strong>Base URL:</strong> {import.meta.env.BASE_URL}
						</Typography>
					</Box>

					<Typography variant="h6" gutterBottom>
						Variables de Entorno Configuradas:
					</Typography>

					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>
										<strong>Variable</strong>
									</TableCell>
									<TableCell>
										<strong>Valor</strong>
									</TableCell>
									<TableCell>
										<strong>Tipo</strong>
									</TableCell>
									<TableCell>
										<strong>Estado</strong>
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{envVars.map((env) => {
									const isCritical = criticalVars.includes(env.key);
									const isDefined = env.value !== undefined && env.value !== "";

									return (
										<TableRow key={env.key}>
											<TableCell>
												<code>{env.key}</code>
											</TableCell>
											<TableCell>{env.key.includes("KEY") || env.key.includes("SECRET") ? "***OCULTO***" : String(env.value)}</TableCell>
											<TableCell>{env.type}</TableCell>
											<TableCell>
												{isDefined ? (
													<Chip label="Definida" color="success" size="small" />
												) : (
													<Chip
														label={isCritical ? "FALTA - CRÍTICA" : "No definida"}
														color={isCritical ? "error" : "warning"}
														size="small"
													/>
												)}
											</TableCell>
										</TableRow>
									);
								})}
								{envVars.length === 0 && (
									<TableRow>
										<TableCell colSpan={4} align="center">
											<Typography color="error">No se encontraron variables de entorno VITE_</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>

					<Box sx={{ mt: 3, p: 2, bgcolor: (theme) => (theme.palette.mode === "dark" ? "grey.800" : "grey.100"), borderRadius: 1 }}>
						<Typography variant="subtitle2" gutterBottom>
							<strong>Nota:</strong>
						</Typography>
						<Typography variant="body2">• Las variables con KEY o SECRET se ocultan por seguridad</Typography>
						<Typography variant="body2">• Las variables VITE_ se incluyen en el build y son visibles en el cliente</Typography>
						<Typography variant="body2">• Para cambiar estas variables, modifica el archivo .env correspondiente y reconstruye</Typography>
					</Box>
				</CardContent>
			</Card>
		</Container>
	);
};

export default EnvCheck;
