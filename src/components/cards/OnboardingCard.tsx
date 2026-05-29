import React, { ReactElement } from "react";

// material-ui
import { Stack, Typography, Button, Box, Link } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project import
import MainCard from "components/MainCard";
import { BRAND_BLUE } from "themes/dashboardTokens";

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
	/**
	 * Prop preservada por compat con call-sites del dashboard. El componente
	 * unifica todos los acentos a BRAND_BLUE para evitar el arcoíris template;
	 * `color` queda sin uso visual.
	 */
	color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
	/** Variante visual: "primary" = card principal con button contained; "secondary" = card terciaria con link; "informative" = card sin CTA */
	variant?: "primary" | "secondary" | "informative";
	/** Si es true, la card se muestra más suave (bg y border menos saturados) */
	muted?: boolean;
}

// ==============================|| ONBOARDING CARD ||============================== //

const OnboardingCard = ({ title, description, actionLabel, onAction, icon, variant = "secondary", muted = false }: OnboardingCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;

	// Card brand-tinted con dos niveles de presencia (normal vs muted).
	const cardBg = muted ? alpha(BRAND_BLUE, isDark ? 0.04 : 0.02) : alpha(BRAND_BLUE, isDark ? 0.07 : 0.035);
	const cardBorder = muted ? alpha(BRAND_BLUE, isDark ? 0.12 : 0.07) : alpha(BRAND_BLUE, isDark ? 0.2 : 0.12);
	const cardBorderHover = alpha(BRAND_BLUE, isDark ? 0.32 : 0.22);

	return (
		<MainCard
			border={false}
			sx={{
				height: "100%",
				minHeight: 180,
				bgcolor: cardBg,
				border: `1px solid ${cardBorder}`,
				display: "flex",
				flexDirection: "column",
				transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
				"&:hover": {
					borderColor: cardBorderHover,
					boxShadow: `0 4px 14px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.08)}`,
					transform: "translateY(-1px)",
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
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							{icon}
						</Box>
						<Typography
							variant="subtitle1"
							sx={{
								color: "text.primary",
								letterSpacing: "-0.005em",
							}}
						>
							{title}
						</Typography>
					</Stack>
					<Typography
						variant="body2"
						sx={{
							color: "text.secondary",
							letterSpacing: "-0.005em",
							lineHeight: 1.5,
							textWrap: "pretty",
						}}
					>
						{description}
					</Typography>
				</Stack>

				{/* CTA según variante */}
				{variant === "informative" ? null : variant === "primary" ? (
					<Button
						variant="contained"
						onClick={onAction}
						sx={{
							alignSelf: "flex-start",
							bgcolor: BRAND_BLUE,
							color: "#fff",
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1.25,
							fontSize: { xs: "0.78rem", sm: "0.82rem" },
							px: { xs: 1.5, sm: 1.75 },
							py: { xs: 0.65, sm: 0.75 },
							whiteSpace: "nowrap",
							boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.24)}`,
							transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
							"&:hover": {
								bgcolor: alpha(BRAND_BLUE, 0.92),
								boxShadow: `0 10px 22px ${alpha(BRAND_BLUE, 0.32)}`,
								transform: "translateY(-1px)",
							},
							"&:active": { transform: "translateY(0)" },
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
							color: BRAND_BLUE,
							fontWeight: 600,
							letterSpacing: "-0.005em",
							textDecoration: "none",
							cursor: "pointer",
							border: "none",
							background: "none",
							p: 0,
							transition: "opacity 0.2s ease",
							"&:hover": {
								textDecoration: "underline",
								textUnderlineOffset: "2px",
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
