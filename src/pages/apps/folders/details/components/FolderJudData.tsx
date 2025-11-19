import React from "react";
import { useState, MouseEvent, useEffect } from "react";
import { dispatch } from "store";
import {
	Skeleton,
	Tooltip,
	Button,
	Grid,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Stack,
	Typography,
	Zoom,
	Divider,
} from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import IconButton from "components/@extended/IconButton";
import dayjs from "utils/dayjs-config";
import data from "data/folder.json";
import { Clock, Notepad, Judge } from "iconsax-react";
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

// ===========================|| DATA WIDGET - USER PERSONAL DATA ||=========================== //

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};
const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const FolderJudData = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();
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

	const status = ["Nueva", "En Progreso", "Cerrada", "Pendiente"];
	const [statusFolder, setStatusFolder] = useState(folder?.status || "Nueva");

	const handleStatus = (e: MouseEvent<HTMLButtonElement>) => {
		if (folder.isLoader) return;

		const currentIndex = status.indexOf(statusFolder);
		const nextIndex = (currentIndex + 1) % status.length;
		const newStatus = status[nextIndex];

		if (newStatus === "Cerrada") {
			folder.finalDateFolder = folder.finalDateFolder || dayjs().format("DD/MM/YYYY");
		} else {
			folder.finalDateFolder = "";
		}

		setStatusFolder(newStatus);
	};

	const handleEdit = (e: any) => {
		setIsEditing(true);
		e.preventDefault();
	};

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
				// Convertir fechas de DD/MM/YYYY a formato ISO (YYYY-MM-DD) antes de enviar al backend
				const formattedValues = {
					...values,
					judFolder: {
						...values.judFolder,
						initialDateJudFolder: values.judFolder.initialDateJudFolder
							? dayjs(values.judFolder.initialDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: values.judFolder.initialDateJudFolder,
						finalDateJudFolder: values.judFolder.finalDateJudFolder
							? dayjs(values.judFolder.finalDateJudFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: values.judFolder.finalDateJudFolder,
					},
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
					enqueueSnackbar(result.message || "Error al actualizar el folder", {
						variant: "error",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
				}
			} catch (error) {
				enqueueSnackbar("Ocurrió un error inesperado. Por favor, intente nuevamente más tarde.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} else {
			enqueueSnackbar("No se puede actualizar. Intente nuevamente más tarde.", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
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
		judFolder: Yup.object().shape({
			statusJudFolder: Yup.string(),
			descriptionJudFolder: Yup.string().max(500),
			initialDateJudFolder: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
			finalDateJudFolder: Yup.string().when("$status", {
				is: (status: any) => status === "Cerrada",
				then: () =>
					Yup.string()
						.required("Con el estado finalizado debe completar la fecha")
						.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
							message: "El formato de fecha debe ser DD/MM/AAAA",
						}),
				otherwise: () => Yup.string(),
			}),
		}),
	});

	const secondaryAction =
		type === "general" ? (
			<Tooltip title="Cambiar estado">
				<IconButton edge="end" aria-label="delete" color="secondary" onClick={handleStatus}>
					<Notepad />
				</IconButton>
			</Tooltip>
		) : null;

	return (
		<MainCard
			shadow={3}
			title={
				<List disablePadding>
					<ListItem sx={{ p: 0 }} secondaryAction={secondaryAction}>
						{isLoader ? (
							<Skeleton variant="rectangular" width={40} height={40} style={{ marginRight: 10 }} />
						) : (
							<ListItemAvatar>
								<Avatar color="primary" variant="rounded">
									<Judge variant="Bold" />
								</Avatar>
							</ListItemAvatar>
						)}
						{isLoader ? (
							<Grid>
								<Skeleton variant="rectangular" width={120} height={16} style={{ marginBottom: 5 }} />
								<Skeleton variant="rectangular" width={120} height={16} />
							</Grid>
						) : (
							<ListItemText
								sx={{ my: 0 }}
								primary={<Typography>Información Judicial</Typography>}
								secondary={<Typography variant="subtitle1">{folder?.folderName || "-"}</Typography>}
							/>
						)}
					</ListItem>
				</List>
			}
		>
			<Formik initialValues={initialValues} onSubmit={_handleSubmit} enableReinitialize validationSchema={ValidationSchema}>
				{({ isSubmitting, values }) => (
					<Form autoComplete="off" noValidate>
						<Grid container spacing={1}>
							<Grid item xs={12} columns={4} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Parte</Typography>
											{isEditing ? (
												<SelectField
													required
													label="Seleccione una parte"
													data={data.parte}
													name="orderStatus"
													style={{ maxHeight: "39.91px" }}
												/>
											) : (
												<Typography variant="body2">{folder?.orderStatus || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Fuero</Typography>
											{isEditing ? (
												<SelectField label="Seleccione el fuero" style={{ maxHeight: "39.91px" }} name="folderFuero" data={data.fuero} />
											) : (
												<Typography variant="body2">{folder?.folderFuero || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item xs={12} columns={4} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Jurisdicción</Typography>
											{isEditing ? (
												<GroupedAutocomplete
													data={data.jurisdicciones}
													placeholder="Seleccione una jurisdicción"
													name="folderJuris"
													onChange={(value: any) => {
														if (value?.item) {
															fetchJuzgados(value.item);
														} else {
															setJuzgadosOptions([]);
														}
													}}
												/>
											) : (
												<Typography variant="body2">
													{folder?.folderJuris
														? typeof folder.folderJuris === "string"
															? folder.folderJuris
															: folder.folderJuris.item
														: "-"}
												</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Juzgado</Typography>
											{isEditing ? (
												<JuzgadoAutocomplete
													options={juzgadosOptions}
													loading={loadingJuzgados}
													disabled={!values.folderJuris}
													placeholder="Buscar juzgado..."
													name="judFolder.courtNumber"
													sx={{ "& .MuiInputBase-root": { height: 39.91 } }}
												/>
											) : (
												<Typography variant="body2">{folder?.judFolder?.courtNumber || "-"}</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item xs={12} columns={4} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">N° de Juzgado</Typography>
											{isEditing ? (
												<InputField name="judFolder.courtNumber" sx={customInputStyles} id="judFolder.courtNumber" />
											) : (
												<Typography variant="body2">{folder?.judFolder?.courtNumber || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">N° de Secretaría</Typography>
											{isEditing ? (
												<InputField name="judFolder.secretaryNumber" sx={customInputStyles} id="judFolder.secretaryNumber" />
											) : (
												<Typography variant="body2">{folder?.judFolder?.secretaryNumber || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item xs={12} columns={4} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Expediente Nª</Typography>
											{isEditing ? (
												<InputField name="judFolder.numberJudFolder" sx={customInputStyles} id="judFolder.numberJudFolder" />
											) : (
												<Typography variant="body2">{folder?.judFolder?.numberJudFolder || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Monto de Reclamo</Typography>
											{isEditing ? (
												<NumberField
													thousandSeparator={","}
													allowNegative={false}
													allowLeadingZeros={false}
													decimalScale={2}
													fullWidth
													placeholder="00.00"
													InputProps={{ startAdornment: "$" }}
													name="judFolder.amountJudFolder"
													sx={customInputStyles}
												/>
											) : (
												<Typography variant="body2">{`$ ${folder?.judFolder?.amountJudFolder || " - "}`}</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item columns={4} xs={12} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Fecha Inicio</Typography>
											{isEditing ? (
												<DateInputField customInputStyles={customInputStyles} name="judFolder.initialDateJudFolder" />
											) : (
												<Typography variant="body2">
													{folder?.judFolder?.initialDateJudFolder
														? dayjs(folder.judFolder?.initialDateJudFolder, "DD-MM-YYYY").format("DD-MM-YYYY")
														: "-"}
												</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Fecha Fin</Typography>
											{isEditing ? (
												<DateInputField customInputStyles={customInputStyles} name="judFolder.finalDateJudFolder" />
											) : (
												<Typography variant="body2">
													{folder?.judFolder?.finalDateJudFolder
														? dayjs(folder.judFolder?.finalDateJudFolder, "DD-MM-YYYY").format("DD-MM-YYYY")
														: "-"}
												</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item columns={4} xs={12} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton />
											<Skeleton />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Estado</Typography>
											{isEditing ? (
												<SelectField
													label="Seleccione un estado"
													data={data.statusJudicial}
													name="judFolder.statusJudFolder"
													style={{ maxHeight: "39.91px" }}
												/>
											) : (
												<Typography variant="body2">{folder?.judFolder?.statusJudFolder || "-"}</Typography>
											)}
										</>
									)}
								</Grid>
								{(type === "general" || type === "judicial") && (
									<Grid item xs={5}>
										{isLoader ? (
											<>
												<Skeleton />
												<Skeleton />
											</>
										) : (
											<>
												<Typography variant="subtitle1">Situación</Typography>
												{isEditing ? (
													<SelectField
														label="Seleccione un estado"
														data={data.situacion}
														name="situationFolder"
														style={{ maxHeight: "39.91px" }}
													/>
												) : (
													<Typography variant="body2">{folder?.situationFolder || "-"}</Typography>
												)}
											</>
										)}
									</Grid>
								)}
							</Grid>
							<Grid item xs={12} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid>
									{isLoader ? (
										<>
											<Skeleton width={100} />
											<Skeleton width={100} />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Descripción</Typography>
											{isEditing ? (
												<InputField name="judFolder.description" sx={customTextareaStyles} id="description" multiline rows={2} />
											) : (
												<Typography variant="body2">{folder?.judFolder?.description || " - "}</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Divider
								variant="fullWidth"
								sx={{
									mt: 4,
									borderBottomWidth: 1,
									borderColor: "rgba(0, 0, 0, 0.12)",
									width: "100%",
								}}
							/>
							<Grid item xs={12}>
								<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 1.5 }}>
									{isLoader ? (
										<>
											<Skeleton width={100} />
										</>
									) : (
										<>
											<Typography sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
												<Clock size={14} style={{ marginLeft: 8 }} />
												{folder?.judFolder?.updatedAt ? dayjs(folder.judFolder.updatedAt).fromNow() : "Sin actualizaciones recientes"}
											</Typography>
										</>
									)}

									<Stack direction="row" spacing={2}>
										<Grid>
											{isEditing ? (
												<Button type="submit" variant="contained" disabled={isLoader}>
													Aplicar
												</Button>
											) : (
												<Button type="button" onClick={handleEdit} disabled={isLoader}>
													Editar
												</Button>
											)}
										</Grid>
									</Stack>
								</Stack>
							</Grid>
						</Grid>
					</Form>
				)}
			</Formik>
		</MainCard>
	);
};

export default FolderJudData;
