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

const CLASE_LABEL: Record<PjnCedula["clase"], string> = {
	cedula: "Cédula",
	parte: "Cédula a la parte",
	tribunal: "Cédula del tribunal",
	incorporada: "Cédula incorporada",
	retorno: "Retorno de cédula",
};

const fmtFecha = (v: string | null) => {
	if (!v) return "—";
	// YYYY-MM-DD (leído del PDF) o ISO exacto (bandeja).
	if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return dayjs(v).format("DD/MM/YYYY");
	const p = dayjs(v);
	return p.isValid() ? p.format("DD/MM/YYYY HH:mm") : "—";
};

// Cédulas del PJN de la carpeta (12/11/2026, pedido de Estudio FS Abogados): las notificaciones
// del juzgado al domicilio electrónico, juntas, arriba de las notificaciones manuales. Lee
// GET /api/folders/:id/cedulas (movimientos CEDULA + bandeja del portal).
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
				if (!cancelled) setError(e?.response?.data?.message || "No se pudieron cargar las cédulas");
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
			? [c.tipo, c.detalle, c.numeroCedula, ...(c.destinatarios || [])].some((v) =>
					String(v || "")
						.toLowerCase()
						.includes(q),
			  )
			: true,
	);

	// Abre el movimiento en Actividad → Movimientos (deep-link ?movement=&open=1).
	const verMovimiento = (c: PjnCedula) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("movement", c.id);
			next.set("open", "1");
			return next;
		});
	};
	const verPdf = async (c: PjnCedula) => {
		try {
			const r = await getPjnMovementPdfUrl(folderId, c.id);
			const url = r?.pdfUrl || (r as any)?.fallbackUrl || c.url;
			if (url) window.open(url, "_blank", "noopener");
		} catch {
			if (c.url) window.open(c.url, "_blank", "noopener");
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
				<Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>Cédulas del expediente</Typography>
				{data && (
					<Typography variant="caption" color="text.secondary">
						{data.count === 1 ? "1 cédula" : `${data.count} cédulas`}
						{data.requiresUpgrade && data.ocultas ? ` · ${data.ocultas} más en el historial` : ""}
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
							: data?.requiresUpgrade && data.ocultas
							? "Las cédulas de este expediente están en el historial completo, que muestran los planes pagos."
							: "El juzgado todavía no notificó cédulas en este expediente.")}
				</Typography>
			) : (
				<TableContainer>
					<Table size="small" sx={{ "& td, & th": { fontSize: "0.8rem", verticalAlign: "top" } }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Fecha</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>Detalle</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Notificada</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Vencimiento</TableCell>
								<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
									Acciones
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filas.map((c) => (
								<TableRow key={c.id} hover data-testid="pjn-cedula-row">
									<TableCell sx={{ whiteSpace: "nowrap" }}>{c.fecha ? dayjs(c.fecha).format("DD/MM/YYYY") : "—"}</TableCell>
									<TableCell>
										<Stack spacing={0.25}>
											<Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{CLASE_LABEL[c.clase]}</Typography>
											{c.numeroCedula && (
												<Typography variant="caption" color="text.secondary">
													N° {c.numeroCedula}
												</Typography>
											)}
											{c.fuente === "bandeja" && (
												<Typography variant="caption" color="text.secondary">
													Bandeja del portal
												</Typography>
											)}
										</Stack>
									</TableCell>
									<TableCell>
										<Typography sx={{ fontSize: "0.8rem" }}>{c.detalle || "—"}</Typography>
										{c.destinatarios.length > 0 && (
											<Typography variant="caption" color="text.secondary">
												A: {c.destinatarios.join(", ")}
											</Typography>
										)}
									</TableCell>
									<TableCell sx={{ whiteSpace: "nowrap" }}>
										<Tooltip
											title={
												c.notificadaFuente === "bandeja"
													? "Fecha exacta de la bandeja de notificaciones"
													: c.notificadaFuente === "documento"
													? "Leída del PDF de la cédula"
													: ""
											}
										>
											<span>{fmtFecha(c.notificadaEl)}</span>
										</Tooltip>
									</TableCell>
									<TableCell sx={{ whiteSpace: "nowrap" }}>{vencChip(c)}</TableCell>
									<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
										{c.fuente === "movimiento" && (
											<Button
												size="small"
												startIcon={<Eye size={14} />}
												onClick={() => verMovimiento(c)}
												sx={{ textTransform: "none", fontSize: "0.75rem" }}
											>
												Movimiento
											</Button>
										)}
										{(c.hasPdf || c.url) && (
											<Button
												size="small"
												startIcon={<DocumentText size={14} />}
												onClick={() => verPdf(c)}
												sx={{ textTransform: "none", fontSize: "0.75rem" }}
											>
												PDF
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
			{data?.requiresUpgrade && (
				<Alert severity="info" sx={{ m: 2, mt: 0 }}>
					Tu plan muestra solo las cédulas de los últimos movimientos
					{data.ocultas ? ` (${data.ocultas} más en el historial)` : ""}. Los planes pagos muestran todas.
				</Alert>
			)}
		</Box>
	);
};

export default PjnCedulasSection;
