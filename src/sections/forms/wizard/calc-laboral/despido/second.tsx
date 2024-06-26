import { Divider, Switch, FormControlLabel, Grid, Typography } from "@mui/material";
import LaborCheckbox from "../components/labor-chebox";
import LaborTopes from "../components/labor-topes";
import LaborMultas from "../components/labor-multas";
import { useField } from "formik";

export default function SecondForm(props: any) {
	const {
		formField: { liquidacion, isLiquidacion, topes, isTopes, remuneracionTopes, isMultas, multas, multaLE, fechaFalsa, salarioFalso },
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
	];
	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Seleccione Cálculos opcionales
			</Typography>
			<Grid item xs={12}>
				<Grid>
					<FormControlLabel
						name={isLiquidacion.name}
						control={
							<Switch
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
				{fieldIsLiquidacion.value && <LaborCheckbox name={liquidacion.name} options={optionsLiquidacion} />}
				<Divider />
				<Grid>
					<FormControlLabel
						control={
							<Switch
								checked={fieldIsTopes.value}
								onChange={(e) => {
									helperTopesArray.setValue([]);
									helperIsTopes.setValue(e.target.checked);
								}}
							/>
						}
						label="Aplicación de Topes"
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsTopes.value && <LaborTopes name={topes.name} nameRemuneracion={remuneracionTopes.name} options={optionsTopes} />}
				<Divider />
				<Grid>
					<FormControlLabel
						control={
							<Switch
								checked={fieldIsMultas.value}
								onChange={(e) => {
									helperIsMultas.setValue(e.target.checked);
								}}
							/>
						}
						label="Aplicación de Multas"
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
					/>
				)}
			</Grid>
		</>
	);
}
