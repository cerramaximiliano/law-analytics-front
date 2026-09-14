import React from "react";
import { Switch, FormControlLabel, Grid, Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LaborTopes from "../components/labor-topes";
import LaborMultas from "../components/labor-multas";
import CalculationSelector from "./components/CalculationSelector";
import { useField } from "formik";
import { BRAND_BLUE } from "themes/dashboardTokens";

export default function SecondForm(props: any) {
	const {
		formField: {
			liquidacion,
			isLiquidacion,
			topes,
			isTopes,
			remuneracionTopes,
			isMultas,
			multas,
			multaLE,
			fechaFalsa,
			salarioFalso,
			multa245bisPorcentaje,
		},
	} = props;
	const fieldIsLiquidacion = useField(isLiquidacion.name)[0];
	const helperIsLiquidacion = useField(isLiquidacion.name)[2];
	const fieldIsTopes = useField(isTopes.name)[0];
	const helperIsTopes = useField(isTopes.name)[2];
	const helperTopesArray = useField(topes.name)[2];
	const helperLiquidacion = useField(liquidacion.name)[2];
	const fieldIsMultas = useField(isMultas.name)[0];
	const helperIsMultas = useField(isMultas.name)[2];
	const optionsLiquidacion = [
		{ value: "preaviso", label: "Preaviso" },
		{ value: "integracionMes", label: "Integración mes" },
		{ value: "sacProp", label: "SAC proporcional" },
		{ value: "sacPreaviso", label: "SAC s/ Preaviso" },
		{ value: "diasTrabajados", label: "Días trabajados" },
		{ value: "vacaciones", label: "Vacaciones" },
	];
	const optionsTopes = [
		{ value: "topeTorrisi", label: "Aplica Torrisi" },
		{ value: "topeVizzoti", label: "Aplica Vizzoti" },
	];
	const optionsMultas = [
		{ value: "multaArt1", label: "Multa Ley 25.323 art. 1" },
		{ value: "multaArt2", label: "Multa Ley 25.323 art. 2" },
		{ value: "multaArt15", label: "Art. 15 Ley 24.013" },
		{ value: "multaArt80", label: "Multa art. 80 LCT" },
		{ value: "multaArt245bis", label: "Art. 245 bis (Ley 27.742)" },
	];
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	// Hairline divider brand-tinted que reemplaza el <Divider /> MUI.
	const hairline = (
		<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), my: 1.5 }} />
	);

	// Switch styling brand: track + thumb en BRAND_BLUE cuando checked.
	const switchSx = {
		"& .MuiSwitch-switchBase.Mui-checked": {
			color: BRAND_BLUE,
			"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) },
		},
		"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
			bgcolor: BRAND_BLUE,
		},
	};

	return (
		<>
			<Grid item xs={12}>
				<Grid>
					<FormControlLabel
						name={isLiquidacion.name}
						control={
							<Switch
								sx={switchSx}
								checked={fieldIsLiquidacion.value}
								onChange={(e) => {
									helperIsLiquidacion.setValue(e.target.checked);
									helperLiquidacion.setValue([]);
								}}
							/>
						}
						label={isLiquidacion.label}
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsLiquidacion.value && (
					<Box sx={{ mt: 2 }}>
						<CalculationSelector name={liquidacion.name} options={optionsLiquidacion} />
					</Box>
				)}
				{hairline}
				<Grid>
					<FormControlLabel
						control={
							<Switch
								sx={switchSx}
								checked={fieldIsTopes.value}
								onChange={(e) => {
									helperTopesArray.setValue([]);
									helperIsTopes.setValue(e.target.checked);
								}}
							/>
						}
						label="Aplicación de topes"
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsTopes.value && <LaborTopes name={topes.name} nameRemuneracion={remuneracionTopes.name} options={optionsTopes} />}
				{hairline}
				<Grid>
					<FormControlLabel
						control={
							<Switch
								sx={switchSx}
								checked={fieldIsMultas.value}
								onChange={(e) => {
									helperIsMultas.setValue(e.target.checked);
								}}
							/>
						}
						label="Aplicación de multas"
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsMultas.value && (
					<LaborMultas
						name={multas.name}
						nameMultas={multaLE.name}
						options={optionsMultas}
						nameFechaFalsa={fechaFalsa.name}
						nameSalarioFalso={salarioFalso.name}
						nameMulta245bisPorcentaje={multa245bisPorcentaje.name}
					/>
				)}
			</Grid>
		</>
	);
}
