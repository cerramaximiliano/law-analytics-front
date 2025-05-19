// material-ui
import { Grid, Chip, Divider, Stack, TableCell, TableRow, Typography, Box, Paper } from "@mui/material";

// project-imports

// assets
import { Calendar, FolderOpen, Profile, Clock, NoteText } from "iconsax-react";
import { memo } from "react";
import moment from "moment";

// ==============================|| TASK - VIEW ||============================== //

const TaskView = memo(({ data }: any) => {
	const notAvailableMsg = "No disponible";

	// Función para obtener el color del estado
	const getStatusColor = (status: string) => {
		switch (status) {
			case "completada":
				return "success";
			case "en_progreso":
				return "warning";
			case "revision":
				return "secondary";
			case "cancelada":
				return "error";
			default:
				return "default";
		}
	};

	// Función para obtener la etiqueta del estado
	const getStatusLabel = (status: string) => {
		switch (status) {
			case "completada":
				return "Completada";
			case "en_progreso":
				return "En Progreso";
			case "revision":
				return "Revisión";
			case "cancelada":
				return "Cancelada";
			case "pendiente":
				return "Pendiente";
			default:
				return status || "Pendiente";
		}
	};

	// Función para obtener el color de prioridad
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "alta":
				return "error";
			case "media":
				return "warning";
			case "baja":
				return "success";
			default:
				return "default";
		}
	};

	// Info card component
	const InfoCard = ({ icon, title, value, color = "textPrimary" }: any) => (
		<Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
			<Stack direction="row" spacing={1} alignItems="center">
				<Box sx={{ color: "primary.main" }}>{icon}</Box>
				<Stack spacing={0.25} sx={{ flex: 1 }}>
					<Typography variant="caption" color="text.secondary">
						{title}
					</Typography>
					<Typography variant="body2" color={color} fontWeight="medium">
						{value}
					</Typography>
				</Stack>
			</Stack>
		</Paper>
	);

	return (
		<TableRow sx={{ "&:hover": { bgcolor: `transparent !important` }, overflow: "hidden" }}>
			<TableCell colSpan={8} sx={{ p: 2, overflow: "hidden" }}>
				<Box sx={{ pl: { xs: 0, sm: 3, md: 4, lg: 6 }, pr: { xs: 0, sm: 2 } }}>
					{/* Header con estado y prioridad */}
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
						<Typography variant="h6">{data.name || notAvailableMsg}</Typography>
						<Stack direction="row" spacing={1}>
							<Chip color={getStatusColor(data.status)} label={getStatusLabel(data.status)} size="small" variant="filled" />
							<Chip
								color={getPriorityColor(data.priority)}
								label={data.priority ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1) : "Normal"}
								size="small"
								variant="outlined"
							/>
						</Stack>
					</Stack>

					{/* Información principal en cards compactas */}
					<Grid container spacing={2} sx={{ mb: 2 }}>
						<Grid item xs={6} sm={3}>
							<InfoCard
								icon={<Calendar size={18} />}
								title="Vencimiento"
								value={moment(data.dueDate).format("DD/MM/YYYY")}
								color={moment(data.dueDate).isBefore(moment()) ? "error" : "textPrimary"}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<InfoCard icon={<FolderOpen size={18} />} title="Carpeta" value={data.folderName || notAvailableMsg} />
						</Grid>
						<Grid item xs={6} sm={3}>
							<InfoCard icon={<Profile size={18} />} title="Responsable" value={data.responsible || data.owner || notAvailableMsg} />
						</Grid>
						<Grid item xs={6} sm={3}>
							<InfoCard icon={<Clock size={18} />} title="Actualizado" value={moment(data.updatedAt).format("DD/MM/YYYY HH:mm")} />
						</Grid>
					</Grid>

					{/* Descripción y detalles principales */}
					<Grid container spacing={2}>
						{/* Panel izquierdo - Descripción */}
						<Grid item xs={12} md={7}>
							<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
								<Stack spacing={2}>
									<Box>
										<Typography variant="subtitle2" color="text.secondary" gutterBottom>
											Descripción
										</Typography>
										<Typography variant="body2">{data.description || notAvailableMsg}</Typography>
									</Box>

									{data.notes && (
										<>
											<Divider />
											<Box>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													Notas
												</Typography>
												<Typography variant="body2">{data.notes}</Typography>
											</Box>
										</>
									)}

									{data.comments && (
										<>
											<Divider />
											<Box>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													Comentarios
												</Typography>
												<Typography variant="body2">{data.comments}</Typography>
											</Box>
										</>
									)}
								</Stack>
							</Paper>
						</Grid>

						{/* Panel derecho - Información adicional */}
						<Grid item xs={12} md={5}>
							<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
								<Stack spacing={2}>
									{/* Etiquetas */}
									{data.tags && data.tags.length > 0 && (
										<Box>
											<Typography variant="subtitle2" color="text.secondary" gutterBottom>
												Etiquetas
											</Typography>
											<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
												{data.tags.map((tag: string, index: number) => (
													<Chip key={index} label={tag} size="small" variant="outlined" />
												))}
											</Stack>
										</Box>
									)}

									{/* Archivos adjuntos */}
									{data.attachments && data.attachments.length > 0 && (
										<Box>
											<Typography variant="subtitle2" color="text.secondary" gutterBottom>
												Archivos adjuntos
											</Typography>
											<Stack spacing={1}>
												{data.attachments.map((attachment: any, index: number) => (
													<Paper
														key={index}
														variant="outlined"
														sx={{
															p: 1,
															display: "flex",
															alignItems: "center",
															gap: 1,
															bgcolor: "grey.50",
														}}
													>
														<NoteText size={16} />
														<Typography variant="body2" noWrap>
															{attachment.name || `Archivo ${index + 1}`}
														</Typography>
													</Paper>
												))}
											</Stack>
										</Box>
									)}

									{/* Timestamps */}
									<Box>
										<Typography variant="subtitle2" color="text.secondary" gutterBottom>
											Información temporal
										</Typography>
										<Stack spacing={0.5}>
											<Typography variant="caption">Creado: {moment(data.createdAt).format("DD/MM/YYYY HH:mm")}</Typography>
											{data.completedAt && (
												<Typography variant="caption" color="success.main">
													Completado: {moment(data.completedAt).format("DD/MM/YYYY HH:mm")}
												</Typography>
											)}
										</Stack>
									</Box>
								</Stack>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</TableCell>
		</TableRow>
	);
});

TaskView.displayName = "TaskView";

export default TaskView;
