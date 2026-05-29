import React from "react";
import { useState } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, useTheme, alpha, useMediaQuery } from "@mui/material";
import dayjs from "utils/dayjs-config";
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

const FieldCard: React.FC<FieldCardProps> = ({ label, value, isLoading, editComponent, isEditing, icon, important = false, helper }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const displayValue = value || "—";
	const hasValue = value && value !== "-";

	if (isLoading) {
		return <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1.5 }} />;
	}

	return (
		<Box
			sx={{
				p: 1.75,
				height: "100%",
				borderRadius: 1.5,
				border: `1px solid ${hasValue ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(theme.palette.text.disabled, 0.12)}`,
				bgcolor: hasValue ? theme.palette.background.paper : alpha(theme.palette.text.disabled, isDark ? 0.04 : 0.02),
				transition: "all 180ms ease",
				position: "relative",
				overflow: "visible",
				"&:hover": hasValue
					? {
							borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
					  }
					: undefined,
			}}
		>
			{/* Important highlight dot */}
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

			<Stack spacing={1}>
				{/* Header */}
				<Stack direction="row" spacing={0.875} alignItems="center">
					{icon && (
						<Box
							sx={{
								color: hasValue ? BRAND_BLUE : theme.palette.text.disabled,
								display: "flex",
								alignItems: "center",
							}}
						>
							{icon}
						</Box>
					)}
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: hasValue ? "text.secondary" : "text.disabled",
							lineHeight: 1.4,
						}}
					>
						{label}
					</Typography>
					{hasValue && <TickCircle size={12} variant="Bold" color={LIVE_GREEN} style={{ marginLeft: "auto" }} />}
				</Stack>

				{/* Value */}
				{isEditing && editComponent ? (
					<Box>{editComponent}</Box>
				) : (
					<>
						<Typography
							sx={{
								fontWeight: hasValue ? 600 : 400,
								color: hasValue ? "text.primary" : "text.disabled",
								fontSize: important ? "1rem" : "0.9rem",
								letterSpacing: "-0.005em",
								lineHeight: 1.4,
							}}
						>
							{displayValue}
						</Typography>
						{helper && hasValue && (
							<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{helper}</Typography>
						)}
					</>
				)}
			</Stack>
		</Box>
	);
};

const FolderDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
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
	};
	const [isEditing, setIsEditing] = useState(false);

	const handleEdit = () => setIsEditing(true);

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
					px: 0.875,
					py: 0.25,
					borderRadius: 0.75,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.66rem",
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

	// Calculate data completeness
	const totalFields = 9;
	const filledFields = [
		folder?.folderName,
		folder?.orderStatus,
		folder?.folderFuero,
		folder?.materia,
		folder?.amount,
		folder?.initialDateFolder,
		folder?.finalDateFolder,
		folder?.situationFolder,
		folder?.judFolder?.courtNumber,
	].filter(Boolean).length;
	const completeness = (filledFields / totalFields) * 100;

	// Calculate duration if both dates exist
	const duration =
		folder?.initialDateFolder && folder?.finalDateFolder
			? dayjs(folder.finalDateFolder, "DD-MM-YYYY").diff(dayjs(folder.initialDateFolder, "DD-MM-YYYY"), "days")
			: null;

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2.5}>
							{/* Header — brand-tinted atmospheric */}
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
													<Briefcase size={20} variant="Bulk" />
												</Box>
												<Box flex={1} sx={{ minWidth: 0 }}>
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
															Carátula
														</Typography>
													</Stack>
													<Typography
														sx={{
															fontSize: isMobile ? "1rem" : isTablet ? "1.15rem" : "1.3rem",
															fontWeight: 600,
															letterSpacing: "-0.015em",
															lineHeight: 1.25,
															color: "text.primary",
														}}
													>
														{isLoader ? <Skeleton width={isMobile ? 200 : 300} /> : folder?.folderName || "Sin carátula"}
													</Typography>
													<Stack direction="row" spacing={1.25} alignItems="center" mt={0.5} flexWrap="wrap" useFlexGap>
														{folder?.status && <StatusPill label={folder.status} />}
														{folder?.orderStatus && (
															<Typography
																sx={{
																	fontSize: "0.78rem",
																	color: "text.secondary",
																	letterSpacing: "-0.005em",
																}}
															>
																{folder.orderStatus}
															</Typography>
														)}
														{!isLoader && folder?.updatedAt && (
															<Stack direction="row" spacing={0.5} alignItems="center">
																<Clock size={12} variant="Linear" color={theme.palette.text.secondary} />
																<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
																	Actualizado {dayjs(folder.updatedAt).fromNow()}
																</Typography>
															</Stack>
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
										value={folder?.initialDateFolder ? dayjs(folder.initialDateFolder).format("DD/MM/YYYY") : null}
										isLoading={isLoader}
										icon={<Calendar1 size={16} />}
										isEditing={isEditing}
										editComponent={<DateInputField customInputStyles={customInputStyles} name="initialDateFolder" />}
									/>
								</Grid>
								<Grid item xs={12} sm={6} md={3}>
									<FieldCard
										label="Fecha Fin"
										value={folder?.finalDateFolder ? dayjs(folder.finalDateFolder).format("DD/MM/YYYY") : null}
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

								{/* Judicial Data if exists */}
								{(folder?.judFolder?.courtNumber || folder?.judFolder?.secretaryNumber) && (
									<>
										{folder?.judFolder?.courtNumber && (
											<Grid item xs={12} sm={6} md={3}>
												<FieldCard
													label="N° de Juzgado"
													value={folder?.judFolder?.courtNumber}
													isLoading={isLoader}
													icon={<Briefcase size={16} />}
												/>
											</Grid>
										)}
										{folder?.judFolder?.secretaryNumber && (
											<Grid item xs={12} sm={6} md={3}>
												<FieldCard
													label="N° de Secretaría"
													value={folder?.judFolder?.secretaryNumber}
													isLoading={isLoader}
													icon={<DocumentText size={16} />}
												/>
											</Grid>
										)}
									</>
								)}

								{/* Description - Full Width */}
								{(folder?.description || isEditing) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												borderRadius: 1.5,
												bgcolor: folder?.description ? theme.palette.background.paper : alpha(theme.palette.text.disabled, isDark ? 0.04 : 0.02),
											}}
										>
											<Stack spacing={1}>
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
														Descripción / observaciones
													</Typography>
												</Stack>
												{isEditing ? (
													<InputField
														name="description"
														multiline
														rows={3}
														fullWidth
														placeholder="Ingresá una descripción o observaciones…"
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
															textWrap: "pretty" as any,
														}}
													>
														{folder?.description}
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

export default FolderDataImproved;
