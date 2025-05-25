import { useState } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Chip, LinearProgress } from "@mui/material";
import moment from "moment";
import data from "data/folder.json";
import { Edit2, Clock, TickCircle, Briefcase, DollarCircle, Calendar1, DocumentText } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import AsynchronousAutocomplete from "components/UI/AsynchronousAutocomplete";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import * as Yup from "yup";
import { useParams } from "react-router";
import { updateFolderById } from "store/reducers/folder";

import "moment/locale/es";
moment.locale("es");

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 42,
	},
	"& .MuiInputBase-input": {
		fontSize: 14,
	},
};

interface FieldCardProps {
	label: string;
	value: string | number | null | undefined;
	isLoading?: boolean;
	editComponent?: React.ReactNode;
	isEditing?: boolean;
	icon?: React.ReactNode;
	hasData?: boolean;
	important?: boolean;
	fullWidth?: boolean;
	helper?: string;
}

const FieldCard: React.FC<FieldCardProps> = ({
	label,
	value,
	isLoading,
	editComponent,
	isEditing,
	icon,
	hasData = true,
	important = false,
	fullWidth = false,
	helper,
}) => {
	const theme = useTheme();
	const displayValue = value || "-";
	const hasValue = value && value !== "-";

	if (isLoading) {
		return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />;
	}

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				height: "100%",
				border: `1px solid ${hasValue ? theme.palette.divider : alpha(theme.palette.divider, 0.3)}`,
				borderRadius: 1.5,
				transition: "all 0.2s ease",
				bgcolor: hasValue ? "background.paper" : alpha(theme.palette.grey[100], 0.3),
				position: "relative",
				overflow: "visible",
				"&:hover": {
					borderColor: hasValue ? theme.palette.primary.main : theme.palette.divider,
					transform: hasValue ? "translateY(-2px)" : "none",
					boxShadow: hasValue ? theme.shadows[2] : "none",
				},
			}}
		>
			{/* Status indicator */}
			{important && hasValue && (
				<Box
					sx={{
						position: "absolute",
						top: -1,
						right: -1,
						width: 8,
						height: 8,
						borderRadius: "50%",
						bgcolor: theme.palette.success.main,
						boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
					}}
				/>
			)}

			<Stack spacing={1.5}>
				{/* Header */}
				<Stack direction="row" spacing={1} alignItems="center">
					{icon && (
						<Box
							sx={{
								color: hasValue ? theme.palette.primary.main : theme.palette.text.disabled,
								display: "flex",
								alignItems: "center",
							}}
						>
							{icon}
						</Box>
					)}
					<Typography
						variant="caption"
						sx={{
							color: hasValue ? "text.secondary" : "text.disabled",
							fontWeight: 500,
							fontSize: "0.75rem",
							textTransform: "uppercase",
							letterSpacing: 0.5,
						}}
					>
						{label}
					</Typography>
					{hasValue && <TickCircle size={14} variant="Bold" color={theme.palette.success.main} style={{ marginLeft: "auto" }} />}
				</Stack>

				{/* Value */}
				{isEditing && editComponent ? (
					<Box>{editComponent}</Box>
				) : (
					<>
						<Typography
							variant="body1"
							sx={{
								fontWeight: hasValue ? 600 : 400,
								color: hasValue ? "text.primary" : "text.disabled",
								fontSize: important ? "1.125rem" : "1rem",
							}}
						>
							{displayValue}
						</Typography>
						{helper && hasValue && (
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
								{helper}
							</Typography>
						)}
					</>
				)}
			</Stack>
		</Paper>
	);
};

const FolderDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();

	const initialValues = {
		...folder,
		initialDateFolder: folder?.initialDateFolder ? moment(folder.initialDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : "",
		finalDateFolder: folder?.finalDateFolder ? moment(folder.finalDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : "",
	};
	const [isEditing, setIsEditing] = useState(false);

	const handleEdit = () => setIsEditing(true);

	const _submitForm = async (values: any, actions: any) => {
		if (id) {
			try {
				const formattedValues = {
					...values,
					initialDateFolder: values.initialDateFolder
						? moment(values.initialDateFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
						: values.initialDateFolder,
					finalDateFolder: values.finalDateFolder
						? moment(values.finalDateFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
						: values.finalDateFolder,
				};

				const result = await dispatch(updateFolderById(id, formattedValues));

				if (result.success) {
					enqueueSnackbar("Se actualizó correctamente", {
						variant: "success",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
				}
			} catch (error) {
				enqueueSnackbar("Error inesperado", {
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
		folderName: Yup.string().max(255).required("La carátula es requerida"),
		materia: Yup.string().max(255).required("La materia es requerida"),
		orderStatus: Yup.string().required("La parte es requerida"),
		status: Yup.string().required("El estado es requerido"),
		description: Yup.string().max(500),
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Nueva":
				return "success";
			case "En Proceso":
				return "primary";
			case "Finalizada":
				return "error";
			default:
				return "default";
		}
	};

	// Calculate data completeness
	const totalFields = 8;
	const filledFields = [
		folder?.folderName,
		folder?.orderStatus,
		folder?.folderFuero,
		folder?.materia,
		folder?.amount,
		folder?.initialDateFolder,
		folder?.finalDateFolder,
		folder?.situationFolder,
	].filter(Boolean).length;
	const completeness = (filledFields / totalFields) * 100;

	// Calculate duration if both dates exist
	const duration =
		folder?.initialDateFolder && folder?.finalDateFolder
			? moment(folder.finalDateFolder, "DD-MM-YYYY").diff(moment(folder.initialDateFolder, "DD-MM-YYYY"), "days")
			: null;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={3}>
							{/* Header Section with Summary */}
							<Paper
								elevation={0}
								sx={{
									p: 3,
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
									bgcolor: alpha(theme.palette.primary.main, 0.02),
								}}
							>
								<Grid container spacing={3} alignItems="center">
									<Grid item xs={12} md={8}>
										<Stack spacing={2}>
											<Stack direction="row" spacing={2} alignItems="center">
												<Briefcase size={24} variant="Bold" color={theme.palette.primary.main} />
												<Box flex={1}>
													<Typography variant="h5" fontWeight={600}>
														{isLoader ? <Skeleton width={300} /> : folder?.folderName || "Sin carátula"}
													</Typography>
													<Stack direction="row" spacing={2} alignItems="center" mt={0.5}>
														{folder?.status && (
															<Chip label={folder.status} color={getStatusColor(folder.status)} size="small" sx={{ fontWeight: 500 }} />
														)}
														{folder?.orderStatus && (
															<Typography variant="body2" color="text.secondary">
																{folder.orderStatus}
															</Typography>
														)}
														{!isLoader && folder?.updatedAt && (
															<Stack direction="row" spacing={0.5} alignItems="center">
																<Clock size={14} />
																<Typography variant="caption" color="text.secondary">
																	Actualizado {moment(folder.updatedAt).fromNow()}
																</Typography>
															</Stack>
														)}
													</Stack>
												</Box>
											</Stack>

											{/* Progress Indicator */}
											<Box>
												<Stack direction="row" justifyContent="space-between" mb={1}>
													<Typography variant="caption" color="text.secondary">
														Información completa
													</Typography>
													<Typography variant="caption" fontWeight={600} color="primary">
														{completeness.toFixed(0)}%
													</Typography>
												</Stack>
												<LinearProgress
													variant="determinate"
													value={completeness}
													sx={{
														height: 6,
														borderRadius: 3,
														bgcolor: alpha(theme.palette.primary.main, 0.1),
														"& .MuiLinearProgress-bar": {
															borderRadius: 3,
														},
													}}
												/>
											</Box>
										</Stack>
									</Grid>
									<Grid item xs={12} md={4}>
										<Stack spacing={2} alignItems={{ xs: "flex-start", md: "flex-end" }}>
											{!isEditing && (
												<Button
													variant="contained"
													onClick={handleEdit}
													startIcon={<Edit2 size={18} />}
													fullWidth
													sx={{ maxWidth: { md: 200 } }}
												>
													Editar Información
												</Button>
											)}
											{duration !== null && (
												<Box textAlign={{ xs: "left", md: "right" }}>
													<Typography variant="caption" color="text.secondary">
														Duración del proceso
													</Typography>
													<Typography variant="h6" fontWeight={600} color="primary">
														{duration} días
													</Typography>
												</Box>
											)}
										</Stack>
									</Grid>
								</Grid>
							</Paper>

							{/* Main Data Grid */}
							<Grid container spacing={2.5}>
								{/* Primary Information - Larger Cards */}
								<Grid item xs={12} md={6}>
									<FieldCard
										label="Materia"
										value={folder?.materia}
										isLoading={isLoader}
										icon={<DocumentText size={18} />}
										important
										isEditing={isEditing}
										editComponent={<AsynchronousAutocomplete size="small" options={data.materia} name="materia" sx={customInputStyles} />}
									/>
								</Grid>
								<Grid item xs={12} md={6}>
									<FieldCard
										label="Monto"
										value={folder?.amount ? `$ ${Number(folder.amount).toLocaleString("es-AR")}` : null}
										isLoading={isLoader}
										icon={<DollarCircle size={18} />}
										important
										helper={folder?.amount ? "Monto reclamado" : undefined}
										isEditing={isEditing}
										editComponent={
											<NumberField
												thousandSeparator={"."}
												decimalSeparator={","}
												allowNegative={false}
												decimalScale={2}
												fullWidth
												placeholder="0,00"
												InputProps={{ startAdornment: "$" }}
												name="amount"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>

								{/* Secondary Information */}
								<Grid item xs={12} sm={6} md={3}>
									<FieldCard
										label="Parte"
										value={folder?.orderStatus}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={
											<SelectField label="" required size="small" data={data.parte} name="orderStatus" sx={customInputStyles} />
										}
									/>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<FieldCard
										label="Fuero"
										value={folder?.folderFuero}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={<SelectField label="" size="small" name="folderFuero" data={data.fuero} sx={customInputStyles} />}
									/>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<FieldCard
										label="Fecha Inicio"
										value={folder?.initialDateFolder ? moment(folder.initialDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : null}
										isLoading={isLoader}
										icon={<Calendar1 size={16} />}
										isEditing={isEditing}
										editComponent={<DateInputField customInputStyles={customInputStyles} name="initialDateFolder" />}
									/>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<FieldCard
										label="Fecha Fin"
										value={folder?.finalDateFolder ? moment(folder.finalDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : null}
										isLoading={isLoader}
										icon={<Calendar1 size={16} />}
										isEditing={isEditing}
										editComponent={<DateInputField customInputStyles={customInputStyles} name="finalDateFolder" />}
									/>
								</Grid>

								{/* Situation - Full Width */}
								<Grid item xs={12}>
									<FieldCard
										label="Situación"
										value={folder?.situationFolder}
										isLoading={isLoader}
										fullWidth
										isEditing={isEditing}
										editComponent={
											<SelectField label="" size="small" data={data.situacion} name="situationFolder" sx={customInputStyles} />
										}
									/>
								</Grid>

								{/* Description - Full Width */}
								{(folder?.description || isEditing) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: folder?.description ? "background.paper" : alpha(theme.palette.grey[100], 0.3),
											}}
										>
											<Stack spacing={1.5}>
												<Typography
													variant="caption"
													sx={{
														color: "text.secondary",
														fontWeight: 500,
														fontSize: "0.75rem",
														textTransform: "uppercase",
														letterSpacing: 0.5,
													}}
												>
													Descripción / Observaciones
												</Typography>
												{isEditing ? (
													<InputField
														name="description"
														multiline
														rows={3}
														fullWidth
														placeholder="Ingrese una descripción o observaciones..."
														sx={customInputStyles}
													/>
												) : (
													<Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
														{folder?.description}
													</Typography>
												)}
											</Stack>
										</Paper>
									</Grid>
								)}
							</Grid>

							{/* Actions */}
							{isEditing && (
								<Paper
									elevation={0}
									sx={{
										p: 2,
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 1.5,
										bgcolor: alpha(theme.palette.primary.main, 0.02),
									}}
								>
									<Stack direction="row" spacing={2} justifyContent="flex-end">
										<Button size="large" variant="outlined" onClick={() => setIsEditing(false)} sx={{ minWidth: 120 }}>
											Cancelar
										</Button>
										<Button size="large" type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 120 }}>
											Guardar Cambios
										</Button>
									</Stack>
								</Paper>
							)}
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderDataImproved;
