import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Autocomplete, Box, Grid, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import MainCard from "components/MainCard";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import LiquidacionWizard, { LiquidacionPrefill } from "sections/forms/wizard/calc-liquidacion";
import { dispatch, useSelector } from "store";
import { getCalculatorsByUserId } from "store/reducers/calculator";
import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import type { CalculatorType } from "types/calculator";

const ORIGEN: Record<string, string> = {
	despido: "de despido",
	liquidacion: "de liquidación final",
	"liquidación final": "de liquidación final",
	art: "de riesgos del trabajo",
	intereses: "de intereses",
	previsional: "previsional",
	retroactivo: "de retroactivo previsional",
};
const pesos = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
const red2 = (n: number) => Math.round(n * 100) / 100;
const capitalDe = (c: CalculatorType) => red2(Number(c.capital) || Math.max(0, (Number(c.amount) || 0) - (Number(c.interest) || 0)));
// Los cálculos de intereses guardan en subClassType la tasa (p. ej. "TasaPasivaBCRA"), no el tipo
const tipoDe = (c: CalculatorType): string => {
	const sub = String(c.subClassType || "");
	if (ORIGEN[sub]) return sub;
	const v: any = c.variables || {};
	if (c.classType === "intereses" || v.tasa || v.segments?.length) return "intereses";
	return sub || c.classType || "";
};

/** Precarga de la liquidación desde un cálculo guardado (lo mismo que hace "Practicar liquidación" desde su resultado). */
function prefillDe(c: CalculatorType): LiquidacionPrefill {
	const v: any = c.variables || {};
	let segments: any[] = (v.segmentsIntereses?.length ? v.segmentsIntereses : v.datosIntereses?.segments || v.segments) || [];
	// cálculo de intereses de una sola tasa: se arma el tramo con sus fechas
	if (!segments.length && tipoDe(c) === "intereses" && v.tasa && v.fechaInicial && v.fechaFinal) {
		segments = [{ startDate: v.fechaInicial, endDate: v.fechaFinal, rate: v.tasa, capital: capitalDe(c), interest: 0, coefficient: 0 }];
	}
	const fecha = c.date ? dayjs(c.date).format("DD/MM/YYYY") : "";
	return {
		capital: capitalDe(c),
		segments: segments.map((s, i) => ({ ...s, id: s.id || `guardado-${i}` })),
		capitalizeInterest: !!(v.capitalizeInterest || v.datosIntereses?.capitalizeInterest),
		folderId: c.folderId || null,
		folderName: c.folderName || null,
		origen: `guardado ${ORIGEN[tipoDe(c)] || ""}${fecha ? ` del ${fecha}` : ""}`.replace(/\s+/g, " ").trim(),
	};
}

// Liquidación encadenada: capital, intereses, pagos a cuenta, honorarios, IVA y tasa de justicia.
function LiquidacionLayout() {
	const location = useLocation();
	const desdeOtroCalculo = !!(location.state as any)?.liquidacion;
	const user = useSelector((state: any) => state.auth.user);
	const calculators: CalculatorType[] = useSelector((state: any) => state.calculator.calculators) || [];
	const [elegido, setElegido] = useState<CalculatorType | null>(null);

	useEffect(() => {
		if (!desdeOtroCalculo && user?._id) dispatch(getCalculatorsByUserId(user._id) as any);
	}, [desdeOtroCalculo, user?._id]);

	// Cálculos que pueden ser el capital de una liquidación (no las liquidaciones ya hechas)
	const opciones = useMemo(
		() =>
			calculators
				.filter((c) => c.type === "Calculado" && c.classType !== "liquidacion" && capitalDe(c) > 0)
				.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))),
		[calculators],
	);

	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<MainCard>
						<Stack spacing={0.5} sx={{ mb: 2 }}>
							<Typography sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 600, letterSpacing: "-0.02em" }}>
								Liquidación judicial
							</Typography>
							<Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
								La planilla que se presenta después de la sentencia (en el fuero laboral nacional, art. 132 de la Ley 18.345): lleva el
								capital de condena a una fecha de corte y le suma o descuenta todo lo que corresponde.
							</Typography>
						</Stack>

						<Box
							sx={{ p: 2, mb: 2.5, borderRadius: 1.5, bgcolor: alpha(BRAND_BLUE, 0.05), border: `1px solid ${alpha(BRAND_BLUE, 0.15)}` }}
						>
							<Typography sx={{ fontWeight: 600, fontSize: "0.9rem", mb: 0.75 }}>Qué calcula</Typography>
							<Typography variant="body2" component="div" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
								1. <strong>Capital</strong>: el monto de condena (por ejemplo, el total de un despido o de un retroactivo previsional).
								<br />
								2. <strong>Intereses</strong> desde la mora hasta la fecha de corte, por tramos de tasas.
								<br />
								3. <strong>Pagos a cuenta</strong>: se descuentan en la fecha en que se hicieron, primero de intereses y después de capital
								(art. 903 CCyC).
								<br />
								4. <strong>Honorarios</strong> de los profesionales en UMA (Ley 27.423), con IVA si corresponde.
								<br />
								5. <strong>Tasa de justicia</strong> y otros conceptos (gastos, peritos).
								<br />
								El resultado es el total a pagar a esa fecha, con el detalle de cada rubro.
							</Typography>
							<Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
								Si ya hiciste el cálculo del capital, usá el botón <strong>Practicar liquidación</strong> en su resultado o elegilo abajo:
								se cargan el capital y los tramos de intereses.
							</Typography>
						</Box>

						{!desdeOtroCalculo && (
							<Autocomplete
								sx={{ mb: 3, maxWidth: 640 }}
								options={opciones}
								value={elegido}
								onChange={(_, c) => setElegido(c)}
								getOptionLabel={(c) =>
									[
										(ORIGEN[tipoDe(c)] || tipoDe(c)).replace(/^de /, "").replace(/^\w/, (l) => l.toUpperCase()),
										c.folderName || "sin carpeta",
										c.date ? dayjs(c.date).format("DD/MM/YYYY") : "",
										`capital ${pesos(capitalDe(c))}`,
									]
										.filter(Boolean)
										.join(" · ")
								}
								isOptionEqualToValue={(a, b) => a._id === b._id}
								noOptionsText="No hay cálculos guardados con capital"
								renderInput={(params) => (
									<TextField
										{...params}
										size="small"
										label="Partir de un cálculo guardado (opcional)"
										helperText="O cargá el capital a mano en los datos de la liquidación."
									/>
								)}
							/>
						)}

						<LiquidacionWizard key={elegido?._id || "manual"} prefill={elegido ? prefillDe(elegido) : undefined} />
					</MainCard>
				</Grid>
			</Grid>
		</>
	);
}
export default LiquidacionLayout;
