import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	FormHelperText,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import { useFormikContext } from "formik";
import { enqueueSnackbar } from "notistack";
import {
	AVISO_PERCIBIDO_MANUAL_SIN_ACTUALIZACION,
	PercibidoMensual,
	mesesDelPeriodo,
	seriePercibidoSugerida,
} from "services/previsionalService";

// Percibidos cargados mes a mes (retroactivo previsional): el percibido de cada mes es exactamente lo que se carga acá,
// sin movilidad, reajustes ni piso. El motor exige un importe por cada mes reclamado (PERCIBIDOS_INCOMPLETOS).

const formatoImporte = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mesLegible = (p: string) => `${p.slice(5)}/${p.slice(0, 4)}`;

/**
 * "1.234,56" | "1234,56" | "1234.56" | "$ 1.234.567" → número; NaN si no se puede leer. Con punto y coma, el último que
 * aparece es el decimal; con solo puntos agrupados de a tres (1.234.567), son miles.
 */
export function leerImporte(texto: string): number {
	let t = String(texto || "")
		.replace(/[$\s]/g, "")
		.replace(/[^\d.,-]/g, "");
	if (!t) return NaN;
	const coma = t.lastIndexOf(",");
	const punto = t.lastIndexOf(".");
	if (coma >= 0 && punto >= 0) t = coma > punto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
	else if (coma >= 0) t = t.replace(/\./g, "").replace(",", ".");
	else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
	const n = Number(t);
	return Number.isFinite(n) ? n : NaN;
}

/** "03/2024" | "3/2024" | "2024-03" | "15/03/2024" → "2024-03"; null si no es un mes. */
export function leerPeriodo(texto: string): string | null {
	const t = String(texto || "").trim();
	let m = t.match(/^(\d{4})[-/](\d{1,2})$/);
	if (m) return Number(m[2]) >= 1 && Number(m[2]) <= 12 ? `${m[1]}-${m[2].padStart(2, "0")}` : null;
	m = t.match(/^(?:\d{1,2}[/-])?(\d{1,2})[/-](\d{4})$/);
	if (m) return Number(m[1]) >= 1 && Number(m[1]) <= 12 ? `${m[2]}-${m[1].padStart(2, "0")}` : null;
	return null;
}

/**
 * Texto pegado desde una planilla → importes por mes. Cada línea "mes importe" (separados por tab, punto y coma o
 * espacios); si ninguna línea trae mes, los importes se asignan en orden a los meses del período.
 */
export function leerPegado(texto: string, meses: string[]): { valores: PercibidoMensual[]; ignoradas: number } {
	const lineas = String(texto || "")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	const partes = lineas.map((l) =>
		l
			.split(/\t|;|\s{2,}|\s(?=[$\d-])/)
			.map((x) => x.trim())
			.filter(Boolean),
	);
	const conMes = partes.some((p) => p.length >= 2 && leerPeriodo(p[0]));
	const valores: PercibidoMensual[] = [];
	let ignoradas = 0;
	partes.forEach((p, i) => {
		const periodo = conMes ? leerPeriodo(p[0]) : meses[i];
		const importe = leerImporte(conMes ? p.slice(1).join("") : p.join(""));
		if (periodo && importe > 0) valores.push({ periodo, importe: Math.round(importe * 100) / 100 });
		else ignoradas++;
	});
	return { valores, ignoradas };
}

interface FilaProps {
	periodo: string;
	importe: number | undefined;
	onCommit: (periodo: string, importe: number | null) => void;
}

/** Cada fila edita su propio texto y recién al salir del campo actualiza Formik (cientos de meses sin lag). */
const FilaMes = memo(function FilaMes({ periodo, importe, onCommit }: FilaProps) {
	const [texto, setTexto] = useState(importe ? formatoImporte.format(importe) : "");
	const enfocado = useRef(false);
	useEffect(() => {
		if (!enfocado.current) setTexto(importe ? formatoImporte.format(importe) : "");
	}, [importe]);
	const falta = !(importe && importe > 0);
	return (
		<TableRow hover>
			<TableCell sx={{ width: 110, color: falta ? "error.main" : undefined, fontWeight: falta ? 600 : undefined }}>
				{mesLegible(periodo)}
			</TableCell>
			<TableCell>
				<TextField
					size="small"
					fullWidth
					value={texto}
					placeholder="Falta cargar"
					error={falta}
					inputProps={{ inputMode: "decimal", "aria-label": `Haber percibido ${mesLegible(periodo)}`, style: { textAlign: "right" } }}
					InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: "text.secondary" }}>$</Typography> }}
					onFocus={() => {
						enfocado.current = true;
					}}
					onChange={(e) => setTexto(e.target.value)}
					onBlur={() => {
						enfocado.current = false;
						const n = leerImporte(texto);
						const v = n > 0 ? Math.round(n * 100) / 100 : null;
						setTexto(v ? formatoImporte.format(v) : "");
						if (v !== (importe || null)) onCommit(periodo, v);
					}}
				/>
			</TableCell>
		</TableRow>
	);
});

export default function PercibidosMensuales() {
	const { values, setFieldValue, errors, submitCount } = useFormikContext<any>();
	const activo = !!values.percibidoManual;
	const meses = useMemo(
		() => mesesDelPeriodo(values),
		[values.fechaDesdeReclamado, values.fechaHastaReclamado, values.fechaCierre], // eslint-disable-line react-hooks/exhaustive-deps
	);
	const lista: PercibidoMensual[] = values.percibidosMensuales || [];
	const porMes = useMemo(
		() => new Map(lista.filter((x) => x && Number(x.importe) > 0).map((x) => [x.periodo, Number(x.importe)])),
		[lista],
	);
	const cargados = meses.filter((p) => porMes.has(p)).length;
	const faltan = meses.length - cargados;
	const [precargando, setPrecargando] = useState(false);
	const [pegarAbierto, setPegarAbierto] = useState(false);
	const [pegado, setPegado] = useState("");

	// Guarda la lista ordenada; los meses fuera del período se conservan (si el usuario vuelve a ampliar el período)
	const guardar = useCallback(
		(m: Map<string, number>) =>
			setFieldValue(
				"percibidosMensuales",
				[...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([periodo, importe]) => ({ periodo, importe })),
			),
		[setFieldValue],
	);
	const porMesRef = useRef(porMes);
	porMesRef.current = porMes;
	const onCommit = useCallback(
		(periodo: string, importe: number | null) => {
			const m = new Map(porMesRef.current);
			if (importe) m.set(periodo, importe);
			else m.delete(periodo);
			guardar(m);
		},
		[guardar],
	);

	const precargar = async (soloVacios: boolean) => {
		if (!meses.length) {
			enqueueSnackbar("Complete primero el período reclamado y la fecha de cierre", { variant: "warning" });
			return;
		}
		if (!(Number(values.haberPagadoAnses) > 0) || !values.haberPagadoAl) {
			enqueueSnackbar("Para precargar hace falta el haber pagado por ANSES y su fecha (paso 1)", { variant: "warning" });
			return;
		}
		setPrecargando(true);
		try {
			const serie = await seriePercibidoSugerida(values);
			const m = new Map(porMesRef.current);
			let n = 0;
			for (const x of serie) {
				if (soloVacios && m.has(x.periodo)) continue;
				m.set(x.periodo, x.importe);
				n++;
			}
			guardar(m);
			enqueueSnackbar(n ? `Se precargaron ${n} mes(es) con el haber calculado` : "No había meses vacíos para precargar", {
				variant: "success",
			});
		} catch (e: any) {
			enqueueSnackbar(e?.response?.data?.mensaje || "No se pudo precargar el haber percibido", { variant: "error" });
		} finally {
			setPrecargando(false);
		}
	};

	const aplicarPegado = () => {
		const { valores, ignoradas } = leerPegado(pegado, meses);
		if (!valores.length) {
			enqueueSnackbar("No se encontraron importes en el texto pegado", { variant: "warning" });
			return;
		}
		const m = new Map(porMesRef.current);
		for (const v of valores) m.set(v.periodo, v.importe);
		guardar(m);
		const fuera = valores.filter((v) => !meses.includes(v.periodo)).length;
		enqueueSnackbar(
			`Se cargaron ${valores.length - fuera} mes(es)` +
				(fuera ? `; ${fuera} quedan fuera del período reclamado` : "") +
				(ignoradas ? `; ${ignoradas} línea(s) no se pudieron leer` : ""),
			{ variant: ignoradas || fuera ? "warning" : "success" },
		);
		setPegado("");
		setPegarAbierto(false);
	};

	const errorCompletitud = typeof errors.percibidosMensuales === "string" ? errors.percibidosMensuales : null;

	return (
		<Box>
			<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
				Haberes percibidos mes a mes
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
				Por defecto el percibido se calcula con los aumentos generales de ANSES desde el haber pagado. Si tenés lo que se cobró
				efectivamente cada mes, podés cargarlo y se usa tal cual.
			</Typography>
			<FormControlLabel
				control={
					<Switch
						checked={activo}
						onChange={(e) => {
							setFieldValue("percibidoManual", e.target.checked);
							if (e.target.checked && !lista.length && meses.length && Number(values.haberPagadoAnses) > 0 && values.haberPagadoAl) {
								setTimeout(() => precargar(true), 0);
							}
						}}
					/>
				}
				label={activo ? "Cargando los percibidos mes a mes" : "Cargar los percibidos mes a mes"}
			/>
			{activo && (
				<Box sx={{ mt: 1.5 }}>
					<Alert severity="info" sx={{ mb: 2 }}>
						Cada mes del período reclamado necesita su percibido: sin todos los meses no se puede calcular. Lo que cargues se toma tal cual
						(sin aumentos, reajustes ni piso), en pesos. El reajuste y el piso de arriba solo se usan para precargar la grilla.{" "}
						{AVISO_PERCIBIDO_MANUAL_SIN_ACTUALIZACION}
					</Alert>
					{!meses.length ? (
						<FormHelperText>Complete el período reclamado y la fecha de cierre para ver los meses.</FormHelperText>
					) : (
						<>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
								<Chip
									color={faltan ? "error" : "success"}
									variant="outlined"
									label={faltan ? `${cargados} de ${meses.length} meses cargados · faltan ${faltan}` : `${meses.length} meses cargados`}
								/>
								<Box sx={{ flex: 1 }} />
								<Button
									size="small"
									variant="outlined"
									disabled={precargando}
									onClick={() => precargar(true)}
									sx={{ textTransform: "none" }}
								>
									{precargando ? "Precargando…" : "Precargar meses vacíos"}
								</Button>
								<Button size="small" variant="outlined" onClick={() => setPegarAbierto(true)} sx={{ textTransform: "none" }}>
									Pegar desde Excel
								</Button>
							</Stack>
							<TableContainer sx={{ maxHeight: 420, border: 1, borderColor: "divider", borderRadius: 1 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell>Mes</TableCell>
											<TableCell align="right">Haber percibido</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{meses.map((p) => (
											<FilaMes key={p} periodo={p} importe={porMes.get(p)} onCommit={onCommit} />
										))}
									</TableBody>
								</Table>
							</TableContainer>
							<FormHelperText>
								Haber mensual sin aguinaldo: el SAC, la obra social y el prorrateo del primer mes los calcula la liquidación.
							</FormHelperText>
						</>
					)}
					{errorCompletitud && submitCount > 0 && (
						<Alert severity="error" sx={{ mt: 1.5 }}>
							{errorCompletitud}
						</Alert>
					)}
				</Box>
			)}

			<Dialog open={pegarAbierto} onClose={() => setPegarAbierto(false)} fullWidth maxWidth="sm">
				<DialogTitle>Pegar percibidos desde una planilla</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
						Copiá dos columnas (mes e importe, por ejemplo <b>03/2024</b> y <b>1.234,56</b>) y pegalas acá. Si copiás solo la columna de
						importes, se asignan en orden desde {meses[0] ? mesLegible(meses[0]) : "el primer mes"}. Los meses que ya tenían importe se
						reemplazan.
					</Typography>
					<TextField
						multiline
						minRows={8}
						fullWidth
						autoFocus
						value={pegado}
						onChange={(e) => setPegado(e.target.value)}
						placeholder={"03/2024\t1.234,56\n04/2024\t1.301,10"}
						inputProps={{ "aria-label": "Texto pegado" }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPegarAbierto(false)}>Cancelar</Button>
					<Button variant="contained" onClick={aplicarPegado} disabled={!pegado.trim()}>
						Cargar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
