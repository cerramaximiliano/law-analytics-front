import React from "react";
import { useState } from "react";
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

const FolderPreJudDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { canUpdate } = useTeam();
	void type;

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

	const getStatusAccent = (status: string) => {
		switch (status) {
			case "Nueva":
				return STALE_AMBER;
			case "En Progreso":
				return BRAND_BLUE;
			case "Cerrada":
				return LIVE_GREEN;
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

	const hasData = folder?.preFolder && Object.values(folder.preFolder).some((value) => value && value !== "");

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
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
											<DocumentText size={14} variant="Bulk" />
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
													Etapa previa
												</Typography>
											</Stack>
											<Stack direction="row" spacing={0.875} alignItems="center" flexWrap="wrap" useFlexGap>
												<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
													Proceso de mediación
												</Typography>
												{values.preFolder.statusPreFolder && <StatusPill label={values.preFolder.statusPreFolder} />}
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
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderPreJudDataCompact;
