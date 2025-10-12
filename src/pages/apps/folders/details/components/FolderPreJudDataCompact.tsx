import React from "react";
import { useState } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Chip } from "@mui/material";
import dayjs from "utils/dayjs-config";
// import data from "data/folder.json";
import { Edit2, User, Calendar, DollarCircle, HashtagSquare } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
// import SelectField from "components/UI/SelectField";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import * as Yup from "yup";
import { useParams } from "react-router";
import { updateFolderById } from "store/reducers/folder";

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 36,
	},
	"& .MuiInputBase-input": {
		fontSize: 13,
		py: 0.5,
	},
};

interface CompactFieldProps {
	label: string;
	value: string | number | null | undefined;
	isLoading?: boolean;
	editComponent?: React.ReactNode;
	isEditing?: boolean;
	icon?: React.ReactNode;
}

const CompactField: React.FC<CompactFieldProps> = ({ label, value, isLoading, editComponent, isEditing, icon }) => {
	if (isLoading) {
		return <Skeleton width={120} height={40} />;
	}

	return (
		<Box>
			<Stack direction="row" spacing={0.5} alignItems="center" mb={0.25}>
				{icon}
				<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
					{label}
				</Typography>
			</Stack>
			{isEditing && editComponent ? (
				<Box>{editComponent}</Box>
			) : (
				<Typography variant="body2" fontWeight={value && value !== "-" ? 500 : 400}>
					{value || "-"}
				</Typography>
			)}
		</Box>
	);
};

const FolderPreJudDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();

	const formatDate = (date: string | null | undefined) => {
		if (!date) return "";
		return dayjs(date, ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"]).format("DD/MM/YYYY");
	};

	const defaultPreFolder = {
		initialDatePreFolder: "",
		finalDatePreFolder: "",
		memberPreFolder: "",
		amountPreFolder: 0,
		numberPreFolder: "",
		statusPreFolder: "Nueva",
		descriptionPreFolder: "",
	};

	const initialValues = {
		...folder,
		preFolder: {
			initialDatePreFolder: formatDate(folder?.preFolder?.initialDatePreFolder) || defaultPreFolder.initialDatePreFolder,
			finalDatePreFolder: formatDate(folder?.preFolder?.finalDatePreFolder) || defaultPreFolder.finalDatePreFolder,
			memberPreFolder: folder?.preFolder?.memberPreFolder || defaultPreFolder.memberPreFolder,
			numberPreFolder: folder?.preFolder?.numberPreFolder || defaultPreFolder.numberPreFolder,
			amountPreFolder: folder?.preFolder?.amountPreFolder || defaultPreFolder.amountPreFolder,
			statusPreFolder: folder?.preFolder?.statusPreFolder || defaultPreFolder.statusPreFolder,
			descriptionPreFolder: folder?.preFolder?.descriptionPreFolder || defaultPreFolder.descriptionPreFolder,
		},
	};

	const [isEditing, setIsEditing] = useState(false);

	const handleEdit = () => setIsEditing(true);

	const _submitForm = async (values: any, actions: any) => {
		if (id) {
			try {
				const formattedValues = {
					...values,
					preFolder: {
						...values.preFolder,
						initialDatePreFolder: values.preFolder.initialDatePreFolder
							? dayjs(values.preFolder.initialDatePreFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: "",
						finalDatePreFolder: values.preFolder.finalDatePreFolder
							? dayjs(values.preFolder.finalDatePreFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: "",
					},
				};

				const result = await dispatch(updateFolderById(id, formattedValues));

				if (result.success) {
					enqueueSnackbar("Datos de mediación actualizados", {
						variant: "success",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
				}
			} catch (error) {
				enqueueSnackbar("Error al actualizar", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		}
		actions.setSubmitting(false);
	};

	const _handleSubmit = (values: any, actions: any) => {
		if (isEditing) {
			setIsEditing(false);
			_submitForm(values, actions);
		}
	};

	const ValidationSchema = Yup.object().shape({
		preFolder: Yup.object().shape({
			memberPreFolder: Yup.string().max(255),
			numberPreFolder: Yup.string().max(50),
			amountPreFolder: Yup.number().min(0),
			statusPreFolder: Yup.string(),
			descriptionPreFolder: Yup.string().max(500),
		}),
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Nueva":
				return "warning";
			case "En Progreso":
				return "info";
			case "Cerrada":
				return "success";
			case "Pendiente":
				return "primary";
			default:
				return "default";
		}
	};

	const hasData = folder?.preFolder && Object.values(folder.preFolder).some((value) => value && value !== "");

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Paper
							elevation={0}
							sx={{
								border: `1px solid ${theme.palette.divider}`,
								borderRadius: 1.5,
								overflow: "hidden",
							}}
						>
							{/* Compact Header */}
							<Box
								sx={{
									px: 2,
									py: 1.5,
									bgcolor: alpha(theme.palette.warning.main, 0.08),
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Stack direction="row" spacing={1.5} alignItems="center">
										<Typography variant="subtitle2" fontWeight={600}>
											Proceso de Mediación
										</Typography>
										{values.preFolder.statusPreFolder && (
											<Chip
												label={values.preFolder.statusPreFolder}
												color={getStatusColor(values.preFolder.statusPreFolder)}
												size="small"
												sx={{ height: 18, fontSize: "0.7rem" }}
											/>
										)}
										{hasData && (
											<Typography variant="caption" color="success.main" sx={{ fontSize: "0.7rem" }}>
												✓ Con datos
											</Typography>
										)}
									</Stack>
									{!isEditing && (
										<Button size="small" variant="text" onClick={handleEdit} sx={{ minWidth: "auto", px: 1 }}>
											<Edit2 size={16} />
										</Button>
									)}
								</Stack>
							</Box>

							{/* Compact Content */}
							<Box sx={{ p: 2 }}>
								<Grid container spacing={2}>
									<Grid item xs={6} md={3}>
										<CompactField
											label="MEDIADOR"
											value={values.preFolder.memberPreFolder}
											isLoading={isLoader}
											icon={<User size={12} />}
											isEditing={isEditing}
											editComponent={
												<InputField size="small" fullWidth placeholder="Nombre" name="preFolder.memberPreFolder" sx={customInputStyles} />
											}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="EXPEDIENTE"
											value={values.preFolder.numberPreFolder}
											isLoading={isLoader}
											icon={<HashtagSquare size={12} />}
											isEditing={isEditing}
											editComponent={
												<InputField size="small" fullWidth placeholder="Número" name="preFolder.numberPreFolder" sx={customInputStyles} />
											}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="INICIO"
											value={values.preFolder.initialDatePreFolder}
											isLoading={isLoader}
											icon={<Calendar size={12} />}
											isEditing={isEditing}
											editComponent={<DateInputField customInputStyles={customInputStyles} name="preFolder.initialDatePreFolder" />}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="MONTO DE RECLAMO"
											value={values.preFolder.amountPreFolder ? `$ ${values.preFolder.amountPreFolder}` : null}
											isLoading={isLoader}
											icon={<DollarCircle size={12} />}
											isEditing={isEditing}
											editComponent={
												<NumberField
													thousandSeparator={","}
													allowNegative={false}
													decimalScale={2}
													fullWidth
													placeholder="0.00"
													InputProps={{ startAdornment: "$" }}
													name="preFolder.amountPreFolder"
													sx={customInputStyles}
												/>
											}
										/>
									</Grid>

									{/* Observaciones - Solo si existe */}
									{(values.preFolder.descriptionPreFolder || isEditing) && (
										<Grid item xs={12}>
											<CompactField
												label="OBSERVACIONES"
												value={values.preFolder.descriptionPreFolder}
												isLoading={isLoader}
												isEditing={isEditing}
												editComponent={
													<InputField
														name="preFolder.descriptionPreFolder"
														multiline
														rows={2}
														fullWidth
														placeholder="Observaciones"
														sx={customInputStyles}
													/>
												}
											/>
										</Grid>
									)}
								</Grid>

								{/* Actions */}
								{isEditing && (
									<Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
										<Button size="small" variant="outlined" onClick={() => setIsEditing(false)}>
											Cancelar
										</Button>
										<Button size="small" type="submit" variant="contained" disabled={isSubmitting}>
											Guardar
										</Button>
									</Stack>
								)}
							</Box>
						</Paper>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderPreJudDataCompact;
