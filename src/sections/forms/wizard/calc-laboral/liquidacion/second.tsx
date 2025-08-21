import React from "react";
import { Box } from "@mui/material";
import CalculationSelector from "./components/CalculationSelector";

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
		<Box sx={{ py: 2 }}>
			<CalculationSelector name={liquidacion.name} options={optionsLiquidacion} />
		</Box>
	);
}
