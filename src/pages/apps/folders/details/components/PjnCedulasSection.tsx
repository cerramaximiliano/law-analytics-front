import React, { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentText, Eye, NotificationStatus } from "iconsax-react";
import { useSearchParams } from "react-router-dom";
import dayjs from "utils/dayjs-config";
import { getPjnCedulasByFolder, getPjnMovementPdfUrl } from "services/pjnMovementsService";
import type { PjnCedula, PjnCedulasResponse } from "types/pjnCedula";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface Props {
	folderId: string;
	searchQuery?: string;
}

// Notificaciones de la bandeja del PJN de la carpeta (12/11/2026, pedido de Estudio FS Abogados):
// las cédulas que el juzgado notificó al domicilio electrónico, juntas, arriba de las
// notificaciones manuales. Lee GET /api/folders/:id/cedulas (solo pjn-notifications).
const PjnCedulasSection: React.FC<Props> = ({ folderId, searchQuery = "" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [, setSearchParams] = useSearchParams();
	const [data, setData] = useState<PjnCedulasResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		getPjnCedulasByFolder(folderId)
			.then((r) => {
				if (!cancelled) setData(r);
			})
			.catch((e) => {
				if (!cancelled) setError(e?.response?.data?.message || "No se pudieron cargar las notificaciones de la bandeja");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [folderId]);

	const q = searchQuery.trim().toLowerCase();
	const filas = (data?.data || []).filter((c) =>
		q
			? [c.numeroCedula, c.oficina, c.autor, ...(c.destinatarios || [])].some((v) =>
					String(v || "")
						.toLowerCase()
						.includes(q),
			  )
			: true,
	);

	// Abre el movimiento vinculado en Actividad → Movimientos (deep-link ?movement=&open=1).
	const verMovimiento = (c: PjnCedula) => {
		if (!c.movementId) return;
		const movementId = c.movementId;
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("movement", movementId);
			next.set("open", "1");
			return next;
		});
	};
	const verPdf = async (c: PjnCedula) => {
		if (!c.movementId) return;
		try {
			const r = await getPjnMovementPdfUrl(folderId, c.movementId);
			const url = r?.pdfUrl || (r as any)?.fallbackUrl;
			if (url) window.open(url, "_blank", "noopener");
		} catch {
			/* sin PDF disponible */
		}
	};

	const hoy = dayjs().startOf("day");
	const vencChip = (c: PjnCedula) => {
		if (!c.vencimiento)
			return (
				<Typography variant="caption" color="text.secondary">
					—
				</Typography>
			);
		const v = dayjs(c.vencimiento);
		const dias = v.diff(hoy, "day");
		const color = dias < 0 ? "default" : dias <= 2 ? "error" : dias <= 5 ? "warning" : "success";
		const label = dias < 0 ? `Venció ${v.format("DD/MM")}` : dias === 0 ? "Vence hoy" : `Vence ${v.format("DD/MM")} (${dias} d)`;
		return <Chip size="small" color={color} variant={dias < 0 ? "outlined" : "filled"} label={label} sx={{ fontWeight: 600 }} />;
	};

	return (
		<Box
			data-testid="pjn-cedulas-section"
			sx={{ mb: 2.5, borderRadius: 1.5, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, overflow: "hidden" }}
		>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) }}>
				<NotificationStatus size={16} variant="Bulk" color={BRAND_BLUE} />
				<Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Notificaciones del juzgado (bandeja del PJN)</Typography>
				{data && (
					<Typography variant="caption" color="text.secondary">
						{data.count === 1 ? "1 cédula" : `${data.count} cédulas`}
					</Typography>
				)}
			</Stack>
			{loading ? (
				<Box sx={{ p: 2 }}>
					<Skeleton variant="rounded" height={72} />
				</Box>
			) : error ? (
				<Alert severity="error" sx={{ m: 2 }}>
					{error}
				</Alert>
			) : filas.length === 0 ? (
				<Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
					{data?.message ||
						(q
							? "Ninguna cédula coincide con la búsqueda."
							: "No hay cédulas de este expediente en la bandeja de notificaciones del PJN de la cuenta vinculada.")}
				</Typography>
			) : (
				<TableContainer>
					<Table size="small" sx={{ "& td, & th": { fontSize: "0.8rem", verticalAlign: "top" } }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Notificada</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>N° cédula</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Oficina / autor</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Destinatario</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Vencimiento</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
									Acciones
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filas.map((c) => (
								<TableRow key={c.id} hover data-testid="pjn-cedula-row">
									<TableCell sx={{ whiteSpace: "nowrap" }}>{c.fecha ? dayjs(c.fecha).format("DD/MM/YYYY HH:mm") : "—"}</TableCell>
									<TableCell sx={{ whiteSpace: "nowrap" }}>{c.numeroCedula || "—"}</TableCell>
									<TableCell>
										<Typography sx={{ fontSize: "0.8rem" }}>{c.oficina || "—"}</Typography>
										{c.autor && c.autor.trim().toUpperCase() !== (c.oficina || "").trim().toUpperCase() && (
											<Typography variant="caption" color="text.secondary">
												{c.autor}
											</Typography>
										)}
									</TableCell>
									<TableCell>{c.destinatarios.length ? c.destinatarios.join(", ") : "—"}</TableCell>
									<TableCell sx={{ whiteSpace: "nowrap" }}>{vencChip(c)}</TableCell>
									<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
										{c.movementId ? (
											<>
												<Button
													size="small"
													startIcon={<Eye size={14} />}
													onClick={() => verMovimiento(c)}
													sx={{ textTransform: "none", fontSize: "0.75rem" }}
												>
													Movimiento
												</Button>
												{c.hasPdf && (
													<Button
														size="small"
														startIcon={<DocumentText size={14} />}
														onClick={() => verPdf(c)}
														sx={{ textTransform: "none", fontSize: "0.75rem" }}
													>
														PDF
													</Button>
												)}
											</>
										) : (
											<Tooltip title="La cédula todavía no aparece entre los movimientos del expediente; se vincula sola cuando el juzgado la carga.">
												<Typography variant="caption" color="text.secondary">
													Sin movimiento aún
												</Typography>
											</Tooltip>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
};

export default PjnCedulasSection;
