import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { ArrowLeft2, DocumentDownload, Save2 } from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { pdf } from "@react-pdf/renderer";

import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { dispatch, useSelector } from "store";
import { addCalculator } from "store/reducers/calculator";
import { useTeam } from "contexts/TeamContext";
import LiquidacionPDF from "components/calculator/LiquidacionPDF";
import { componentesDeLiquidacion, LiquidacionInput, LiquidacionResultado } from "services/liquidacionService";
import type { InterestSegment } from "components/calculator/InterestSegmentsManager";

const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const fecha = (f: string) => dayjs.utc(f).format("DD/MM/YYYY");
const numero = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);

interface Props {
	resultado: LiquidacionResultado;
	input: LiquidacionInput;
	segments: InterestSegment[];
	folderId: string | null;
	folderName: string | null;
	descripcion: string;
	onVolver: () => void;
}

const Fila = ({ concepto, monto, fuerte, detalle }: { concepto: string; monto: number; fuerte?: boolean; detalle?: string }) => (
	<TableRow>
		<TableCell sx={{ fontWeight: fuerte ? 700 : 400 }}>
			{concepto}
			{detalle && (
				<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
					{detalle}
				</Typography>
			)}
		</TableCell>
		<TableCell align="right" sx={{ fontWeight: fuerte ? 700 : 400, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
			{money(monto)}
		</TableCell>
	</TableRow>
);

const LiquidacionResultados = ({ resultado: r, input, segments, folderId, folderName, descripcion, onVolver }: Props) => {
	const user = useSelector((state: any) => state.auth.user);
	const { rates } = useSelector((state: any) => state.interestRates);
	const { getRequestHeaders } = useTeam();
	const [guardando, setGuardando] = useState(false);
	const [guardado, setGuardado] = useState(false);
	const tasasLabels: Record<string, string> = Object.fromEntries((rates || []).map((t: any) => [t.value, t.label]));

	const descargarPDF = async () => {
		const blob = await pdf(
			<LiquidacionPDF resultado={r} tasasLabels={tasasLabels} titulo="Liquidación" caratula={folderName || descripcion} />,
		).toBlob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `liquidacion-${r.fechaCorte}.pdf`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const guardar = async () => {
		const userId = user?._id || user?.id;
		if (!userId) return enqueueSnackbar("No se encontró el usuario", { variant: "error" });
		setGuardando(true);
		const res: any = await dispatch(
			addCalculator(
				{
					userId,
					date: dayjs().format("YYYY-MM-DD"),
					type: "Calculado",
					classType: "liquidacion",
					subClassType: "liquidacion",
					amount: r.totales.general,
					capital: r.credito.capitalOriginal,
					interest: r.credito.interesesDevengados,
					user: user?.name || user?.email || "Usuario",
					description: descripcion || undefined,
					...(folderId ? { folderId } : {}),
					...(folderName ? { folderName } : {}),
					componentes: componentesDeLiquidacion(r),
					variables: { input, resultado: r, segments },
				} as any,
				{ headers: getRequestHeaders() },
			),
		);
		setGuardando(false);
		if (res?.success) {
			setGuardado(true);
			enqueueSnackbar("Liquidación guardada", { variant: "success" });
		} else {
			enqueueSnackbar(res?.error || "No se pudo guardar la liquidación", { variant: "error" });
		}
	};

	return (
		<Box>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent="space-between"
				alignItems={{ sm: "center" }}
				spacing={1}
				sx={{ mb: 2 }}
			>
				<Typography sx={{ fontWeight: 600, fontSize: "1.05rem" }}>Liquidación al {fecha(r.fechaCorte)}</Typography>
				<Stack direction="row" spacing={1}>
					<Button size="small" startIcon={<ArrowLeft2 size={16} />} onClick={onVolver} sx={{ textTransform: "none" }}>
						Modificar
					</Button>
					<Button
						size="small"
						variant="outlined"
						startIcon={<DocumentDownload size={16} />}
						onClick={descargarPDF}
						sx={{ textTransform: "none" }}
					>
						PDF
					</Button>
					<Button
						size="small"
						variant="contained"
						disabled={guardando || guardado}
						startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : <Save2 size={16} />}
						onClick={guardar}
						sx={{ bgcolor: BRAND_BLUE, textTransform: "none" }}
					>
						{guardado ? "Guardada" : "Guardar"}
					</Button>
				</Stack>
			</Stack>

			{r.avisos.map((a, i) => (
				<Alert severity="warning" key={i} sx={{ mb: 1 }}>
					{a}
				</Alert>
			))}

			<Typography sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}>Intereses por tramo</Typography>
			<Box sx={{ overflowX: "auto" }}>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Período</TableCell>
							<TableCell>Tasa</TableCell>
							<TableCell align="right">Capital</TableCell>
							<TableCell align="right">Intereses</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{r.credito.tramos.map((t: any, i: number) => (
							<TableRow key={i}>
								<TableCell sx={{ whiteSpace: "nowrap" }}>
									{fecha(t.desde)} – {fecha(t.hasta)}
								</TableCell>
								<TableCell>
									{t.tipo === "simple" ? `Tasa fija ${numero(t.tasaFija)} %` : tasasLabels[t.tasa] || t.tasa}
									{t.capitalizacion && t.capitalizacion !== "none" ? " (capitalización anual)" : ""}
									{t.comparativaCER?.disponible
										? ` · tope art. 55 Ley 27.802 (${t.comparativaCER.criterio === "ipc" ? "IPC" : "CER"} + 3 %)`
										: ""}
								</TableCell>
								<TableCell align="right">{money(t.capital)}</TableCell>
								<TableCell align="right">{money(t.interesEfectivo)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Box>

			<Typography sx={{ fontWeight: 600, mt: 3, mb: 0.5 }}>Resumen</Typography>
			<Table size="small">
				<TableBody>
					<Fila concepto="Capital" monto={r.credito.capitalOriginal} />
					<Fila concepto="Intereses" monto={r.credito.interesesDevengados} />
					{r.credito.pagos.map((p, i) => (
						<Fila
							key={i}
							concepto={`${p.concepto || "Pago a cuenta"} (${fecha(p.fecha)})`}
							monto={-(p.aIntereses + p.aCapital)}
							detalle={`${money(p.aIntereses)} a intereses y ${money(p.aCapital)} a capital`}
						/>
					))}
					<Fila concepto="Saldo del crédito" monto={r.totales.credito} fuerte />
					{r.honorarios.map((h, i) => (
						<React.Fragment key={i}>
							<Fila
								concepto={`Honorarios${h.profesional ? " " + h.profesional : ""}`}
								monto={h.honorario}
								detalle={[
									`${numero(h.unidades)} ${h.unidad} · ${numero(h.porcentaje)} % de ${money(h.base)} · UMA ${money(h.valorUnidad)}`,
									h.piso?.aplicado ? "piso del art. 21" : "",
									h.minimo?.aplicado ? `mínimo de ${h.minimo.unidades} UMA` : "",
									...h.ajustes.map((a) => a.motivo),
								]
									.filter(Boolean)
									.join(" · ")}
							/>
							{h.iva > 0 && <Fila concepto={`IVA ${h.ivaAlicuota} % sobre honorarios`} monto={h.iva} />}
						</React.Fragment>
					))}
					{r.tasaJusticia && (
						<Fila
							concepto="Tasa de justicia"
							monto={r.tasaJusticia.monto}
							detalle={`Tributo · ${numero(r.tasaJusticia.alicuota)} % sobre ${money(r.tasaJusticia.base)} (${r.tasaJusticia.norma})${
								r.tasaJusticia.yaAbonada ? ` · menos ${money(r.tasaJusticia.yaAbonada)} ya abonados` : ""
							}`}
						/>
					)}
					{r.otros.map((o, i) => (
						<Fila key={i} concepto={o.concepto} monto={o.monto} />
					))}
					<Fila concepto="Total de la liquidación" monto={r.totales.general} fuerte />
				</TableBody>
			</Table>
			<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
				Verificá tasas, criterios de capitalización y honorarios con lo dispuesto en la sentencia antes de presentar la liquidación.
			</Typography>
		</Box>
	);
};

export default LiquidacionResultados;
