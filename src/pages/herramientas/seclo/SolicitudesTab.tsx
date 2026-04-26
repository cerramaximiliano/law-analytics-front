import { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Add, Eye, RefreshCircle, Trash } from "iconsax-react";
import { useNavigate } from "react-router-dom";

import { dispatch, useSelector } from "store";
import {
	fetchMySolicitudes,
	deleteSolicitud,
	reactivarSolicitud,
} from "store/reducers/seclo";
import type { SecloSolicitud, SecloStatus } from "types/seclo";

import CreateSolicitudWizard from "./CreateSolicitudWizard";

const STATUS_COLORS: Record<SecloStatus, "default" | "warning" | "info" | "success" | "error"> = {
	pending:           "warning",
	processing:        "info",
	submitted:         "info",
	completed:         "success",
	error:             "error",
	dry_run_completed: "info",
};

const STATUS_LABELS: Record<SecloStatus, string> = {
	pending:           "Pendiente",
	processing:        "Procesando",
	submitted:         "Enviada",
	completed:         "Completada",
	error:             "Error",
	dry_run_completed: "Prueba completada",
};

function getParticipantName(p: SecloSolicitud["requirentes"][0]): string {
	if (p?.contactId && typeof p.contactId === "object") {
		return `${(p.contactId as any).name || ""} ${(p.contactId as any).lastName || ""}`.trim() || "—";
	}
	return p?.snapshot?.name || "—";
}

export default function SolicitudesTab() {
	const navigate = useNavigate();
	const solicitudes = useSelector((s: any) => s.seclo.solicitudes as SecloSolicitud[]);
	const total = useSelector((s: any) => s.seclo.solicitudesTotal as number);
	const loading = useSelector((s: any) => s.seclo.loading as boolean);
	const credential = useSelector((s: any) => s.seclo.credential);

	const [page, setPage] = useState(0);
	const [rowsPerPage] = useState(15);
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [openCreate, setOpenCreate] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<SecloSolicitud | null>(null);

	const load = (overrides?: Record<string, any>) => {
		dispatch(
			fetchMySolicitudes({
				page: page + 1,
				limit: rowsPerPage,
				status: statusFilter || undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
				...overrides,
			}),
		);
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, statusFilter]);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await dispatch(deleteSolicitud(deleteTarget._id));
		} finally {
			setDeleteTarget(null);
		}
	};

	const handleReactivar = async (sol: SecloSolicitud) => {
		await dispatch(reactivarSolicitud(sol._id));
	};

	// Mensajes de bloqueo según estado de la credencial
	const credentialBlocker = (() => {
		if (!credential) {
			return { severity: "warning" as const, msg: "Cargá tus credenciales en la pestaña 'Credenciales' antes de crear solicitudes." };
		}
		if (!credential.enabled) {
			return { severity: "error" as const, msg: "Tu credencial está deshabilitada. Activala antes de crear solicitudes." };
		}
		if (credential.credentialInvalid) {
			return { severity: "error" as const, msg: "Tu credencial está marcada como inválida. Actualizala para reanudar." };
		}
		if (!credential.credentialsValidated) {
			return { severity: "info" as const, msg: "Estamos validando tu credencial. Vas a poder crear solicitudes apenas se confirme (≤ 5 min)." };
		}
		return null;
	})();

	const canCreate = !credentialBlocker;

	return (
		<Stack spacing={2}>
			{/* Banner de estado de credencial */}
			{credentialBlocker && (
				<Alert severity={credentialBlocker.severity}>{credentialBlocker.msg}</Alert>
			)}

			{/* Toolbar */}
			<Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
				<FormControl size="small" sx={{ minWidth: 160 }}>
					<InputLabel>Estado</InputLabel>
					<Select
						value={statusFilter}
						label="Estado"
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setPage(0);
						}}
					>
						<MenuItem value="">Todos</MenuItem>
						{Object.entries(STATUS_LABELS).map(([v, l]) => (
							<MenuItem key={v} value={v}>{l}</MenuItem>
						))}
					</Select>
				</FormControl>

				<TextField
					size="small"
					label="Desde"
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					InputLabelProps={{ shrink: true }}
					sx={{ width: 160 }}
				/>
				<TextField
					size="small"
					label="Hasta"
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					InputLabelProps={{ shrink: true }}
					sx={{ width: 160 }}
				/>
				<Button size="small" variant="outlined" onClick={() => { setPage(0); load({ page: 1 }); }}>
					Aplicar
				</Button>

				<Box flexGrow={1} />

				<Tooltip title={canCreate ? "" : "Necesitás una credencial validada"}>
					<span>
						<Button
							variant="contained"
							startIcon={<Add size={18} />}
							onClick={() => setOpenCreate(true)}
							disabled={!canCreate}
						>
							Nueva solicitud
						</Button>
					</span>
				</Tooltip>
			</Stack>

			{/* Tabla */}
			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Trabajador</TableCell>
							<TableCell>Empleador</TableCell>
							<TableCell>Objeto del reclamo</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Expediente</TableCell>
							<TableCell>Creado</TableCell>
							<TableCell align="center">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={7} align="center">
									<CircularProgress size={20} />
								</TableCell>
							</TableRow>
						) : solicitudes.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} align="center">
									<Typography variant="body2" color="text.secondary">
										Sin solicitudes
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							solicitudes.map((sol) => (
								<TableRow key={sol._id} hover>
									<TableCell>
										<Typography variant="body2" noWrap>{getParticipantName(sol.requirentes[0])}</Typography>
									</TableCell>
									<TableCell>
										<Typography variant="body2" noWrap>{getParticipantName(sol.requeridos[0])}</Typography>
									</TableCell>
									<TableCell>
										<Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
											{sol.objetoReclamo.join(", ")}
										</Typography>
									</TableCell>
									<TableCell>
										<Chip label={STATUS_LABELS[sol.status]} color={STATUS_COLORS[sol.status]} size="small" />
									</TableCell>
									<TableCell>
										<Typography variant="body2">
											{sol.resultado?.numeroExpediente || sol.resultado?.numeroTramite
												? `${sol.resultado?.numeroExpediente || ""}${sol.resultado?.numeroTramite ? ` #${sol.resultado.numeroTramite}` : ""}`.trim()
												: "—"}
										</Typography>
									</TableCell>
									<TableCell>
										<Typography variant="caption">{new Date(sol.createdAt).toLocaleDateString("es-AR")}</Typography>
									</TableCell>
									<TableCell align="center">
										<Box display="flex" gap={0.5} justifyContent="center">
											<Tooltip title="Ver detalle">
												<IconButton size="small" onClick={() => navigate(`/herramientas/seclo/solicitudes/${sol._id}`)}>
													<Eye size={16} />
												</IconButton>
											</Tooltip>
											{sol.status === "error" && (
												<Tooltip title="Reactivar">
													<IconButton size="small" color="warning" onClick={() => handleReactivar(sol)}>
														<RefreshCircle size={16} />
													</IconButton>
												</Tooltip>
											)}
											{["pending", "error"].includes(sol.status) && (
												<Tooltip title="Eliminar">
													<IconButton size="small" color="error" onClick={() => setDeleteTarget(sol)}>
														<Trash size={16} />
													</IconButton>
												</Tooltip>
											)}
										</Box>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>

			<TablePagination
				component="div"
				count={total}
				page={page}
				onPageChange={(_, p) => setPage(p)}
				rowsPerPage={rowsPerPage}
				rowsPerPageOptions={[15]}
			/>

			{/* Wizard de creación */}
			<CreateSolicitudWizard
				open={openCreate}
				onClose={() => {
					setOpenCreate(false);
					load();
				}}
			/>

			{/* Confirmación de eliminación */}
			<Dialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Eliminar solicitud</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Querés eliminar la solicitud de <strong>{deleteTarget ? getParticipantName(deleteTarget.requirentes[0]) : ""}</strong>?
						Esta acción también borra los archivos adjuntos.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
					<Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
