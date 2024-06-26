import { Dialog, DialogTitle, Divider, Button, Grid, Stack, DialogContent, InputLabel, DialogActions } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import SelectField from "components/UI/SelectField";
import { Dispatch, SetStateAction } from "react";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";
import { CalcAmounts } from "../components/CalcTable";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (movement: CalcAmounts) => void;
	folderId: any;
};

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

const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const ModalCalcData = ({ open, setOpen, handlerAddress, folderId }: AddressModalType) => {
	function closeTaskModal() {
		setOpen(false);
	}

	const CustomerSchema = [
		Yup.object().shape({
			type: Yup.string().max(255).required("Campo requerido"),
			user: Yup.string().max(255).required("Campo requerido"),
			amount: Yup.string().max(255).required("Campo requerido"),
			date: Yup.string()
				.required("La fecha es requerida")
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				}),
		}),
	];

	const currentValidationSchema = CustomerSchema[0];

	const getInitialValues = (folderId: FormikValues | null) => {
		const newTask = {
			type: "",
			user: "",
			date: "",
			amount: "",
			description: "",
			folderId: folderId,
		};
		return newTask;
	};

	const initialValues = getInitialValues(folderId);

	async function _submitForm(values: any, actions: any) {
		alert(JSON.stringify(values, null, 2));
		actions.setSubmitting(false);
		if (handlerAddress) {
			handlerAddress({ ...values, time: values.date }); // Ajuste para que `time` reciba la fecha correcta
		}
	}

	function _handleSubmit(values: any, actions: any) {
		console.log("submit", values, actions);
		_submitForm(values, actions);
		closeTaskModal();
		actions.resetForm();
	}

	return (
		<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
			{({ isSubmitting, resetForm }) => {
				const handleClose = () => {
					closeTaskModal();
					resetForm();
				};

				return (
					<Dialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
					>
						<DialogTitle>Agregar Monto, Ofrecimiento, Cálculo</DialogTitle>
						<Divider />
						<Form autoComplete="off" noValidate>
							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={3} justifyContent="center">
									<Grid item xs={12} md={8}>
										<Grid container spacing={3}>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="type">Tipo</InputLabel>
													<SelectField
														required={true}
														label="Seleccione un tipo"
														data={["Calculado", "Reclamado", "Ofertado"]}
														name="type"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="user">Parte</InputLabel>
													<SelectField
														required={true}
														label="Seleccione un"
														data={["Actora", "Demandada"]}
														name="user"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="amount">Monto</InputLabel>
													<NumberField
														thousandSeparator={","}
														allowNegative={false}
														allowLeadingZeros={false}
														sx={customTextareaStyles}
														decimalScale={2}
														fullWidth
														placeholder="00.00"
														name="amount"
														InputProps={{ startAdornment: "$" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="date">Fecha</InputLabel>
													<DateInputField name="date" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="description">Descripción</InputLabel>
													<InputField
														fullWidth
														sx={customTextareaStyles}
														id="description"
														multiline
														rows={2}
														placeholder="Ingrese una descripción"
														name="description"
													/>
												</Stack>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</DialogContent>
							<Divider />
							<DialogActions sx={{ p: 2.5 }}>
								<Grid container justifyContent="right" alignItems="right">
									<Grid item>
										<Stack direction="row" spacing={2} alignItems="rigth">
											<Button color="error" onClick={handleClose}>
												Cancelar
											</Button>
											<Button type="submit" variant="contained" disabled={isSubmitting}>
												Guardar
											</Button>
										</Stack>
									</Grid>
								</Grid>
							</DialogActions>
						</Form>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalCalcData;
