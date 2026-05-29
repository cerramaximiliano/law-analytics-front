import React from "react";
import { Grid, Stack, InputLabel, DialogContent, Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import data from "data/folder.json";
import AsynchronousAutocomplete from "components/UI/AsynchronousAutocomplete";
import InputField from "components/UI/InputField";
import SelectField from "components/UI/SelectField";
import { BRAND_BLUE } from "themes/dashboardTokens";

const FirstStep = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	// Estilos brand-aware compartidos para inputs/selects de este step.
	// Border + hover + focus tintados, sin el hardcoded color #000 en placeholder.
	const fieldSx = {
		"& .MuiInputBase-root": { height: 39.91 },
		"& .MuiInputBase-input": { fontSize: 13 },
		"& input::placeholder, & textarea::placeholder": {
			color: "text.secondary",
			opacity: 0.7,
		},
		"& .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.26 : 0.16),
			transition: "border-color 0.15s ease",
		},
		"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, isDark ? 0.46 : 0.32),
		},
		"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: alpha(BRAND_BLUE, 0.55),
			borderWidth: 1,
		},
	};

	const textareaSx = {
		...fieldSx,
		"& .MuiInputBase-root": { height: "auto" },
	};

	const labelSx = {
		fontSize: "0.78rem",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.primary",
	};

	return (
		<DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
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
							Datos requeridos
						</Typography>
					</Box>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Información de la carpeta
					</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
						Cargá la carátula y el estado básico. Después podés completar más detalles.
					</Typography>
				</Stack>

				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="customer-folderName" sx={labelSx}>
								Carátula
							</InputLabel>
							<InputField
								fullWidth
								sx={fieldSx}
								id="customer-folderName"
								placeholder="Ej. González c/ Pérez s/ Daños y Perjuicios"
								name="folderName"
							/>
						</Stack>
					</Grid>

					<Grid item xs={12} sm={6}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="customer-orderStatus" sx={labelSx}>
								Parte
							</InputLabel>
							<SelectField required label="Seleccioná una parte" data={data.parte} name="orderStatus" style={{ maxHeight: "39.91px" }} />
						</Stack>
					</Grid>

					<Grid item xs={12} sm={6}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="status" sx={labelSx}>
								Estado
							</InputLabel>
							<SelectField label="Seleccioná un estado" data={data.estado} name="status" style={{ maxHeight: "39.91px" }} />
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="materia" sx={labelSx}>
								Materia
							</InputLabel>
							<AsynchronousAutocomplete placeholder="Seleccioná una materia" options={data.materia} name="materia" />
						</Stack>
					</Grid>

					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="description" sx={labelSx}>
								Descripción
							</InputLabel>
							<InputField fullWidth sx={textareaSx} id="description" multiline rows={2} placeholder="Notas, contexto o referencias internas." name="description" />
						</Stack>
					</Grid>
				</Grid>
			</Stack>
		</DialogContent>
	);
};

export default FirstStep;
