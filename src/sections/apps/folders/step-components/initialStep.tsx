import React from "react";
import { Grid, Stack, DialogContent, Typography, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DocumentDownload, DocumentText1 } from "iconsax-react";
import { useFormikContext } from "formik";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface FormValues {
	entryMethod: "manual" | "automatic";
}

// Card de selección — replica el lenguaje brand: border tintado cuando
// seleccionada, ícono en círculo brand, copy sentence case.
interface MethodCardProps {
	selected: boolean;
	icon: React.ReactNode;
	title: string;
	description: string;
	onClick: () => void;
}

const MethodCard = ({ selected, icon, title, description, onClick }: MethodCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return (
		<Box
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick();
				}
			}}
			sx={{
				cursor: "pointer",
				height: "100%",
				position: "relative",
				overflow: "hidden",
				borderRadius: 1.5,
				border: `1px solid ${selected ? alpha(BRAND_BLUE, isDark ? 0.45 : 0.32) : alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
				bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.1 : 0.05) : theme.palette.background.paper,
				transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease",
				p: 2.5,
				"&:hover": {
					borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28),
					bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.07) : alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
				},
				"&:active": { transform: "scale(0.99)" },
				"&:focus-visible": {
					outline: `2px solid ${alpha(BRAND_BLUE, 0.5)}`,
					outlineOffset: 2,
				},
			}}
		>
			<Stack spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
				<Box
					sx={{
						width: 56,
						height: 56,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1),
						color: BRAND_BLUE,
						transition: "background-color 0.15s ease",
					}}
				>
					{icon}
				</Box>
				<Typography
					sx={{
						fontSize: "1rem",
						fontWeight: 600,
						letterSpacing: "-0.01em",
						color: "text.primary",
						textAlign: "center",
					}}
				>
					{title}
				</Typography>
				<Typography
					sx={{
						fontSize: "0.82rem",
						color: "text.secondary",
						lineHeight: 1.5,
						textAlign: "center",
						textWrap: "pretty",
					}}
				>
					{description}
				</Typography>
			</Stack>
		</Box>
	);
};

const InitialStep = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { setFieldValue, values } = useFormikContext<FormValues>();

	const handleSelectEntryMethod = (method: "manual" | "automatic") => {
		setFieldValue("entryMethod", method);
	};

	return (
		<DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
			<Stack spacing={2}>
				{/* Header de sección con eyebrow */}
				<Stack spacing={0.5}>
					<Box
						sx={{
							display: "inline-flex",
							alignSelf: "flex-start",
							alignItems: "center",
							px: 1,
							py: 0.3,
							borderRadius: 0.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.62rem",
								fontWeight: 600,
								letterSpacing: "0.14em",
								textTransform: "uppercase",
								color: BRAND_BLUE,
								lineHeight: 1,
							}}
						>
							Método de ingreso
						</Typography>
					</Box>
					<Typography
						sx={{
							fontSize: "1rem",
							fontWeight: 600,
							letterSpacing: "-0.015em",
							color: "text.primary",
						}}
					>
						¿Cómo querés cargar la carpeta?
					</Typography>
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
						Importá automáticamente desde el portal judicial o cargá los datos a mano.
					</Typography>
				</Stack>

				<Grid container spacing={2} sx={{ pt: 0.5 }}>
					<Grid item xs={12} sm={6}>
						<MethodCard
							selected={values.entryMethod === "manual"}
							onClick={() => handleSelectEntryMethod("manual")}
							icon={<DocumentText1 size={28} variant="Bulk" />}
							title="Ingreso manual"
							description="Cargá vos los datos de la causa. Útil cuando no está en los portales o querés ajustar todo."
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<MethodCard
							selected={values.entryMethod === "automatic"}
							onClick={() => handleSelectEntryMethod("automatic")}
							icon={<DocumentDownload size={28} variant="Bulk" />}
							title="Ingreso automático"
							description="Importá la causa desde PJN, MEV (Buenos Aires) o EJE (CABA). Más rápido y se sincroniza."
						/>
					</Grid>
				</Grid>
			</Stack>
		</DialogContent>
	);
};

export default InitialStep;
