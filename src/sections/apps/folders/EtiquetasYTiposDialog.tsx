import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	MenuItem,
	Skeleton,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Add, Trash } from "iconsax-react";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import useEtiquetasExpediente, { Etiqueta } from "hooks/useEtiquetasExpediente";

// ==============================|| ETIQUETAS Y TIPOS: CONFIGURACIÓN CENTRAL ||============================== //
// Un solo lugar para lo que cada estudio define para sus carpetas: las etiquetas del expediente
// y los tipos de anotación del Seguimiento, con cuánto se usa cada uno, y quién puede
// administrarlos. Se abre desde Mis Carpetas y desde la solapa Seguimiento.

export interface TipoAnotacion {
	_id?: string;
	nombre: string;
	letra: string;
	color: string;
}

interface Config {
	tipos: TipoAnotacion[];
	estados: Etiqueta[];
	quienConfigura: "admins" | "editores";
	uso: { estados: Record<string, number>; tipos: Record<string, number> };
	canConfig: boolean;
	canPermisos: boolean;
}

const API = import.meta.env.VITE_BASE_URL;
const COLORES = ["#2e7d32", "#d32f2f", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f", "#5d4037", "#455a64"];
const TIPOS_SUGERIDOS: TipoAnotacion[] = [
	{ nombre: "Procesal", letra: "P", color: "#1b2533" },
	{ nombre: "Extraprocesal", letra: "E", color: "#8a94a6" },
	{ nombre: "Pendiente", letra: "N", color: "#d32f2f" },
];

const ColorInput = ({
	value,
	onChange,
	label,
	disabled,
}: {
	value: string;
	onChange: (v: string) => void;
	label: string;
	disabled?: boolean;
}) => (
	<Tooltip title="Color">
		<Box
			component="input"
			type="color"
			value={value}
			disabled={disabled}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
			aria-label={label}
			sx={{ width: 36, height: 36, p: 0, border: "none", bgcolor: "transparent", cursor: disabled ? "default" : "pointer", flexShrink: 0 }}
		/>
	</Tooltip>
);

const Seccion = ({ titulo, ayuda, children }: { titulo: string; ayuda: string; children: React.ReactNode }) => (
	<Box sx={{ mb: 3 }}>
		<Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>{titulo}</Typography>
		<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 1.25 }}>{ayuda}</Typography>
		{children}
	</Box>
);

const uso = (n: number | undefined, uno: string, muchos: string) => (
	<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", width: 104, flexShrink: 0, textAlign: "right" }}>
		{n ? `${n} ${n === 1 ? uno : muchos}` : "Sin usar"}
	</Typography>
);

interface Props {
	open: boolean;
	onClose: () => void;
	/** Después de guardar: las listas vigentes. */
	onSaved?: (cfg: { tipos: TipoAnotacion[]; etiquetas: Etiqueta[] }) => void;
}

const EtiquetasYTiposDialog = ({ open, onClose, onSaved }: Props) => {
	const { getRequestHeaders } = useTeam();
	const { guardar: guardarEtiquetas } = useEtiquetasExpediente();
	const [cfg, setCfg] = useState<Config | null>(null);
	const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
	const [tipos, setTipos] = useState<TipoAnotacion[]>([]);
	const [quien, setQuien] = useState<"admins" | "editores">("admins");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		setCfg(null);
		setError(null);
		axios
			.get(`${API}/api/seguimiento/config`, { headers: getRequestHeaders() })
			.then((res) => {
				if (cancelled) return;
				setCfg(res.data);
				setEtiquetas((res.data.estados || []).map((e: Etiqueta) => ({ ...e })));
				setTipos((res.data.tipos || []).map((t: TipoAnotacion) => ({ ...t })));
				setQuien(res.data.quienConfigura || "admins");
			})
			.catch((e) => !cancelled && setError(e?.response?.data?.message || "No se pudo cargar la configuración."));
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const soloLectura = !cfg?.canConfig;
	const cambio = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
	const incompleto = etiquetas.some((e) => !e.nombre.trim()) || tipos.some((t) => !t.nombre.trim());

	const guardar = async () => {
		if (!cfg) return;
		setSaving(true);
		setError(null);
		try {
			const headers = getRequestHeaders();
			let etiquetasFinal = cfg.estados;
			let tiposFinal = cfg.tipos;
			if (cfg.canConfig && cambio(etiquetas, cfg.estados)) etiquetasFinal = await guardarEtiquetas(etiquetas);
			if (cfg.canConfig && cambio(tipos, cfg.tipos)) {
				const res = await axios.put(`${API}/api/seguimiento/tipos`, { tipos }, { headers });
				tiposFinal = res.data?.tipos || [];
			}
			if (cfg.canPermisos && quien !== cfg.quienConfigura)
				await axios.put(`${API}/api/seguimiento/config`, { quienConfigura: quien }, { headers });
			dispatch(
				openSnackbar({ open: true, message: "Configuración guardada.", variant: "alert", alert: { color: "success" }, close: true }),
			);
			onSaved?.({ tipos: tiposFinal, etiquetas: etiquetasFinal });
			onClose();
		} catch (e: any) {
			setError(e?.response?.data?.message || "No se pudo guardar la configuración.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth data-testid="etiquetas-tipos-dialog">
			<DialogTitle sx={{ pb: 0.5 }}>Etiquetas y tipos</DialogTitle>
			<DialogContent>
				<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 2 }}>
					Lo que definas acá vale para todas las carpetas{cfg?.canPermisos ? " y todo el equipo" : ""}.
				</Typography>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}
				{!cfg && !error && <Skeleton variant="rounded" height={220} />}
				{cfg && soloLectura && (
					<Alert severity="info" sx={{ mb: 2 }}>
						Tu rol en el equipo no permite modificar esta configuración.
					</Alert>
				)}
				{cfg && (
					<>
						<Seccion
							titulo="Etiquetas del expediente"
							ayuda="Se ponen en cada carpeta (por ejemplo «Haber reajustado» o «Embargo») para después filtrar Mis Carpetas y armar listados."
						>
							<Stack spacing={1}>
								{etiquetas.map((e, i) => (
									<Stack key={e._id || `nueva-${i}`} direction="row" spacing={1} alignItems="center" data-testid="etiqueta-config-fila">
										<ColorInput
											value={e.color}
											disabled={soloLectura}
											label={`Color de ${e.nombre || "etiqueta"}`}
											onChange={(color) => setEtiquetas((d) => d.map((x, j) => (j === i ? { ...x, color } : x)))}
										/>
										<TextField
											size="small"
											label="Nombre"
											value={e.nombre}
											disabled={soloLectura}
											onChange={(ev) =>
												setEtiquetas((d) => d.map((x, j) => (j === i ? { ...x, nombre: ev.target.value.slice(0, 40) } : x)))
											}
											fullWidth
										/>
										{uso(e._id ? cfg.uso.estados[e._id] : 0, "carpeta", "carpetas")}
										{!soloLectura && (
											<Tooltip title="Quitar. Se saca también de las carpetas que la tenían.">
												<IconButton
													size="small"
													onClick={() => setEtiquetas((d) => d.filter((_, j) => j !== i))}
													aria-label="Quitar etiqueta"
												>
													<Trash size={16} />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								))}
							</Stack>
							{etiquetas.length === 0 && (
								<Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Todavía no hay etiquetas.</Typography>
							)}
							{!soloLectura && (
								<Button
									size="small"
									startIcon={<Add size={16} />}
									onClick={() => setEtiquetas((d) => [...d, { nombre: "", color: COLORES[d.length % COLORES.length] }])}
									disabled={etiquetas.length >= 60}
									sx={{ mt: 1 }}
								>
									Agregar etiqueta
								</Button>
							)}
						</Seccion>

						<Seccion
							titulo="Tipos de anotación"
							ayuda="Se eligen al anotar en la solapa Seguimiento. Cada tipo tiene la letra de su botón y el color con que se ve la anotación."
						>
							<Stack spacing={1}>
								{tipos.map((t, i) => (
									<Stack key={t._id || `nuevo-${i}`} direction="row" spacing={1} alignItems="center" data-testid="tipo-config-fila">
										<ColorInput
											value={t.color}
											disabled={soloLectura}
											label={`Color de ${t.nombre || "tipo"}`}
											onChange={(color) => setTipos((d) => d.map((x, j) => (j === i ? { ...x, color } : x)))}
										/>
										<TextField
											size="small"
											label="Letra"
											value={t.letra}
											disabled={soloLectura}
											onChange={(ev) =>
												setTipos((d) => d.map((x, j) => (j === i ? { ...x, letra: ev.target.value.slice(0, 2).toUpperCase() } : x)))
											}
											sx={{ width: 76, flexShrink: 0 }}
										/>
										<TextField
											size="small"
											label="Nombre"
											value={t.nombre}
											disabled={soloLectura}
											onChange={(ev) => setTipos((d) => d.map((x, j) => (j === i ? { ...x, nombre: ev.target.value.slice(0, 30) } : x)))}
											fullWidth
										/>
										{uso(t._id ? cfg.uso.tipos[t._id] : 0, "anotación", "anotaciones")}
										{!soloLectura && (
											<Tooltip title="Quitar. Las anotaciones que lo tenían quedan sin tipo.">
												<IconButton size="small" onClick={() => setTipos((d) => d.filter((_, j) => j !== i))} aria-label="Quitar tipo">
													<Trash size={16} />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								))}
							</Stack>
							{tipos.length === 0 && <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Todavía no hay tipos.</Typography>}
							{!soloLectura && (
								<Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
									<Button
										size="small"
										startIcon={<Add size={16} />}
										onClick={() => setTipos((d) => [...d, { nombre: "", letra: "", color: "#3a7bff" }])}
										disabled={tipos.length >= 12}
									>
										Agregar tipo
									</Button>
									{tipos.length === 0 && (
										<Button size="small" variant="outlined" onClick={() => setTipos(TIPOS_SUGERIDOS.map((t) => ({ ...t })))}>
											Usar Procesal, Extraprocesal y Pendiente
										</Button>
									)}
								</Stack>
							)}
						</Seccion>

						{cfg.canPermisos && (
							<Seccion
								titulo="Quién puede crearlos y modificarlos"
								ayuda="Un lector nunca puede. Poner y quitar etiquetas en una carpeta lo hace cualquiera que pueda editarla."
							>
								<TextField
									select
									size="small"
									value={quien}
									onChange={(e) => setQuien(e.target.value as "admins" | "editores")}
									inputProps={{ "data-testid": "quien-configura" }}
									sx={{ minWidth: 300 }}
								>
									<MenuItem value="admins">Solo el titular y los administradores</MenuItem>
									<MenuItem value="editores">También los editores</MenuItem>
								</TextField>
							</Seccion>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={saving} color="secondary">
					{soloLectura ? "Cerrar" : "Cancelar"}
				</Button>
				{cfg && (!soloLectura || cfg.canPermisos) && (
					<Button onClick={guardar} disabled={saving || incompleto} variant="contained">
						{saving ? "Guardando…" : "Guardar"}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default EtiquetasYTiposDialog;
