import React from "react";
import { Grid, Stack, InputLabel, DialogContent, Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import data from "data/folder.json";
import GroupedAutocomplete from "components/UI/GroupedAutocomplete";
import SelectField from "components/UI/SelectField";
import DateInputField from "components/UI/DateInputField";
import { BRAND_BLUE } from "themes/dashboardTokens";

const SecondStep = ({ values }: any) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const fieldSx = {
		"& .MuiInputBase-root": { height: 39.91 },
		"& .MuiInputBase-input": { fontSize: 13 },
		"& input::placeholder": { color: "text.secondary", opacity: 0.7 },
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

	const labelSx = {
		fontSize: "0.78rem",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.primary",
	};

	const isClosed = values?.status === "Cerrada";

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
							Datos opcionales
						</Typography>
					</Box>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Jurisdicción, fechas y fuero
					</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
						Podés completar estos campos ahora o más tarde desde el detalle de la carpeta.
					</Typography>
				</Stack>

				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="folderJuris" sx={labelSx}>
								Jurisdicción
							</InputLabel>
							<GroupedAutocomplete name="folderJuris" data={data.jurisdicciones} placeholder="Seleccioná una jurisdicción" />
						</Stack>
					</Grid>

					<Grid item xs={12} sm={isClosed ? 6 : 12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="initialDateFolder" sx={labelSx}>
								Fecha de inicio
							</InputLabel>
							<DateInputField name="initialDateFolder" customInputStyles={fieldSx} />
						</Stack>
					</Grid>

					{isClosed && (
						<Grid item xs={12} sm={6}>
							<Stack spacing={0.75}>
								<InputLabel htmlFor="finalDateFolder" sx={labelSx}>
									Fecha de cierre
								</InputLabel>
								<DateInputField name="finalDateFolder" customInputStyles={fieldSx} />
							</Stack>
						</Grid>
					)}

					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<InputLabel htmlFor="folderFuero" sx={labelSx}>
								Fuero
							</InputLabel>
							<SelectField label="Seleccioná el fuero" style={{ maxHeight: "39.91px" }} name="folderFuero" data={data.fuero} />
						</Stack>
					</Grid>
				</Grid>
			</Stack>
		</DialogContent>
	);
};

export default SecondStep;
