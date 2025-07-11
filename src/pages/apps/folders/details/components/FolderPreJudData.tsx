import { useState, MouseEvent } from "react";
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
import moment from "moment";
import data from "data/folder.json";
import { MenuBoard, Clock, Notepad } from "iconsax-react";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import * as Yup from "yup";
import { useParams } from "react-router";
import { updateFolderById } from "store/reducers/folder";

import "moment/locale/es"; // Importa el idioma español
moment.locale("es"); // Configura moment a español

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

const FolderPreJudData = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();

	// Formateo de fechas a DD/MM/YYYY
	const formatDate = (date: string | null | undefined) => {
		if (!date) return "";
		return moment(date, ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"]).format("DD/MM/YYYY");
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

	// Inicializar valores con fallback para folder y preFolder
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

	//

	const status = ["Nueva", "En Progreso", "Cerrada", "Pendiente"];
	const [statusFolder, setStatusFolder] = useState(folder?.status || "Nueva");

	const handleStatus = (e: MouseEvent<HTMLButtonElement>) => {
		if (folder.isLoader) return;

		const currentIndex = status.indexOf(statusFolder);
		const nextIndex = (currentIndex + 1) % status.length;
		const newStatus = status[nextIndex];

		if (newStatus === "Cerrada") {
			folder.finalDateFolder = folder.finalDateFolder || moment().format("DD/MM/YYYY");
		} else {
			folder.finalDateFolder = "";
		}

		setStatusFolder(newStatus);
	};

	const handleEdit = (e: any) => {
		setIsEditing(true);
		e.preventDefault();
	};

	const _submitForm = async (values: any, actions: any) => {
		if (id) {
			try {
				// Convertir fechas de DD/MM/YYYY a formato ISO (YYYY-MM-DD) antes de enviar al backend
				const formattedValues = {
					...values,
					preFolder: {
						...values.preFolder,
						initialDatePreFolder: values.preFolder.initialDatePreFolder
							? moment(values.preFolder.initialDatePreFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: values.preFolder.initialDatePreFolder,
						finalDatePreFolder: values.preFolder.finalDatePreFolder
							? moment(values.preFolder.finalDatePreFolder, "DD/MM/YYYY").format("YYYY-MM-DD")
							: values.preFolder.finalDatePreFolder,
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
		preFolder: Yup.object().shape({
			initialDatePreFolder: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
			finalDatePreFolder: Yup.string().when("status", {
				is: (status: any) => status === "Cerrada",
				then: () =>
					Yup.string()
						.required("Con el estado finalizado debe completar la fecha")
						.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
							message: "El formato de fecha debe ser DD/MM/AAAA",
						}),
				otherwise: () => Yup.string(),
			}),
			statusPreFolder: Yup.string().required("El estado es requerido"),
			descriptionPreFolder: Yup.string().max(500, "Máximo 500 caracteres"),
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
								<Avatar color="warning" variant="rounded">
									<MenuBoard variant="Bold" />
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
								primary={
									<Typography>
										{type === "general" && "Información General"}
										{type === "judicial" && "Información Judicial"}
										{type === "mediacion" && "Información Prejudicial"}
									</Typography>
								}
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
											<Typography variant="subtitle1">Expediente Nª</Typography>
											{isEditing ? (
												<InputField name="preFolder.memberPreFolder" sx={customInputStyles} id="numberPreFolder" />
											) : (
												<Typography variant="body2">{folder?.preFolder?.numberPreFolder || " - "}</Typography>
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
													name="preFolder.amountPreFolder"
													sx={customInputStyles}
												/>
											) : (
												<Typography variant="body2">{`$ ${folder?.preFolder?.amountPreFolder || " - "}`}</Typography>
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
												<DateInputField customInputStyles={customInputStyles} name="preFolder.initialDatePreFolder" />
											) : (
												<Typography variant="body2">
													{folder?.preFolder?.initialDatePreFolder
														? moment(folder.preFolder?.initialDatePreFolder, "DD-MM-YYYY").format("DD-MM-YYYY")
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
												<DateInputField customInputStyles={customInputStyles} name="preFolder.finalDatePreFolder" />
											) : (
												<Typography variant="body2">
													{folder?.preFolder?.finalDatePreFolder
														? moment(folder.preFolder?.finalDatePreFolder, "DD-MM-YYYY").format("DD-MM-YYYY")
														: "-"}
												</Typography>
											)}
										</>
									)}
								</Grid>
							</Grid>
							<Grid item xs={12} sx={{ display: "flex", justifyContent: "space-between" }}>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton width={100} />
											<Skeleton width={100} />
										</>
									) : (
										<>
											<Typography variant="subtitle1">Descripción</Typography>
											{isEditing ? (
												<InputField
													name="preFolder.descriptionPreFolder"
													sx={customTextareaStyles}
													id="descriptionPreFolder"
													multiline
													rows={2}
												/>
											) : (
												<Typography
													variant="body2"
													noWrap
													sx={{
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
														maxWidth: "100%",
													}}
												>
													{folder?.preFolder?.descriptionPreFolder || " - "}
												</Typography>
											)}
										</>
									)}
								</Grid>
								<Grid item xs={5}>
									{isLoader ? (
										<>
											<Skeleton width={100} />
											<Skeleton width={100} />
										</>
									) : (
										<>
											<Typography
												variant="subtitle1"
												noWrap
												sx={{
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
													maxWidth: "100%",
												}}
											>
												Mediador/Conciliador
											</Typography>
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
												{folder?.preFolder?.updatedAt ? moment(folder?.preFolder?.updatedAt).fromNow() : "Sin actualizaciones recientes"}
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

export default FolderPreJudData;
