/**
 * Vencimientos automáticos — "Representás a" (P15).
 *
 * Tarjeta de Información general, junto a "Tipo de proceso": muestra la parte que el usuario representa
 * en la causa y abre un popover para elegirla/cambiarla entre los intervinientes PJN. Las cédulas
 * dirigidas a esa parte o a sus letrados se proponen en el calendario como vencimientos sugeridos.
 *
 * - fuente 'usuario': la indicó el usuario. 'auto': la sugirió el hub por sus CUIT (ya hay parte
 *   asignada: se muestra y se puede cambiar, no se pide como si faltara). null: sin parte → CTA "Indicar".
 * - Solo se renderiza con la función activa (Perfil → Integraciones → Vencimientos automáticos) y causa
 *   PJN vinculada. Backend: GET/PUT /api/plazos-automaticos/carpetas/:folderId/parte.
 */
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Popover, Stack, Typography } from "@mui/material";
import { CalendarTick } from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { getPlazosParte, savePlazosParte, type PlazosParteVista } from "api/plazosAutomaticos";

const FUEROS_CON_PLAZOS = new Set(["CausasCivil", "CausasTrabajo", "CausasSegSocial", "CausasSegSoc", "CausasComercial"]);

interface FolderLike {
	_id?: unknown;
	pjn?: boolean;
	causaId?: unknown;
	causaType?: string;
}

export const aplicaPlazosParte = (folder: FolderLike | null | undefined): boolean =>
	!!(folder?._id && folder?.pjn && folder?.causaId && FUEROS_CON_PLAZOS.has(folder?.causaType || ""));

export interface RepresentaAData {
	/** Null mientras carga, si la función no está activa o si la causa no la soporta: no se muestra nada. */
	vista: PlazosParteVista | null;
	guardando: boolean;
	guardar: (body: { partes: string[] } | { auto: true }) => Promise<boolean>;
	/** Texto de la parte (o partes) actual; "Ninguna" si indicó que no representa a nadie; "Sin indicar" si falta. */
	valor: string;
	helper: string;
	/** Falta que el usuario indique la parte (fuente null y hay partes para elegir). */
	pendiente: boolean;
}

export const useRepresentaA = (folder: FolderLike | null | undefined): RepresentaAData => {
	const folderId = folder?._id ? String(folder._id) : null;
	const aplica = aplicaPlazosParte(folder);
	const [vista, setVista] = useState<PlazosParteVista | null>(null);
	const [guardando, setGuardando] = useState(false);

	useEffect(() => {
		if (!aplica || !folderId) {
			setVista(null);
			return;
		}
		let vivo = true;
		getPlazosParte(folderId)
			.then((v) => vivo && setVista(v))
			.catch(() => vivo && setVista(null));
		return () => {
			vivo = false;
		};
	}, [aplica, folderId]);

	const guardar = useCallback(
		async (body: { partes: string[] } | { auto: true }) => {
			if (!folderId) return false;
			setGuardando(true);
			try {
				const v = await savePlazosParte(folderId, body);
				setVista(v);
				const n = v.reevaluacion?.actualizados || 0;
				enqueueSnackbar(
					n
						? `Listo. ${n} ${n === 1 ? "cédula pasó" : "cédulas pasaron"} a tu calendario como sugerencia.`
						: "Listo, guardamos la parte que representás.",
					{ variant: "success" },
				);
				return true;
			} catch {
				enqueueSnackbar("No pudimos guardar la parte. Probá de nuevo.", { variant: "error" });
				return false;
			} finally {
				setGuardando(false);
			}
		},
		[folderId],
	);

	const visible = !!(vista?.activo && vista.soportada);
	const elegidas = visible ? vista!.partes.filter((p) => p.elegida) : [];
	let valor = "Sin indicar";
	if (visible) {
		if (elegidas.length) valor = elegidas.map((p) => p.nombre).join(" · ");
		else if (vista!.ninguna) valor = "Ninguna";
	}
	let helper = "Elegí una parte para tus vencimientos";
	if (visible) {
		if (vista!.fuente === "usuario") helper = "Indicado por vos";
		else if (vista!.fuente === "auto") helper = "Detectada por tu CUIT";
		else if (!vista!.partes.length) helper = "Aún no tenemos las partes de la causa";
	}

	return {
		vista: visible ? vista : null,
		guardando,
		guardar,
		valor,
		helper,
		pendiente: visible && !vista!.fuente && vista!.partes.length > 0,
	};
};

interface PopoverProps {
	anchor: HTMLElement | null;
	onClose: () => void;
	data: RepresentaAData;
}

export const RepresentaAPopover = ({ anchor, onClose, data }: PopoverProps) => {
	const { vista, guardando, guardar } = data;
	const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (anchor && vista) setSeleccion(new Set(vista.partes.filter((p) => p.elegida).map((p) => p.intervinienteId)));
	}, [anchor, vista]);

	if (!vista) return null;

	const toggle = (id: string) =>
		setSeleccion((prev) => {
			const s = new Set(prev);
			if (s.has(id)) s.delete(id);
			else s.add(id);
			return s;
		});

	const elegidasAhora = vista.partes.filter((p) => p.elegida).map((p) => p.intervinienteId);
	// "Sin cambios" solo si ya hay una elección del usuario idéntica; una parte automática se puede confirmar tal cual.
	const sinCambios =
		vista.fuente === "usuario" && elegidasAhora.length === seleccion.size && elegidasAhora.every((id) => seleccion.has(id));

	const aceptar = async (body: { partes: string[] } | { auto: true }) => {
		if (await guardar(body)) onClose();
	};

	return (
		<Popover
			open={!!anchor}
			anchorEl={anchor}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			transformOrigin={{ vertical: "top", horizontal: "left" }}
			slotProps={{ paper: { sx: { width: 340, maxWidth: "calc(100vw - 32px)", p: 2 }, "data-testid": "folder-plazos-parte" } as any }}
		>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
				<CalendarTick size={18} variant="Bulk" />
				<Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>¿A quién representás en esta causa?</Typography>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textWrap: "pretty" }}>
				Las cédulas dirigidas a esta parte o a sus letrados se proponen en tu calendario como vencimientos sugeridos.
				{vista.fuente === "auto" && " La marcamos sola porque tu CUIT figura entre sus letrados: confirmala o cambiala."}
			</Typography>

			{!vista.partes.length ? (
				<Typography variant="body2" color="text.secondary">
					Todavía no tenemos las partes de esta causa. Las traemos del PJN en los próximos días; mientras tanto seguimos usando tu bandeja y
					tu CUIT.
				</Typography>
			) : (
				<>
					<Box sx={{ maxHeight: 260, overflowY: "auto" }}>
						<Stack spacing={0.25}>
							{vista.partes.map((p) => (
								<FormControlLabel
									key={p.intervinienteId}
									control={<Checkbox size="small" checked={seleccion.has(p.intervinienteId)} onChange={() => toggle(p.intervinienteId)} />}
									label={
										<Typography variant="body2">
											{p.nombre}
											{p.tipo && (
												<Typography component="span" variant="caption" color="text.secondary">
													{` · ${p.tipo.toLowerCase()}`}
												</Typography>
											)}
											{p.sugerida && (
												<Typography component="span" variant="caption" color="primary">
													{" · sugerida"}
												</Typography>
											)}
										</Typography>
									}
								/>
							))}
						</Stack>
					</Box>
					<Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center" flexWrap="wrap" useFlexGap>
						<Button
							size="small"
							variant="contained"
							disabled={guardando || sinCambios}
							onClick={() => aceptar({ partes: [...seleccion] })}
							startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : null}
							sx={{ textTransform: "none" }}
						>
							{seleccion.size ? (vista.fuente === "auto" && !sinCambios ? "Confirmar" : "Guardar") : "No represento a ninguna"}
						</Button>
						{vista.fuente === "usuario" && (
							<Button
								size="small"
								variant="text"
								disabled={guardando}
								onClick={() => aceptar({ auto: true })}
								sx={{ textTransform: "none" }}
							>
								Usar la detección automática
							</Button>
						)}
					</Stack>
				</>
			)}
		</Popover>
	);
};
