import React from "react";
import { Grid, Typography, Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";
import { ArrowRight2, InfoCircle } from "iconsax-react";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface FormValues {
	judicialPower?: "nacional" | "buenosaires" | "caba";
}

const PJN_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png";
const CABA_LOGO_URL = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";

interface PowerCardProps {
	selected: boolean;
	logoSrc: string;
	logoAlt: string;
	logoBg: string;
	title: string;
	description: string;
	codeChip: string;
	onClick: () => void;
}

// Row card de poder judicial — replica el lenguaje de JurisdictionPill
// (logo + content + chip + arrow) pero a tamaño full-row.
const PowerCard = ({ selected, logoSrc, logoAlt, logoBg, title, description, codeChip, onClick }: PowerCardProps) => {
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
				display: "flex",
				alignItems: "center",
				gap: 1.5,
				p: 1.75,
				borderRadius: 1.5,
				border: `1px solid ${selected ? alpha(BRAND_BLUE, isDark ? 0.45 : 0.32) : alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
				bgcolor: selected ? alpha(BRAND_BLUE, isDark ? 0.1 : 0.05) : theme.palette.background.paper,
				transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease",
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
			{/* Logo del organismo — mantiene su bg-color de marca */}
			<Box
				sx={{
					width: 44,
					height: 44,
					borderRadius: 1,
					backgroundColor: logoBg,
					border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.06)}`,
					p: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<img src={logoSrc} alt={logoAlt} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
			</Box>

			{/* Contenido — title + description */}
			<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
				<Stack direction="row" alignItems="center" spacing={0.875} flexWrap="wrap" useFlexGap>
					<Typography
						sx={{
							fontSize: "0.9rem",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							color: "text.primary",
							lineHeight: 1.25,
						}}
					>
						{title}
					</Typography>
					{/* Code chip ("PJN", "BA", "CABA") */}
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							px: 0.625,
							py: 0.2,
							borderRadius: 0.625,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.34 : 0.2)}`,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								color: BRAND_BLUE,
								fontVariantNumeric: "tabular-nums",
								lineHeight: 1,
							}}
						>
							{codeChip}
						</Typography>
					</Box>
				</Stack>
				<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.4, textWrap: "pretty" }}>
					{description}
				</Typography>
			</Stack>

			<Box sx={{ display: "flex", alignItems: "center", color: selected ? BRAND_BLUE : "text.secondary", flexShrink: 0 }}>
				<ArrowRight2 size={18} />
			</Box>
		</Box>
	);
};

const JudicialPowerSelection = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { setFieldValue, values } = useFormikContext<FormValues>();

	const handleSelectJudicialPower = (power: "nacional" | "buenosaires" | "caba") => {
		setFieldValue("judicialPower", power);
	};

	return (
		<Stack spacing={2}>
			{/* Header de sección */}
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
						Poder judicial
					</Typography>
				</Box>
				<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
					¿De dónde traemos la causa?
				</Typography>
				<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
					Elegí el portal judicial — los datos se importan y se sincronizan automáticamente.
				</Typography>
			</Stack>

			<Grid container spacing={1.25}>
				<Grid item xs={12}>
					<PowerCard
						selected={values.judicialPower === "nacional"}
						onClick={() => handleSelectJudicialPower("nacional")}
						logoSrc={PJN_LOGO_URL}
						logoAlt="Poder Judicial de la Nación"
						logoBg="#222E43"
						title="Poder Judicial de la Nación"
						description="Causas federales y nacionales."
						codeChip="PJN"
					/>
				</Grid>
				<Grid item xs={12}>
					<PowerCard
						selected={values.judicialPower === "buenosaires"}
						onClick={() => handleSelectJudicialPower("buenosaires")}
						logoSrc={logoPJBuenosAires}
						logoAlt="Poder Judicial de Buenos Aires"
						logoBg="#f8f8f8"
						title="Poder Judicial de Buenos Aires"
						description="Fuero provincial — MEV / Mesa de entradas virtual."
						codeChip="BA"
					/>
				</Grid>
				<Grid item xs={12}>
					<PowerCard
						selected={values.judicialPower === "caba"}
						onClick={() => handleSelectJudicialPower("caba")}
						logoSrc={CABA_LOGO_URL}
						logoAlt="Poder Judicial de CABA"
						logoBg="#f8f8f8"
						title="Poder Judicial de la Ciudad"
						description="Fuero de CABA — EJE / Expediente judicial electrónico."
						codeChip="CABA"
					/>
				</Grid>
			</Grid>

			{/* Notice brand-aware — reemplaza el Alert MUI info */}
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-start",
					gap: 1,
					px: 1.5,
					py: 1.25,
					borderRadius: 1.5,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
				}}
			>
				<Box sx={{ color: BRAND_BLUE, display: "flex", mt: 0.125, flexShrink: 0 }}>
					<InfoCircle size={16} variant="Bulk" />
				</Box>
				<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
					Los datos de la causa se importan automáticamente desde el sistema seleccionado.
				</Typography>
			</Box>
		</Stack>
	);
};

export default JudicialPowerSelection;
