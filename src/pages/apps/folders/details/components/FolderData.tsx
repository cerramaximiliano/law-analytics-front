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
import { FolderCross, Folder, FolderOpen, Clock, Notepad } from "iconsax-react";
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

const FolderData = ({ folder, isLoader, type }: { folder: any; isLoader: boolean; type: string }) => {
	const { id } = useParams<{ id: string }>();

	const initialValues = {
		...folder,
		initialDateFolder: folder?.initialDateFolder ? moment(folder.initialDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : "",
		finalDateFolder: folder?.finalDateFolder ? moment(folder.finalDateFolder, "DD-MM-YYYY").format("DD/MM/YYYY") : "",
	};
	const [isEditing, setIsEditing] = useState(false);

	const status = ["Nueva", "En Proceso", "Finalizada"];
	const [statusFolder, setStatusFolder] = useState(folder?.status || "Nueva");

	const handleStatus = (e: MouseEvent<HTMLButtonElement>) => {
		if (folder.isLoader) return;

		const currentIndex = status.indexOf(statusFolder);
		const nextIndex = (currentIndex + 1) % status.length;
		const newStatus = status[nextIndex];

		if (newStatus === "Finalizada") {
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
				const result = await dispatch(updateFolderById(id, values));

				if (result.success) {
					enqueueSnackbar("Se actualizó correctamente", {
						variant: "success",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
					console.log("Folder actualizado con éxito:", result.folder);
				} else {
					enqueueSnackbar(result.message || "Error al actualizar el folder", {
						variant: "error",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
					console.error("Error al actualizar folder:", result.message);
				}
			} catch (error) {
				enqueueSnackbar("Ocurrió un error inesperado. Por favor, intente nuevamente más tarde.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				console.error("Error inesperado:", error);
			}
		} else {
			console.error("ID is undefined, unable to update folder");
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
		description: Yup.string().max(500),
		initialDateFolder: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
			message: "El formato de fecha debe ser DD/MM/AAAA",
		}),
		finalDateFolder: Yup.string().when("status", {
			is: (status: any) => status === "Finalizada",
			then: () =>
				Yup.string()
					.required("Con el estado finalizado debe completar la fecha")
					.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
						message: "El formato de fecha debe ser DD/MM/AAAA",
					}),
			otherwise: () => Yup.string(),
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
					<ListItem
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between", // Asegura que el texto y el botón estén correctamente alineados
							gap: 1, // Opcional: espacio entre elementos
						}}
						disablePadding
						secondaryAction={secondaryAction}
					>
						{isLoader ? (
							<Skeleton variant="rectangular" width={40} height={40} style={{ marginRight: 10 }} />
						) : (
							<ListItemAvatar>
								{statusFolder === "Finalizada" && type === "general" && (
									<Avatar color="error" variant="rounded">
										<FolderCross variant="Bold" />
									</Avatar>
								)}
								{statusFolder === "Nueva" && type === "general" && (
									<Avatar color="success" variant="rounded">
										<Folder variant="Bold" />
									</Avatar>
								)}
								{statusFolder === "En Proceso" && type === "general" && (
									<Avatar color="primary" variant="rounded">
										<FolderOpen variant="Bold" />
									</Avatar>
								)}
							</ListItemAvatar>
						)}
						{isLoader ? (
							<Grid>
								<Skeleton variant="rectangular" width={120} height={16} style={{ marginBottom: 5 }} />
								<Skeleton variant="rectangular" width={120} height={16} />
							</Grid>
						) : (
							<ListItemText
								sx={{
									my: 0,
									overflow: "hidden",
									maxWidth: "calc(100% - 48px)",
								}}
								primary={<Typography>Información General</Typography>}
								secondary={
									<Typography
										variant="subtitle1"
										sx={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											display: "-webkit-box",
											WebkitLineClamp: 2, // Limita a 2 líneas
											WebkitBoxOrient: "vertical",
											lineHeight: 1.2, // Ajusta según necesites
											maxHeight: "2.4em", // 2 líneas * lineHeight
											maxWidth: "calc(100% - 48px)",
										}}
									>
										{folder?.folderName || "-"}
									</Typography>
								}
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
											<Typography variant="subtitle1">Materia</Typography>
											{isEditing ? (
												<AsynchronousAutocomplete placeholder="Seleccione una materia" options={data.materia} name="materia" />
											) : (
												<Typography variant="body2">{folder?.materia || " - "}</Typography>
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
											<Typography variant="subtitle1">Monto</Typography>
											{isEditing ? (
												<NumberField
													thousandSeparator={","}
													allowNegative={false}
													allowLeadingZeros={false}
													decimalScale={2}
													fullWidth
													placeholder="00.00"
													InputProps={{ startAdornment: "$" }}
													name="amount"
													sx={customInputStyles}
												/>
											) : (
												<Typography variant="body2">{`$ ${folder?.amount || " - "}`}</Typography>
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
												<DateInputField customInputStyles={customInputStyles} name="initialDateFolder" />
											) : (
												<Typography variant="body2">
													{folder?.initialDateFolder ? moment(folder?.initialDateFolder, "DD-MM-YYYY").format("DD-MM-YYYY") : "-"}
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
												<DateInputField customInputStyles={customInputStyles} name="finalDateFolder" />
											) : (
												type === "general" && (
													<Typography variant="body2">
														{folder?.finalDateFolder ? moment(folder?.finalDateFolder, "DD-MM-YYYY").format("DD-MM-YYYY") : "-"}
													</Typography>
												)
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
											<Typography variant="body2">{type === "general" && statusFolder}</Typography>
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
												<InputField name="description" sx={customTextareaStyles} id="description" multiline rows={2} />
											) : (
												<Typography variant="body2">{folder?.description || " - "}</Typography>
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
												{folder?.updatedAt ? moment(folder.updatedAt).fromNow() : "Sin actualizaciones recientes"}
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

export default FolderData;
