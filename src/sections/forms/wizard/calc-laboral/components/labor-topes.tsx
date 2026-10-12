import React from "react";
import { Grid, FormControl, FormLabel, FormControlLabel, Radio, RadioGroup, InputLabel, FormHelperText } from "@mui/material";
import NumberField from "components/UI/NumberField";
import { useField } from "formik";

interface Props {
	name: string;
	nameRemuneracion: string;
	options: { value: string; label: string }[];
}

// Criterio de tope del art. 245 LCT, excluyente:
//  - Vizzoti (CSJN 2004): la base no puede bajar del 67 % de la mejor remuneración.
//  - Torrisi (CSJN 1992): tope pleno, base = mínimo entre remuneración y tope.
// El array `topes` guarda una sola opción para mantener el formato de los cálculos guardados.
const LaborTopes: React.FC<Props> = (props) => {
	const { nameRemuneracion, name, options } = props;
	const [field, meta, helper] = useField(name);
	const { setValue } = helper;
	const [touched, error] = [meta.touched, meta.error];
	const seleccion: string = Array.isArray(field.value) && field.value.length > 0 ? field.value[0] : "";

	return (
		<Grid container spacing={3} justifyContent="center" sx={{ marginTop: "10px", marginBottom: "10px" }}>
			<Grid>
				<FormControl error={!!(touched && error)}>
					<FormLabel component="legend">Criterio del tope</FormLabel>
					<RadioGroup name={field.name} value={seleccion} onChange={(e) => setValue([e.target.value])}>
						{options.map((opt) => (
							<FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} sx={{ width: "100%" }} />
						))}
					</RadioGroup>
					{touched && error && <FormHelperText>{error}</FormHelperText>}
				</FormControl>
			</Grid>
			{seleccion && (
				<Grid item xs={12} style={{ maxWidth: "100%" }} justifyContent="center">
					<InputLabel sx={{ textAlign: { xs: "left" } }}>Remuneración tope:</InputLabel>
					<NumberField
						thousandSeparator={","}
						allowNegative={false}
						allowLeadingZeros={false}
						decimalScale={2}
						InputProps={{ startAdornment: "$" }}
						placeholder="Ingrese la remuneración tope"
						name={nameRemuneracion}
					/>
				</Grid>
			)}
		</Grid>
	);
};

export default LaborTopes;
