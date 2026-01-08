import React from "react";
// material-ui
import { Stack, Typography, Button, Box } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// project import
import MainCard from "components/MainCard";

// icons
import { Folder2, Add, Profile2User, Calculator, Calendar } from "iconsax-react";

// hooks
import { useNavigate } from "react-router-dom";

// types
import { ThemeMode } from "types/config";

// ==============================|| ONBOARDING EDUCATIONAL BLOCK ||============================== //

const OnboardingEducationalBlock = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	const handleCreateFolder = () => {
		navigate("/apps/folders/list?onboarding=true");
	};

	const features = [
		{
			icon: <Profile2User size={20} />,
			label: "Contactos",
			description: "Vincula clientes y contrapartes",
		},
		{
			icon: <Calculator size={20} />,
			label: "Calculos",
			description: "Intereses, honorarios y mas",
		},
		{
			icon: <Calendar size={20} />,
			label: "Vencimientos",
			description: "Nunca pierdas una fecha importante",
		},
	];

	return (
		<MainCard
			sx={{
				minHeight: { xs: "auto", sm: 300 },
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
			}}
		>
			<Stack spacing={{ xs: 2.5, sm: 4 }} alignItems="center" sx={{ py: { xs: 2, sm: 3 } }}>
				{/* Icono principal */}
				<Box
					sx={{
						width: { xs: 60, sm: 80 },
						height: { xs: 60, sm: 80 },
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === ThemeMode.DARK ? 0.2 : 0.1),
						color: theme.palette.primary.main,
					}}
				>
					<Folder2 size={32} variant="Bulk" />
				</Box>

				{/* Titulo y descripcion */}
				<Stack spacing={1} alignItems="center" sx={{ maxWidth: 400, textAlign: "center", px: { xs: 1, sm: 0 } }}>
					<Typography variant="h4" color="text.primary" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
						¿Que es una carpeta?
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
						Una carpeta representa un expediente, causa o cliente. Desde ahi gestionas toda la informacion relacionada.
					</Typography>
				</Stack>

				{/* Features - ocultas en mobile para no ocupar espacio */}
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={{ xs: 1, sm: 2 }}
					sx={{ width: "100%", justifyContent: "center", display: { xs: "none", sm: "flex" } }}
				>
					{features.map((feature, index) => (
						<Box
							key={index}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1.5,
								p: 1.5,
								borderRadius: 2,
								bgcolor: alpha(theme.palette.grey[500], theme.palette.mode === ThemeMode.DARK ? 0.1 : 0.05),
								minWidth: 180,
							}}
						>
							<Box
								sx={{
									color: theme.palette.primary.main,
								}}
							>
								{feature.icon}
							</Box>
							<Stack spacing={0}>
								<Typography variant="subtitle2" color="text.primary">
									{feature.label}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{feature.description}
								</Typography>
							</Stack>
						</Box>
					))}
				</Stack>

				{/* CTA */}
				<Button variant="contained" color="primary" size="large" startIcon={<Add />} onClick={handleCreateFolder} sx={{ textTransform: "none" }}>
					Crear mi primera carpeta
				</Button>
			</Stack>
		</MainCard>
	);
};

export default OnboardingEducationalBlock;
