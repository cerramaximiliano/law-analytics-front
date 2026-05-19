import React, { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, useTheme, alpha } from "@mui/material";
import dayjs from "utils/dayjs-config";
import data from "data/folder.json";
import { Edit2, Calendar, DollarCircle, HashtagSquare, Judge, Building, DocumentText, TickCircle, ExportSquare } from "iconsax-react";
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
	const isDark = theme.palette.mode === "dark";
	const hasValue = value && value !== "-";

	if (isLoading) {
		return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1.5 }} />;
	}

	return (
		<Box
			sx={{
				p: 1.75,
				height: "100%",
				border: `1px solid ${hasValue ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(theme.palette.text.disabled, 0.12)}`,
				borderRadius: 1.5,
				bgcolor: hasValue ? theme.palette.background.paper : alpha(theme.palette.text.disabled, isDark ? 0.04 : 0.02),
				transition: "all 180ms ease",
				position: "relative",
				"&:hover": hasValue
					? {
							borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
					  }
					: undefined,
			}}
		>
			{important && hasValue && (
				<Box
					sx={{
						position: "absolute",
						top: -3,
						right: -3,
						width: 8,
						height: 8,
						borderRadius: "50%",
						bgcolor: LIVE_GREEN,
						boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
					}}
				/>
			)}

			<Stack direction="row" spacing={1.25} alignItems="flex-start">
				<Box
					sx={{
						width: 36,
						height: 36,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: hasValue ? alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) : alpha(theme.palette.text.disabled, 0.08),
						border: `1px solid ${hasValue ? alpha(BRAND_BLUE, isDark ? 0.28 : 0.18) : alpha(theme.palette.text.disabled, 0.16)}`,
						color: hasValue ? BRAND_BLUE : theme.palette.text.disabled,
						flexShrink: 0,
					}}
				>
					{React.cloneElement(icon as React.ReactElement, {
						size: 16,
						variant: hasValue ? "Bulk" : "Linear",
					})}
				</Box>
				<Box flex={1} sx={{ minWidth: 0 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: hasValue ? BRAND_BLUE : theme.palette.text.disabled }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: hasValue ? "text.secondary" : "text.disabled",
							}}
						>
							{label}
						</Typography>
					</Stack>
					{isEditing && editComponent ? (
						<Box mt={1}>{editComponent}</Box>
					) : (
						<>
							<Typography
								sx={{
									fontWeight: hasValue ? 600 : 400,
									color: valueColor || (hasValue ? "text.primary" : "text.disabled"),
									fontSize: important ? "1.1rem" : "1rem",
									letterSpacing: "-0.005em",
									mt: 0.25,
									lineHeight: 1.4,
								}}
							>
								{value || "—"}
							</Typography>
							{helper && hasValue && (
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.25 }}>
									{helper}
								</Typography>
							)}
						</>
					)}
				</Box>
				{hasValue && !isEditing && <TickCircle size={14} variant="Bold" color={LIVE_GREEN} />}
			</Stack>
		</Box>
	);
};

const FolderJudDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { canUpdate } = useTeam();

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
		juzgado: Yup.string().max(255),
		secretaria: Yup.string().max(255),
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
			case "Sentencia Cámara":
				return BRAND_BLUE;
			case "Abierto a Prueba":
				return STALE_AMBER;
			case "Sentencia":
			case "Sentencia Corte":
				return LIVE_GREEN;
			case "Apelación":
			case "Recurso ante Cámara":
				return theme.palette.error.main;
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
					px: 1,
					py: 0.375,
					borderRadius: 0.875,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.72rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "-0.005em",
					}}
				>
					{label}
				</Typography>
			</Box>
		);
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
			? dayjs(folder.judFolder.finalDateJudFolder, "DD-MM-YYYY").diff(dayjs(folder.judFolder.initialDateJudFolder, "DD-MM-YYYY"), "days")
			: null;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2.5}>
							{/* Header — brand-tinted */}
							<Box
								sx={{
									p: 2.5,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									borderRadius: 2,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
								}}
							>
								<Grid container spacing={2.5} alignItems="center">
									<Grid item xs={12} md={8}>
										<Stack spacing={2}>
											<Stack direction="row" spacing={1.5} alignItems="center">
												<Box
													sx={{
														width: 40,
														height: 40,
														borderRadius: 1,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
														color: BRAND_BLUE,
														flexShrink: 0,
													}}
												>
													<Judge size={20} variant="Bulk" />
												</Box>
												<Box flex={1}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
														<Typography
															sx={{
																fontSize: "0.6rem",
																fontWeight: 600,
																letterSpacing: "0.08em",
																textTransform: "uppercase",
																color: "text.secondary",
															}}
														>
															Etapa judicial
														</Typography>
													</Stack>
													<Typography sx={{ fontSize: "1.25rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
														Proceso judicial
													</Typography>
													<Stack direction="row" spacing={1.25} alignItems="center" mt={0.5} flexWrap="wrap" useFlexGap>
														{hasData && (
															<Stack direction="row" spacing={0.5} alignItems="center">
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
																	Información registrada
																</Typography>
															</Stack>
														)}
														{folder?.pjn && (
															<Box
																sx={{
																	display: "inline-flex",
																	alignItems: "center",
																	gap: 0.5,
																	px: 0.875,
																	py: 0.25,
																	borderRadius: 0.75,
																	bgcolor: alpha(LIVE_GREEN, isDark ? 0.14 : 0.08),
																	border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
																}}
															>
																<ExportSquare size={11} variant="Bulk" color={LIVE_GREEN} />
																<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: LIVE_GREEN, letterSpacing: "-0.005em" }}>
																	Vinculado con PJN
																</Typography>
															</Box>
														)}
													</Stack>
												</Box>
											</Stack>

											{/* Progress — brand */}
											<Box>
												<Stack direction="row" justifyContent="space-between" mb={0.75}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
														<Typography
															sx={{
																fontSize: "0.62rem",
																fontWeight: 600,
																letterSpacing: "0.08em",
																textTransform: "uppercase",
																color: "text.secondary",
															}}
														>
															Información completa
														</Typography>
													</Stack>
													<Typography
														sx={{
															fontSize: "0.82rem",
															fontWeight: 700,
															color: completeness === 100 ? LIVE_GREEN : BRAND_BLUE,
															letterSpacing: "-0.005em",
															fontVariantNumeric: "tabular-nums",
														}}
													>
														{completeness.toFixed(0)}%
													</Typography>
												</Stack>
												<Box
													sx={{
														width: "100%",
														height: 6,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08),
														borderRadius: 1,
														overflow: "hidden",
													}}
												>
													<Box
														sx={{
															width: `${completeness}%`,
															height: "100%",
															bgcolor: completeness === 100 ? LIVE_GREEN : BRAND_BLUE,
															transition: "width 300ms ease",
														}}
													/>
												</Box>
											</Box>
										</Stack>
									</Grid>
									<Grid item xs={12} md={4}>
										<Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
											{!isEditing && canUpdate && (
												<Button
													variant="contained"
													onClick={handleEdit}
													startIcon={<Edit2 size={16} variant="Bulk" />}
													fullWidth
													sx={{
														maxWidth: { md: 200 },
														textTransform: "none",
														fontWeight: 600,
														letterSpacing: "-0.005em",
														bgcolor: BRAND_BLUE,
														color: "#fff",
														borderRadius: 1,
														py: 1,
														boxShadow: "none",
														"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
													}}
												>
													Editar información
												</Button>
											)}
											{duration !== null && (
												<Box textAlign={{ xs: "left", md: "right" }}>
													<Typography
														sx={{
															fontSize: "0.6rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Duración del proceso
													</Typography>
													<Typography
														sx={{
															fontSize: "1.1rem",
															fontWeight: 700,
															color: BRAND_BLUE,
															letterSpacing: "-0.015em",
															fontVariantNumeric: "tabular-nums",
														}}
													>
														{duration}{" "}
														<Box component="span" sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.secondary" }}>
															días
														</Box>
													</Typography>
												</Box>
											)}
										</Stack>
									</Grid>
								</Grid>
							</Box>

							{/* Court Information */}
							<Box
								sx={{
									p: 2.5,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									borderRadius: 1.5,
									bgcolor: hasCourtInfo
										? alpha(BRAND_BLUE, isDark ? 0.04 : 0.02)
										: alpha(theme.palette.text.disabled, isDark ? 0.04 : 0.02),
								}}
							>
								<Stack spacing={2}>
									<Stack direction="row" spacing={1} alignItems="center">
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
												color: hasCourtInfo ? BRAND_BLUE : theme.palette.text.disabled,
											}}
										>
											<Building size={14} variant="Bulk" />
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
													Tribunal
												</Typography>
											</Stack>
											<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
												Información del tribunal
											</Typography>
										</Stack>
									</Stack>
									<Grid container spacing={2.5}>
										{[
											{
												label: "Jurisdicción",
												value: folder?.folderJuris
													? typeof folder.folderJuris === "string"
														? folder.folderJuris
														: folder.folderJuris.item
													: null,
												editComponent: (
													<GroupedAutocomplete
														data={data.jurisdicciones}
														placeholder="Seleccioná una jurisdicción"
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
												),
											},
											{
												label: "Juzgado",
												value: values.judFolder.courtNumber,
												editComponent: (
													<JuzgadoAutocomplete
														options={juzgadosOptions}
														loading={loadingJuzgados}
														disabled={!values.folderJuris}
														placeholder="Buscar juzgado…"
														name="judFolder.courtNumber"
														sx={customInputStyles}
													/>
												),
											},
											{
												label: "Secretaría",
												value: values.judFolder.secretaryNumber || folder?.secretaria,
												editComponent: (
													<InputField
														size="small"
														fullWidth
														placeholder="Número de secretaría"
														name="judFolder.secretaryNumber"
														sx={customInputStyles}
													/>
												),
											},
										].map((field) => {
											const hasValue = field.value && field.value !== "-";
											return (
												<Grid item xs={12} md={6} key={field.label}>
													<Stack spacing={0.5}>
														<Stack direction="row" spacing={0.5} alignItems="center">
															<Box
																sx={{
																	width: 3,
																	height: 3,
																	borderRadius: "50%",
																	bgcolor: hasValue ? BRAND_BLUE : theme.palette.text.disabled,
																}}
															/>
															<Typography
																sx={{
																	fontSize: "0.6rem",
																	fontWeight: 600,
																	letterSpacing: "0.08em",
																	textTransform: "uppercase",
																	color: hasValue ? "text.secondary" : "text.disabled",
																}}
															>
																{field.label}
															</Typography>
														</Stack>
														{isEditing ? (
															field.editComponent
														) : (
															<Typography
																sx={{
																	fontSize: "1rem",
																	fontWeight: 600,
																	color: hasValue ? "text.primary" : "text.disabled",
																	letterSpacing: "-0.005em",
																}}
															>
																{field.value || "—"}
															</Typography>
														)}
													</Stack>
												</Grid>
											);
										})}
									</Grid>
								</Stack>
							</Box>

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
												? dayjs(values.judFolder.initialDateJudFolder, "DD/MM/YYYY").format("dddd, D [de] MMMM [de] YYYY")
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
									<Box
										sx={{
											p: 2,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
											borderRadius: 1.5,
											bgcolor: theme.palette.background.paper,
										}}
									>
										<Stack spacing={1.25}>
											<Stack direction="row" spacing={0.5} alignItems="center">
												<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
												<Typography
													sx={{
														fontSize: "0.6rem",
														fontWeight: 600,
														letterSpacing: "0.08em",
														textTransform: "uppercase",
														color: "text.secondary",
													}}
												>
													Estado del proceso
												</Typography>
											</Stack>
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
													<StatusPill label={values.judFolder.statusJudFolder} />
												</Box>
											)}
										</Stack>
									</Box>
								</Grid>

								{/* Fecha de finalización */}
								{(values.judFolder.finalDateJudFolder || isEditing) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.22 : 0.16)}`,
												borderRadius: 1.5,
												bgcolor: alpha(LIVE_GREEN, isDark ? 0.06 : 0.03),
											}}
										>
											<Stack direction="row" spacing={1.25} alignItems="center">
												<Box
													sx={{
														width: 40,
														height: 40,
														borderRadius: 1,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(LIVE_GREEN, isDark ? 0.18 : 0.1),
														border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
														color: LIVE_GREEN,
														flexShrink: 0,
													}}
												>
													<Calendar size={18} variant="Bulk" />
												</Box>
												<Box flex={1}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: LIVE_GREEN }} />
														<Typography
															sx={{
																fontSize: "0.6rem",
																fontWeight: 600,
																letterSpacing: "0.08em",
																textTransform: "uppercase",
																color: "text.secondary",
															}}
														>
															Fecha de finalización
														</Typography>
													</Stack>
													{isEditing ? (
														<Box mt={1}>
															<DateInputField customInputStyles={customInputStyles} name="judFolder.finalDateJudFolder" />
														</Box>
													) : (
														<>
															<Typography
																sx={{ fontSize: "1.1rem", fontWeight: 700, color: LIVE_GREEN, letterSpacing: "-0.015em", mt: 0.25 }}
															>
																{values.judFolder.finalDateJudFolder || "—"}
															</Typography>
															{values.judFolder.finalDateJudFolder && (
																<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
																	{dayjs(values.judFolder.finalDateJudFolder, "DD/MM/YYYY").format("dddd, D [de] MMMM [de] YYYY")}
																</Typography>
															)}
														</>
													)}
												</Box>
											</Stack>
										</Box>
									</Grid>
								)}

								{/* Additional info — Sentencia / Apelación / Fecha pago */}
								{(folder?.sentencia || folder?.apelacion || folder?.fechaPago) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												borderRadius: 1.5,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
											}}
										>
											<Stack spacing={1.5}>
												<Stack direction="row" spacing={0.5} alignItems="center">
													<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
													<Typography
														sx={{
															fontSize: "0.6rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Información adicional
													</Typography>
												</Stack>
												<Grid container spacing={2.5}>
													{folder?.sentencia && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
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
																<Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
																	{folder.sentencia}
																</Typography>
															</Stack>
														</Grid>
													)}
													{folder?.apelacion && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
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
																<Typography
																	sx={{
																		fontSize: "0.92rem",
																		fontWeight: 600,
																		color: theme.palette.error.main,
																		letterSpacing: "-0.005em",
																	}}
																>
																	{folder.apelacion}
																</Typography>
															</Stack>
														</Grid>
													)}
													{folder?.fechaPago && (
														<Grid item xs={12} md={4}>
															<Stack spacing={0.5}>
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
																<Typography
																	sx={{ fontSize: "0.92rem", fontWeight: 600, color: LIVE_GREEN, letterSpacing: "-0.005em" }}
																>
																	{formatDate(folder.fechaPago)}
																</Typography>
															</Stack>
														</Grid>
													)}
												</Grid>
											</Stack>
										</Box>
									</Grid>
								)}

								{/* Observaciones */}
								{(values.judFolder.descriptionJudFolder || isEditing) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												borderRadius: 1.5,
												bgcolor: values.judFolder.descriptionJudFolder
													? theme.palette.background.paper
													: alpha(theme.palette.text.disabled, isDark ? 0.04 : 0.02),
											}}
										>
											<Stack spacing={1}>
												<Stack direction="row" spacing={0.625} alignItems="center">
													<DocumentText size={12} variant="Bulk" color={BRAND_BLUE} />
													<Typography
														sx={{
															fontSize: "0.6rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Observaciones del proceso judicial
													</Typography>
												</Stack>
												{isEditing ? (
													<InputField
														name="judFolder.descriptionJudFolder"
														multiline
														rows={3}
														fullWidth
														placeholder="Notas sobre el desarrollo del proceso judicial…"
														sx={customInputStyles}
													/>
												) : (
													<Typography
														sx={{
															fontSize: "0.88rem",
															color: "text.primary",
															letterSpacing: "-0.005em",
															lineHeight: 1.6,
															whiteSpace: "pre-wrap",
															pl: 2.5,
															textWrap: "pretty" as any,
														}}
													>
														{values.judFolder.descriptionJudFolder}
													</Typography>
												)}
											</Stack>
										</Box>
									</Grid>
								)}
							</Grid>

							{/* Actions — ghost cancel + sober brand submit */}
							{isEditing && (
								<Box
									sx={{
										p: 1.75,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										borderRadius: 1.5,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
									}}
								>
									<Stack direction="row" spacing={1.25} justifyContent="flex-end">
										<Button
											onClick={() => setIsEditing(false)}
											sx={{
												minWidth: 120,
												textTransform: "none",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												color: "text.secondary",
												borderRadius: 1.25,
												py: 1,
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
											type="submit"
											variant="contained"
											disabled={isSubmitting}
											sx={{
												minWidth: 120,
												textTransform: "none",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												bgcolor: BRAND_BLUE,
												color: "#fff",
												borderRadius: 1.25,
												py: 1,
												boxShadow: "none",
												"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
											}}
										>
											Guardar cambios
										</Button>
									</Stack>
								</Box>
							)}
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderJudDataImproved;
