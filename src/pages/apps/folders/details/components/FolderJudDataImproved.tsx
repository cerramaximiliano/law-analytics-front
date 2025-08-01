import React, { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Chip, Avatar, LinearProgress } from "@mui/material";
import moment from "moment";
import data from "data/folder.json";
import { Edit2, Calendar, DollarCircle, HashtagSquare, Judge, Building, DocumentText, TickCircle, ArrowRight2 } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import GroupedAutocomplete from "components/UI/GroupedAutocomplete";
import JuzgadoAutocomplete from "components/UI/JuzgadoAutocomplete";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import * as Yup from "yup";
import { useParams } from "react-router";
import { updateFolderById } from "store/reducers/folder";
import { getJuzgadosByJurisdiction, Juzgado } from "api/juzgados";

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

interface JudicialInfoCardProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined;
	helper?: string;
	isLoading?: boolean;
	editComponent?: React.ReactNode;
	isEditing?: boolean;
	valueColor?: string;
	important?: boolean;
}

const JudicialInfoCard: React.FC<JudicialInfoCardProps> = ({
	icon,
	label,
	value,
	helper,
	isLoading,
	editComponent,
	isEditing,
	valueColor,
	important = false,
}) => {
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
							borderColor: theme.palette.info.main,
					  }
					: {},
			}}
		>
			{important && hasValue && (
				<Box
					sx={{
						position: "absolute",
						top: -1,
						right: -1,
						width: 8,
						height: 8,
						borderRadius: "50%",
						bgcolor: theme.palette.info.main,
						boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
					}}
				/>
			)}

			<Stack spacing={2}>
				<Stack direction="row" spacing={1.5} alignItems="flex-start">
					<Avatar
						sx={{
							bgcolor: hasValue ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
							width: 40,
							height: 40,
						}}
					>
						{React.cloneElement(icon as React.ReactElement, {
							size: 20,
							color: hasValue ? theme.palette.info.main : theme.palette.grey[500],
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
										fontSize: important ? "1.25rem" : "1.125rem",
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

const FolderJudDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();

	const formatDate = (date: string | null | undefined) => {
		if (!date) return "";
		return moment(date, ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"]).format("DD/MM/YYYY");
	};

	const defaultJudFolder = {
		initialDateJudFolder: "",
		finalDateJudFolder: "",
		numberJudFolder: "",
		amountJudFolder: "",
		statusJudFolder: "Inicio Demanda",
		descriptionJudFolder: "",
		courtNumber: "",
		secretaryNumber: "",
	};

	const initialValues = {
		...folder,
		folderJuris: folder?.folderJuris
			? typeof folder.folderJuris === "string"
				? { item: folder.folderJuris, label: "" }
				: folder.folderJuris
			: null,
		judFolder: {
			initialDateJudFolder: formatDate(folder?.judFolder?.initialDateJudFolder) || defaultJudFolder.initialDateJudFolder,
			finalDateJudFolder: formatDate(folder?.judFolder?.finalDateJudFolder) || defaultJudFolder.finalDateJudFolder,
			numberJudFolder: folder?.judFolder?.numberJudFolder || defaultJudFolder.numberJudFolder,
			amountJudFolder: folder?.judFolder?.amountJudFolder || defaultJudFolder.amountJudFolder,
			statusJudFolder: folder?.judFolder?.statusJudFolder || defaultJudFolder.statusJudFolder,
			descriptionJudFolder: folder?.judFolder?.descriptionJudFolder || defaultJudFolder.descriptionJudFolder,
			courtNumber: folder?.judFolder?.courtNumber || defaultJudFolder.courtNumber,
			secretaryNumber: folder?.judFolder?.secretaryNumber || defaultJudFolder.secretaryNumber,
		},
	};

	const [isEditing, setIsEditing] = useState(false);
	const [juzgadosOptions, setJuzgadosOptions] = useState<Juzgado[]>([]);
	const [loadingJuzgados, setLoadingJuzgados] = useState(false);

	const handleEdit = () => setIsEditing(true);

	useEffect(() => {
		if (folder?.folderJuris && isEditing) {
			fetchJuzgados(typeof folder.folderJuris === "string" ? folder.folderJuris : folder.folderJuris.item);
		}
	}, [folder?.folderJuris, isEditing]);

	const fetchJuzgados = async (jurisdiccion: string) => {
		if (!jurisdiccion) {
			setJuzgadosOptions([]);
			return;
		}

		setLoadingJuzgados(true);
		try {
			const juzgados = await getJuzgadosByJurisdiction(jurisdiccion);
			setJuzgadosOptions(juzgados);
		} catch (error: any) {
			console.error("Error fetching juzgados:", error);
			if (error?.response?.status !== 401) {
				enqueueSnackbar("Error al cargar juzgados", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
			setJuzgadosOptions([]);
		} finally {
			setLoadingJuzgados(false);
		}
	};

	const _submitForm = async (values: any, actions: any) => {
		if (id) {
			try {
				const formattedValues = {
					...values,
					judFolder: {
						...values.judFolder,
						initialDateJudFolder: values.judFolder.initialDateJudFolder
							? moment(values.judFolder.initialDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: "",
						finalDateJudFolder: values.judFolder.finalDateJudFolder
							? moment(values.judFolder.finalDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: "",
					},
				};

				const result = await dispatch(updateFolderById(id, formattedValues));

				if (result.success) {
					enqueueSnackbar("Datos judiciales actualizados", {
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
		juzgado: Yup.string().max(255),
		secretaria: Yup.string().max(255),
		judFolder: Yup.object().shape({
			numberJudFolder: Yup.string().max(50),
			amountJudFolder: Yup.string(),
			statusJudFolder: Yup.string(),
			descriptionJudFolder: Yup.string().max(500),
		}),
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Inicio Demanda":
				return "info";
			case "Contestación Demanda":
				return "primary";
			case "Abierto a Prueba":
				return "warning";
			case "Sentencia":
				return "success";
			case "Apelación":
				return "error";
			case "Sentencia Cámara":
				return "secondary";
			case "Recurso ante Cámara":
				return "error";
			case "Sentencia Corte":
				return "success";
			default:
				return "default";
		}
	};

	// Calculate completeness
	const totalFields = 6;
	const filledFields = [
		folder?.judFolder?.courtNumber || folder?.juzgado,
		folder?.judFolder?.secretaryNumber || folder?.secretaria,
		folder?.judFolder?.numberJudFolder,
		folder?.judFolder?.statusJudFolder !== "Inicio Demanda" ? folder?.judFolder?.statusJudFolder : null,
		folder?.judFolder?.initialDateJudFolder,
		folder?.judFolder?.amountJudFolder,
	].filter(Boolean).length;
	const completeness = (filledFields / totalFields) * 100;

	const hasData = folder?.judFolder && Object.values(folder.judFolder).some((value) => value && value !== "" && value !== "Inicio Demanda");
	const hasCourtInfo = folder?.juzgado || folder?.secretaria || folder?.judFolder?.courtNumber || folder?.judFolder?.secretaryNumber;

	// Calculate duration
	const duration =
		folder?.judFolder?.initialDateJudFolder && folder?.judFolder?.finalDateJudFolder
			? moment(folder.judFolder.finalDateJudFolder, "DD-MM-YYYY").diff(moment(folder.judFolder.initialDateJudFolder, "DD-MM-YYYY"), "days")
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
									bgcolor: alpha(theme.palette.info.main, 0.02),
								}}
							>
								<Grid container spacing={3} alignItems="center">
									<Grid item xs={12} md={8}>
										<Stack spacing={2}>
											<Stack direction="row" spacing={2} alignItems="center">
												<Judge size={24} variant="Bold" color={theme.palette.info.main} />
												<Box flex={1}>
													<Typography variant="h5" fontWeight={600}>
														Proceso Judicial
													</Typography>
													<Stack direction="row" spacing={2} alignItems="center" mt={0.5}>
														{hasData && (
															<Typography variant="caption" color="success.main" display="flex" alignItems="center" gap={0.5}>
																<TickCircle size={14} variant="Bold" />
																Información registrada
															</Typography>
														)}
														{folder?.pjn && (
															<Chip
																icon={<ArrowRight2 size={14} />}
																label="Vinculado con PJN"
																color="success"
																size="small"
																variant="outlined"
															/>
														)}
													</Stack>
												</Box>
											</Stack>

											{/* Progress */}
											<Box>
												<Stack direction="row" justifyContent="space-between" mb={1}>
													<Typography variant="caption" color="text.secondary">
														Información completa
													</Typography>
													<Typography variant="caption" fontWeight={600} color="info.main">
														{completeness.toFixed(0)}%
													</Typography>
												</Stack>
												<LinearProgress
													variant="determinate"
													value={completeness}
													sx={{
														height: 6,
														borderRadius: 3,
														bgcolor: alpha(theme.palette.info.main, 0.1),
														"& .MuiLinearProgress-bar": {
															borderRadius: 3,
															bgcolor: theme.palette.info.main,
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
														bgcolor: theme.palette.info.main,
														"&:hover": {
															bgcolor: theme.palette.info.dark,
														},
													}}
												>
													Editar Información
												</Button>
											)}
											{duration !== null && (
												<Box textAlign={{ xs: "left", md: "right" }}>
													<Typography variant="caption" color="text.secondary">
														Duración del proceso
													</Typography>
													<Typography variant="h6" fontWeight={600} color="info.main">
														{duration} días
													</Typography>
												</Box>
											)}
										</Stack>
									</Grid>
								</Grid>
							</Paper>

							{/* Court Information - Always visible */}
							<Paper
								elevation={0}
								sx={{
									p: 3,
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
									bgcolor: hasCourtInfo ? alpha(theme.palette.info.main, 0.04) : alpha(theme.palette.grey[100], 0.3),
								}}
							>
								<Stack spacing={2}>
									<Typography variant="h6" fontWeight={600} display="flex" alignItems="center" gap={1}>
										<Building size={20} color={hasCourtInfo ? theme.palette.info.main : theme.palette.text.secondary} />
										Información del Tribunal
									</Typography>
									<Grid container spacing={3}>
										<Grid item xs={12} md={6}>
											<Stack spacing={1}>
												<Typography variant="caption" color="text.secondary" fontWeight={500}>
													JURISDICCIÓN
												</Typography>
												{isEditing ? (
													<GroupedAutocomplete
														data={data.jurisdicciones}
														placeholder="Seleccione una jurisdicción"
														name="folderJuris"
														sx={customInputStyles}
														onChange={(value: any) => {
															if (value?.item) {
																fetchJuzgados(value.item);
															} else {
																setJuzgadosOptions([]);
															}
														}}
													/>
												) : (
													<Typography variant="h6" fontWeight={600} color={folder?.folderJuris ? "text.primary" : "text.disabled"}>
														{folder?.folderJuris
															? typeof folder.folderJuris === "string"
																? folder.folderJuris
																: folder.folderJuris.item
															: "No especificada"}
													</Typography>
												)}
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Stack spacing={1}>
												<Typography variant="caption" color="text.secondary" fontWeight={500}>
													JUZGADO
												</Typography>
												{isEditing ? (
													<JuzgadoAutocomplete
														options={juzgadosOptions}
														loading={loadingJuzgados}
														disabled={!values.folderJuris}
														placeholder="Buscar juzgado..."
														name="judFolder.courtNumber"
														sx={customInputStyles}
													/>
												) : (
													<Typography variant="h6" fontWeight={600} color={values.judFolder.courtNumber ? "text.primary" : "text.disabled"}>
														{values.judFolder.courtNumber || "No especificado"}
													</Typography>
												)}
											</Stack>
										</Grid>
										<Grid item xs={12} md={6}>
											<Stack spacing={1}>
												<Typography variant="caption" color="text.secondary" fontWeight={500}>
													SECRETARÍA
												</Typography>
												{isEditing ? (
													<InputField
														size="small"
														fullWidth
														placeholder="Número de Secretaría"
														name="judFolder.secretaryNumber"
														sx={customInputStyles}
													/>
												) : (
													<Typography
														variant="h6"
														fontWeight={600}
														color={values.judFolder.secretaryNumber || folder?.secretaria ? "text.primary" : "text.disabled"}
													>
														{values.judFolder.secretaryNumber || folder?.secretaria || "No especificada"}
													</Typography>
												)}
											</Stack>
										</Grid>
									</Grid>
								</Stack>
							</Paper>

							{/* Main Information Grid */}
							<Grid container spacing={2.5}>
								{/* Primary Information */}
								<Grid item xs={12} md={4}>
									<JudicialInfoCard
										icon={<HashtagSquare />}
										label="NÚMERO DE EXPEDIENTE"
										value={values.judFolder.numberJudFolder}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={
											<InputField
												size="small"
												fullWidth
												placeholder="Ej: 12345/2024"
												name="judFolder.numberJudFolder"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<JudicialInfoCard
										icon={<Calendar />}
										label="FECHA DE INICIO"
										value={values.judFolder.initialDateJudFolder}
										helper={
											values.judFolder.initialDateJudFolder
												? moment(values.judFolder.initialDateJudFolder, "DD/MM/YYYY").format("dddd, D [de] MMMM [de] YYYY")
												: undefined
										}
										isLoading={isLoader}
										isEditing={isEditing}
										editComponent={<DateInputField customInputStyles={customInputStyles} name="judFolder.initialDateJudFolder" />}
									/>
								</Grid>
								<Grid item xs={12} md={4}>
									<JudicialInfoCard
										icon={<DollarCircle />}
										label="MONTO DE SENTENCIA"
										value={
											values.judFolder.amountJudFolder ? `$ ${Number(values.judFolder.amountJudFolder).toLocaleString("es-AR")}` : null
										}
										valueColor={values.judFolder.amountJudFolder ? theme.palette.success.main : undefined}
										isLoading={isLoader}
										important
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
												name="judFolder.amountJudFolder"
												sx={customInputStyles}
											/>
										}
									/>
								</Grid>

								{/* Estado del proceso */}
								<Grid item xs={12}>
									<Paper
										elevation={0}
										sx={{
											p: 2.5,
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 1.5,
											bgcolor: "background.paper",
										}}
									>
										<Stack spacing={2}>
											<Typography variant="subtitle2" fontWeight={600}>
												Estado del Proceso
											</Typography>
											{isEditing ? (
												<SelectField
													label=""
													size="small"
													data={data.statusJudicial}
													name="judFolder.statusJudFolder"
													sx={customInputStyles}
												/>
											) : (
												<Box>
													<Chip
														label={values.judFolder.statusJudFolder}
														color={getStatusColor(values.judFolder.statusJudFolder)}
														size="medium"
														sx={{ fontWeight: 600 }}
													/>
												</Box>
											)}
										</Stack>
									</Paper>
								</Grid>

								{/* Fecha de finalización */}
								{(values.judFolder.finalDateJudFolder || isEditing) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: alpha(theme.palette.success.main, 0.04),
											}}
										>
											<Stack direction="row" spacing={2} alignItems="center">
												<Avatar
													sx={{
														bgcolor: alpha(theme.palette.success.main, 0.1),
														color: theme.palette.success.main,
														width: 44,
														height: 44,
													}}
												>
													<Calendar size={20} color={theme.palette.success.main} variant="Bold" />
												</Avatar>
												<Box flex={1}>
													<Typography variant="caption" color="text.secondary" fontWeight={500}>
														FECHA DE FINALIZACIÓN
													</Typography>
													{isEditing ? (
														<DateInputField customInputStyles={customInputStyles} name="judFolder.finalDateJudFolder" />
													) : (
														<>
															<Typography variant="h6" fontWeight={600} color="success.main">
																{values.judFolder.finalDateJudFolder || "-"}
															</Typography>
															{values.judFolder.finalDateJudFolder && (
																<Typography variant="caption" color="text.secondary">
																	{moment(values.judFolder.finalDateJudFolder, "DD/MM/YYYY").format("dddd, D [de] MMMM [de] YYYY")}
																</Typography>
															)}
														</>
													)}
												</Box>
											</Stack>
										</Paper>
									</Grid>
								)}

								{/* Additional dates if they exist */}
								{(folder?.sentencia || folder?.apelacion || folder?.fechaPago) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: alpha(theme.palette.info.main, 0.02),
											}}
										>
											<Stack spacing={2}>
												<Typography variant="subtitle2" fontWeight={600}>
													Información Adicional del Proceso
												</Typography>
												<Grid container spacing={3}>
													{folder?.sentencia && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
																<Typography variant="caption" color="text.secondary" fontWeight={500}>
																	SENTENCIA
																</Typography>
																<Typography variant="body1" fontWeight={600}>
																	{folder.sentencia}
																</Typography>
															</Stack>
														</Grid>
													)}
													{folder?.apelacion && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
																<Typography variant="caption" color="text.secondary" fontWeight={500}>
																	APELACIÓN
																</Typography>
																<Typography variant="body1" fontWeight={600} color="error.main">
																	{folder.apelacion}
																</Typography>
															</Stack>
														</Grid>
													)}
													{folder?.fechaPago && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
																<Typography variant="caption" color="text.secondary" fontWeight={500}>
																	FECHA DE PAGO
																</Typography>
																<Typography variant="body1" fontWeight={600} color="success.main">
																	{formatDate(folder.fechaPago)}
																</Typography>
															</Stack>
														</Grid>
													)}
												</Grid>
											</Stack>
										</Paper>
									</Grid>
								)}

								{/* Observaciones */}
								{(values.judFolder.descriptionJudFolder || isEditing) && (
									<Grid item xs={12}>
										<Paper
											elevation={0}
											sx={{
												p: 2.5,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 1.5,
												bgcolor: values.judFolder.descriptionJudFolder ? "background.paper" : alpha(theme.palette.grey[100], 0.3),
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
													OBSERVACIONES DEL PROCESO JUDICIAL
												</Typography>
												{isEditing ? (
													<InputField
														name="judFolder.descriptionJudFolder"
														multiline
														rows={3}
														fullWidth
														placeholder="Notas sobre el desarrollo del proceso judicial..."
														sx={customInputStyles}
													/>
												) : (
													<Typography variant="body1" sx={{ whiteSpace: "pre-wrap", pl: 3 }}>
														{values.judFolder.descriptionJudFolder}
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
										bgcolor: alpha(theme.palette.info.main, 0.02),
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
												bgcolor: theme.palette.info.main,
												"&:hover": {
													bgcolor: theme.palette.info.dark,
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

export default FolderJudDataImproved;
