/**
 * /validar y /validar/:codigo — Validación PÚBLICA de un documento emitido por Law||Analytics.
 *
 * Es el destino del QR que llevan los PDF del retroactivo previsional. Sin login: muestra los totales registrados
 * al emitir el documento para que quien tiene el papel los compare. El hub devuelve el titular con iniciales y el
 * expediente con sus últimos dígitos (law-analytics-server, GET /api/public/validaciones/:codigo).
 */

import { FormEvent, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { TickCircle } from "iconsax-react";

import SEO from "components/SEO/SEO";
import { TIPO_PAGO_LABELS, TipoPago } from "services/previsionalService";
import { codigoCompleto, consultarValidacion, normalizarCodigo, ResultadoConsulta } from "services/validacionService";

const money = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);

/** YYYY-MM-DD → DD/MM/AAAA. */
const fecha = (f?: string | null) => (f && /^\d{4}-\d{2}-\d{2}/.test(f) ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : f || "-");

/** ISO con hora → DD/MM/AAAA HH:mm en hora local. */
const fechaHora = (iso?: string | null) => {
	if (!iso) return "-";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = (n: number) => String(n).padStart(2, "0");
	return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const labelPago = (tipo?: string | null) => (tipo && TIPO_PAGO_LABELS[tipo as TipoPago]) || "Pago a cuenta";

const Dato = ({ k, v }: { k: string; v: React.ReactNode }) => (
	<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0, sm: 2 }} sx={{ py: 0.75 }}>
		<Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: 150 } }}>
			{k}
		</Typography>
		<Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
			{v}
		</Typography>
	</Stack>
);

const FilaImporte = ({ label, monto, destacado }: { label: string; monto: number; destacado?: boolean }) => (
	<Stack
		direction="row"
		justifyContent="space-between"
		alignItems="baseline"
		spacing={2}
		sx={{
			py: destacado ? 1.25 : 0.75,
			px: destacado ? 1.5 : 0,
			mt: destacado ? 1 : 0,
			borderRadius: 1,
			bgcolor: destacado ? "success.lighter" : "transparent",
			borderBottom: destacado ? "none" : "1px solid",
			borderColor: "divider",
		}}
	>
		<Typography variant={destacado ? "subtitle1" : "body2"} sx={{ fontWeight: destacado ? 700 : 400 }}>
			{label}
		</Typography>
		<Typography
			variant={destacado ? "h5" : "body2"}
			sx={{ fontWeight: destacado ? 700 : 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
		>
			{money(monto)}
		</Typography>
	</Stack>
);

const FormularioCodigo = ({ inicial = "" }: { inicial?: string }) => {
	const navigate = useNavigate();
	const [codigo, setCodigo] = useState(normalizarCodigo(inicial));
	const completo = codigoCompleto(codigo);

	const enviar = (e: FormEvent) => {
		e.preventDefault();
		if (completo) navigate(`/validar/${codigo}`);
	};

	return (
		<Box component="form" onSubmit={enviar} noValidate>
			<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
				<TextField
					label="Código de validación"
					placeholder="XXXX-XXXX-XXXX"
					value={codigo}
					onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
					fullWidth
					autoFocus={!inicial}
					autoComplete="off"
					inputProps={{
						"aria-label": "Código de validación",
						spellCheck: false,
						autoCapitalize: "characters",
						style: { fontFamily: "monospace", letterSpacing: 2, fontSize: 18 },
					}}
					helperText="Está en el recuadro con el QR de la primera hoja y en el pie de cada página."
				/>
				<Button type="submit" variant="contained" size="large" disabled={!completo} sx={{ minWidth: 120, height: 48 }}>
					Validar
				</Button>
			</Stack>
		</Box>
	);
};

const ResultadoValidacion = ({ codigo }: { codigo: string }) => {
	const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);

	useEffect(() => {
		let cancelado = false;
		setResultado(null);
		consultarValidacion(codigo).then((r) => {
			if (!cancelado) setResultado(r);
		});
		return () => {
			cancelado = true;
		};
	}, [codigo]);

	if (!resultado) {
		return (
			<Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
				<CircularProgress />
				<Typography color="text.secondary">Consultando el código {codigo}…</Typography>
			</Stack>
		);
	}

	if (resultado.estado !== "valido") {
		const mensaje =
			resultado.estado === "no_encontrado"
				? `No encontramos un documento con el código ${codigo}. Revisá que esté bien escrito.`
				: resultado.estado === "demasiadas_consultas"
				? "Hiciste muchas consultas seguidas; esperá un minuto."
				: "No pudimos consultar el código en este momento. Probá de nuevo en unos minutos.";
		return (
			<Stack spacing={3}>
				<Alert severity={resultado.estado === "no_encontrado" ? "error" : "warning"}>{mensaje}</Alert>
				<FormularioCodigo inicial={resultado.estado === "no_encontrado" ? codigo : ""} />
			</Stack>
		);
	}

	const d = resultado.documento;
	return (
		<Stack spacing={3}>
			<Box>
				<Chip
					color="success"
					icon={<TickCircle size={18} variant="Bold" />}
					label="Documento verificado"
					sx={{ fontWeight: 600, mb: 1.5 }}
				/>
				<Typography variant="h4" component="h1">
					Retroactivo previsional
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", letterSpacing: 1, mt: 0.5 }}>
					{d.codigo}
				</Typography>
			</Box>

			<Box>
				<Dato k="Titular" v={d.titular || "-"} />
				<Dato k="Expediente" v={d.expediente || "-"} />
				<Dato k="Prestación" v={d.prestacion || "-"} />
				<Dato k="Período" v={`${fecha(d.desde)} – ${fecha(d.cierre)}`} />
				<Dato k="Tasa de interés" v={d.tasa || "-"} />
				{d.haberReajustado && <Dato k="Haber reajustado" v={`${money(d.haberReajustado.reclamado)} (${d.haberReajustado.periodo})`} />}
			</Box>

			<Box>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
					Totales
				</Typography>
				<FilaImporte label="Capital" monto={d.totales.capital} />
				<FilaImporte label="Intereses" monto={d.totales.intereses} />
				<FilaImporte label="Total" monto={d.totales.total} />
				<FilaImporte label="Pagos a cuenta" monto={d.totales.pagado ? -d.totales.pagado : 0} />
				<FilaImporte label={`Saldo al ${fecha(d.cierre)}`} monto={d.totales.saldo} destacado />
			</Box>

			{d.pagos && d.pagos.length > 0 && (
				<Box>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
						Pagos a cuenta
					</Typography>
					{d.pagos.map((p, i) => (
						<Stack
							key={`${p.fecha}-${i}`}
							direction="row"
							justifyContent="space-between"
							spacing={2}
							sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
						>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="body2">{fecha(p.fecha)}</Typography>
								<Typography variant="caption" color="text.secondary">
									{labelPago(p.tipo)}
								</Typography>
							</Box>
							<Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
								{money(p.importe)}
							</Typography>
						</Stack>
					))}
				</Box>
			)}

			<Divider />
			<Stack spacing={0.5}>
				<Typography variant="body2" color="text.secondary">
					Emitido el {fechaHora(d.emitidoEn)}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
					Huella:{" "}
					<Box component="span" sx={{ fontFamily: "monospace" }}>
						{d.huellaCorta}
					</Box>
				</Typography>
			</Stack>
			<Alert severity="info" variant="outlined">
				Por privacidad, el titular se muestra con iniciales y el expediente con sus últimos dígitos. Compará estos importes con los del
				documento que tenés.
			</Alert>
			<Button component={RouterLink} to="/validar" variant="text" sx={{ alignSelf: "flex-start" }}>
				Validar otro código
			</Button>
		</Stack>
	);
};

const ValidarDocumento = () => {
	const { codigo: codigoUrl } = useParams<{ codigo?: string }>();
	const codigo = codigoUrl ? normalizarCodigo(codigoUrl) : "";

	return (
		<Box component="section" sx={{ pt: { xs: 12, md: 15 }, pb: { xs: 6, md: 10 }, bgcolor: "background.default", minHeight: "70vh" }}>
			<SEO
				title="Validar documento | Law Analytics"
				description="Comprobá que los totales de un documento emitido por Law||Analytics coinciden con los registrados."
				path={codigo ? `/validar/${codigo}` : "/validar"}
				noindex
			/>
			<Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
				<Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
					{codigo ? (
						<ResultadoValidacion codigo={codigo} />
					) : (
						<Stack spacing={3}>
							<Box>
								<Typography variant="h4" component="h1" gutterBottom>
									Validar documento
								</Typography>
								<Typography color="text.secondary">
									Ingresá el código de validación que figura en el documento para ver los totales que registró Law||Analytics al emitirlo.
								</Typography>
							</Box>
							<FormularioCodigo />
						</Stack>
					)}
				</Paper>
			</Container>
		</Box>
	);
};

export default ValidarDocumento;
