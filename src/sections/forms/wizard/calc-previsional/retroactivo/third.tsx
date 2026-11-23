import React, { useEffect, useState } from "react";
import {
	Grid,
	InputLabel,
	Typography,
	Box,
	alpha,
	useTheme,
	FormControl,
	Select,
	MenuItem,
	FormHelperText,
	Button,
	IconButton,
	Stack,
	Alert,
	Paper,
	Radio,
	Collapse,
	Checkbox,
	FormControlLabel,
	Divider,
} from "@mui/material";
import { Add, Trash, Setting2 } from "iconsax-react";
import { useFormikContext } from "formik";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const INDICES_MOVILIDAD = [
	{ value: "aumentos_generales_anses", label: "Aumentos Generales ANSES por movilidad" },
	{ value: "recomposicion_ley_27426", label: "Recomposición Ley 27.426 — Torelli (salto único en 1/2021)" },
	{ value: "ley_27426_diferido_6_meses", label: "Continuidad Ley 27.426 — IPC+RIPTE mes a mes" },
	{
		value: "art4_dnu_274_24_con_27426_junio",
		label: "Art. 4 DNU 274/24 abr-jun 2024; en junio, además, el 45,88 % de la Ley 27.426 (Galletta)",
	},
	{
		value: "empalme_27426_dnu_70_30_julio_2024",
		label: "Empalme Ley 27.426 – DNU 274/24: 70 % IPC y 30 % RIPTE de enero-abril 2024, en julio de 2024 (Galletta)",
	},
	{
		value: "mayor_27426_o_general",
		label: "El mayor entre la Ley 27.426 y el aumento general, por trimestre, 3/2021 a 3/2024 (Galletta con piso)",
	},
	{
		value: "aguirre_ipc_trimestral",
		label: "Aguirre: IPC de octubre-diciembre 2023 en marzo 2024 y de enero-marzo 2024 en junio 2024",
	},
	{ value: "aumento_mar_2021_sem2_2020", label: "Aumento Marzo 2021 por segundo semestre 2020 (Cortes)" },
	{ value: "ipc_trimestral_retrasado_3m", label: "IPC trimestral retrasado 3 meses (Cortes)" },
	{ value: "badaro_isal", label: "Índice de salarios INDEC (Badaro), anual hasta 12/2006" },
	{ value: "ngr_extendido", label: "Nivel General de las Remuneraciones extendido (Sánchez), mensual hasta 03/1995" },
	{ value: "aumentos_porcentuales", label: "Aumentos generales ANSES, solo el porcentaje (sin sumas fijas)" },
	{ value: "sin_movilidad", label: "Sin movilidad" },
];

interface PatronMovilidad {
	value: string;
	label: string;
	descripcion: string;
	generaTramos: (fechaInicial: string) => MovilidadCriterio[];
	// El precedente dice que el reajuste no puede dejar un haber menor que el cobrado: al elegir el patrón se enciende
	// la opción "el haber reclamado no puede ser inferior al percibido" (el usuario la puede apagar).
	noInferiorAlPercibido?: boolean;
}

const PATRONES: PatronMovilidad[] = [
	{
		value: "aumentos_generales",
		label: "Solo aumentos generales ANSES",
		descripcion: "Aplica los aumentos generales ANSES en todo el período, sin doctrinas adicionales.",
		generaTramos: (fechaInicial) => [{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial }],
	},
	{
		value: "badaro",
		label: "Badaro — índice de salarios INDEC hasta 12/2006",
		descripcion:
			"Sin movilidad hasta 12/2001 → índice de salarios INDEC (nivel general, anual) hasta 12/2006 → aumentos generales desde 1/2007.",
		generaTramos: (fechaInicial) => {
			const fi = dayjs(fechaInicial, "DD/MM/YYYY");
			const tramos: MovilidadCriterio[] = [];
			if (fi.isValid() && fi.isBefore(dayjs("2002-01-01"))) {
				tramos.push({ indiceMovilidad: "sin_movilidad", fechaDesde: fechaInicial });
				tramos.push({ indiceMovilidad: "badaro_isal", fechaDesde: "01/01/2002" });
			} else tramos.push({ indiceMovilidad: "badaro_isal", fechaDesde: fechaInicial });
			tramos.push({ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/01/2007" });
			return tramos;
		},
	},
	{
		value: "sanchez_badaro",
		label: "Sánchez y Badaro — remuneraciones hasta 03/1995 e índice de salarios hasta 12/2006",
		descripcion:
			"Nivel general de las remuneraciones (extendido) hasta 03/1995 → sin movilidad hasta 12/2001 → índice de salarios INDEC (anual) hasta 12/2006 → aumentos generales desde 1/2007.",
		generaTramos: (fechaInicial) => {
			const fi = dayjs(fechaInicial, "DD/MM/YYYY");
			const tramos: MovilidadCriterio[] = [];
			if (fi.isValid() && fi.isBefore(dayjs("1995-04-01"))) {
				tramos.push({ indiceMovilidad: "ngr_extendido", fechaDesde: fechaInicial });
				tramos.push({ indiceMovilidad: "sin_movilidad", fechaDesde: "01/04/1995" });
			} else if (fi.isValid() && fi.isBefore(dayjs("2002-01-01")))
				tramos.push({ indiceMovilidad: "sin_movilidad", fechaDesde: fechaInicial });
			tramos.push({
				indiceMovilidad: "badaro_isal",
				fechaDesde: fi.isValid() && fi.isAfter(dayjs("2002-01-01")) ? fechaInicial : "01/01/2002",
			});
			tramos.push({ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/01/2007" });
			return tramos;
		},
	},
	{
		value: "torelli",
		label: "Recomposición Ley 27.426 — Torelli",
		descripcion: "Aumentos generales hasta 12/2020 → recomposición Torelli en 1/2021 (salto único) → aumentos generales desde 2/2021.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/02/2021" },
		],
	},
	{
		value: "continuidad",
		label: "Continuidad Ley 27.426",
		descripcion: "Aumentos generales hasta 1/2020 → Ley 27.426 mes a mes (2/2020 - 1/2021) → aumentos generales desde 2/2021.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/02/2020" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/02/2021" },
		],
	},
	{
		value: "cortes",
		label: "Precedente Cortes, Leonardo Evaristo",
		descripcion:
			"Aumentos generales hasta 12/2020 → recomposición Torelli en 1/2021 → aumento Marzo 2021 (segundo semestre 2020) → IPC trimestral retrasado 3 meses (4/2021 - 3/2024) → aumentos generales desde 4/2024.",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumento_mar_2021_sem2_2020", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "ipc_trimestral_retrasado_3m", fechaDesde: "01/04/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/04/2024" },
		],
	},
	// ── Movilidad 2021-2024: "Galletta" (CFSS Sala II, 13/11/2026) y "Aguirre" (Sala III, 5/11/2026) ──────────────
	// Galletta ordena la ley 27.426 "de manera continua desde enero de 2021 hasta junio de 2024 inclusive, para empalmar
	// a partir de allí con el régimen actual (decreto 274/2024)". Cómo se empalma admite varias lecturas; cada patrón
	// es una de las opciones que ofrece BlueCorp y da lo mismo que BlueCorp mes a mes (validado el 23/11/2026, ver
	// law-analytics-server/docs/PREVISIONAL_RETROACTIVO.md). El resultado cambia mucho de uno a otro.
	// `noInferiorAlPercibido`: cons. V de Galletta, la pauta "en modo alguno puede resultar en un haber inferior al que
	// hubiera correspondido por la aplicación de las disposiciones vigentes". Se enciende en los patrones donde algún
	// mes el reclamado queda por debajo de lo cobrado (BlueCorp no tiene esa opción: para comparar con una planilla de
	// BlueCorp hay que destildarla).
	{
		value: "galletta",
		label: "Precedente Galletta — Ley 27.426 hasta 6/2024",
		descripcion:
			"Aumentos generales hasta 12/2020 → recomposición Torelli en 1/2021 → Ley 27.426 (IPC+RIPTE) hasta 6/2024, en lugar de la ley 27.609 → aumentos generales (decreto 274/24) desde 7/2024. En abril y mayo de 2024 el haber no aumenta y en junio sube 45,88 %. Es la lectura más baja. En BlueCorp: «Galletta, Sala II (27426 desde 01/2021, con recomposición 2020 a enero 2021)».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/07/2024" },
		],
		noInferiorAlPercibido: true, // 4 y 5/2024 quedan por debajo de lo cobrado
	},
	{
		value: "galletta_sin_recomposicion",
		label: "Precedente Galletta — Ley 27.426 hasta 6/2024, sin recomposición de 2020",
		descripcion:
			"Igual que el anterior pero sin el salto de enero de 2021 por la movilidad suspendida en 2020: la Ley 27.426 arranca en 1/2021 sobre el haber cobrado. Suele quedar por debajo de lo percibido en muchos meses. En BlueCorp: «Galletta, Sala II (27426 desde 01/2021, sin recomposición)».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/07/2024" },
		],
		noInferiorAlPercibido: true,
	},
	{
		// La ley 27.426 se corta en 3/2024; en abril, mayo y junio rigen los aumentos del art. 4 del DNU y en junio,
		// además, el 45,88 % de la 27.426 (que refleja octubre-diciembre de 2023; los del DNU, febrero-abril de 2024).
		value: "galletta_dnu",
		label: "Precedente Galletta — con art. 4 DNU 274/24 en abril-junio de 2024",
		descripcion:
			"Igual que Galletta hasta 3/2024; en abril, mayo y junio de 2024 suma los aumentos del art. 4 del DNU 274/24 y en junio, además, el 45,88 % de la Ley 27.426 → aumentos generales desde 7/2024. El haber de junio de 2024 queda mucho más alto que con el primer patrón. En BlueCorp: «Galletta, Sala II: 27426 + integración 2020 + art. 4 DNU 274/24 abr-jun 2024» (la de «Continuar con fallo Galletta»).",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "art4_dnu_274_24_con_27426_junio", fechaDesde: "01/04/2024" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/07/2024" },
		],
		noInferiorAlPercibido: true, // en haberes bajos, 6 a 11/2022 quedan apenas por debajo de lo cobrado
	},
	{
		value: "galletta_empalme",
		label: "Precedente Galletta — con empalme 70/30 en julio de 2024",
		descripcion:
			"Igual que Galletta hasta 6/2024; en julio de 2024 suma, sobre el aumento general, el 70 % de la variación del IPC y el 30 % de la del RIPTE de enero-abril de 2024 (el período que la Ley 27.426 dejaba sin cubrir) → aumentos generales desde 8/2024. Es la lectura más alta. En BlueCorp: «Galletta, Sala II, con recomposición 2020 y empalme 70/30 ene-abr 2024».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "empalme_27426_dnu_70_30_julio_2024", fechaDesde: "01/07/2024" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/08/2024" },
		],
		noInferiorAlPercibido: true, // 4 y 5/2024 quedan por debajo de lo cobrado
	},
	{
		value: "galletta_empalme_sin_recomposicion",
		label: "Precedente Galletta — con empalme 70/30, sin recomposición de 2020",
		descripcion:
			"Como el anterior, sin el salto de enero de 2021: Ley 27.426 desde 1/2021 hasta 6/2024 y empalme 70/30 en julio de 2024. En BlueCorp: «Galletta, Sala II, sin recomposición, con empalme 70/30 ene-abr 2024».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "ley_27426_diferido_6_meses", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "empalme_27426_dnu_70_30_julio_2024", fechaDesde: "01/07/2024" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/08/2024" },
		],
		noInferiorAlPercibido: true,
	},
	{
		// No queda por debajo de lo cobrado en ningún mes: no enciende "no inferior al percibido".
		value: "galletta_piso",
		label: "Precedente Galletta — con piso trimestral (el mayor entre Ley 27.426 y ANSES)",
		descripcion:
			"Recomposición Torelli en 1/2021 y, de 3/2021 a 3/2024, en cada trimestre el aumento más alto entre el de la Ley 27.426 y el general de ANSES → aumentos generales desde 4/2024. Nunca queda por debajo de lo cobrado. En BlueCorp: «Galletta con piso trimestral: el mayor entre 27426 y ANSeS (Soroet)».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "mayor_27426_o_general", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/04/2024" },
		],
	},
	{
		// CFSS Sala III, "Aguirre" (5/11/2026); la mayoría de "Pena" (Sala I, 17/11/2026) sigue la misma pauta.
		value: "aguirre",
		label: "Precedente Aguirre — IPC trimestral en marzo y junio de 2024",
		descripcion:
			"Aumentos generales hasta 2/2024; en marzo de 2024 el IPC de octubre-diciembre de 2023 (53,29 %) en lugar del aumento de la ley 27.609, abril y mayo sin aumento, y en junio el IPC de enero-marzo de 2024 (51,62 %) → aumentos generales desde 7/2024. Es también la pauta de la mayoría en Pena. En BlueCorp: «Aguirre, Jorge Alberto (trimestral)».",
		generaTramos: (fechaInicial) => [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: fechaInicial },
			{ indiceMovilidad: "aguirre_ipc_trimestral", fechaDesde: "01/03/2024" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/07/2024" },
		],
		noInferiorAlPercibido: true, // 4 y 5/2024 quedan por debajo de lo cobrado
	},
];

// Detecta el patrón a partir de los criterios actuales (solo por estructura de índices, ignorando fechas).
// Devuelve "personalizado" si la combinación no matchea ningún patrón conocido.
const detectarPatron = (criterios: MovilidadCriterio[]): string => {
	if (!Array.isArray(criterios) || criterios.length === 0) return "personalizado";
	const indices = criterios.map((c) => c?.indiceMovilidad);
	if (indices.length === 1 && indices[0] === "aumentos_generales_anses") return "aumentos_generales";
	if (indices[0] === "ngr_extendido" && indices.slice(-2).join() === "badaro_isal,aumentos_generales_anses" && indices.length <= 4)
		return "sanchez_badaro";
	if (indices[indices.length - 1] === "aumentos_generales_anses" && indices[indices.length - 2] === "badaro_isal" && indices.length <= 3)
		return "badaro";
	if (
		indices.length === 3 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "recomposicion_ley_27426" &&
		indices[2] === "aumentos_generales_anses"
	)
		return "torelli";
	if (
		indices.length === 3 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "ley_27426_diferido_6_meses" &&
		indices[2] === "aumentos_generales_anses"
	)
		// misma estructura en dos patrones: los distingue desde cuándo rige la ley 27.426 (2/2020 o 1/2021)
		return String(criterios[1]?.fechaDesde || "").endsWith("/2021") ? "galletta_sin_recomposicion" : "continuidad";
	if (
		indices.length === 5 &&
		indices[0] === "aumentos_generales_anses" &&
		indices[1] === "recomposicion_ley_27426" &&
		indices[2] === "aumento_mar_2021_sem2_2020" &&
		indices[3] === "ipc_trimestral_retrasado_3m" &&
		indices[4] === "aumentos_generales_anses"
	)
		return "cortes";
	if (indices.join() === "aumentos_generales_anses,recomposicion_ley_27426,ley_27426_diferido_6_meses,aumentos_generales_anses")
		return "galletta";
	if (
		indices.join() ===
		"aumentos_generales_anses,recomposicion_ley_27426,ley_27426_diferido_6_meses,art4_dnu_274_24_con_27426_junio,aumentos_generales_anses"
	)
		return "galletta_dnu";
	const G = "aumentos_generales_anses";
	const R = "recomposicion_ley_27426";
	const L = "ley_27426_diferido_6_meses";
	const porEstructura: Record<string, string> = {
		[[G, R, L, "empalme_27426_dnu_70_30_julio_2024", G].join()]: "galletta_empalme",
		[[G, L, "empalme_27426_dnu_70_30_julio_2024", G].join()]: "galletta_empalme_sin_recomposicion",
		[[G, R, "mayor_27426_o_general", G].join()]: "galletta_piso",
		[[G, "aguirre_ipc_trimestral", G].join()]: "aguirre",
	};
	if (porEstructura[indices.join()]) return porEstructura[indices.join()];
	return "personalizado";
};

interface MovilidadCriterio {
	indiceMovilidad: string;
	fechaDesde: string;
}

interface ThirdFormProps {
	formField: any;
}

export default function ThirdForm({ formField }: ThirdFormProps) {
	const { criteriosMovilidad } = formField;

	const theme = useTheme();
	const { values, setFieldValue, errors, touched, submitCount } = useFormikContext<any>();

	const criterios: MovilidadCriterio[] = values[criteriosMovilidad.name] || [];
	const detectado = detectarPatron(criterios);
	const isPersonalizado = detectado === "personalizado";

	const [avanzado, setAvanzado] = useState(isPersonalizado);

	// Auto-inicialización del primer renderizado: si los criterios están vacíos (placeholder)
	// y haberPagadoAl está disponible, populamos con el patrón "aumentos_generales" por default.
	useEffect(() => {
		const sinDatos = criterios.length === 0 || (criterios.length === 1 && !criterios[0]?.indiceMovilidad && !criterios[0]?.fechaDesde);
		const fechaInicial = values.haberReclamadoAl || values.haberPagadoAl;
		if (sinDatos && fechaInicial) {
			const patronDef = PATRONES.find((p) => p.value === "aumentos_generales");
			if (patronDef) {
				setFieldValue(criteriosMovilidad.name, patronDef.generaTramos(fechaInicial));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Si el detectado es "personalizado", abrir avanzado automáticamente.
	useEffect(() => {
		if (isPersonalizado) setAvanzado(true);
	}, [isPersonalizado]);

	const handlePatronChange = (nuevoPatron: string) => {
		const patronDef = PATRONES.find((p) => p.value === nuevoPatron);
		if (!patronDef) return;
		const fechaInicial = values.haberReclamadoAl || values.haberPagadoAl || criterios[0]?.fechaDesde || "";
		setFieldValue(criteriosMovilidad.name, patronDef.generaTramos(fechaInicial));
		// cada patrón deja la opción como le corresponde: tildada si el criterio queda por debajo de lo cobrado en algún mes
		setFieldValue("noInferiorAlPercibido", !!patronDef.noInferiorAlPercibido);
	};

	const handleAddCriterio = () => {
		setFieldValue(criteriosMovilidad.name, [...criterios, { indiceMovilidad: "", fechaDesde: "" }]);
	};

	const handleRemoveCriterio = (index: number) => {
		const updated = criterios.filter((_, i) => i !== index);
		setFieldValue(criteriosMovilidad.name, updated);
	};

	const handleCriterioChange = (index: number, field: keyof MovilidadCriterio, value: string) => {
		const updated = criterios.map((c, i) => (i === index ? { ...c, [field]: value } : c));
		setFieldValue(criteriosMovilidad.name, updated);
	};

	const criterioErrors = (errors[criteriosMovilidad.name] as any[]) || [];
	const criterioTouched = (touched[criteriosMovilidad.name] as any[]) || [];
	const rootError = typeof errors[criteriosMovilidad.name] === "string" ? errors[criteriosMovilidad.name] : null;

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
				Criterios Aplicables a la Movilidad
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
				Elegí el patrón legal que aplica al reclamo. Si tu caso requiere algo no contemplado, podés ajustar los tramos en "Configuración
				avanzada".
			</Typography>

			{/* Selector visual de patrones */}
			<Stack spacing={1} sx={{ mb: 2 }}>
				{PATRONES.map((p) => {
					const isSelected = detectado === p.value;
					return (
						<Paper
							key={p.value}
							elevation={0}
							onClick={() => handlePatronChange(p.value)}
							sx={{
								p: 2,
								cursor: "pointer",
								border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
								bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : "background.paper",
								borderRadius: 1,
								transition: "border-color 0.2s, background-color 0.2s",
								"&:hover": {
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<Stack direction="row" alignItems="flex-start" spacing={1.5}>
								<Radio checked={isSelected} size="small" sx={{ p: 0, mt: 0.4 }} />
								<Box flex={1}>
									<Typography variant="subtitle2" fontWeight={isSelected ? 600 : 500}>
										{p.label}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
										{p.descripcion}
									</Typography>
								</Box>
							</Stack>
						</Paper>
					);
				})}
			</Stack>

			{isPersonalizado && (
				<Alert severity="info" sx={{ mb: 2 }}>
					Configuración personalizada — los tramos definidos no coinciden con ningún patrón predefinido. Editalos abajo en configuración
					avanzada.
				</Alert>
			)}

			{/* Toggle de configuración avanzada */}
			<Box sx={{ mb: 2 }}>
				<Button
					variant="text"
					size="small"
					startIcon={<Setting2 size={16} />}
					onClick={() => setAvanzado(!avanzado)}
					disabled={isPersonalizado}
				>
					{avanzado ? "Ocultar" : "Mostrar"} configuración avanzada
				</Button>
			</Box>

			<Collapse in={avanzado || isPersonalizado}>
				<Box>
					{(rootError || (submitCount > 0 && typeof errors[criteriosMovilidad.name] === "string")) && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{rootError as string}
						</Alert>
					)}

					<Stack spacing={2}>
						{criterios.map((criterio, index) => {
							const errIndice = criterioErrors[index]?.indiceMovilidad;
							const errFecha = criterioErrors[index]?.fechaDesde;
							const touchedIndice = criterioTouched[index]?.indiceMovilidad;
							const touchedFecha = criterioTouched[index]?.fechaDesde;

							return (
								<Paper
									key={index}
									elevation={0}
									sx={{
										p: 2,
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 1,
										bgcolor: index % 2 === 0 ? theme.palette.background.paper : alpha(theme.palette.primary.main, 0.02),
									}}
								>
									<Stack direction="row" alignItems="flex-start" spacing={1}>
										<Box sx={{ flex: 1 }}>
											<Grid container spacing={2} alignItems="flex-start">
												{/* Número de período */}
												<Grid item xs={12}>
													<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
														<Box
															sx={{
																width: 24,
																height: 24,
																borderRadius: "50%",
																bgcolor: "primary.main",
																color: "primary.contrastText",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																fontSize: "0.75rem",
																fontWeight: 700,
																flexShrink: 0,
															}}
														>
															{index + 1}
														</Box>
														<Typography variant="subtitle2" color="text.secondary">
															{index === 0 ? "Período inicial" : `Período ${index + 1}`}
														</Typography>
													</Stack>
												</Grid>

												{/* Índice de movilidad */}
												<Grid item xs={12} md={6}>
													<InputLabel>Índice de Movilidad *</InputLabel>
													<FormControl fullWidth error={!!(touchedIndice && errIndice)}>
														<Select
															value={criterio.indiceMovilidad}
															onChange={(e) => handleCriterioChange(index, "indiceMovilidad", e.target.value)}
															displayEmpty
														>
															<MenuItem value="" disabled>
																<Typography color="text.secondary">Seleccione un índice</Typography>
															</MenuItem>
															{INDICES_MOVILIDAD.map((idx) => (
																<MenuItem key={idx.value} value={idx.value}>
																	{idx.label}
																</MenuItem>
															))}
														</Select>
														{touchedIndice && errIndice && <FormHelperText>{errIndice}</FormHelperText>}
													</FormControl>
												</Grid>

												{/* Fecha desde */}
												<Grid item xs={12} md={6}>
													<InputLabel>Fecha de inicio *</InputLabel>
													<Box>
														<DateInputField name={`${criteriosMovilidad.name}[${index}].fechaDesde`} />
													</Box>
													{index > 0 && criterios[index - 1]?.fechaDesde && (
														<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
															Debe ser posterior a {criterios[index - 1].fechaDesde}
														</Typography>
													)}
													{touchedFecha && errFecha && (
														<Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
															{errFecha}
														</Typography>
													)}
												</Grid>
											</Grid>
										</Box>

										{/* Botón eliminar */}
										{criterios.length > 1 && (
											<IconButton onClick={() => handleRemoveCriterio(index)} size="small" color="error" sx={{ mt: 3.5, flexShrink: 0 }}>
												<Trash size={18} />
											</IconButton>
										)}
									</Stack>
								</Paper>
							);
						})}
					</Stack>

					<Box sx={{ mt: 2 }}>
						<Button variant="outlined" startIcon={<Add size={16} />} onClick={handleAddCriterio} size="small">
							Agregar criterio
						</Button>
					</Box>
				</Box>
			</Collapse>

			<Divider sx={{ my: 3 }} />

			<Typography variant="h6" gutterBottom>
				Particularidades del haber reclamado
			</Typography>
			<FormControlLabel
				control={<Checkbox checked={!!values.zonaAustral} onChange={(e) => setFieldValue("zonaAustral", e.target.checked)} />}
				label="Bonificación por zona austral (las sumas fijas y el haber máximo se multiplican por 1,4)"
			/>
			<FormControlLabel
				sx={{ display: "flex", mt: 0.5 }}
				control={
					<Checkbox checked={!!values.noInferiorAlPercibido} onChange={(e) => setFieldValue("noInferiorAlPercibido", e.target.checked)} />
				}
				label="El haber reclamado no puede ser inferior al percibido"
			/>
			<Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4, mb: 1 }}>
				Si en algún mes el criterio elegido da un haber menor que el que se cobró, se toma el haber percibido: ese mes queda sin diferencia
				en lugar de restar del total. Usalo cuando la sentencia dice que el reajuste no puede disminuir el haber (por ejemplo, Galletta). Si
				lo dejás destildado, los meses en que el reclamado es menor se descuentan del capital. El resultado te avisa en qué meses pasó.
			</Typography>
			{values.prestacion === "pension_derivada" && (
				<Grid container spacing={2.5} sx={{ mt: 0.5 }}>
					<Grid item xs={12} md={6}>
						<InputLabel>Fecha de fallecimiento del causante</InputLabel>
						<DateInputField name="pensionFecha" />
						<FormHelperText>Desde ese mes el haber reclamado se multiplica por el porcentaje de la pensión.</FormHelperText>
					</Grid>
					<Grid item xs={12} md={6}>
						<InputLabel>Porcentaje de la pensión</InputLabel>
						<NumberField
							allowNegative={false}
							decimalScale={2}
							fullWidth
							placeholder="70"
							name="pensionPorcentaje"
							InputProps={{ endAdornment: "%" }}
						/>
						<FormHelperText>Dejalo vacío si el haber reclamado ya es el de la pensión.</FormHelperText>
					</Grid>
				</Grid>
			)}
		</>
	);
}
