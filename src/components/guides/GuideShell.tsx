import React, { useState, useEffect, ReactNode } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Stack,
	Step,
	Stepper,
	StepLabel,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { PopupTransition } from "components/@extended/Transitions";
import { ArrowLeft2, ArrowRight2, TickCircle } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

export interface GuideStep {
	title: string;
	content: ReactNode;
}

export interface GuideShellProps {
	open: boolean;
	onClose: () => void;
	/** Icono brand para el header (renderizado dentro de un icon-ring 32×32). */
	icon: ReactNode;
	/** Eyebrow del header. Default: "Guía". */
	eyebrow?: string;
	/** Título principal del modal. */
	title: string;
	/** Subtítulo opcional (línea descriptiva debajo del título). */
	subtitle?: string;
	steps: GuideStep[];
	maxWidth?: "sm" | "md" | "lg";
}

const GuideShell: React.FC<GuideShellProps> = ({ open, onClose, icon, eyebrow = "Guía", title, subtitle, steps, maxWidth = "md" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
	const [activeStep, setActiveStep] = useState(0);

	useEffect(() => {
		if (!open) {
			const t = setTimeout(() => setActiveStep(0), 250);
			return () => clearTimeout(t);
		}
	}, [open]);

	const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
	const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

	const isLast = activeStep === steps.length - 1;

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
		"&.Mui-disabled": {
			opacity: 0.45,
			color: "text.secondary",
		},
	};

	const soberBrandBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={fullScreen}
			maxWidth={maxWidth}
			fullWidth
			TransitionComponent={PopupTransition}
			PaperProps={{
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			{/* ─── Header brand ─── */}
			<DialogTitle
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							{eyebrow}
						</Typography>
					</Stack>
					<Typography
						sx={{
							fontSize: "1rem",
							fontWeight: 600,
							letterSpacing: "-0.015em",
							color: "text.primary",
						}}
					>
						{title}
					</Typography>
					{subtitle && (
						<Typography
							sx={{
								fontSize: "0.72rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{subtitle}
						</Typography>
					)}
				</Stack>
			</DialogTitle>

			{/* ─── Stepper + Content ─── */}
			<DialogContent sx={{ p: 0 }}>
				<Box
					sx={{
						px: { xs: 1.5, sm: 3 },
						pt: 2.5,
						pb: 1.5,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.025 : 0.015),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)}`,
					}}
				>
					<Stepper
						activeStep={activeStep}
						alternativeLabel
						sx={{
							"& .MuiStepLabel-label": {
								fontSize: "0.72rem",
								letterSpacing: "-0.005em",
								mt: 0.75,
								"&.Mui-active": { color: BRAND_BLUE, fontWeight: 600 },
								"&.Mui-completed": { color: "text.primary", fontWeight: 500 },
							},
							"& .MuiStepIcon-root": {
								color: alpha(BRAND_BLUE, isDark ? 0.2 : 0.16),
								"&.Mui-active": { color: BRAND_BLUE },
								"&.Mui-completed": { color: BRAND_BLUE },
							},
							"& .MuiStepConnector-line": {
								borderColor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12),
							},
						}}
					>
						{steps.map((step, idx) => (
							<Step key={idx}>
								<StepLabel>{step.title}</StepLabel>
							</Step>
						))}
					</Stepper>
				</Box>

				<Box
					sx={{
						p: { xs: 2, sm: 3 },
						minHeight: 400,
						maxHeight: { xs: "calc(100vh - 280px)", md: 500 },
						overflowY: "auto",
					}}
				>
					{/* Title del paso */}
					<Stack direction="row" spacing={0.625} alignItems="center" mb={1}>
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							Paso {activeStep + 1} de {steps.length}
						</Typography>
					</Stack>
					<Typography
						sx={{
							fontSize: { xs: "1.05rem", sm: "1.2rem" },
							fontWeight: 600,
							letterSpacing: "-0.015em",
							color: "text.primary",
							mb: 2,
						}}
					>
						{steps[activeStep]?.title}
					</Typography>
					<Box>{steps[activeStep]?.content}</Box>
				</Box>
			</DialogContent>

			{/* ─── Actions brand ─── */}
			<DialogActions
				sx={{
					px: 2.5,
					py: 1.5,
					borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				}}
			>
				<Button
					onClick={handleBack}
					disabled={activeStep === 0}
					startIcon={<ArrowLeft2 size={14} variant="Bulk" />}
					sx={ghostBtnSx}
				>
					Anterior
				</Button>
				<Box sx={{ flex: "1 1 auto" }} />
				<Button onClick={onClose} sx={ghostBtnSx}>
					Cerrar
				</Button>
				{isLast ? (
					<Button
						onClick={onClose}
						startIcon={<TickCircle size={14} variant="Bulk" />}
						sx={soberBrandBtnSx}
					>
						Finalizar
					</Button>
				) : (
					<Button onClick={handleNext} endIcon={<ArrowRight2 size={14} variant="Bulk" />} sx={soberBrandBtnSx}>
						Siguiente
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default GuideShell;
