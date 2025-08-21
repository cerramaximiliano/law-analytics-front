import React from "react";
import { Link } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Button, Grid, Stack, Typography, Tooltip } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ProfileRadialChart from "./ProfileRadialChart";
import { useSelector } from "store";

// assets
import BackLeft from "assets/images/profile/UserProfileBackLeft";
import BackRight from "assets/images/profile/UserProfileBackRight";

// types
import { ThemeMode } from "types/config";

// ==============================|| USER PROFILE - TOP CARD ||============================== //

interface Props {
	focusInput: () => void;
}

const ProfileCard = ({ focusInput }: Props) => {
	const theme = useTheme();
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	// Obtener la información del usuario del store de Redux
	const user = useSelector((state) => state.auth.user);

	const calculateProfileCompletion = () => {
		if (!user) {
			return 0;
		}

		// Array de campos requeridos para un perfil completo
		const requiredFields = ["firstName", "lastName", "email", "dob", "contact", "designation", "address", "country", "state"] as const;

		// Contador de campos completados
		let completedFields = 0;
		const fieldStatus: Record<string, boolean> = {};

		// Verificar cada campo y registrar su estado
		for (const field of requiredFields) {
			// Verificación especial para 'dob' ya que puede ser un objeto Date o string
			if (field === "dob") {
				fieldStatus[field] = Boolean(user[field]);
			} else {
				fieldStatus[field] = Boolean(user[field] !== undefined && user[field] !== null && String(user[field]).trim() !== "");
			}

			if (fieldStatus[field]) {
				completedFields++;
			}
		}

		// Calcular porcentaje de completitud (asegurar que sea al menos 1 si hay algún campo)
		const percentage = Math.round((completedFields / requiredFields.length) * 100);

		return percentage > 0 ? percentage : user.firstName ? 10 : 0; // Dar al menos 10% si tiene nombre
	};

	// Determinar mensaje según el porcentaje de completitud
	const getProfileMessage = () => {
		if (completionPercentage < 30) {
			return "Completa tu perfil para desbloquear aplicativos";
		} else if (completionPercentage < 70) {
			return "Continúa completando tu perfil para desbloquear todas las funcionalidades";
		} else if (completionPercentage < 100) {
			return "Tu perfil está casi completo. Agrega los últimos detalles";
		} else {
			return "¡Perfil completo! Todas las funcionalidades están disponibles";
		}
	};

	let completionPercentage = 0;
	if (user?.profileCompletionScore !== undefined && typeof user.profileCompletionScore === "number") {
		completionPercentage = user.profileCompletionScore;
	} else if (user) {
		completionPercentage = calculateProfileCompletion();
	}

	return (
		<MainCard
			border={false}
			content={false}
			sx={{
				bgcolor: theme.palette.mode === ThemeMode.DARK ? "primary.700" : "primary.lighter",
				position: "relative",
			}}
		>
			<Box sx={{ position: "absolute", bottom: "-7px", left: 0, zIndex: 1 }}>
				<BackLeft />
			</Box>
			<Grid container justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 5 }}>
				<Grid item>
					<Stack direction="row" spacing={matchDownSM ? 1 : 2} alignItems="center">
						<Tooltip title={`Completitud: ${completionPercentage}%`}>
							<Box sx={{ ml: { xs: 0, sm: 1 } }}>
								<ProfileRadialChart />
							</Box>
						</Tooltip>
						<Stack spacing={0.75}>
							<Typography variant="h5">Editar tu Perfil</Typography>
							<Typography variant="body2" color="secondary">
								{getProfileMessage()}
							</Typography>
						</Stack>
					</Stack>
				</Grid>
				<Grid item sx={{ mx: matchDownSM ? 2 : 3, my: matchDownSM ? 1 : 0, mb: matchDownSM ? 2 : 0 }} xs={matchDownSM ? 12 : "auto"}>
					<Button variant="contained" fullWidth={matchDownSM} component={Link} to="/apps/profiles/user/personal" onClick={focusInput}>
						Editar Perfil
					</Button>
				</Grid>
			</Grid>
			<Box sx={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
				<BackRight />
			</Box>
		</MainCard>
	);
};

export default ProfileCard;
