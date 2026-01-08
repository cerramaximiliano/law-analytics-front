import React, { ReactElement } from "react";
// material-ui
import { Stack, Typography, Button, Box, Link } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// project import
import MainCard from "components/MainCard";

// types
import { ThemeMode } from "types/config";

export interface OnboardingCardProps {
	title: string;
	description: string;
	/** Label del CTA. Si no se provee y variant es "informative", no se muestra CTA */
	actionLabel?: string;
	/** Callback del CTA */
	onAction?: () => void;
	icon: ReactElement;
	color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
	/** Variante visual: "primary" para accion principal, "secondary" para secundarias, "informative" sin CTA */
	variant?: "primary" | "secondary" | "informative";
	/** Si es true, la card se muestra mas suave (menos prominente) */
	muted?: boolean;
}

// ==============================|| ONBOARDING CARD ||============================== //

const OnboardingCard = ({
	title,
	description,
	actionLabel,
	onAction,
	icon,
	color = "primary",
	variant = "secondary",
	muted = false,
}: OnboardingCardProps) => {
	const theme = useTheme();

	const getColorValue = () => {
		switch (color) {
			case "secondary":
				return theme.palette.secondary.main;
			case "success":
				return theme.palette.success.main;
			case "warning":
				return theme.palette.warning.main;
			case "error":
				return theme.palette.error.main;
			case "info":
				return theme.palette.info.main;
			default:
				return theme.palette.primary.main;
		}
	};

	const colorValue = getColorValue();

	// Opacidad reducida para cards muted
	const contentOpacity = muted ? 0.7 : 1;
	const iconBgOpacity = muted ? 0.08 : theme.palette.mode === ThemeMode.DARK ? 0.2 : 0.1;

	return (
		<MainCard
			sx={{
				height: "100%",
				minHeight: 180,
				display: "flex",
				flexDirection: "column",
				opacity: muted ? 0.85 : 1,
				transition: "opacity 0.2s ease",
				"&:hover": {
					opacity: 1,
				},
			}}
		>
			<Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
				<Stack spacing={1.5}>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(colorValue, iconBgOpacity),
								color: muted ? alpha(colorValue, 0.7) : colorValue,
							}}
						>
							{icon}
						</Box>
						<Typography variant="h5" color="text.primary" sx={{ opacity: contentOpacity }}>
							{title}
						</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ opacity: contentOpacity }}>
						{description}
					</Typography>
				</Stack>

				{/* CTA segun variante - informative no tiene CTA */}
				{variant === "informative" ? null : variant === "primary" ? (
					<Button
						variant="contained"
						color={color}
						onClick={onAction}
						size="small"
						sx={{
							alignSelf: "flex-start",
							textTransform: "none",
						}}
					>
						{actionLabel}
					</Button>
				) : (
					<Link
						component="button"
						variant="body2"
						onClick={onAction}
						sx={{
							alignSelf: "flex-start",
							color: muted ? "text.secondary" : colorValue,
							textDecoration: "none",
							cursor: "pointer",
							"&:hover": {
								textDecoration: "underline",
								color: colorValue,
							},
						}}
					>
						{actionLabel}
					</Link>
				)}
			</Stack>
		</MainCard>
	);
};

export default OnboardingCard;
