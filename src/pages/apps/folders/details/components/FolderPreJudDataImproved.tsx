import React, { useState } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, useTheme, alpha } from "@mui/material";
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
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE, LIVE_GREEN } from "themes/dashboardTokens";

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
									fontSize: "1rem",
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

const FolderPreJudDataImproved = ({ folder, isLoader }: { folder: any; isLoader: boolean }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { canUpdate } = useTeam();

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
													<DocumentText size={20} variant="Bulk" />
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
															Etapa previa
														</Typography>
													</Stack>
													<Typography sx={{ fontSize: "1.25rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
														Proceso de mediación
													</Typography>
													{hasData && (
														<Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
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
													Editar mediación
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

								{/* Fecha de finalización */}
								{(values.preFolder.finalDatePreFolder || isEditing) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.22 : 0.16)}`,
												borderRadius: 1.5,
												bgcolor: values.preFolder.finalDatePreFolder ? alpha(LIVE_GREEN, isDark ? 0.06 : 0.03) : "transparent",
											}}
										>
											<Stack direction="row" spacing={1.25} alignItems="center">
												<Box
													sx={{
														width: 36,
														height: 36,
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
													<Calendar size={16} variant="Bulk" />
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
															<DateInputField customInputStyles={customInputStyles} name="preFolder.finalDatePreFolder" />
														</Box>
													) : (
														<Typography
															sx={{ fontSize: "1.05rem", fontWeight: 700, color: LIVE_GREEN, letterSpacing: "-0.015em", mt: 0.25 }}
														>
															{values.preFolder.finalDatePreFolder || "—"}
														</Typography>
													)}
												</Box>
											</Stack>
										</Box>
									</Grid>
								)}

								{/* Observaciones */}
								{(values.preFolder.descriptionPreFolder || isEditing) && (
									<Grid item xs={12}>
										<Box
											sx={{
												p: 2,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												borderRadius: 1.5,
												bgcolor: values.preFolder.descriptionPreFolder
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
														Observaciones del proceso
													</Typography>
												</Stack>
												{isEditing ? (
													<InputField
														name="preFolder.descriptionPreFolder"
														multiline
														rows={3}
														fullWidth
														placeholder="Notas sobre el desarrollo de la mediación…"
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
														{values.preFolder.descriptionPreFolder}
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

export default FolderPreJudDataImproved;
