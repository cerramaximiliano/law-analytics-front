import React, { ClipboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

// material-ui
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	AlertTitle,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Divider,
	FormControlLabel,
	FormHelperText,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";

// third-party
import { Form, Formik, FormikHelpers, getIn, useFormikContext } from "formik";

// project-imports
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import LinkCauseSelector from "sections/forms/wizard/calc-previsional/retroactivo/components/LinkCauseSelector";
import {
	avisoDeCategoria,
	calcularHaberCaja,
	CatalogoHaberCaja,
	categoriasOfrecidas,
	equiparacionDeCategoria,
	HaberCajaInput,
	HaberCajaRespuesta,
	leerFilasPegadas,
	monedaDelPeriodo,
	normalizarPeriodo,
	obtenerCatalogoHaberCaja,
} from "services/haberCajaService";
import {
	armarEntradaHaberCaja,
	CAUSA_VINCULADA,
	ClaseServicio,
	FilaAutonomoForm,
	filaAutonomoVacia,
	FilaRemuneracionForm,
	filaRemuneracionVacia,
	FORM_ID,
	HaberCajaValues,
	nuevaFilaAutonomo,
	nuevaFilaRemuneracion,
	TramoServicio,
	valoresIniciales,
} from "sections/forms/wizard/calc-previsional/haber-caja/formModel/haberCajaFormModel";
import crearValidationSchema from "sections/forms/wizard/calc-previsional/haber-caja/formModel/validationSchema";
import { valoresDesdeCalculadora } from "sections/forms/wizard/calc-previsional/haber-caja/formModel/valoresDesdeGuardado";
import HaberCajaResultado, { HaberCajaEnEdicion } from "./HaberCajaResultado";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { fechaCalculo } from "utils/calculatorDate";

// assets
import { Add, ArrowDown2, Calculator, Trash } from "iconsax-react";

// Misma feature paga que el retroactivo previsional: el hub responde 403 con upgradeRequired si el plan no la tiene
const FEATURE = "calculoPrevisional";

const CLASES: { clase: ClaseServicio; etiqueta: string }[] = [
	{ clase: "n", etiqueta: "Relación de dependencia" },
	{ clase: "m", etiqueta: "Autónomos" },
	{ clase: "p", etiqueta: "Simultáneos" },
];
const TRAMOS: { tramo: TramoServicio; etiqueta: string }[] = [
	{ tramo: "antes", etiqueta: "hasta 6/1994" },
	{ tramo: "despues", etiqueta: "desde 7/1994" },
];
const UNIDADES = [
	["a", "Años"],
	["m", "Meses"],
	["d", "Días"],
] as const;

interface Props {
	/** Carpeta de `?folder=`: el cálculo arranca vinculado a ella. */
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
	/** Haber de caja guardado que se reabre para editar. */
	calculadoraEnEdicion?: any | null;
	onSalirEdicion?: () => void;
	onGuardado?: (modo: "actualizado" | "nuevo") => void;
}

/** Mensajes de error de Formik aplanados (los de las grillas vienen anidados por fila). */
function mensajesDe(errores: unknown, salida: string[] = []): string[] {
	if (!errores) return salida;
	if (typeof errores === "string") {
		if (errores && !salida.includes(errores)) salida.push(errores);
	} else if (Array.isArray(errores)) errores.forEach((e) => mensajesDe(e, salida));
	else if (typeof errores === "object") Object.values(errores as object).forEach((e) => mensajesDe(e, salida));
	return salida;
}

// ---- filas de las grillas (memoizadas: al tipear en una fila no se vuelven a dibujar las demás) ----

interface FilaRemuneracionProps {
	fila: FilaRemuneracionForm;
	indice: number;
	error: any;
	catalogo: CatalogoHaberCaja | null;
	onCambiar: (indice: number, campo: keyof FilaRemuneracionForm, valor: string) => void;
	onQuitar: (id: number) => void;
}

const FilaRemuneracionGrilla = memo(function FilaRemuneracionGrilla({
	fila: f,
	indice: i,
	error,
	catalogo,
	onCambiar,
	onQuitar,
}: FilaRemuneracionProps) {
	const periodo = normalizarPeriodo(f.periodo);
	const automatica = monedaDelPeriodo(catalogo, periodo);
	const elegida = f.moneda ? catalogo?.monedas.find((m) => m.clave === f.moneda) : automatica;
	const normalizar = (campo: "periodo" | "hasta") => {
		const p = normalizarPeriodo(f[campo]);
		if (p && p !== f[campo]) onCambiar(i, campo, p);
	};
	return (
		<TableRow>
			<TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
			<TableCell>
				<TextField
					fullWidth
					size="small"
					placeholder="MM/AAAA"
					value={f.periodo}
					onChange={(e) => onCambiar(i, "periodo", e.target.value)}
					onBlur={() => normalizar("periodo")}
					error={!!error?.periodo || (!!f.periodo.trim() && !periodo)}
					inputProps={{ "aria-label": `Período de la fila ${i + 1}` }}
				/>
			</TableCell>
			<TableCell>
				<TextField
					fullWidth
					size="small"
					placeholder="Un mes"
					value={f.hasta}
					onChange={(e) => onCambiar(i, "hasta", e.target.value)}
					onBlur={() => normalizar("hasta")}
					error={!!error?.hasta}
					inputProps={{ "aria-label": `Hasta de la fila ${i + 1}` }}
				/>
			</TableCell>
			<TableCell>
				<TextField
					fullWidth
					size="small"
					placeholder="0,00"
					value={f.importe}
					onChange={(e) => onCambiar(i, "importe", e.target.value)}
					error={!!error?.importe}
					InputProps={{ startAdornment: <InputAdornment position="start">{elegida?.simbolo || "$"}</InputAdornment> }}
					inputProps={{ inputMode: "decimal", "aria-label": `Importe de la fila ${i + 1}` }}
				/>
			</TableCell>
			<TableCell>
				<TextField
					select
					fullWidth
					size="small"
					value={f.moneda}
					onChange={(e) => onCambiar(i, "moneda", e.target.value)}
					disabled={!catalogo}
					SelectProps={{ native: true }}
					inputProps={{ "aria-label": `Moneda de la fila ${i + 1}` }}
				>
					<option value="">{automatica ? `${automatica.etiqueta} (por el período)` : "Según el período"}</option>
					{(catalogo?.monedas || []).map((m) => (
						<option key={m.clave} value={m.clave}>
							{m.etiqueta}
						</option>
					))}
				</TextField>
			</TableCell>
			<TableCell align="right">
				<Tooltip title="Quitar fila">
					<IconButton size="small" color="error" onClick={() => onQuitar(f.id)} aria-label={`Quitar la fila ${i + 1}`}>
						<Trash size={16} />
					</IconButton>
				</Tooltip>
			</TableCell>
		</TableRow>
	);
});

interface FilaAutonomoProps {
	fila: FilaAutonomoForm;
	indice: number;
	error: any;
	catalogo: CatalogoHaberCaja | null;
	sinEquiparacion: boolean;
	onCambiar: (indice: number, campo: keyof FilaAutonomoForm, valor: string) => void;
	onQuitar: (id: number) => void;
}

const FilaAutonomoGrilla = memo(function FilaAutonomoGrilla({
	fila: f,
	indice: i,
	error,
	catalogo,
	sinEquiparacion,
	onCambiar,
	onQuitar,
}: FilaAutonomoProps) {
	const desde = normalizarPeriodo(f.desde);
	const hasta = normalizarPeriodo(f.hasta);
	const periodoListo = !!desde && !!hasta && hasta >= desde;
	// Las categorías que se ofrecen son las de la época del período (catálogo del hub); el resto queda en «Otras»
	const ofrecidas = periodoListo ? categoriasOfrecidas(catalogo, desde, hasta) : [];
	const otras = (catalogo?.categorias || []).filter((c) => !ofrecidas.some((o) => o.codigo === c.codigo));
	const aviso = periodoListo && f.categoria ? avisoDeCategoria(catalogo, f.categoria, desde, hasta) : null;
	const equiparada = periodoListo && f.categoria && !sinEquiparacion ? equiparacionDeCategoria(catalogo, f.categoria, desde, hasta) : null;
	const cruzaEpocas = periodoListo && !!catalogo && !ofrecidas.length;
	const ayuda =
		error?.categoria ||
		aviso ||
		(equiparada ? `Se computa ${equiparada}.` : null) ||
		(cruzaEpocas && !f.categoria ? "El período cruza épocas con categorías distintas: conviene partirlo." : null);
	const normalizar = (campo: "desde" | "hasta") => {
		const p = normalizarPeriodo(f[campo]);
		if (p && p !== f[campo]) onCambiar(i, campo, p);
	};
	return (
		<TableRow>
			<TableCell sx={{ verticalAlign: "top" }}>
				<TextField
					fullWidth
					size="small"
					placeholder="MM/AAAA"
					value={f.desde}
					onChange={(e) => onCambiar(i, "desde", e.target.value)}
					onBlur={() => normalizar("desde")}
					error={!!error?.desde}
					helperText={error?.desde}
					inputProps={{ "aria-label": `Desde del período de autónomos ${i + 1}` }}
				/>
			</TableCell>
			<TableCell sx={{ verticalAlign: "top" }}>
				<TextField
					fullWidth
					size="small"
					placeholder="MM/AAAA"
					value={f.hasta}
					onChange={(e) => onCambiar(i, "hasta", e.target.value)}
					onBlur={() => normalizar("hasta")}
					error={!!error?.hasta}
					helperText={error?.hasta}
					inputProps={{ "aria-label": `Hasta del período de autónomos ${i + 1}` }}
				/>
			</TableCell>
			<TableCell sx={{ verticalAlign: "top" }}>
				<TextField
					select
					fullWidth
					size="small"
					value={f.categoria}
					onChange={(e) => onCambiar(i, "categoria", e.target.value)}
					disabled={!catalogo}
					error={!!error?.categoria}
					helperText={ayuda}
					FormHelperTextProps={{ sx: { color: error?.categoria ? undefined : aviso ? "warning.dark" : undefined } }}
					SelectProps={{ native: true }}
					inputProps={{ "aria-label": `Categoría del período de autónomos ${i + 1}` }}
				>
					<option value="">{periodoListo ? "Elegí la categoría" : "Cargá el período"}</option>
					{ofrecidas.length > 0 && (
						<optgroup label="Categorías del período">
							{ofrecidas.map((c) => (
								<option key={c.codigo} value={c.codigo}>
									{c.etiqueta}
								</option>
							))}
						</optgroup>
					)}
					<optgroup label={ofrecidas.length ? "Otras categorías" : "Categorías"}>
						{otras.map((c) => (
							<option key={c.codigo} value={c.codigo}>
								{c.etiqueta}
							</option>
						))}
					</optgroup>
				</TextField>
			</TableCell>
			<TableCell align="center" sx={{ verticalAlign: "top" }}>
				{/* El motor todavía no distingue la moratoria: entra con su categoría, valuada a la misma fecha */}
				<Tooltip title="Todavía no cambia el cálculo: la moratoria entra con su categoría">
					<span>
						<Checkbox
							size="small"
							checked={!!f.moratoria}
							disabled
							inputProps={{ "aria-label": `Moratoria del período de autónomos ${i + 1}` }}
						/>
					</span>
				</Tooltip>
			</TableCell>
			<TableCell align="right" sx={{ verticalAlign: "top" }}>
				<Tooltip title="Quitar período">
					<IconButton size="small" color="error" onClick={() => onQuitar(f.id)} aria-label={`Quitar el período de autónomos ${i + 1}`}>
						<Trash size={16} />
					</IconButton>
				</Tooltip>
			</TableCell>
		</TableRow>
	);
});

// ---- formulario ----

interface FormularioProps {
	catalogo: CatalogoHaberCaja | null;
	errorCatalogo: boolean;
	onReintentarCatalogo: () => void;
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
	cargando: boolean;
	onLimpiar: () => void;
}

function Formulario({ catalogo, errorCatalogo, onReintentarCatalogo, folder, onFolderChange, cargando, onLimpiar }: FormularioProps) {
	const { values, errors, submitCount, setFieldValue, setFieldError, getFieldProps } = useFormikContext<HaberCajaValues>();
	// La validación corre al calcular; al corregir una fila marcada se le quita el error para no dejarlo viejo a la vista
	const erroresRef = useRef(errors);
	erroresRef.current = errors;
	const limpiarErrorDeFila = useCallback(
		(grilla: "remuneraciones" | "autonomos", indice: number) => {
			const e = erroresRef.current[grilla];
			if (Array.isArray(e) && e[indice]) setFieldError(`${grilla}[${indice}]`, undefined);
		},
		[setFieldError],
	);
	const [avisoPegado, setAvisoPegado] = useState<string | null>(null);
	const esPension = values.prestacion === "pension";

	// ---- carpeta vinculada (igual que el retroactivo) ----
	const carpetaInicial =
		folder || (values.folderId ? { _id: values.folderId, folderName: values.folderName || "Carpeta vinculada", materia: "" } : null);
	const [metodo, setMetodo] = useState<"manual" | "causa">(carpetaInicial ? "causa" : "manual");
	const [carpeta, setCarpeta] = useState<any>(carpetaInicial);
	useEffect(() => {
		if (folder && folder._id !== carpeta?._id) {
			setCarpeta(folder);
			setMetodo("causa");
			setFieldValue("reclamante", `${CAUSA_VINCULADA}${folder._id}`, false);
			setFieldValue("folderId", folder._id, false);
			setFieldValue("folderName", folder.folderName || "", false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [folder?._id]);
	const cambiarMetodo = (m: "manual" | "causa", datosCarpeta: any, meta?: { folderId: string; folderName: string }) => {
		setMetodo(m);
		setCarpeta(datosCarpeta);
		if (m === "causa" && datosCarpeta) {
			setFieldValue("reclamante", `${CAUSA_VINCULADA}${datosCarpeta._id}`);
			if (meta) {
				setFieldValue("folderId", meta.folderId);
				setFieldValue("folderName", meta.folderName);
			}
			if (onFolderChange && meta?.folderId) onFolderChange(meta.folderId);
		} else {
			setFieldValue("reclamante", "");
			setFieldValue("folderId", "");
			setFieldValue("folderName", "");
			if (onFolderChange) onFolderChange(null);
		}
	};

	// ---- grilla de remuneraciones ----
	const remuneraciones = values.remuneraciones;
	const cargadas = useMemo(() => remuneraciones.filter((f) => !filaRemuneracionVacia(f)).length, [remuneraciones]);
	const cambiarRemuneracion = useCallback(
		(indice: number, campo: keyof FilaRemuneracionForm, valor: string) => {
			setFieldValue(`remuneraciones[${indice}].${campo}`, valor, false);
			limpiarErrorDeFila("remuneraciones", indice);
		},
		[setFieldValue, limpiarErrorDeFila],
	);
	const quitarRemuneracion = useCallback(
		(id: number) =>
			setFieldValue(
				"remuneraciones",
				values.remuneraciones.length > 1 ? values.remuneraciones.filter((f) => f.id !== id) : [nuevaFilaRemuneracion()],
				false,
			),
		[setFieldValue, values.remuneraciones],
	);
	// Pegado desde una planilla: si el texto trae varias celdas (tabulaciones o saltos de línea) se convierte en filas;
	// si es un valor suelto se deja que el campo lo pegue como siempre.
	const pegar = (e: ClipboardEvent<HTMLDivElement>) => {
		const texto = e.clipboardData.getData("text/plain");
		if (!/[\t\n]/.test(texto.trim())) return;
		e.preventDefault();
		const { filas: pegadas, descartadas } = leerFilasPegadas(texto);
		if (!pegadas.length) {
			setAvisoPegado("No se pudo leer ninguna fila de lo pegado. Se esperan dos columnas: período (MM/AAAA o AAAA-MM) e importe.");
			return;
		}
		setFieldValue(
			"remuneraciones",
			[...remuneraciones.filter((f) => !filaRemuneracionVacia(f)), ...pegadas.map((f) => nuevaFilaRemuneracion(f.periodo, f.importe))],
			false,
		);
		setAvisoPegado(
			`Se pegaron ${pegadas.length} ${pegadas.length === 1 ? "fila" : "filas"}` +
				(descartadas
					? ` (${descartadas} ${descartadas === 1 ? "línea descartada" : "líneas descartadas"} por no tener período e importe).`
					: ".") +
				" La moneda de cada una sale del período; revisala si la constancia ya trae los importes convertidos.",
		);
	};

	// ---- grilla de autónomos ----
	const autonomos = values.autonomos;
	const cambiarAutonomo = useCallback(
		(indice: number, campo: keyof FilaAutonomoForm, valor: string) => {
			setFieldValue(`autonomos[${indice}].${campo}`, valor, false);
			limpiarErrorDeFila("autonomos", indice);
		},
		[setFieldValue, limpiarErrorDeFila],
	);
	const quitarAutonomo = useCallback(
		(id: number) =>
			setFieldValue(
				"autonomos",
				values.autonomos.filter((f) => f.id !== id),
				false,
			),
		[setFieldValue, values.autonomos],
	);

	const errorRemuneraciones = typeof errors.remuneraciones === "string" ? errors.remuneraciones : null;
	const errorAutonomos = typeof errors.autonomos === "string" ? errors.autonomos : null;
	const errorServicios = errors.servicios ? mensajesDe(errors.servicios)[0] : null;
	const mensajes = submitCount > 0 ? mensajesDe(errors) : [];
	const hayAutonomos = autonomos.some((f) => !filaAutonomoVacia(f));

	const fecha = (name: keyof HaberCajaValues & string, label: string, ayuda?: string, extra?: object) => (
		<Grid item xs={12} sm={6} md={4} lg={2.4}>
			<InputField
				fullWidth
				type="date"
				name={name}
				label={label}
				InputLabelProps={{ shrink: true }}
				{...(ayuda ? { helperText: getIn(errors, name) || ayuda } : {})}
				{...extra}
			/>
		</Grid>
	);
	const casilla = (name: keyof HaberCajaValues & string, label: string, extra?: object) => (
		<FormControlLabel
			control={<Checkbox checked={!!values[name]} onChange={(e) => setFieldValue(name, e.target.checked)} />}
			label={label}
			{...extra}
		/>
	);

	return (
		<Stack spacing={3}>
			{/* Titular y carpeta */}
			<Box>
				<Typography variant="h5" sx={{ mb: 2 }}>
					Titular
				</Typography>
				<LinkCauseSelector
					requiereField="reclamante"
					requeridoField="folderId"
					onMethodChange={cambiarMetodo}
					initialFolder={carpetaInicial}
				/>
				<Box sx={{ mt: 2 }}>
					{metodo === "causa" && carpeta ? (
						<Paper variant="outlined" sx={{ p: 1.5, borderColor: "primary.main" }}>
							<Typography variant="body1" fontWeight={500}>
								{carpeta.folderName}
							</Typography>
						</Paper>
					) : (
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<InputField fullWidth name="reclamante" label="Titular" placeholder="Apellido y nombre o nombre del caso" />
							</Grid>
						</Grid>
					)}
				</Box>
			</Box>

			<Divider />

			{/* Prestación y fechas */}
			<Box>
				<Typography variant="h5" sx={{ mb: 2 }}>
					Prestación y fechas
				</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={3}>
						<TextField select fullWidth label="Prestación" {...getFieldProps("prestacion")}>
							<MenuItem value="jubilacion">Jubilación</MenuItem>
							<MenuItem value="pension">Pensión directa</MenuItem>
							<MenuItem value="edadAvanzada">Edad avanzada</MenuItem>
						</TextField>
					</Grid>
					{esPension && (
						<Grid item xs={12} sm={6} md={3}>
							<NumberField
								fullWidth
								name="porcentajePension"
								label="Porcentaje de la pensión"
								decimalScale={2}
								helperText="Opcional (p. ej. 70). Vacío: haber del causante."
								InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
							/>
						</Grid>
					)}
					{!esPension && (
						<Grid item xs={12} sm={6} md={3}>
							{casilla("anticipada", "Prestación anticipada")}
						</Grid>
					)}
					{!esPension && values.anticipada && (
						<Grid item xs={12} sm={6} md={3}>
							<NumberField
								fullWidth
								name="anticipadaPorcentaje"
								label="Porcentaje de la anticipada"
								decimalScale={2}
								helperText="Vacío: 50 % (Ley 25.994) u 80 % (Dec. 674/21) según la fecha."
								InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
							/>
						</Grid>
					)}
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							select
							fullWidth
							label="Criterio de cálculo"
							helperText="Convenciones de redondeo y de topes"
							{...getFieldProps("programa")}
						>
							<MenuItem value="ansesPrpa">ANSES (primeros pagos)</MenuItem>
							<MenuItem value="bluecorp">BlueCorp</MenuItem>
						</TextField>
					</Grid>
				</Grid>
				<Grid container spacing={2} sx={{ mt: 0 }}>
					{fecha("fad", esPension ? "Fecha de fallecimiento (FAD)" : "Adquisición del derecho (FAD)")}
					{fecha("cese", "Cese", esPension ? "Opcional en la pensión directa" : undefined)}
					{fecha("solicitud", "Solicitud")}
					{fecha("alta", "Alta")}
					{fecha("acuerdo", "Acuerdo", "Opcional: suma PBU, PC y PAP a ese mes")}
					{/* El motor todavía no la usa (movilidad desde el inicio de pago): visible y deshabilitada */}
					{fecha("inicioPago", "Inicial de pago", "Todavía no interviene en el cálculo", { disabled: true })}
				</Grid>
			</Box>

			<Divider />

			{/* Servicios */}
			<Box>
				<Typography variant="h5" sx={{ mb: 0.5 }}>
					Servicios
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Años, meses y días de la constancia, antes y después de 7/1994 (PC y PAP), por clase de servicio.
				</Typography>
				<TableContainer component={Paper} variant="outlined" sx={{ borderColor: errorServicios ? "error.main" : undefined }}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell />
								{TRAMOS.map((t) => (
									<TableCell key={t.tramo} align="center">
										{t.tramo === "antes" ? "Hasta el 6/1994 (PC)" : "Desde el 7/1994 (PAP)"}
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{CLASES.map((c) => (
								<TableRow key={c.clase}>
									<TableCell sx={{ whiteSpace: "nowrap" }}>{c.etiqueta}</TableCell>
									{TRAMOS.map((t) => (
										<TableCell key={t.tramo}>
											<Stack direction="row" spacing={1}>
												{UNIDADES.map(([u, etiqueta]) => {
													const name = `servicios.${c.clase}.${t.tramo}.${u}`;
													return (
														<TextField
															key={u}
															fullWidth
															size="small"
															placeholder={etiqueta}
															value={getIn(values, name) || ""}
															onChange={(e) => setFieldValue(name, e.target.value.replace(/\D/g, ""), false)}
															error={!!getIn(errors, `servicios.${c.clase}.${t.tramo}`)}
															inputProps={{
																inputMode: "numeric",
																maxLength: 2,
																"aria-label": `${etiqueta} de ${c.etiqueta.toLowerCase()} ${t.etiqueta}`,
															}}
														/>
													);
												})}
											</Stack>
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				{errorServicios && <FormHelperText error>{errorServicios}</FormHelperText>}
				<Grid container spacing={2} sx={{ mt: 0.5 }}>
					<Grid item xs={12} md={6}>
						<TextField
							select
							fullWidth
							label="Servicios excedentes de 35 años (PC)"
							helperText="De qué clase se quitan los meses anteriores a 7/1994 que pasan de 35 años"
							{...getFieldProps("excedente35")}
						>
							<MenuItem value="">Según el criterio de cálculo</MenuItem>
							<MenuItem value="menosFavorable">Los menos favorables</MenuItem>
							<MenuItem value="autonomos">Primero los autónomos</MenuItem>
							<MenuItem value="dependencia">Primero los de dependencia</MenuItem>
							<MenuItem value="ninguno">No quitar</MenuItem>
						</TextField>
					</Grid>
				</Grid>
			</Box>

			<Divider />

			{/* Remuneraciones */}
			<Box>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 1, gap: 1 }}>
					<Typography variant="h5">Remuneraciones</Typography>
					<Stack direction="row" spacing={1}>
						<Button
							size="small"
							color="secondary"
							onClick={() => {
								setFieldValue("remuneraciones", [nuevaFilaRemuneracion()], false);
								setAvisoPegado(null);
							}}
							disabled={!cargadas}
						>
							Vaciar
						</Button>
						<Button
							size="small"
							variant="outlined"
							startIcon={<Add size={16} />}
							onClick={() => setFieldValue("remuneraciones", [...remuneraciones, nuevaFilaRemuneracion()], false)}
						>
							Agregar fila
						</Button>
					</Stack>
				</Stack>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Una fila por mes; para un renglón de varios meses cargá también el «hasta» y el importe total. Varias filas del mismo mes son
					empleadores distintos. La moneda sale sola del período y se puede corregir. Podés copiar dos columnas de una planilla (período e
					importe) y pegarlas sobre la grilla.
				</Typography>
				{avisoPegado && (
					<Alert severity="info" onClose={() => setAvisoPegado(null)} sx={{ mb: 1.5 }}>
						{avisoPegado}
					</Alert>
				)}
				<TableContainer
					component={Paper}
					variant="outlined"
					onPaste={pegar}
					sx={{ maxHeight: 420, borderColor: errors.remuneraciones && submitCount > 0 ? "error.main" : undefined }}
				>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: 48 }}>#</TableCell>
								<TableCell sx={{ minWidth: 110 }}>Período</TableCell>
								<TableCell sx={{ minWidth: 110 }}>Hasta</TableCell>
								<TableCell sx={{ minWidth: 150 }}>Importe</TableCell>
								<TableCell sx={{ minWidth: 220 }}>Moneda</TableCell>
								<TableCell sx={{ width: 48 }} />
							</TableRow>
						</TableHead>
						<TableBody>
							{remuneraciones.map((f, i) => (
								<FilaRemuneracionGrilla
									key={f.id}
									fila={f}
									indice={i}
									error={Array.isArray(errors.remuneraciones) ? errors.remuneraciones[i] : undefined}
									catalogo={catalogo}
									onCambiar={cambiarRemuneracion}
									onQuitar={quitarRemuneracion}
								/>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<Typography variant="caption" color={errorRemuneraciones ? "error" : "text.secondary"} sx={{ display: "block", mt: 1 }}>
					{errorRemuneraciones || `${cargadas} ${cargadas === 1 ? "remuneración cargada" : "remuneraciones cargadas"}`}
				</Typography>
				<Grid container spacing={2} sx={{ mt: 0.5 }}>
					<Grid item xs={12} sm={6} md={3}>
						<InputField fullWidth name="promedioDesde" label="Período del promedio: desde" placeholder="MM/AAAA" />
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<InputField fullWidth name="promedioHasta" label="Período del promedio: hasta" placeholder="MM/AAAA" />
					</Grid>
					<Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
						<Typography variant="caption" color="text.secondary">
							Opcional. El «Período Dde/Hasta» de la constancia: solo las remuneraciones de ese período entran en el promedio. Vacío, entran
							todas las cargadas.
						</Typography>
					</Grid>
				</Grid>
			</Box>

			<Divider />

			{/* Autónomos */}
			<Box>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 1, gap: 1 }}>
					<Typography variant="h5">Aportes autónomos</Typography>
					<Button
						size="small"
						variant="outlined"
						startIcon={<Add size={16} />}
						onClick={() => setFieldValue("autonomos", [...autonomos, nuevaFilaAutonomo()], false)}
					>
						Agregar período
					</Button>
				</Stack>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Un período por categoría, con la categoría histórica (la efectivamente aportada): las que se ofrecen son las de la época del
					período y debajo se muestra cómo se computa. Los años de servicios autónomos y simultáneos se cargan arriba, en Servicios.
				</Typography>
				{errorCatalogo && (
					<Alert
						severity="warning"
						sx={{ mb: 1.5 }}
						action={
							<Button color="inherit" size="small" onClick={onReintentarCatalogo}>
								Reintentar
							</Button>
						}
					>
						No se pudo cargar el catálogo de categorías y monedas. Sin él no se pueden elegir categorías; la moneda de cada remuneración la
						asigna el servidor por el período.
					</Alert>
				)}
				{autonomos.length > 0 && (
					<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={{ minWidth: 120 }}>Desde</TableCell>
									<TableCell sx={{ minWidth: 120 }}>Hasta</TableCell>
									<TableCell sx={{ minWidth: 260 }}>Categoría</TableCell>
									<TableCell align="center" sx={{ width: 90 }}>
										Moratoria
									</TableCell>
									<TableCell sx={{ width: 48 }} />
								</TableRow>
							</TableHead>
							<TableBody>
								{autonomos.map((f, i) => (
									<FilaAutonomoGrilla
										key={f.id}
										fila={f}
										indice={i}
										error={Array.isArray(errors.autonomos) ? errors.autonomos[i] : undefined}
										catalogo={catalogo}
										sinEquiparacion={values.sinEquiparacion}
										onCambiar={cambiarAutonomo}
										onQuitar={quitarAutonomo}
									/>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
				{errorAutonomos && <FormHelperText error>{errorAutonomos}</FormHelperText>}
				<FormControlLabel
					sx={{ mt: 1 }}
					control={
						<Switch
							checked={values.sinEquiparacion}
							onChange={(e) => setFieldValue("sinEquiparacion", e.target.checked)}
							disabled={!hayAutonomos}
						/>
					}
					label="Computar la categoría efectivamente aportada (sin la equiparación del Dec. 1361/80)"
				/>
			</Box>

			<Divider />

			{/* Otras entradas */}
			<Box>
				<Typography variant="h5" sx={{ mb: 2 }}>
					Bonificaciones y convenios
				</Typography>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} md={4}>
						{casilla("zonaAustral", "Bonificación por zona austral (Ley 19.485)")}
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<NumberField
							fullWidth
							name="reciprocidad"
							label="Porcentaje de reciprocidad a cargo de ANSES"
							decimalScale={4}
							helperText="Opcional (p. ej. 81,67). Vacío: sin convenio de reciprocidad."
							InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<TextField
							select
							fullWidth
							label="La reciprocidad se aplica sobre"
							disabled={values.reciprocidad === "" || values.reciprocidad === undefined || values.reciprocidad === null}
							{...getFieldProps("reciprocidadAlcance")}
						>
							<MenuItem value="pbu">Solo la PBU</MenuItem>
							<MenuItem value="todas">PBU, PC y PAP</MenuItem>
						</TextField>
					</Grid>
				</Grid>
			</Box>

			{/* Opciones de cálculo: los ajustes con que se valida la correspondencia con la liquidación de ANSES */}
			<Accordion variant="outlined" disableGutters>
				<AccordionSummary expandIcon={<ArrowDown2 size={16} />}>
					<Typography variant="subtitle1">Opciones de cálculo</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Por defecto el cálculo sigue la norma. Estas opciones reproducen lo que a veces hace ANSES al liquidar, para validar la
						correspondencia con la constancia.
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<TextField select fullWidth label="Remuneraciones actualizadas al mes de" {...getFieldProps("mesActualizacion")}>
								<MenuItem value="cesacion">La cesación (norma)</MenuItem>
								<MenuItem value="acuerdo">El acuerdo</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} sm={6}>
							<TextField select fullWidth label="Divisor del promedio de remuneraciones" {...getFieldProps("divisorW")}>
								<MenuItem value="">Según el criterio de cálculo</MenuItem>
								<MenuItem value="meses">Meses con remuneración (hasta 120)</MenuItem>
								<MenuItem value="120">Siempre 120</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} sm={6}>
							{casilla("topeArt9", "Tope del art. 9 sobre la remuneración del mes")}
						</Grid>
						<Grid item xs={12} sm={6}>
							{casilla("topeArt14", "Tope del máximo a la cesación sobre la remuneración actualizada")}
						</Grid>
						<Grid item xs={12} sm={6}>
							{casilla("aplicarMaximo", "Aplicar el haber máximo")}
						</Grid>
						<Grid item xs={12} sm={6}>
							{casilla("aplicarMinimo", "Incluir en el haber el complemento al haber mínimo")}
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>

			{mensajes.length > 0 && (
				<Alert severity="error">
					<AlertTitle>Revisá los datos antes de calcular</AlertTitle>
					<Box component="ul" sx={{ m: 0, pl: 2.5 }}>
						{mensajes.slice(0, 8).map((m) => (
							<li key={m}>{m}</li>
						))}
						{mensajes.length > 8 && <li>y {mensajes.length - 8} más</li>}
					</Box>
				</Alert>
			)}

			{/* Acciones */}
			<Stack direction="row" spacing={1.5} justifyContent="flex-end">
				<Button color="secondary" onClick={onLimpiar} disabled={cargando}>
					Limpiar
				</Button>
				<Button
					variant="contained"
					type="submit"
					disabled={cargando}
					startIcon={cargando ? <CircularProgress size={16} color="inherit" /> : <Calculator size={18} />}
				>
					{cargando ? "Calculando…" : "Calcular"}
				</Button>
			</Stack>
		</Stack>
	);
}

// ==============================|| HABER DE CAJA: FORMULARIO Y RESULTADO ||============================== //

export default function HaberCajaCalculadora({ folder, onFolderChange, calculadoraEnEdicion, onSalirEdicion, onGuardado }: Props) {
	const [catalogo, setCatalogo] = useState<CatalogoHaberCaja | null>(null);
	const [errorCatalogo, setErrorCatalogo] = useState(false);
	const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
	const [calculo, setCalculo] = useState<{ respuesta: HaberCajaRespuesta; input: HaberCajaInput; values: HaberCajaValues } | null>(null);
	const [mejorarPlan, setMejorarPlan] = useState(false);
	const { subscription, hasFeatureLocal } = useSubscription();
	// Sin suscripción cargada todavía no se bloquea: decide el hub
	const sinAcceso = !!subscription && !hasFeatureLocal(FEATURE);

	// Catálogo del hub: categorías de autónomos por época y moneda de curso legal por período
	const cargarCatalogo = useCallback(async () => {
		setErrorCatalogo(false);
		try {
			setCatalogo(await obtenerCatalogoHaberCaja());
		} catch {
			setErrorCatalogo(true);
		}
	}, []);
	useEffect(() => {
		cargarCatalogo();
	}, [cargarCatalogo]);

	const esquema = useMemo(() => crearValidationSchema(catalogo), [catalogo]);

	// Edición de un guardado: valores iniciales desde `variables.formulario` (o `input` como respaldo)
	const valoresEdicion = useMemo(
		() => (calculadoraEnEdicion ? valoresDesdeCalculadora(calculadoraEnEdicion) : null),
		[calculadoraEnEdicion],
	);
	const enEdicion: HaberCajaEnEdicion | null =
		calculadoraEnEdicion && valoresEdicion
			? { id: calculadoraEnEdicion._id, fecha: calculadoraEnEdicion.date, titular: calculadoraEnEdicion.user || "" }
			: null;
	const [iniciales] = useState<HaberCajaValues>(() => valoresEdicion || valoresIniciales());

	async function calcular(values: HaberCajaValues, acciones: FormikHelpers<HaberCajaValues>) {
		if (sinAcceso) {
			setMejorarPlan(true);
			acciones.setSubmitting(false);
			return;
		}
		setErrorCalculo(null);
		try {
			const input = armarEntradaHaberCaja(values, catalogo);
			const respuesta = await calcularHaberCaja(input);
			if (!respuesta?.resultado) throw new Error("El servidor no devolvió el resultado del cálculo");
			setCalculo({ respuesta, input, values });
		} catch (error: any) {
			if (error?.response?.status === 403 && error?.response?.data?.upgradeRequired) {
				setMejorarPlan(true);
				return;
			}
			setCalculo(null);
			setErrorCalculo(error?.response?.data?.mensaje || error?.mensaje || error?.message || "No se pudo calcular el haber de caja");
		} finally {
			acciones.setSubmitting(false);
		}
	}

	return (
		<Stack spacing={3}>
			<Typography variant="body2" color="text.secondary">
				Haber inicial de la Ley 24.241 (PBU + PC + PAP) tal como lo liquida ANSES, a partir de las fechas, los servicios, las remuneraciones
				y los aportes autónomos de la constancia de primeros pagos. FAD desde 7/1994.
			</Typography>

			{enEdicion && (
				<Alert
					severity="warning"
					action={
						<Button color="inherit" size="small" onClick={onSalirEdicion} sx={{ textTransform: "none" }}>
							Descartar edición
						</Button>
					}
				>
					Estás editando el haber de caja guardado del {enEdicion.fecha ? fechaCalculo(enEdicion.fecha) : "—"}
					{enEdicion.titular ? ` (${enEdicion.titular})` : ""}. Los cambios no se aplican hasta que guardes.
				</Alert>
			)}
			{calculadoraEnEdicion && !valoresEdicion && (
				<Alert severity="info">Este cálculo no se puede reabrir para editar. Podés cargar uno nuevo.</Alert>
			)}
			{sinAcceso && (
				<Alert severity="info">
					El cálculo del haber de caja está disponible en los planes Estándar, Pro y Premium. Podés cargar los datos; para calcular, mejorá
					tu plan.
				</Alert>
			)}
			<LimitErrorModal
				open={mejorarPlan}
				onClose={() => setMejorarPlan(false)}
				message="Para calcular el haber de caja necesitás un plan pago."
				featureInfo={{ feature: "Haber de caja", plan: subscription?.plan || "free", availableIn: ["standard", "pro", "premium"] }}
				upgradeRequired={true}
			/>

			<Formik initialValues={iniciales} validationSchema={esquema} onSubmit={calcular} validateOnChange={false} validateOnBlur={true}>
				{({ isSubmitting, resetForm }) => (
					<Form id={FORM_ID} noValidate>
						<Formulario
							catalogo={catalogo}
							errorCatalogo={errorCatalogo}
							onReintentarCatalogo={cargarCatalogo}
							folder={folder}
							onFolderChange={onFolderChange}
							cargando={isSubmitting}
							onLimpiar={() => {
								resetForm({ values: valoresIniciales() });
								setErrorCalculo(null);
								setCalculo(null);
								if (onFolderChange) onFolderChange(null);
							}}
						/>
					</Form>
				)}
			</Formik>

			{errorCalculo && (
				<Alert severity="error" onClose={() => setErrorCalculo(null)}>
					<AlertTitle>No se pudo calcular</AlertTitle>
					{errorCalculo}
				</Alert>
			)}

			{calculo && (
				<HaberCajaResultado
					respuesta={calculo.respuesta}
					input={calculo.input}
					values={calculo.values}
					enEdicion={enEdicion}
					onGuardado={onGuardado}
				/>
			)}
		</Stack>
	);
}
