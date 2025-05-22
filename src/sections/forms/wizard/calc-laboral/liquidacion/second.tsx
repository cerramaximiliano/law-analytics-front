import { Grid, InputLabel, Typography } from "@mui/material";
import LaborCheckbox from "../components/labor-chebox";

export default function SecondForm(props: any) {
	const {
		formField: { liquidacion },
	} = props;

	const optionsLiquidacion = [
		{ value: "preaviso", label: "Preaviso" },
		{ value: "integracionMes", label: "Integración mes" },
		{ value: "sacProp", label: "SAC proporcional" },
		{ value: "sacPreaviso", label: "SAC s/ Preaviso" },
		{ value: "diasTrabajados", label: "Días trabajados" },
		{ value: "vacaciones", label: "Vacaciones" },
	];

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Seleccione Cálculos a incluir
			</Typography>
			<Grid item xs={12} style={{ marginTop: "35px" }}>
				<Grid>
					<LaborCheckbox name={liquidacion.name} options={optionsLiquidacion} />
				</Grid>
			</Grid>
		</>
	);
}