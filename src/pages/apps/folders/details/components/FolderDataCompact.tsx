import { useState, useEffect } from "react";
import { dispatch } from "store";
import { Skeleton, Button, Grid, Stack, Typography, Zoom, Box, Paper, useTheme, alpha, Chip, Divider } from "@mui/material";
import moment from "moment";
import data from "data/folder.json";
import { Edit2, Clock } from "iconsax-react";
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

import "moment/locale/es";
moment.locale("es");

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
		return <Skeleton width={width === "auto" ? 120 : width} height={40} />;
	}

	return (
		<Box sx={{ width }}>
			<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
				{label}
			</Typography>
			{isEditing && editComponent ? (
				<Box sx={{ mt: 0.5 }}>{editComponent}</Box>
			) : (
				<Typography variant="body2" fontWeight={value && value !== "-" ? 500 : 400}>
					{value || "-"}
				</Typography>
			)}
		</Box>
	);
};

const FolderDataCompact = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();

	const initialValues = {
		...folder,
		initialDateFolder: folder?.initialDateFolder ? moment.parseZone(folder.initialDateFolder).format("DD/MM/YYYY") : "",
		finalDateFolder: folder?.finalDateFolder ? moment.parseZone(folder.finalDateFolder).format("DD/MM/YYYY") : "",
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Nueva":
				return "success";
			case "En Progreso":
				return "primary";
			case "Cerrada":
				return "error";
			case "Pendiente":
				return "warning";
			default:
				return "default";
		}
	};

	return (
		<Box>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Stack spacing={2}>
							{/* Compact Header */}
							<Paper
								elevation={0}
								sx={{
									p: 2,
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 1.5,
									bgcolor: alpha(theme.palette.primary.main, 0.02),
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Box>
										<Typography variant="subtitle1" fontWeight={600}>
											{isLoader ? <Skeleton width={200} /> : folder?.folderName || "Sin carátula"}
										</Typography>
										<Stack direction="row" spacing={1.5} alignItems="center" mt={0.5}>
											{type === "general" && (
												<Chip
													label={folder?.status || "Nueva"}
													color={getStatusColor(folder?.status)}
													size="small"
													sx={{ height: 20, fontSize: "0.75rem" }}
												/>
											)}
											{!isLoader && folder?.updatedAt && (
												<Stack direction="row" spacing={0.5} alignItems="center">
													<Clock size={12} />
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
														{moment(folder.updatedAt).fromNow()}
													</Typography>
												</Stack>
											)}
										</Stack>
									</Box>
									{!isEditing && (
										<Button size="small" variant="text" onClick={handleEdit} startIcon={<Edit2 size={16} />}>
											Editar
										</Button>
									)}
								</Stack>
							</Paper>

							{/* Compact Data Grid */}
							<Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
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
											value={folder?.initialDateFolder ? moment.parseZone(folder.initialDateFolder).format("DD/MM/YYYY") : null}
											isLoading={isLoader}
											isEditing={isEditing}
											editComponent={<DateInputField customInputStyles={customInputStyles} name="initialDateFolder" />}
										/>
									</Grid>
									<Grid item xs={6} md={3}>
										<CompactField
											label="FECHA FIN"
											value={folder?.finalDateFolder ? moment.parseZone(folder.finalDateFolder).format("DD/MM/YYYY") : null}
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
												<Divider sx={{ my: 0.5 }} />
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

								{/* Actions */}
								{isEditing && (
									<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
										<Button size="small" variant="outlined" onClick={() => setIsEditing(false)}>
											Cancelar
										</Button>
										<Button size="small" type="submit" variant="contained" disabled={isSubmitting}>
											Guardar
										</Button>
									</Box>
								)}
							</Paper>
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default FolderDataCompact;
