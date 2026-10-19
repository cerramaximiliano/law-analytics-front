/**
 * Partes y letrados del expediente (PJN), tal como los descarga extra-info del portal.
 *
 * Se muestran aunque el usuario no tenga activada la sincronización a contactos (Perfil →
 * Integraciones PJN): así ve primero quiénes intervienen y después elige cuáles pasan a sus
 * contactos (uno, varios o todos). Los que ya son contactos de la carpeta quedan marcados.
 *
 * Backend: GET/POST /api/folders/:folderId/intervinientes-pjn (law-analytics-server,
 * services/intervinientesPjnService.js). Solo causas PJN; EJE crea sus contactos por otro circuito.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Checkbox, Chip, CircularProgress, Collapse, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowDown2, People } from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN } from "themes/dashboardTokens";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { filterContactsByFolder } from "store/reducers/contacts";
import { useTeam } from "contexts/TeamContext";
import {
	agregarIntervinientesPjn,
	getIntervinientesPjn,
	type EstadoContacto,
	type ImportacionResultado,
	type IntervinientesPjnVista,
	type LetradoPjn,
} from "api/intervinientesPjn";

interface Props {
	folderId: string;
	// Avisa al contenedor qué trajo el panel (null si no hay datos), para que el estado vacío de contactos no lo contradiga.
	onVistaChange?: (vista: IntervinientesPjnVista | null) => void;
}

const aviso = (message: string, color: "success" | "error" | "info" | "warning") =>
	dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function mensajeResultado(r: ImportacionResultado): { texto: string; color: "success" | "warning" | "info" } {
	const partes: string[] = [];
	const activos = r.creados - r.archivados;
	if (activos) partes.push(`${plural(activos, "contacto nuevo", "contactos nuevos")}`);
	if (r.vinculados) partes.push(`${plural(r.vinculados, "contacto existente vinculado", "contactos existentes vinculados")} a la carpeta`);
	if (r.limiteAlcanzado) {
		const extra = [
			r.archivados ? `${plural(r.archivados, "quedó archivado", "quedaron archivados")}` : "",
			r.omitidos ? `${plural(r.omitidos, "no se agregó", "no se agregaron")}` : "",
		]
			.filter(Boolean)
			.join(" y ");
		return {
			texto: `${partes.length ? partes.join(" y ") + ". " : ""}Llegaste al límite de contactos de tu plan${extra ? `: ${extra}` : ""}.`,
			color: "warning",
		};
	}
	if (!partes.length) return { texto: "Ya estaban todos en la carpeta.", color: "info" };
	return { texto: `Listo: ${partes.join(" y ")}.`, color: "success" };
}

export default function IntervinientesPjnPanel({ folderId, onVistaChange }: Props) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { canCreate } = useTeam();
	const [vista, setVista] = useState<IntervinientesPjnVista | null>(null);
	const [abierto, setAbierto] = useState<boolean | null>(null);
	const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
	const [guardando, setGuardando] = useState(false);

	const aplicar = useCallback(
		(v: IntervinientesPjnVista) => {
			setVista(v);
			setSeleccion(new Set());
			onVistaChange?.(v);
		},
		[onVistaChange],
	);

	useEffect(() => {
		let vivo = true;
		setVista(null);
		setAbierto(null);
		onVistaChange?.(null);
		getIntervinientesPjn(folderId)
			.then((v) => vivo && aplicar(v))
			.catch(() => {
				if (!vivo) return;
				setVista(null);
				onVistaChange?.(null);
			});
		return () => {
			vivo = false;
		};
	}, [folderId, aplicar, onVistaChange]);

	// Ids únicos de los que todavía no están en la carpeta (un letrado puede figurar bajo dos partes).
	const pendientes = useMemo(() => {
		const ids = new Set<string>();
		for (const p of vista?.partes || []) {
			if (p.estado !== "en_carpeta") ids.add(p.id);
			p.letrados.forEach((l) => l.estado !== "en_carpeta" && ids.add(l.id));
		}
		(vista?.letradosSinParte || []).forEach((l) => l.estado !== "en_carpeta" && ids.add(l.id));
		return ids;
	}, [vista]);

	if (!vista?.soportada) return null;

	const total = vista.total || 0;
	const enCarpeta = vista.enCarpeta || 0;
	// Abierto por defecto mientras quede algo por agregar; si ya está todo, colapsado.
	const expandido = abierto ?? (vista.estado !== "disponible" || pendientes.size > 0);

	const agregar = async (body: { ids: string[] } | { todos: true }) => {
		setGuardando(true);
		try {
			const { resultado, data } = await agregarIntervinientesPjn(folderId, body);
			aplicar(data);
			const m = mensajeResultado(resultado);
			aviso(m.texto, m.color);
			dispatch(filterContactsByFolder(folderId) as any);
		} catch {
			aviso("No pudimos agregar los contactos. Probá de nuevo.", "error");
		} finally {
			setGuardando(false);
		}
	};

	const cambiar = (id: string) =>
		setSeleccion((prev) => {
			const s = new Set(prev);
			if (s.has(id)) s.delete(id);
			else s.add(id);
			return s;
		});

	const chipEstado = (estado: EstadoContacto) => {
		if (estado === "en_carpeta")
			return (
				<Chip
					size="small"
					label="En la carpeta"
					sx={{
						height: 20,
						fontSize: "0.68rem",
						fontWeight: 600,
						bgcolor: alpha(LIVE_GREEN, isDark ? 0.2 : 0.12),
						color: isDark ? LIVE_GREEN : "#15803D",
					}}
				/>
			);
		if (estado === "en_contactos")
			return (
				<Chip
					size="small"
					variant="outlined"
					label="En tus contactos"
					sx={{ height: 20, fontSize: "0.68rem", borderColor: alpha(BRAND_BLUE, 0.4), color: BRAND_BLUE }}
				/>
			);
		return null;
	};

	const fila = (
		key: string,
		item: { id: string; nombre: string; tipo: string | null; estado: EstadoContacto },
		nivel: 0 | 1,
		detalle?: string | null,
	) => (
		<Stack key={key} direction="row" alignItems="center" spacing={0.5} sx={{ pl: nivel ? 3.5 : 0, py: 0.25, minWidth: 0 }}>
			{canCreate && (
				<Checkbox
					size="small"
					sx={{ p: 0.5 }}
					disabled={item.estado === "en_carpeta" || guardando}
					checked={item.estado === "en_carpeta" || seleccion.has(item.id)}
					onChange={() => cambiar(item.id)}
					inputProps={{ "aria-label": `Agregar ${item.nombre} a contactos` }}
				/>
			)}
			<Box sx={{ minWidth: 0, flex: 1 }}>
				<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
					<Typography sx={{ fontSize: nivel ? "0.8rem" : "0.85rem", fontWeight: nivel ? 500 : 600, wordBreak: "break-word" }}>
						{item.nombre}
					</Typography>
					{item.tipo && (
						<Chip
							size="small"
							variant="outlined"
							label={item.tipo.toLowerCase()}
							sx={{ height: 20, fontSize: "0.68rem", textTransform: "none" }}
						/>
					)}
					{chipEstado(item.estado)}
				</Stack>
				{detalle && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", wordBreak: "break-word" }}>{detalle}</Typography>}
			</Box>
		</Stack>
	);

	const filaLetrado = (parteId: string, l: LetradoPjn) => fila(`${parteId}-${l.id}`, l, 1, l.matricula);

	return (
		<Box
			data-testid="folder-intervinientes-pjn"
			sx={{
				mt: 2,
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				spacing={1}
				onClick={() => setAbierto(!expandido)}
				sx={{ p: 1.5, cursor: "pointer", userSelect: "none" }}
			>
				<People size={18} color={BRAND_BLUE} variant="Bulk" />
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.005em" }}>
						Partes y letrados del expediente (PJN)
					</Typography>
					<Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
						{vista.estado === "disponible"
							? `${enCarpeta} de ${total} en la carpeta`
							: vista.estado === "pendiente"
							? "Todavía no los descargamos"
							: "Sin partes publicadas"}
					</Typography>
				</Box>
				<IconButton size="small" aria-label={expandido ? "Contraer" : "Expandir"}>
					<ArrowDown2 size={16} style={{ transform: expandido ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
				</IconButton>
			</Stack>

			<Collapse in={expandido} unmountOnExit>
				<Box sx={{ px: 1.5, pb: 1.5 }}>
					{vista.estado === "pendiente" && (
						<Typography variant="body2" color="text.secondary">
							Las traemos del PJN en los próximos días. Cuando estén, vas a poder elegir cuáles agregar a tus contactos.
						</Typography>
					)}
					{vista.estado === "sin_intervinientes" && (
						<Typography variant="body2" color="text.secondary">
							El PJN no publica partes ni letrados para este expediente.
						</Typography>
					)}
					{vista.estado === "disponible" && (
						<>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
								Vienen del portal del PJN.{canCreate ? " Elegí cuáles agregar a tus contactos." : ""}
							</Typography>
							<Stack spacing={0.75}>
								{(vista.partes || []).map((p) => (
									<Box key={p.id}>
										{fila(p.id, p, 0)}
										{p.letrados.map((l) => filaLetrado(p.id, l))}
									</Box>
								))}
								{!!vista.letradosSinParte?.length && (
									<Box>
										<Typography
											sx={{
												fontSize: "0.72rem",
												fontWeight: 600,
												color: "text.secondary",
												textTransform: "uppercase",
												letterSpacing: "0.06em",
												mt: 0.5,
											}}
										>
											Otros letrados
										</Typography>
										{vista.letradosSinParte.map((l) => filaLetrado("sin", l))}
									</Box>
								)}
							</Stack>
							{canCreate && pendientes.size > 0 && (
								<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
									<Button
										size="small"
										variant="contained"
										disabled={guardando || seleccion.size === 0}
										onClick={() => agregar({ ids: [...seleccion] })}
										startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : null}
										sx={{ textTransform: "none", boxShadow: "none" }}
									>
										{seleccion.size ? `Agregar ${plural(seleccion.size, "seleccionado", "seleccionados")}` : "Agregar seleccionados"}
									</Button>
									<Button
										size="small"
										variant="outlined"
										disabled={guardando}
										onClick={() => agregar({ todos: true })}
										sx={{ textTransform: "none" }}
									>
										Agregar todos a contactos
									</Button>
								</Stack>
							)}
						</>
					)}
				</Box>
			</Collapse>
		</Box>
	);
}
