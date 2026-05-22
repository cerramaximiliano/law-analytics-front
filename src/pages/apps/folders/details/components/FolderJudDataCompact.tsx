import React from "react";
import { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, useTheme, alpha } from "@mui/material";
import dayjs from "utils/dayjs-config";
import data from "data/folder.json";
import { Edit2, Calendar, DollarCircle, HashtagSquare, Judge as JudgeIcon, TickCircle } from "iconsax-react";
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
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

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
		return <Skeleton width={120} height={40} sx={{ borderRadius: 1 }} />;
	}

	const hasValue = value && value !== "-";

	return (
		<Box>
			<Stack direction="row" spacing={0.5} alignItems="center" mb={0.25}>
				{icon}
				<Typography
					sx={{
						fontSize: "0.6rem",
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "text.secondary",
						lineHeight: 1.4,
					}}
				>
					{label}
				</Typography>
			</Stack>
			{isEditing && editComponent ? (
				<Box>{editComponent}</Box>
			) : (
				<Typography
					sx={{
						fontSize: "0.85rem",
						fontWeight: hasValue ? 500 : 400,
						color: hasValue ? "text.primary" : "text.disabled",
						letterSpacing: "-0.005em",
						mt: 0.25,
					}}
				>
					{value || "—"}
				</Typography>
			)}
		</Box>
	);
};

const FolderJudDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { canUpdate } = useTeam();
	void type;

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

	const getStatusAccent = (status: string) => {
		switch (status) {
			case "Inicio Demanda":
			case "Contestación Demanda":
				return BRAND_BLUE;
			case "Abierto a Prueba":
				return STALE_AMBER;
			case "Sentencia":
			case "Sentencia Corte":
				return LIVE_GREEN;
			case "Apelación":
			case "Recurso ante Cámara":
				return theme.palette.error.main;
			case "Sentencia Cámara":
				return BRAND_BLUE;
			default:
				return theme.palette.text.secondary as string;
		}
	};

	const StatusPill = ({ label }: { label: string }) => {
		const accent = getStatusAccent(label);
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.5,
					px: 0.75,
					py: 0.125,
					borderRadius: 0.625,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.62rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						lineHeight: 1,
					}}
				>
					{label}
				</Typography>
			</Box>
		);
	};

	const hasData = folder?.judFolder && Object.values(folder.judFolder).some((value) => value && value !== "");
	const hasCourtInfo = folder?.juzgado || folder?.secretaria || folder?.judFolder?.courtNumber || folder?.judFolder?.secretaryNumber;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2}>
							{/* Court Info — brand-tinted */}
							{(hasCourtInfo || isEditing) && (
								<Box
									sx={{
										px: 1.75,
										py: 1.25,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										borderRadius: 1.5,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
									}}
								>
									<Grid container spacing={2}>
										<Grid item xs={6}>
											<Stack direction="row" spacing={0.5} alignItems="center" mb={isEditing ? 0.5 : 0}>
												<JudgeIcon size={12} variant="Bulk" color={BRAND_BLUE} />
												<Typography
													sx={{
														fontSize: "0.6rem",
														fontWeight: 600,
														letterSpacing: "0.08em",
														textTransform: "uppercase",
														color: "text.secondary",
													}}
												>
													Juzgado
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
												<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em", mt: 0.25 }}>
													{values.judFolder.courtNumber || folder?.juzgado || "—"}
												</Typography>
											)}
										</Grid>
										<Grid item xs={6}>
											<Stack direction="row" spacing={0.5} alignItems="center" mb={isEditing ? 0.5 : 0}>
												<JudgeIcon size={12} variant="Bulk" color={BRAND_BLUE} />
												<Typography
													sx={{
														fontSize: "0.6rem",
														fontWeight: 600,
														letterSpacing: "0.08em",
														textTransform: "uppercase",
														color: "text.secondary",
													}}
												>
													Secretaría
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
												<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em", mt: 0.25 }}>
													{values.judFolder.secretaryNumber || folder?.secretaria || "—"}
												</Typography>
											)}
										</Grid>
									</Grid>
								</Box>
							)}

							{/* Main Judicial Data */}
							<Box
								sx={{
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									borderRadius: 1.5,
									overflow: "hidden",
									bgcolor: theme.palette.background.paper,
								}}
							>
								{/* Header — brand-tinted */}
								<Box
									sx={{
										px: 1.75,
										py: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
										borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									}}
								>
									<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
										<Stack direction="row" spacing={1.25} alignItems="center">
											<Box
												sx={{
													width: 28,
													height: 28,
													borderRadius: 0.75,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
													color: BRAND_BLUE,
													flexShrink: 0,
												}}
											>
												<JudgeIcon size={14} variant="Bulk" />
											</Box>
											<Stack spacing={0.125}>
												<Stack direction="row" spacing={0.5} alignItems="center">
													<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
													<Typography
														sx={{
															fontSize: "0.58rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Etapa judicial
													</Typography>
												</Stack>
												<Stack direction="row" spacing={0.875} alignItems="center" flexWrap="wrap" useFlexGap>
													<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
														Proceso judicial
													</Typography>
													{values.judFolder.statusJudFolder && <StatusPill label={values.judFolder.statusJudFolder} />}
													{hasData && (
														<Stack direction="row" spacing={0.375} alignItems="center">
															<TickCircle size={12} variant="Bold" color={LIVE_GREEN} />
															<Typography
																sx={{
																	fontSize: "0.66rem",
																	fontWeight: 600,
																	color: LIVE_GREEN,
																	letterSpacing: "0.04em",
																	textTransform: "uppercase",
																}}
															>
																Con datos
															</Typography>
														</Stack>
													)}
												</Stack>
											</Stack>
										</Stack>
										{!isEditing && canUpdate && (
											<Button
												size="small"
												onClick={handleEdit}
												sx={{
													minWidth: "auto",
													width: 28,
													height: 28,
													borderRadius: 1,
													p: 0,
													color: BRAND_BLUE,
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
													"&:hover": {
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
														borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
													},
												}}
											>
												<Edit2 size={14} variant="Bulk" />
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
													<Box
														sx={{
															borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
															pt: 1.5,
															mt: 1,
														}}
													>
														<Grid container spacing={2}>
															{folder?.sentencia && (
																<Grid item xs={4}>
																	<Typography
																		sx={{
																			fontSize: "0.6rem",
																			fontWeight: 600,
																			letterSpacing: "0.08em",
																			textTransform: "uppercase",
																			color: "text.secondary",
																		}}
																	>
																		Sentencia
																	</Typography>
																	<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em", mt: 0.25 }}>
																		{folder.sentencia}
																	</Typography>
																</Grid>
															)}
															{folder?.apelacion && (
																<Grid item xs={4}>
																	<Typography
																		sx={{
																			fontSize: "0.6rem",
																			fontWeight: 600,
																			letterSpacing: "0.08em",
																			textTransform: "uppercase",
																			color: "text.secondary",
																		}}
																	>
																		Apelación
																	</Typography>
																	<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em", mt: 0.25 }}>
																		{folder.apelacion}
																	</Typography>
																</Grid>
															)}
															{folder?.fechaPago && (
																<Grid item xs={4}>
																	<Typography
																		sx={{
																			fontSize: "0.6rem",
																			fontWeight: 600,
																			letterSpacing: "0.08em",
																			textTransform: "uppercase",
																			color: "text.secondary",
																		}}
																	>
																		Fecha de pago
																	</Typography>
																	<Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: LIVE_GREEN, letterSpacing: "-0.005em", mt: 0.25 }}>
																		{formatDate(folder.fechaPago)}
																	</Typography>
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

									{/* Actions — ghost cancel + sober brand submit */}
									{isEditing && (
										<Stack
											direction="row"
											spacing={1}
											justifyContent="flex-end"
											mt={2}
											pt={1.5}
											sx={{ borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}
										>
											<Button
												size="small"
												onClick={() => setIsEditing(false)}
												sx={{
													textTransform: "none",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													color: "text.secondary",
													borderRadius: 1,
													px: 1.5,
													py: 0.625,
													border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
													"&:hover": {
														color: BRAND_BLUE,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
														borderColor: alpha(BRAND_BLUE, 0.28),
													},
												}}
											>
												Cancelar
											</Button>
											<Button
												size="small"
												type="submit"
												variant="contained"
												disabled={isSubmitting}
												sx={{
													textTransform: "none",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													bgcolor: BRAND_BLUE,
													color: "#fff",
													borderRadius: 1,
													px: 1.75,
													py: 0.625,
													boxShadow: "none",
													"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
												}}
											>
												Guardar
											</Button>
										</Stack>
									)}
								</Box>
							</Box>
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderJudDataCompact;
