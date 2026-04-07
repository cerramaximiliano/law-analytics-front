import React from "react";
import { Grid, Stack, InputLabel, Typography } from "@mui/material";
import { useFormikContext } from "formik";
import InputField from "components/UI/InputField";

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const FirstStep = () => {
	const { values } = useFormikContext<{ type: string }>();
	const isJuridica = values.type?.toLowerCase().includes("jurídica");

	return (
		<Grid container spacing={2} justifyContent="center">
			<Grid item xs={12} md={8}>
				<Grid container spacing={2}>
					{isJuridica ? (
						<>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="company" required>
										Razón Social
									</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="company"
										name="company"
										placeholder="Ingrese la razón social"
										required
									/>
								</Stack>
							</Grid>

							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="representanteLegal.nombre">
										Representante legal{" "}
										<Typography component="span" variant="caption" color="text.secondary">
											(opcional)
										</Typography>
									</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="representanteLegal.nombre"
										name="representanteLegal.nombre"
										placeholder="Nombre y apellido del representante"
									/>
								</Stack>
							</Grid>

							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="representanteLegal.dni">
										DNI del representante{" "}
										<Typography component="span" variant="caption" color="text.secondary">
											(opcional)
										</Typography>
									</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="representanteLegal.dni"
										name="representanteLegal.dni"
										placeholder="Ej: 30.123.456"
									/>
								</Stack>
							</Grid>
						</>
					) : (
						<>
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="name" required>
										Nombre
									</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="name"
										name="name"
										placeholder="Ingrese un nombre"
										required
									/>
								</Stack>
							</Grid>

							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="lastName" required>
										Apellido
									</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="lastName"
										name="lastName"
										placeholder="Ingrese un apellido"
										required
									/>
								</Stack>
							</Grid>
						</>
					)}
				</Grid>
			</Grid>
		</Grid>
	);
};

export default FirstStep;
