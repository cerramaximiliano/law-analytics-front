import React from "react";
import { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, useTheme, alpha, useMediaQuery } from "@mui/material";
import dayjs from "utils/dayjs-config";
import data from "data/folder.json";
import { Edit2, Clock, Folder2 } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import AsynchronousAutocomplete from "components/UI/AsynchronousAutocomplete";
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
	width?: string | number;
}

const CompactField: React.FC<CompactFieldProps> = ({ label, value, isLoading, editComponent, isEditing, width = "auto" }) => {
	if (isLoading) {
		return <Skeleton width={width === "auto" ? 120 : width} height={40} sx={{ borderRadius: 1 }} />;
	}

	const hasValue = value && value !== "-";

	return (
		<Box sx={{ width }}>
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
			{isEditing && editComponent ? (
				<Box sx={{ mt: 0.5 }}>{editComponent}</Box>
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

const FolderDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));
	const { canUpdate } = useTeam();

	const initialValues = {
		...folder,
		initialDateFolder: folder?.initialDateFolder ? dayjs(folder.initialDateFolder).format("DD/MM/YYYY") : "",
		finalDateFolder: folder?.finalDateFolder ? dayjs(folder.finalDateFolder).format("DD/MM/YYYY") : "",
		folderJuris: folder?.folderJuris
			? typeof folder.folderJuris === "string"
				? { item: folder.folderJuris, label: "" }
				: folder.folderJuris
			: null,
		judFolder: folder?.judFolder || {
			courtNumber: "",
			secretaryNumber: "",
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
					initialDateFolder: values.initialDateFolder
						? dayjs(values.initialDateFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
						: values.initialDateFolder,
					finalDateFolder: values.finalDateFolder
						? dayjs(values.finalDateFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
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
				} else {
					enqueueSnackbar(result.message || "Error al actualizar", {
						variant: "error",
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

	const getStatusAccent = (status: string) => {
		switch (status) {
			case "Nueva":
				return LIVE_GREEN;
			case "En Progreso":
				return BRAND_BLUE;
			case "Cerrada":
				return theme.palette.text.disabled as string;
			case "Pendiente":
				return STALE_AMBER;
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

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2}>
							{/* Header — brand-tinted */}
							<Box
								sx={{
									p: 1.75,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									borderRadius: 1.5,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
									<Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
										<Box
											sx={{
												width: 32,
												height: 32,
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
											<Folder2 size={16} variant="Bulk" />
										</Box>
										<Stack spacing={0.125} sx={{ minWidth: 0 }}>
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
													Carátula
												</Typography>
											</Stack>
											<Typography
												sx={{
													fontSize: isMobile ? "0.88rem" : isTablet ? "0.95rem" : "1rem",
													fontWeight: 600,
													letterSpacing: "-0.015em",
													lineHeight: 1.3,
													color: "text.primary",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{isLoader ? <Skeleton width={200} /> : folder?.folderName || "Sin carátula"}
											</Typography>
											<Stack direction="row" spacing={0.875} alignItems="center" mt={0.375} flexWrap="wrap" useFlexGap>
												{type === "general" && <StatusPill label={folder?.status || "Nueva"} />}
												{!isLoader && folder?.updatedAt && (
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Clock size={11} variant="Linear" color={theme.palette.text.secondary} />
														<Typography
															sx={{
																fontSize: "0.68rem",
																color: "text.secondary",
																letterSpacing: "-0.005em",
															}}
														>
															{dayjs(folder.updatedAt).fromNow()}
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
											startIcon={<Edit2 size={14} variant="Bulk" />}
											sx={{
												textTransform: "none",
												fontWeight: 600,
												fontSize: "0.78rem",
												letterSpacing: "-0.005em",
												color: BRAND_BLUE,
												borderRadius: 1,
												px: 1.25,
												py: 0.5,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
												bgcolor: "transparent",
												"&:hover": {
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06),
													borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
												},
											}}
										>
											Editar
										</Button>
									)}
								</Stack>
							</Box>

							{/* Data grid — brand-bordered */}
							<Box
								sx={{
									p: 2,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									borderRadius: 1.5,
									bgcolor: theme.palette.background.paper,
								}}
							>
								<Grid container spacing={2}>
									{/* Row 1 */}
									<Grid item xs={6} md={3}>
										<CompactField
											label="PARTE"
											value={folder?.orderStatus}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={
												<SelectField label="Parte" required size="small" data={data.parte} name="orderStatus" sx={customInputStyles} />
											}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="FUERO"
											value={folder?.folderFuero}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={<SelectField label="Fuero" size="small" name="folderFuero" data={data.fuero} sx={customInputStyles} />}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="MATERIA"
											value={folder?.materia}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={<AsynchronousAutocomplete size="small" options={data.materia} name="materia" sx={customInputStyles} />}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="MONTO"
											value={folder?.amount ? `$ ${folder.amount}` : null}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={
												<NumberField
													thousandSeparator={","}
													allowNegative={false}
													decimalScale={2}
													fullWidth
													placeholder="0.00"
													InputProps={{ startAdornment: "$" }}
													name="amount"
													sx={customInputStyles}
												/>
											}
										/>
									</Grid>

									{/* Row 2 */}
									<Grid item xs={6} md={3}>
										<CompactField
											label="FECHA INICIO"
											value={folder?.initialDateFolder ? dayjs(folder.initialDateFolder).format("DD/MM/YYYY") : null}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={<DateInputField customInputStyles={customInputStyles} name="initialDateFolder" />}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="FECHA FIN"
											value={folder?.finalDateFolder ? dayjs(folder.finalDateFolder).format("DD/MM/YYYY") : null}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={<DateInputField customInputStyles={customInputStyles} name="finalDateFolder" />}
										/>
									</Grid>
									{(type === "general" || type === "judicial") && (
										<Grid item xs={12} md={6}>
											<CompactField
												label="SITUACIÓN"
												value={folder?.situationFolder}
												isLoading={isLoader}
												isEditing={isEditing}
												editComponent={
													<SelectField label="Situación" size="small" data={data.situacion} name="situationFolder" sx={customInputStyles} />
												}
											/>
										</Grid>
									)}

									{/* Jurisdiction and Juzgado */}
									<Grid item xs={6} md={3}>
										<CompactField
											label="JURISDICCIÓN"
											value={
												folder?.folderJuris ? (typeof folder.folderJuris === "string" ? folder.folderJuris : folder.folderJuris.item) : null
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
													disabled={!values.folderJuris}
													placeholder="Buscar juzgado..."
													name="judFolder.courtNumber"
													size="small"
													sx={customInputStyles}
												/>
											}
										/>
									</Grid>

									{/* Judicial Data if exists */}
									{folder?.judFolder?.secretaryNumber && (
										<Grid item xs={6} md={3}>
											<CompactField label="N° SECRETARÍA" value={folder?.judFolder?.secretaryNumber} isLoading={isLoader} />
										</Grid>
									)}

									{/* Description - Full Width */}
									{folder?.description && (
										<>
											<Grid item xs={12}>
												<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), my: 0.5 }} />
											</Grid>
											<Grid item xs={12}>
												<CompactField
													label="DESCRIPCIÓN"
													value={folder?.description}
													isLoading={isLoader}
													isEditing={isEditing}
													width="100%"
													editComponent={<InputField name="description" multiline rows={2} fullWidth sx={customInputStyles} />}
												/>
											</Grid>
										</>
									)}
								</Grid>

								{/* Actions — ghost cancel + sober brand submit */}
								{isEditing && (
									<Box
										sx={{
											display: "flex",
											justifyContent: "flex-end",
											gap: 1,
											mt: 2,
											pt: 1.5,
											borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
										}}
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
									</Box>
								)}
							</Box>
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderDataCompact;
