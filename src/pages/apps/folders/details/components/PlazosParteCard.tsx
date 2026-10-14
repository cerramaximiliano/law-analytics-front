/**
 * Vencimientos automáticos — "Represento a" (P15).
 *
 * Elige la parte que el usuario representa en la causa, entre los intervinientes PJN. Las cédulas
 * dirigidas a esa parte o a sus letrados se proponen como propias (evento en el calendario); sin
 * elección se usa la detección automática (sus CUIT entre los letrados de la causa). Al guardar, el
 * backend reevalúa los avisos vigentes de la carpeta y pasa a evento los que ahora son suyos.
 *
 * Solo se muestra a quien tiene activa la función (Perfil → Integraciones → Vencimientos
 * automáticos). Backend: GET/PUT /api/plazos-automaticos/carpetas/:folderId/parte.
 */
import { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CalendarTick } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { getPlazosParte, savePlazosParte, type PlazosParteVista } from "api/plazosAutomaticos";
import type { FolderData } from "types/folder";

interface Props {
	folder: Pick<FolderData, "_id" | "pjn" | "causaId" | "causaType"> | null | undefined;
}

const FUEROS_CON_PLAZOS = new Set(["CausasCivil", "CausasTrabajo", "CausasSegSocial", "CausasSegSoc", "CausasComercial"]);

const aviso = (message: string, color: "success" | "error" | "info") =>
	dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

export default function PlazosParteCard({ folder }: Props) {
	const folderId = folder?._id ? String(folder._id) : null;
	const aplica = !!(folderId && folder?.pjn && folder?.causaId && FUEROS_CON_PLAZOS.has(folder?.causaType || ""));
	const [vista, setVista] = useState<PlazosParteVista | null>(null);
	const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
	const [guardando, setGuardando] = useState(false);

	const aplicarVista = useCallback((v: PlazosParteVista) => {
		setVista(v);
		setSeleccion(new Set(v.partes.filter((p) => p.elegida).map((p) => p.intervinienteId)));
	}, []);

	useEffect(() => {
		if (!aplica || !folderId) return;
		let vivo = true;
		getPlazosParte(folderId)
			.then((v) => vivo && aplicarVista(v))
			.catch(() => vivo && setVista(null));
		return () => {
			vivo = false;
		};
	}, [aplica, folderId, aplicarVista]);

	if (!aplica || !vista?.activo || !vista.soportada) return null;

	const guardar = async (body: { partes: string[] } | { auto: true }) => {
		if (!folderId) return;
		setGuardando(true);
		try {
			const v = await savePlazosParte(folderId, body);
			aplicarVista(v);
			const n = v.reevaluacion?.actualizados || 0;
			aviso(
				n
					? `Listo. ${n} ${n === 1 ? "cédula pasó" : "cédulas pasaron"} a tu calendario como sugerencia.`
					: "Listo, guardamos la parte que representás.",
				"success",
			);
		} catch {
			aviso("No pudimos guardar la parte. Probá de nuevo.", "error");
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

	const elegidasAhora = vista.partes.filter((p) => p.elegida).map((p) => p.intervinienteId);
	const sinCambios =
		vista.fuente === "usuario" && elegidasAhora.length === seleccion.size && elegidasAhora.every((id) => seleccion.has(id));

	return (
		<Box
			data-testid="folder-plazos-parte"
			sx={{ mt: 2, p: 2, borderRadius: 1.5, border: "1px solid", borderColor: alpha(BRAND_BLUE, 0.25), bgcolor: alpha(BRAND_BLUE, 0.03) }}
		>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
				<CalendarTick size={18} color={BRAND_BLUE} variant="Bulk" />
				<Typography sx={{ fontWeight: 600, fontSize: "0.92rem" }}>Vencimientos automáticos: ¿a quién representás?</Typography>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
					<Stack spacing={0.25}>
						{vista.partes.map((p) => (
							<FormControlLabel
								key={p.intervinienteId}
								control={<Checkbox size="small" checked={seleccion.has(p.intervinienteId)} onChange={() => cambiar(p.intervinienteId)} />}
								label={
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
										<Typography variant="body2">{p.nombre}</Typography>
										{p.tipo && (
											<Chip size="small" label={p.tipo.toLowerCase()} variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
										)}
										{p.sugerida && <Chip size="small" label="sugerida" color="primary" sx={{ height: 20, fontSize: "0.7rem" }} />}
									</Stack>
								}
							/>
						))}
					</Stack>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
						<Button
							size="small"
							variant="contained"
							disabled={guardando || sinCambios}
							onClick={() => guardar({ partes: [...seleccion] })}
							startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : null}
							sx={{ textTransform: "none" }}
						>
							{seleccion.size ? "Guardar" : "No represento a ninguna"}
						</Button>
						{vista.fuente === "usuario" && (
							<Button
								size="small"
								variant="text"
								disabled={guardando}
								onClick={() => guardar({ auto: true })}
								sx={{ textTransform: "none" }}
							>
								Usar la detección automática
							</Button>
						)}
					</Stack>
				</>
			)}
		</Box>
	);
}
