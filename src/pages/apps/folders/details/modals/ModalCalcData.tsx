import { Dialog, DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, Zoom, useTheme, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik, FormikValues } from "formik";
import { addCalculator } from "store/reducers/calculator";
import { dispatch, useSelector } from "store";
import { enqueueSnackbar } from "notistack";

import { ModalCalcType } from "types/calculator";

const ModalCalcData = ({ open, setOpen, handlerAddress, folderId, folderName }: ModalCalcType) => {
	const theme = useTheme();

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

	const auth = useSelector((state) => state.auth);
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
		try {
			const calculatorData = {
				type: values.type,
				user: values.user,
				userId: auth.user?._id,
				amount: Number(values.amount),
				folderId: folderId,
				date: values.date,
				description: values.description,
				...(auth.user?.groupId && { groupId: auth.user.groupId }),
			};

			const result = await dispatch(addCalculator(calculatorData));

			if (result.success) {
				enqueueSnackbar("Elemento agregado correctamente.", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});

				if (handlerAddress) {
					handlerAddress(result.calculator);
				}

				closeTaskModal();
				actions.resetForm();
			} else {
				enqueueSnackbar("Ha ocurrido un error al guardar el elemento.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			enqueueSnackbar("Error al guardar el elemento.", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	}

	function _handleSubmit(values: any, actions: any) {
		_submitForm(values, actions);
		closeTaskModal();
		actions.resetForm();
	}

	const truncatedFolderName = folderName ? (folderName.length > 15 ? `${folderName.slice(0, 15)}...` : folderName) : "";
	const folderNameLines = truncatedFolderName
		? truncatedFolderName.split(" ").reduce(
				(lines, word, index) => {
					const currentLine = lines[lines.length - 1];
					if (currentLine && currentLine.length + word.length <= 25) {
						lines[lines.length - 1] = `${currentLine} ${word}`;
					} else {
						lines.push(word);
					}
					return lines;
				},
				["", ""],
		  )
		: ["", ""];

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
						PaperProps={{
							sx: {
								width: "600px",
								maxWidth: "600px",
								p: 0,
								borderRadius: 2,
								boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
							},
						}}
						sx={{
							"& .MuiBackdrop-root": { opacity: "0.5 !important" },
						}}
					>
						<DialogTitle
							sx={{
								bgcolor: theme.palette.primary.lighter,
								p: 3,
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
									Agregar Montos de Reclamo y Ofrecimientos
								</Typography>
								<Typography color="textSecondary" variant="subtitle2">
									Carpeta: {folderNameLines}
								</Typography>
							</Stack>
						</DialogTitle>

						<Divider />

						<DialogContent
							sx={{
								p: 3,
								display: "flex",
								flexDirection: "column",
								gap: 3,
							}}
						>
							<SelectField
								required={true}
								label="Tipo"
								data={["Reclamado", "Ofertado"]}
								name="type"
								style={{
									maxHeight: "39.91px",
									"& .MuiInputBase-root": {
										height: "39.91px",
										fontSize: 12,
									},
									"& .MuiSelect-select": {
										fontSize: 12,
									},
									"& .MuiInputLabel-root": {
										fontSize: 12,
									},
								}}
							/>
							<SelectField
								required={true}
								label="Parte"
								data={["Actora", "Demandada"]}
								name="user"
								style={{
									maxHeight: "39.91px",
									"& .MuiInputBase-root": {
										height: "39.91px",
										fontSize: 12,
									},
									"& .MuiSelect-select": {
										fontSize: 12,
									},
									"& .MuiInputLabel-root": {
										fontSize: 12,
									},
								}}
							/>
							<NumberField
								thousandSeparator={","}
								allowNegative={false}
								allowLeadingZeros={false}
								sx={{
									"& .MuiInputBase-input": {
										fontSize: 12,
									},
									"& input::placeholder": {
										color: "#000000",
										opacity: 0.6,
									},
								}}
								decimalScale={2}
								fullWidth
								placeholder="00.00"
								name="amount"
								InputProps={{ startAdornment: "$" }}
							/>
							<DateInputField
								name="date"
								label="Fecha"
								customInputStyles={{
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
								}}
							/>
							<InputField
								fullWidth
								label="Descripción"
								id="description"
								multiline
								rows={2}
								placeholder="Ingrese una descripción"
								name="description"
								customInputStyles={{
									"& .MuiInputBase-input": {
										fontSize: 12,
									},
									"& textarea::placeholder": {
										color: "#000000",
										opacity: 0.6,
									},
								}}
							/>
						</DialogContent>

						<Divider />

						<DialogActions
							sx={{
								p: 2.5,
								bgcolor: theme.palette.background.default,
								borderTop: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Button
								color="inherit"
								onClick={handleClose}
								sx={{
									color: theme.palette.text.secondary,
									"&:hover": {
										bgcolor: theme.palette.action.hover,
									},
								}}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								variant="contained"
								disabled={isSubmitting}
								sx={{
									minWidth: 120,
									py: 1.25,
									fontWeight: 600,
								}}
							>
								Guardar
							</Button>
						</DialogActions>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalCalcData;
