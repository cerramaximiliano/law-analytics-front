import React from "react";
import { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Chip } from "@mui/material";
import dayjs from "utils/dayjs-config";
import data from "data/folder.json";
import { Edit2, Calendar, DollarCircle, HashtagSquare, Judge as JudgeIcon } from "iconsax-react";
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

const FolderJudDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();

	const formatDate = (date: string | null | undefined) => {
		if (!date) return "";
		return dayjs(date, ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"]).format("DD/MM/YYYY");
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
		juzgado: folder?.juzgado || null,
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
			// Don't redirect on error, just show empty options
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
							? dayjs(values.judFolder.initialDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: "",
						finalDateJudFolder: values.judFolder.finalDateJudFolder
							? dayjs(values.judFolder.finalDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
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

	const hasData = folder?.judFolder && Object.values(folder.judFolder).some((value) => value && value !== "");
	const hasCourtInfo = folder?.juzgado || folder?.secretaria || folder?.judFolder?.courtNumber || folder?.judFolder?.secretaryNumber;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2}>
							{/* Court Info - Only if exists */}
							{(hasCourtInfo || isEditing) && (
								<Paper
									elevation={0}
									sx={{
										px: 2,
										py: 1.5,
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 1.5,
										bgcolor: alpha(theme.palette.info.main, 0.04),
									}}
								>
									<Grid container spacing={2}>
										<Grid item xs={6}>
											<Stack direction="row" spacing={0.5} alignItems="center" mb={isEditing ? 0.5 : 0}>
												<JudgeIcon size={14} />
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
													JUZGADO
												</Typography>
											</Stack>
											{isEditing ? (
												<InputField
													size="small"
													fullWidth
													placeholder="Número de Juzgado"
													name="judFolder.courtNumber"
													sx={customInputStyles}
												/>
											) : (
												<Typography variant="body2" fontWeight={500}>
													{values.judFolder.courtNumber || folder?.juzgado || "-"}
												</Typography>
											)}
										</Grid>
										<Grid item xs={6}>
											<Stack direction="row" spacing={0.5} alignItems="center" mb={isEditing ? 0.5 : 0}>
												<JudgeIcon size={14} />
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
													SECRETARÍA
												</Typography>
											</Stack>
											{isEditing ? (
												<InputField
													size="small"
													fullWidth
													placeholder="Número de Secretaría"
													name="judFolder.secretaryNumber"
													sx={customInputStyles}
												/>
											) : (
												<Typography variant="body2" fontWeight={500}>
													{values.judFolder.secretaryNumber || folder?.secretaria || "-"}
												</Typography>
											)}
										</Grid>
									</Grid>
								</Paper>
							)}

							{/* Main Judicial Data */}
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
										bgcolor: alpha(theme.palette.info.main, 0.08),
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Stack direction="row" spacing={1.5} alignItems="center">
											<Typography variant="subtitle2" fontWeight={600}>
												Proceso Judicial
											</Typography>
											{values.judFolder.statusJudFolder && (
												<Chip
													label={values.judFolder.statusJudFolder}
													color={getStatusColor(values.judFolder.statusJudFolder)}
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
										{/* Jurisdiction and Juzgado */}
										<Grid item xs={6} md={3}>
											<CompactField
												label="JURISDICCIÓN"
												value={
													folder?.folderJuris
														? typeof folder.folderJuris === "string"
															? folder.folderJuris
															: folder.folderJuris.item
														: null
												}
												isLoading={isLoader}
												isEditing={isEditing}
												editComponent={
													<GroupedAutocomplete
														data={data.jurisdicciones}
														placeholder="Jurisdicción"
														name="folderJuris"
														size="small"
														sx={customInputStyles}
														onChange={(value: any) => {
															if (value?.item) {
																fetchJuzgados(value.item);
															} else {
																setJuzgadosOptions([]);
															}
														}}
													/>
												}
											/>
										</Grid>
										<Grid item xs={6} md={3}>
											<CompactField
												label="JUZGADO"
												value={folder?.judFolder?.courtNumber}
												isLoading={isLoader}
												isEditing={isEditing}
												editComponent={
													<JuzgadoAutocomplete
														options={juzgadosOptions}
														loading={loadingJuzgados}
														disabled={!initialValues.folderJuris}
														placeholder="Buscar juzgado..."
														name="judFolder.courtNumber"
														size="small"
														sx={customInputStyles}
													/>
												}
											/>
										</Grid>
										<Grid item xs={6} md={3}>
											<CompactField
												label="EXPEDIENTE"
												value={values.judFolder.numberJudFolder}
												isLoading={isLoader}
												icon={<HashtagSquare size={12} />}
												isEditing={isEditing}
												editComponent={
													<InputField size="small" fullWidth placeholder="Número" name="judFolder.numberJudFolder" sx={customInputStyles} />
												}
											/>
										</Grid>
										<Grid item xs={6} md={3}>
											<CompactField
												label="ESTADO"
												value={values.judFolder.statusJudFolder}
												isLoading={isLoader}
												isEditing={isEditing}
												editComponent={
													<SelectField
														label="Estado"
														size="small"
														data={data.statusJudicial}
														name="judFolder.statusJudFolder"
														sx={customInputStyles}
													/>
												}
											/>
										</Grid>
										<Grid item xs={6} md={3}>
											<CompactField
												label="INICIO"
												value={values.judFolder.initialDateJudFolder}
												isLoading={isLoader}
												icon={<Calendar size={12} />}
												isEditing={isEditing}
												editComponent={<DateInputField customInputStyles={customInputStyles} name="judFolder.initialDateJudFolder" />}
											/>
										</Grid>
										<Grid item xs={6} md={3}>
											<CompactField
												label="MONTO DE RECLAMO"
												value={values.judFolder.amountJudFolder ? `$ ${values.judFolder.amountJudFolder}` : null}
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
														name="judFolder.amountJudFolder"
														sx={customInputStyles}
													/>
												}
											/>
										</Grid>

										{/* Additional info in single row */}
										{(folder?.sentencia || folder?.apelacion || folder?.fechaPago) && (
											<>
												<Grid item xs={12}>
													<Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1, mt: 1 }}>
														<Grid container spacing={2}>
															{folder?.sentencia && (
																<Grid item xs={4}>
																	<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																		SENTENCIA
																	</Typography>
																	<Typography variant="body2">{folder.sentencia}</Typography>
																</Grid>
															)}
															{folder?.apelacion && (
																<Grid item xs={4}>
																	<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																		APELACIÓN
																	</Typography>
																	<Typography variant="body2">{folder.apelacion}</Typography>
																</Grid>
															)}
															{folder?.fechaPago && (
																<Grid item xs={4}>
																	<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																		FECHA PAGO
																	</Typography>
																	<Typography variant="body2">{formatDate(folder.fechaPago)}</Typography>
																</Grid>
															)}
														</Grid>
													</Box>
												</Grid>
											</>
										)}

										{/* Observaciones - Solo si existe */}
										{(values.judFolder.descriptionJudFolder || isEditing) && (
											<Grid item xs={12}>
												<CompactField
													label="OBSERVACIONES"
													value={values.judFolder.descriptionJudFolder}
													isLoading={isLoader}
													isEditing={isEditing}
													editComponent={
														<InputField
															name="judFolder.descriptionJudFolder"
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
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderJudDataCompact;
