import React, { useState } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Avatar, LinearProgress } from "@mui/material";
import dayjs from "utils/dayjs-config";
import { Edit2, User, Calendar, DollarCircle, HashtagSquare, DocumentText, TickCircle } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import * as Yup from "yup";
import { useParams } from "react-router";
import { updateFolderById } from "store/reducers/folder";

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 42,
	},
	"& .MuiInputBase-input": {
		fontSize: 14,
	},
};

interface InfoCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined;
	helper?: string;
	isLoading?: boolean;
	editComponent?: React.ReactNode;
	isEditing?: boolean;
	valueColor?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, helper, isLoading, editComponent, isEditing, valueColor }) => {
	const theme = useTheme();
	const hasValue = value && value !== "-";

	if (isLoading) {
		return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />;
	}

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2.5,
				height: "100%",
				border: `1px solid ${hasValue ? theme.palette.divider : alpha(theme.palette.divider, 0.3)}`,
				borderRadius: 1.5,
				transition: "all 0.2s ease",
				position: "relative",
				bgcolor: hasValue ? "background.paper" : alpha(theme.palette.grey[50], 0.5),
				"&:hover": hasValue
					? {
							transform: "translateY(-2px)",
							boxShadow: theme.shadows[2],
							borderColor: theme.palette.primary.main,
					  }
					: {},
			}}
		>
			<Stack spacing={2}>
				<Stack direction="row" spacing={1.5} alignItems="flex-start">
					<Avatar
						sx={{
							bgcolor: hasValue ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
							width: 40,
							height: 40,
						}}
					>
						{React.cloneElement(icon as React.ReactElement, {
							size: 20,
							color: hasValue ? theme.palette.warning.main : theme.palette.grey[500],
							variant: hasValue ? "Bold" : "Linear",
						})}
					</Avatar>
					<Box flex={1}>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
							{label}
						</Typography>
						{isEditing && editComponent ? (
							<Box mt={1}>{editComponent}</Box>
						) : (
							<>
								<Typography
									variant="h6"
									sx={{
										fontWeight: hasValue ? 600 : 400,
										color: valueColor || (hasValue ? "text.primary" : "text.disabled"),
										fontSize: "1.125rem",
										mt: 0.5,
									}}
								>
									{value || "-"}
								</Typography>
								{helper && hasValue && (
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
										{helper}
									</Typography>
								)}
							</>
						)}
					</Box>
					{hasValue && !isEditing && <TickCircle size={16} variant="Bold" color={theme.palette.success.main} style={{ opacity: 0.8 }} />}
				</Stack>
			</Stack>
		</Paper>
	);
};

const FolderPreJudDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
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

	// Calculate completeness
	const totalFields = 5;
	const filledFields = [
		folder?.preFolder?.memberPreFolder,
		folder?.preFolder?.numberPreFolder,
		folder?.preFolder?.amountPreFolder,
		folder?.preFolder?.initialDatePreFolder,
		folder?.preFolder?.statusPreFolder !== "Nueva" ? folder?.preFolder?.statusPreFolder : null,
	].filter(Boolean).length;
	const completeness = (filledFields / totalFields) * 100;

	const hasData = folder?.preFolder && Object.values(folder.preFolder).some((value) => value && value !== "" && value !== "Nueva");

	// Calculate duration
	const duration =
		folder?.preFolder?.initialDatePreFolder && folder?.preFolder?.finalDatePreFolder
			? dayjs(folder.preFolder.finalDatePreFolder, "DD-MM-YYYY").diff(dayjs(folder.preFolder.initialDatePreFolder, "DD-MM-YYYY"), "days")
			: null;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={3}>
							{/* Header with Status */}
							<Paper
								elevation={0}
								sx={{
									p: 3,
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
									bgcolor: alpha(theme.palette.warning.main, 0.02),
								}}
							>
								<Grid container spacing={3} alignItems="center">
									<Grid item xs={12} md={8}>
										<Stack spacing={2}>
											<Stack direction="row" spacing={2} alignItems="center">
												<DocumentText size={24} variant="Bold" color={theme.palette.warning.main} />
												<Box flex={1}>
													<Typography variant="h5" fontWeight={600}>
														Proceso de Mediación
													</Typography>
													{hasData && (
														<Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5} mt={0.5}>
															<TickCircle size={14} variant="Bold" />
															Información registrada
														</Typography>
													)}
												</Box>
											</Stack>

											{/* Progress */}
											<Box>
												<Stack direction="row" justifyContent="space-between" mb={1}>
													<Typography variant="caption" color="text.secondary">
														Información completa
													</Typography>
													<Typography variant="caption" fontWeight={600} color="warning.main">
														{completeness.toFixed(0)}%
													</Typography>
												</Stack>
												<LinearProgress
													variant="determinate"
													value={completeness}
													sx={{
														height: 6,
														borderRadius: 3,
														bgcolor: alpha(theme.palette.warning.main, 0.1),
														"& .MuiLinearProgress-bar": {
															borderRadius: 3,
															bgcolor: theme.palette.warning.main,
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
													sx={{
														maxWidth: { md: 200 },
														bgcolor: theme.palette.warning.main,
														"&:hover": {
															bgcolor: theme.palette.warning.dark,
														},
													}}
												>
													Editar Mediación
												</Button>
											)}
											{duration !== null && (
												<Box textAlign={{ xs: "left", md: "right" }}>
													<Typography variant="caption" color="text.secondary">
														Duración del proceso
													</Typography>
													<Typography variant="h6" fontWeight={600} color="warning.main">
														{duration} días
													</Typography>
												</Box>
											)}
										</Stack>
									</Grid>
								</Grid>
							</Paper>

							{/* Main Information Grid */}
							<Grid container spacing={2.5}>
								{/* Mediador - Full Width for emphasis */}
								<Grid item xs={12}>
									<InfoCard
										icon={<User />}
										label="MEDIADOR ASIGNADO"
										value={values.preFolder.memberPreFolder}
										helper={values.preFolder.memberPreFolder ? "Profesional a cargo del proceso" : undefined}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={
											<InputField
												size="small"
												fullWidth
												placeholder="Nombre del mediador"
												name="preFolder.memberPreFolder"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>

								{/* Key Information Row */}
								<Grid item xs={12} md={4}>
									<InfoCard
										icon={<HashtagSquare />}
										label="NÚMERO DE EXPEDIENTE"
										value={values.preFolder.numberPreFolder}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={
											<InputField
												size="small"
												fullWidth
												placeholder="Ej: 12345/2024"
												name="preFolder.numberPreFolder"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<InfoCard
										icon={<Calendar />}
										label="FECHA DE INICIO"
										value={values.preFolder.initialDatePreFolder}
										helper={
											values.preFolder.initialDatePreFolder
												? dayjs(values.preFolder.initialDatePreFolder, "DD/MM/YYYY").format("dddd, D [de] MMMM [de] YYYY")
												: undefined
										}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={<DateInputField customInputStyles={customInputStyles} name="preFolder.initialDatePreFolder" />}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<InfoCard
										icon={<DollarCircle />}
										label="MONTO ACORDADO"
										value={
											values.preFolder.amountPreFolder ? `$ ${Number(values.preFolder.amountPreFolder).toLocaleString("es-AR")}` : null
										}
										valueColor={values.preFolder.amountPreFolder ? theme.palette.success.main : undefined}
										isLoading={isLoader}
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
												name="preFolder.amountPreFolder"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>

								{/* Fecha de finalización si existe */}
								{(values.preFolder.finalDatePreFolder || isEditing) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: values.preFolder.finalDatePreFolder ? alpha(theme.palette.success.main, 0.04) : "transparent",
											}}
										>
											<Stack direction="row" spacing={2} alignItems="center">
												<Avatar
													sx={{
														bgcolor: alpha(theme.palette.success.main, 0.1),
														width: 40,
														height: 40,
													}}
												>
													<Calendar size={20} color={theme.palette.success.main} variant="Bold" />
												</Avatar>
												<Box flex={1}>
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
														FECHA DE FINALIZACIÓN
													</Typography>
													{isEditing ? (
														<Box mt={1}>
															<DateInputField customInputStyles={customInputStyles} name="preFolder.finalDatePreFolder" />
														</Box>
													) : (
														<Typography variant="h6" fontWeight={600} color="success.main">
															{values.preFolder.finalDatePreFolder || "-"}
														</Typography>
													)}
												</Box>
											</Stack>
										</Paper>
									</Grid>
								)}

								{/* Observaciones */}
								{(values.preFolder.descriptionPreFolder || isEditing) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: values.preFolder.descriptionPreFolder ? "background.paper" : alpha(theme.palette.grey[100], 0.3),
											}}
										>
											<Stack spacing={1.5}>
												<Typography
													variant="subtitle2"
													sx={{
														color: "text.secondary",
														fontWeight: 600,
														display: "flex",
														alignItems: "center",
														gap: 1,
													}}
												>
													<DocumentText size={16} />
													OBSERVACIONES DEL PROCESO
												</Typography>
												{isEditing ? (
													<InputField
														name="preFolder.descriptionPreFolder"
														multiline
														rows={3}
														fullWidth
														placeholder="Notas sobre el desarrollo de la mediación..."
														sx={customInputStyles}
													/>
												) : (
													<Typography variant="body1" sx={{ whiteSpace: "pre-wrap", pl: 3 }}>
														{values.preFolder.descriptionPreFolder}
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
										bgcolor: alpha(theme.palette.warning.main, 0.02),
									}}
								>
									<Stack direction="row" spacing={2} justifyContent="flex-end">
										<Button size="large" variant="outlined" onClick={() => setIsEditing(false)} sx={{ minWidth: 120 }}>
											Cancelar
										</Button>
										<Button
											size="large"
											type="submit"
											variant="contained"
											disabled={isSubmitting}
											sx={{
												minWidth: 120,
												bgcolor: theme.palette.warning.main,
												"&:hover": {
													bgcolor: theme.palette.warning.dark,
												},
											}}
										>
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

export default FolderPreJudDataImproved;
