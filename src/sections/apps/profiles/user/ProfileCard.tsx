import React from "react";
import { Link } from "react-router-dom";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";

// project-imports
import ProfileRadialChart from "./ProfileRadialChart";
import { useSelector } from "store";

// icons
import { Edit2 } from "iconsax-react";

// types
import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| USER PROFILE - TOP CARD ||============================== //

interface Props {
	focusInput: () => void;
}

const ProfileCard = ({ focusInput }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));

	const user = useSelector((state) => state.auth.user);

	const calculateProfileCompletion = () => {
		if (!user) return 0;
		const requiredFields = ["firstName", "lastName", "email", "dob", "contact", "designation", "address", "country", "state"] as const;
		let completedFields = 0;
		for (const field of requiredFields) {
			if (field === "dob") {
				if (user[field]) completedFields++;
			} else if (user[field] !== undefined && user[field] !== null && String(user[field]).trim() !== "") {
				completedFields++;
			}
		}
		const percentage = Math.round((completedFields / requiredFields.length) * 100);
		return percentage > 0 ? percentage : user.firstName ? 10 : 0;
	};

	let completionPercentage = 0;
	if (user?.profileCompletionScore !== undefined && typeof user.profileCompletionScore === "number") {
		completionPercentage = user.profileCompletionScore;
	} else if (user) {
		completionPercentage = calculateProfileCompletion();
	}

	const getProfileMessage = () => {
		if (completionPercentage < 30) return "Completá tu perfil para desbloquear aplicativos";
		if (completionPercentage < 70) return "Continuá completando tu perfil para desbloquear todas las funcionalidades";
		if (completionPercentage < 100) return "Tu perfil está casi completo. Agregá los últimos detalles";
		return "¡Perfil completo! Todas las funcionalidades están disponibles";
	};

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				borderRadius: 2,
				p: { xs: 2, md: 2.5 },
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
			}}
		>
			{/* Radial blob */}
			<Box
				sx={{
					position: "absolute",
					top: -60,
					right: -40,
					width: 280,
					height: 280,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			{/* Dot grid */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
					backgroundSize: "22px 22px",
					maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					opacity: 0.6,
					pointerEvents: "none",
				}}
			/>

			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "stretch", sm: "center" }}
				spacing={{ xs: 1.5, sm: 2 }}
				sx={{ position: "relative" }}
			>
				<Stack direction="row" spacing={matchDownSM ? 1.5 : 2} alignItems="center" sx={{ minWidth: 0 }}>
					<Tooltip title={`Completitud: ${completionPercentage}%`}>
						<Box
							sx={{
								flexShrink: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<ProfileRadialChart />
						</Box>
					</Tooltip>
					<Stack spacing={0.25} sx={{ minWidth: 0 }}>
						<Stack direction="row" spacing={0.875} alignItems="center">
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.62rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Tu perfil
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: { xs: "1.05rem", md: "1.2rem" },
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textWrap: "balance",
							}}
						>
							Mantené tu información actualizada
						</Typography>
						<Typography
							sx={{
								fontSize: "0.82rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							{getProfileMessage()}
						</Typography>
					</Stack>
				</Stack>

				<Button
					variant="contained"
					fullWidth={matchDownSM}
					component={Link}
					to="/apps/profiles/user/personal"
					onClick={focusInput}
					startIcon={<Edit2 size={15} variant="Linear" />}
					sx={{
						flexShrink: 0,
						minWidth: { sm: 140 },
						textTransform: "none",
						bgcolor: BRAND_BLUE,
						color: "#fff",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						borderRadius: 1.25,
						boxShadow: "none",
						transition: "background-color 0.15s ease",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
					}}
				>
					Editar perfil
				</Button>
			</Stack>
		</Box>
	);
};

export default ProfileCard;
