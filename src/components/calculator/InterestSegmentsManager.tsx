import React, { useState, useEffect, useCallback } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	CircularProgress,
	Collapse,
	FormControlLabel,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
	Alert,
	Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Add, Trash, Calculator, Edit2, TickCircle, CloseCircle } from "iconsax-react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import "dayjs/locale/es";

// Types
export type InterestType = "indexed" | "simple";
export type RatePeriod = "daily" | "monthly" | "annual";
export type CapitalizationFrequency = "none" | "monthly" | "quarterly" | "semiannual" | "annual";

export interface InterestSegment {
	id: string;
	startDate: string;
	endDate: string;
	rate: string;
	rateName?: string;
	capital: number;
	interest: number;
	coefficient: number;
	isExtension?: boolean;
	isCalculated?: boolean;
	// Campos para interés simple
	interestType?: InterestType;
	simpleRate?: number;
	ratePeriod?: RatePeriod;
	capitalizationFrequency?: CapitalizationFrequency;
}

export interface InterestRate {
	label: string;
	value: string;
	fechaInicio: Date;
	fechaUltima: Date;
}

interface InterestSegmentsManagerProps {
	capital: number;
	initialDate?: string;
	segments: InterestSegment[];
	onSegmentsChange: (segments: InterestSegment[]) => void;
	availableRates: InterestRate[];
	disabled?: boolean;
	capitalizeInterest: boolean;
	onCapitalizeChange: (capitalize: boolean) => void;
	onTotalChange?: (total: { interest: number; amount: number }) => void;
}

const MAX_SEGMENTS = 10;

// Opciones de período para interés simple
const RATE_PERIODS: { value: RatePeriod; label: string; daysPerPeriod: number }[] = [
	{ value: "daily", label: "Diario", daysPerPeriod: 1 },
	{ value: "monthly", label: "Mensual", daysPerPeriod: 30 },
	{ value: "annual", label: "Anual", daysPerPeriod: 365 },
];

// Opciones de capitalización para interés simple
const CAPITALIZATION_OPTIONS: { value: CapitalizationFrequency; label: string; months: number }[] = [
	{ value: "none", label: "Sin capitalización", months: 0 },
	{ value: "monthly", label: "Mensual", months: 1 },
	{ value: "quarterly", label: "Trimestral", months: 3 },
	{ value: "semiannual", label: "Semestral", months: 6 },
	{ value: "annual", label: "Anual", months: 12 },
];

// Helper para obtener días por período
const getDaysPerPeriod = (period: RatePeriod): number => {
	return RATE_PERIODS.find((p) => p.value === period)?.daysPerPeriod || 365;
};

// Helper para calcular días entre fechas
const calculateDaysBetween = (startDate: string, endDate: string): number => {
	const start = dayjs(startDate, "DD/MM/YYYY");
	const end = dayjs(endDate, "DD/MM/YYYY");
	return end.diff(start, "day"); // Diferencia exacta de días
};

// Helper para calcular interés simple con capitalización opcional
const calculateSimpleInterest = (
	capital: number,
	rate: number,
	ratePeriod: RatePeriod,
	startDate: string,
	endDate: string,
	capitalizationFrequency: CapitalizationFrequency = "none",
): { interest: number; coefficient: number; details?: any } => {
	const start = dayjs(startDate, "DD/MM/YYYY");
	const end = dayjs(endDate, "DD/MM/YYYY");
	const daysPerPeriod = getDaysPerPeriod(ratePeriod);
	const rateDecimal = rate / 100;

	// Sin capitalización: cálculo simple
	if (capitalizationFrequency === "none") {
		const days = end.diff(start, "day");
		const coefficient = (rateDecimal * days) / daysPerPeriod;
		const interest = Math.round(capital * coefficient);
		return { interest, coefficient };
	}

	// Con capitalización: calcular por períodos
	const capOption = CAPITALIZATION_OPTIONS.find((c) => c.value === capitalizationFrequency);
	const monthsPerPeriod = capOption?.months || 12;

	let currentDate = start.clone();
	let accumulatedCapital = capital;
	let totalInterest = 0;
	const periods: any[] = [];

	while (currentDate.isBefore(end)) {
		// Calcular fecha fin del período de capitalización
		let periodEnd = currentDate.add(monthsPerPeriod, "month");

		// Si el período excede la fecha final, usar la fecha final
		if (periodEnd.isAfter(end)) {
			periodEnd = end;
		}

		// Calcular días del período
		const periodDays = periodEnd.diff(currentDate, "day");

		// Calcular interés del período
		const periodCoefficient = (rateDecimal * periodDays) / daysPerPeriod;
		const periodInterest = Math.round(accumulatedCapital * periodCoefficient);

		periods.push({
			start: currentDate.format("DD/MM/YYYY"),
			end: periodEnd.format("DD/MM/YYYY"),
			days: periodDays,
			capital: accumulatedCapital,
			interest: periodInterest,
			coefficient: periodCoefficient,
		});

		totalInterest += periodInterest;

		// Capitalizar: agregar interés al capital para el siguiente período
		accumulatedCapital += periodInterest;

		// Mover al siguiente período
		currentDate = periodEnd;
	}

	// Coeficiente total efectivo
	const totalCoefficient = totalInterest / capital;

	return {
		interest: totalInterest,
		coefficient: totalCoefficient,
		details: {
			periods,
			finalCapital: accumulatedCapital,
			capitalizationFrequency,
		},
	};
};

// Helper para generar ID único
const generateId = () => `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper para formatear moneda
const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
	}).format(value);
};

// Helper para obtener nombre de tasa
const getRateName = (rateValue: string, rates: InterestRate[]): string => {
	const rate = rates.find((r) => r.value === rateValue);
	return rate?.label || rateValue;
};

// Helper para validar fecha dentro del rango de la tasa
const isDateInRateRange = (date: string, rate: string, rates: InterestRate[]): boolean => {
	const rateConfig = rates.find((r) => r.value === rate);
	if (!rateConfig) return false;

	const dateObj = dayjs(date, "DD/MM/YYYY");
	const inicio = dayjs(rateConfig.fechaInicio);
	const ultima = dayjs(rateConfig.fechaUltima);

	return dateObj.isAfter(inicio.subtract(1, "day")) && dateObj.isBefore(ultima.add(1, "day"));
};

const InterestSegmentsManager: React.FC<InterestSegmentsManagerProps> = ({
	capital,
	initialDate,
	segments,
	onSegmentsChange,
	availableRates,
	disabled = false,
	capitalizeInterest,
	onCapitalizeChange,
	onTotalChange,
}) => {
	const theme = useTheme();
	const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
	const [editingSegment, setEditingSegment] = useState<Partial<InterestSegment> | null>(null);
	const [isCalculating, setIsCalculating] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [newSegment, setNewSegment] = useState<Partial<InterestSegment>>({
		interestType: "indexed",
		ratePeriod: "annual",
		capitalizationFrequency: "none",
	});

	// Calcular totales cuando cambian los segmentos o la capitalización
	useEffect(() => {
		if (onTotalChange && segments.length > 0) {
			const totalInterest = segments.reduce((sum, seg) => sum + (seg.interest || 0), 0);
			const lastSegment = segments[segments.length - 1];
			const finalAmount = capitalizeInterest ? (lastSegment?.capital || capital) + (lastSegment?.interest || 0) : capital + totalInterest;

			onTotalChange({ interest: totalInterest, amount: finalAmount });
		}
	}, [segments, capitalizeInterest, capital, onTotalChange]);

	// Calcular intereses para un segmento específico
	const calculateSegmentInterest = useCallback(
		async (segment: Partial<InterestSegment>, segmentCapital: number): Promise<{ interest: number; coefficient: number } | null> => {
			if (!segment.startDate || !segment.endDate || !segment.rate) {
				setError("Debe completar todos los campos del tramo");
				return null;
			}

			try {
				const baseURL = process.env.REACT_APP_BASE_URL || "";
				const url = `${baseURL}/api/tasas/consulta?fechaDesde=${segment.startDate}&fechaHasta=${segment.endDate}&campo=${segment.rate}&calcular=true`;

				const response = await axios.get(url, { withCredentials: true });

				if (response.data.resultado !== undefined) {
					const coefficient = response.data.resultado;
					const interest = Math.round(segmentCapital * coefficient);
					return { interest, coefficient };
				}

				// Formato legado (array)
				if (Array.isArray(response.data)) {
					const totalInterest = response.data.reduce(
						(sum: number, item: any) => sum + (typeof item.interes === "number" ? item.interes : 0),
						0,
					);
					return { interest: totalInterest, coefficient: totalInterest / segmentCapital };
				}

				return null;
			} catch (err: any) {
				const errorMsg = err.response?.data?.message || err.message || "Error al calcular intereses";
				setError(errorMsg);
				return null;
			}
		},
		[],
	);

	// Obtener el capital para un segmento según si hay capitalización
	const getCapitalForSegment = useCallback(
		(index: number): number => {
			if (!capitalizeInterest || index === 0) {
				return capital;
			}

			// Capitalización: sumar capital + intereses de segmentos anteriores
			let accumulatedCapital = capital;
			for (let i = 0; i < index; i++) {
				if (segments[i]?.isCalculated) {
					accumulatedCapital += segments[i].interest || 0;
				}
			}
			return accumulatedCapital;
		},
		[capital, capitalizeInterest, segments],
	);

	// Agregar nuevo segmento
	const handleAddSegment = () => {
		if (segments.length >= MAX_SEGMENTS) {
			setError(`Máximo ${MAX_SEGMENTS} tramos permitidos`);
			return;
		}

		// Determinar fecha inicial del nuevo segmento
		let defaultStartDate = "";

		if (segments.length > 0) {
			// Si hay segmentos previos, el nuevo empieza el día después del último
			const lastSegment = segments[segments.length - 1];
			if (lastSegment.endDate) {
				defaultStartDate = dayjs(lastSegment.endDate, "DD/MM/YYYY").add(1, "day").format("DD/MM/YYYY");
			}
		} else if (initialDate) {
			// Solo usar initialDate si se proporciona explícitamente (ej: fecha de egreso en laboral)
			defaultStartDate = initialDate;
		}
		// Si es el primer segmento y no hay initialDate, dejar vacío para que el usuario elija

		setNewSegment({
			startDate: defaultStartDate,
			endDate: "",
			rate: "",
			interestType: "indexed",
			simpleRate: undefined,
			ratePeriod: "annual",
			capitalizationFrequency: "none",
		});
		setIsAddingNew(true);
		setError(null);
	};

	// Guardar nuevo segmento
	const handleSaveNewSegment = async () => {
		const isSimpleInterest = newSegment.interestType === "simple";

		// Validar campos según el tipo de interés
		if (!newSegment.startDate || !newSegment.endDate) {
			setError("Debe completar las fechas");
			return;
		}

		if (isSimpleInterest) {
			if (newSegment.simpleRate === undefined || newSegment.simpleRate <= 0) {
				setError("Debe ingresar una tasa de interés válida");
				return;
			}
			if (!newSegment.ratePeriod) {
				setError("Debe seleccionar el período de la tasa");
				return;
			}
		} else {
			if (!newSegment.rate) {
				setError("Debe seleccionar una tasa de interés");
				return;
			}
			// Validar fechas dentro del rango de la tasa
			if (!isDateInRateRange(newSegment.startDate, newSegment.rate, availableRates)) {
				setError("La fecha inicial está fuera del rango disponible para la tasa seleccionada");
				return;
			}
			if (!isDateInRateRange(newSegment.endDate, newSegment.rate, availableRates)) {
				setError("La fecha final está fuera del rango disponible para la tasa seleccionada");
				return;
			}
		}

		// Validar que fecha final sea mayor que inicial
		if (dayjs(newSegment.endDate, "DD/MM/YYYY").isBefore(dayjs(newSegment.startDate, "DD/MM/YYYY"))) {
			setError("La fecha final debe ser posterior a la fecha inicial");
			return;
		}

		// Validar que no haya superposición con el tramo anterior
		if (segments.length > 0) {
			const lastSegment = segments[segments.length - 1];
			const lastEndDate = dayjs(lastSegment.endDate, "DD/MM/YYYY");
			const newStartDate = dayjs(newSegment.startDate, "DD/MM/YYYY");

			// La fecha de inicio del nuevo tramo debe ser posterior a la fecha de fin del anterior
			if (newStartDate.isBefore(lastEndDate) || newStartDate.isSame(lastEndDate)) {
				setError(`La fecha inicial debe ser posterior al ${lastSegment.endDate} (fin del tramo anterior)`);
				return;
			}

			// Advertir si hay un gap grande entre tramos (más de 1 día)
			const expectedStartDate = lastEndDate.add(1, "day");
			if (newStartDate.isAfter(expectedStartDate)) {
				// Solo advertencia, pero permitir continuar - el usuario puede querer dejar un período sin intereses
			}
		}

		setIsCalculating("new");
		setError(null);

		const segmentCapital = getCapitalForSegment(segments.length);
		let result: { interest: number; coefficient: number } | null = null;

		if (isSimpleInterest) {
			// Calcular interés simple localmente
			result = calculateSimpleInterest(
				segmentCapital,
				newSegment.simpleRate!,
				newSegment.ratePeriod!,
				newSegment.startDate,
				newSegment.endDate,
				newSegment.capitalizationFrequency || "none",
			);
		} else {
			// Calcular interés indexado mediante API
			result = await calculateSegmentInterest(newSegment, segmentCapital);
		}

		if (result) {
			const ratePeriodLabel = RATE_PERIODS.find((p) => p.value === newSegment.ratePeriod)?.label || "";
			const capLabel = CAPITALIZATION_OPTIONS.find((c) => c.value === newSegment.capitalizationFrequency)?.label || "";
			const rateNameParts = [`Interés Simple ${newSegment.simpleRate}% ${ratePeriodLabel}`];
			if (newSegment.capitalizationFrequency && newSegment.capitalizationFrequency !== "none") {
				rateNameParts.push(`(Cap. ${capLabel})`);
			}

			const newSegmentComplete: InterestSegment = {
				id: generateId(),
				startDate: newSegment.startDate,
				endDate: newSegment.endDate,
				rate: isSimpleInterest ? "simple" : newSegment.rate!,
				rateName: isSimpleInterest ? rateNameParts.join(" ") : getRateName(newSegment.rate!, availableRates),
				capital: segmentCapital,
				interest: result.interest,
				coefficient: result.coefficient,
				isCalculated: true,
				isExtension: false,
				interestType: newSegment.interestType,
				simpleRate: isSimpleInterest ? newSegment.simpleRate : undefined,
				ratePeriod: isSimpleInterest ? newSegment.ratePeriod : undefined,
				capitalizationFrequency: isSimpleInterest ? newSegment.capitalizationFrequency : undefined,
			};

			onSegmentsChange([...segments, newSegmentComplete]);
			setIsAddingNew(false);
			setNewSegment({ interestType: "indexed", ratePeriod: "annual", capitalizationFrequency: "none" });
		}

		setIsCalculating(null);
	};

	// Cancelar agregar nuevo
	const handleCancelNew = () => {
		setIsAddingNew(false);
		setNewSegment({ interestType: "indexed", ratePeriod: "annual", capitalizationFrequency: "none" });
		setError(null);
	};

	// Iniciar edición de segmento
	const handleStartEdit = (segment: InterestSegment) => {
		setEditingSegmentId(segment.id);
		setEditingSegment({ ...segment });
		setError(null);
	};

	// Guardar edición
	const handleSaveEdit = async () => {
		if (!editingSegment || !editingSegmentId) return;

		const isSimpleInterest = editingSegment.interestType === "simple";

		if (!editingSegment.startDate || !editingSegment.endDate) {
			setError("Debe completar las fechas");
			return;
		}

		if (isSimpleInterest) {
			if (editingSegment.simpleRate === undefined || editingSegment.simpleRate <= 0) {
				setError("Debe ingresar una tasa de interés válida");
				return;
			}
			if (!editingSegment.ratePeriod) {
				setError("Debe seleccionar el período de la tasa");
				return;
			}
		} else {
			if (!editingSegment.rate) {
				setError("Debe seleccionar una tasa de interés");
				return;
			}
			// Validar fechas
			if (!isDateInRateRange(editingSegment.startDate, editingSegment.rate, availableRates)) {
				setError("La fecha inicial está fuera del rango disponible para la tasa seleccionada");
				return;
			}
			if (!isDateInRateRange(editingSegment.endDate, editingSegment.rate, availableRates)) {
				setError("La fecha final está fuera del rango disponible para la tasa seleccionada");
				return;
			}
		}

		if (dayjs(editingSegment.endDate, "DD/MM/YYYY").isBefore(dayjs(editingSegment.startDate, "DD/MM/YYYY"))) {
			setError("La fecha final debe ser posterior a la fecha inicial");
			return;
		}

		const segmentIndex = segments.findIndex((s) => s.id === editingSegmentId);

		// Validar que no haya superposición con el tramo anterior
		if (segmentIndex > 0) {
			const prevSegment = segments[segmentIndex - 1];
			const prevEndDate = dayjs(prevSegment.endDate, "DD/MM/YYYY");
			const editStartDate = dayjs(editingSegment.startDate, "DD/MM/YYYY");

			if (editStartDate.isBefore(prevEndDate) || editStartDate.isSame(prevEndDate)) {
				setError(`La fecha inicial debe ser posterior al ${prevSegment.endDate} (fin del tramo anterior)`);
				return;
			}
		}

		// Validar que no haya superposición con el tramo siguiente
		if (segmentIndex < segments.length - 1) {
			const nextSegment = segments[segmentIndex + 1];
			const nextStartDate = dayjs(nextSegment.startDate, "DD/MM/YYYY");
			const editEndDate = dayjs(editingSegment.endDate, "DD/MM/YYYY");

			if (editEndDate.isAfter(nextStartDate) || editEndDate.isSame(nextStartDate)) {
				setError(`La fecha final debe ser anterior al ${nextSegment.startDate} (inicio del tramo siguiente)`);
				return;
			}
		}

		setIsCalculating(editingSegmentId);
		setError(null);
		const segmentCapital = getCapitalForSegment(segmentIndex);
		let result: { interest: number; coefficient: number } | null = null;

		if (isSimpleInterest) {
			// Calcular interés simple localmente
			result = calculateSimpleInterest(
				segmentCapital,
				editingSegment.simpleRate!,
				editingSegment.ratePeriod!,
				editingSegment.startDate,
				editingSegment.endDate,
				editingSegment.capitalizationFrequency || "none",
			);
		} else {
			// Calcular interés indexado mediante API
			result = await calculateSegmentInterest(editingSegment, segmentCapital);
		}

		if (result) {
			const ratePeriodLabel = RATE_PERIODS.find((p) => p.value === editingSegment.ratePeriod)?.label || "";
			const capLabel = CAPITALIZATION_OPTIONS.find((c) => c.value === editingSegment.capitalizationFrequency)?.label || "";
			const rateNameParts = [`Interés Simple ${editingSegment.simpleRate}% ${ratePeriodLabel}`];
			if (editingSegment.capitalizationFrequency && editingSegment.capitalizationFrequency !== "none") {
				rateNameParts.push(`(Cap. ${capLabel})`);
			}

			const updatedSegments = segments.map((seg) => {
				if (seg.id === editingSegmentId) {
					return {
						...seg,
						startDate: editingSegment.startDate!,
						endDate: editingSegment.endDate!,
						rate: isSimpleInterest ? "simple" : editingSegment.rate!,
						rateName: isSimpleInterest ? rateNameParts.join(" ") : getRateName(editingSegment.rate!, availableRates),
						capital: segmentCapital,
						interest: result!.interest,
						coefficient: result!.coefficient,
						isCalculated: true,
						interestType: editingSegment.interestType,
						simpleRate: isSimpleInterest ? editingSegment.simpleRate : undefined,
						ratePeriod: isSimpleInterest ? editingSegment.ratePeriod : undefined,
						capitalizationFrequency: isSimpleInterest ? editingSegment.capitalizationFrequency : undefined,
					};
				}
				return seg;
			});

			// Si hay capitalización, recalcular segmentos posteriores
			if (capitalizeInterest && segmentIndex < segments.length - 1) {
				await recalculateSubsequentSegments(updatedSegments, segmentIndex);
			} else {
				onSegmentsChange(updatedSegments);
			}

			setEditingSegmentId(null);
			setEditingSegment(null);
		}

		setIsCalculating(null);
	};

	// Recalcular segmentos posteriores cuando hay capitalización
	const recalculateSubsequentSegments = async (currentSegments: InterestSegment[], fromIndex: number) => {
		const updatedSegments = [...currentSegments];

		for (let i = fromIndex + 1; i < updatedSegments.length; i++) {
			const segment = updatedSegments[i];
			let newCapital = capital;

			// Calcular capital acumulado
			for (let j = 0; j < i; j++) {
				newCapital += updatedSegments[j].interest || 0;
			}

			let result: { interest: number; coefficient: number } | null = null;

			if (segment.interestType === "simple" && segment.simpleRate && segment.ratePeriod) {
				// Recalcular interés simple
				result = calculateSimpleInterest(
					newCapital,
					segment.simpleRate,
					segment.ratePeriod,
					segment.startDate,
					segment.endDate,
					segment.capitalizationFrequency || "none",
				);
			} else {
				// Recalcular interés indexado
				result = await calculateSegmentInterest(segment, newCapital);
			}

			if (result) {
				updatedSegments[i] = {
					...segment,
					capital: newCapital,
					interest: result.interest,
					coefficient: result.coefficient,
				};
			}
		}

		onSegmentsChange(updatedSegments);
	};

	// Cancelar edición
	const handleCancelEdit = () => {
		setEditingSegmentId(null);
		setEditingSegment(null);
		setError(null);
	};

	// Eliminar segmento
	const handleDeleteSegment = (segmentId: string) => {
		const segmentIndex = segments.findIndex((s) => s.id === segmentId);
		const newSegments = segments.filter((s) => s.id !== segmentId);

		// Si hay capitalización y eliminamos un segmento del medio, recalcular
		if (capitalizeInterest && segmentIndex < segments.length - 1 && newSegments.length > 0) {
			recalculateSubsequentSegments(newSegments, Math.max(0, segmentIndex - 1));
		} else {
			onSegmentsChange(newSegments);
		}
	};

	// Manejar cambio de capitalización
	const handleCapitalizeChange = async (checked: boolean) => {
		onCapitalizeChange(checked);

		// Recalcular todos los segmentos con la nueva configuración
		if (segments.length > 1) {
			const updatedSegments = [...segments];

			for (let i = 0; i < updatedSegments.length; i++) {
				let segmentCapital = capital;

				if (checked && i > 0) {
					// Con capitalización
					for (let j = 0; j < i; j++) {
						segmentCapital += updatedSegments[j].interest || 0;
					}
				}

				if (updatedSegments[i].capital !== segmentCapital) {
					const segment = updatedSegments[i];
					let result: { interest: number; coefficient: number } | null = null;

					if (segment.interestType === "simple" && segment.simpleRate && segment.ratePeriod) {
						// Recalcular interés simple
						result = calculateSimpleInterest(
							segmentCapital,
							segment.simpleRate,
							segment.ratePeriod,
							segment.startDate,
							segment.endDate,
							segment.capitalizationFrequency || "none",
						);
					} else {
						// Recalcular interés indexado
						result = await calculateSegmentInterest(segment, segmentCapital);
					}

					if (result) {
						updatedSegments[i] = {
							...updatedSegments[i],
							capital: segmentCapital,
							interest: result.interest,
							coefficient: result.coefficient,
						};
					}
				}
			}

			onSegmentsChange(updatedSegments);
		}
	};

	// Calcular totales
	const totalInterest = segments.reduce((sum, seg) => sum + (seg.interest || 0), 0);
	const finalAmount = capitalizeInterest
		? (segments[segments.length - 1]?.capital || capital) + (segments[segments.length - 1]?.interest || 0)
		: capital + totalInterest;

	return (
		<Box>
			{/* Header con opción de capitalización */}
			<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6">Tramos de Intereses</Typography>
				<FormControlLabel
					control={
						<Checkbox
							checked={capitalizeInterest}
							onChange={(e) => handleCapitalizeChange(e.target.checked)}
							disabled={disabled || segments.length === 0}
						/>
					}
					label="Capitalizar intereses"
				/>
			</Stack>

			{/* Mensaje de error */}
			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{/* Tabla de tramos */}
			{segments.length > 0 && (
				<TableContainer component={Card} sx={{ mb: 2 }}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>#</TableCell>
								<TableCell>Fecha Inicio</TableCell>
								<TableCell>Fecha Fin</TableCell>
								<TableCell>Tasa</TableCell>
								<TableCell align="right">Capital</TableCell>
								<TableCell align="right">Coeficiente</TableCell>
								<TableCell align="right">Interés</TableCell>
								<TableCell align="center">Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{segments.map((segment, index) => (
								<TableRow
									key={segment.id}
									sx={{
										bgcolor: segment.isExtension ? "action.hover" : "inherit",
									}}
								>
									{editingSegmentId === segment.id ? (
										// Modo edición
										<>
											<TableCell>
												<Stack spacing={0.5}>
													<Typography variant="caption">{index + 1}</Typography>
													<ToggleButtonGroup
														value={editingSegment?.interestType || "indexed"}
														exclusive
														onChange={(_e, value) => {
															if (value !== null) {
																setEditingSegment({
																	...editingSegment,
																	interestType: value as InterestType,
																	rate: value === "simple" ? "simple" : editingSegment?.rate,
																});
															}
														}}
														size="small"
													>
														<ToggleButton value="indexed" sx={{ py: 0.25, px: 0.5, fontSize: 10 }}>
															Index
														</ToggleButton>
														<ToggleButton value="simple" sx={{ py: 0.25, px: 0.5, fontSize: 10 }}>
															Simple
														</ToggleButton>
													</ToggleButtonGroup>
												</Stack>
											</TableCell>
											<TableCell>
												<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
													<DatePicker
														value={editingSegment?.startDate ? dayjs(editingSegment.startDate, "DD/MM/YYYY") : null}
														onChange={(date: Dayjs | null) =>
															setEditingSegment({
																...editingSegment,
																startDate: date?.format("DD/MM/YYYY") || "",
															})
														}
														format="DD/MM/YYYY"
														slotProps={{
															textField: { size: "small", sx: { width: 140 } },
														}}
													/>
												</LocalizationProvider>
											</TableCell>
											<TableCell>
												<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
													<DatePicker
														value={editingSegment?.endDate ? dayjs(editingSegment.endDate, "DD/MM/YYYY") : null}
														onChange={(date: Dayjs | null) =>
															setEditingSegment({
																...editingSegment,
																endDate: date?.format("DD/MM/YYYY") || "",
															})
														}
														format="DD/MM/YYYY"
														slotProps={{
															textField: { size: "small", sx: { width: 140 } },
														}}
													/>
												</LocalizationProvider>
											</TableCell>
											<TableCell>
												{editingSegment?.interestType === "simple" ? (
													<Stack direction="row" spacing={1} flexWrap="wrap">
														<TextField
															label="Tasa"
															size="small"
															type="number"
															value={editingSegment?.simpleRate ?? ""}
															onChange={(e) =>
																setEditingSegment({
																	...editingSegment,
																	simpleRate: e.target.value ? parseFloat(e.target.value) : undefined,
																})
															}
															InputProps={{
																endAdornment: <InputAdornment position="end">%</InputAdornment>,
															}}
															inputProps={{ min: 0, step: 0.01 }}
															sx={{ width: 80 }}
														/>
														<TextField
															select
															label="Período"
															size="small"
															value={editingSegment?.ratePeriod || "annual"}
															onChange={(e) =>
																setEditingSegment({
																	...editingSegment,
																	ratePeriod: e.target.value as RatePeriod,
																})
															}
															sx={{ width: 90 }}
														>
															{RATE_PERIODS.map((period) => (
																<MenuItem key={period.value} value={period.value}>
																	{period.label}
																</MenuItem>
															))}
														</TextField>
														<TextField
															select
															label="Capitaliz."
															size="small"
															value={editingSegment?.capitalizationFrequency || "none"}
															onChange={(e) =>
																setEditingSegment({
																	...editingSegment,
																	capitalizationFrequency: e.target.value as CapitalizationFrequency,
																})
															}
															sx={{ width: 110 }}
														>
															{CAPITALIZATION_OPTIONS.map((cap) => (
																<MenuItem key={cap.value} value={cap.value}>
																	{cap.label}
																</MenuItem>
															))}
														</TextField>
													</Stack>
												) : (
													<TextField
														select
														size="small"
														value={editingSegment?.rate || ""}
														onChange={(e) =>
															setEditingSegment({
																...editingSegment,
																rate: e.target.value,
															})
														}
														sx={{ minWidth: 180 }}
													>
														{availableRates.map((rate) => (
															<MenuItem key={rate.value} value={rate.value}>
																{rate.label}
															</MenuItem>
														))}
													</TextField>
												)}
											</TableCell>
											<TableCell align="right">-</TableCell>
											<TableCell align="right">-</TableCell>
											<TableCell align="right">-</TableCell>
											<TableCell align="center">
												<Stack direction="row" spacing={0.5} justifyContent="center">
													{isCalculating === segment.id ? (
														<CircularProgress size={20} />
													) : (
														<>
															<IconButton size="small" color="success" onClick={handleSaveEdit}>
																<TickCircle size={18} />
															</IconButton>
															<IconButton size="small" color="error" onClick={handleCancelEdit}>
																<CloseCircle size={18} />
															</IconButton>
														</>
													)}
												</Stack>
											</TableCell>
										</>
									) : (
										// Modo visualización
										<>
											<TableCell>
												{index + 1}
												{segment.isExtension && <Chip label="Extensión" size="small" color="info" sx={{ ml: 1 }} />}
											</TableCell>
											<TableCell>{segment.startDate}</TableCell>
											<TableCell>{segment.endDate}</TableCell>
											<TableCell>{segment.rateName || segment.rate}</TableCell>
											<TableCell align="right">{formatCurrency(segment.capital)}</TableCell>
											<TableCell align="right">{(segment.coefficient * 100).toFixed(4)}%</TableCell>
											<TableCell align="right" sx={{ color: "success.main", fontWeight: 500 }}>
												{formatCurrency(segment.interest)}
											</TableCell>
											<TableCell align="center">
												<Stack direction="row" spacing={0.5} justifyContent="center">
													<Tooltip title="Editar">
														<IconButton
															size="small"
															color="primary"
															onClick={() => handleStartEdit(segment)}
															disabled={disabled || segment.isExtension}
														>
															<Edit2 size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Eliminar">
														<IconButton
															size="small"
															color="error"
															onClick={() => handleDeleteSegment(segment.id)}
															disabled={disabled || segment.isExtension}
														>
															<Trash size={18} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</>
									)}
								</TableRow>
							))}

							{/* Fila de totales */}
							<TableRow sx={{ bgcolor: "action.selected" }}>
								<TableCell colSpan={4}>
									<Typography fontWeight="bold">TOTALES</Typography>
								</TableCell>
								<TableCell align="right">
									<Typography fontWeight="bold">{formatCurrency(capital)}</Typography>
								</TableCell>
								<TableCell align="right">-</TableCell>
								<TableCell align="right">
									<Typography fontWeight="bold" color="success.main">
										{formatCurrency(totalInterest)}
									</Typography>
								</TableCell>
								<TableCell />
							</TableRow>

							{/* Fila de monto final */}
							<TableRow sx={{ bgcolor: "primary.lighter" }}>
								<TableCell colSpan={6}>
									<Typography fontWeight="bold">MONTO FINAL (Capital + Intereses)</Typography>
								</TableCell>
								<TableCell align="right">
									<Typography fontWeight="bold" color="primary.main" fontSize="1.1rem">
										{formatCurrency(finalAmount)}
									</Typography>
								</TableCell>
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Formulario para agregar nuevo tramo */}
			<Collapse in={isAddingNew}>
				<Card sx={{ mb: 2, p: 2, bgcolor: "background.default" }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
						<Typography variant="subtitle2">Nuevo Tramo</Typography>
						<ToggleButtonGroup
							value={newSegment.interestType || "indexed"}
							exclusive
							onChange={(_e, value) => {
								if (value !== null) {
									setNewSegment({
										...newSegment,
										interestType: value as InterestType,
										rate: value === "simple" ? "" : newSegment.rate,
										simpleRate: value === "indexed" ? undefined : newSegment.simpleRate,
									});
								}
							}}
							size="small"
						>
							<ToggleButton value="indexed" sx={{ px: 2 }}>
								Tasa Indexada
							</ToggleButton>
							<ToggleButton value="simple" sx={{ px: 2 }}>
								Interés Simple
							</ToggleButton>
						</ToggleButtonGroup>
					</Stack>

					<Grid container spacing={1} alignItems="center">
						<Grid item xs={6} sm={2}>
							<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
								<DatePicker
									label="Fecha Inicio"
									value={newSegment.startDate ? dayjs(newSegment.startDate, "DD/MM/YYYY") : null}
									onChange={(date: Dayjs | null) =>
										setNewSegment({
											...newSegment,
											startDate: date?.format("DD/MM/YYYY") || "",
										})
									}
									format="DD/MM/YYYY"
									slotProps={{
										textField: { size: "small", fullWidth: true },
									}}
								/>
							</LocalizationProvider>
						</Grid>
						<Grid item xs={6} sm={2}>
							<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
								<DatePicker
									label="Fecha Fin"
									value={newSegment.endDate ? dayjs(newSegment.endDate, "DD/MM/YYYY") : null}
									onChange={(date: Dayjs | null) =>
										setNewSegment({
											...newSegment,
											endDate: date?.format("DD/MM/YYYY") || "",
										})
									}
									format="DD/MM/YYYY"
									slotProps={{
										textField: { size: "small", fullWidth: true },
									}}
								/>
							</LocalizationProvider>
						</Grid>

						{newSegment.interestType === "simple" ? (
							<>
								<Grid item xs={4} sm={1.5}>
									<TextField
										label="Tasa"
										size="small"
										fullWidth
										type="number"
										value={newSegment.simpleRate ?? ""}
										onChange={(e) =>
											setNewSegment({
												...newSegment,
												simpleRate: e.target.value ? parseFloat(e.target.value) : undefined,
											})
										}
										InputProps={{
											endAdornment: <InputAdornment position="end">%</InputAdornment>,
										}}
										inputProps={{ min: 0, step: 0.01 }}
									/>
								</Grid>
								<Grid item xs={4} sm={1.5}>
									<TextField
										select
										label="Período"
										size="small"
										fullWidth
										value={newSegment.ratePeriod || "annual"}
										onChange={(e) =>
											setNewSegment({
												...newSegment,
												ratePeriod: e.target.value as RatePeriod,
											})
										}
									>
										{RATE_PERIODS.map((period) => (
											<MenuItem key={period.value} value={period.value}>
												{period.label}
											</MenuItem>
										))}
									</TextField>
								</Grid>
								<Grid item xs={4} sm={2}>
									<TextField
										select
										label="Capitalización"
										size="small"
										fullWidth
										value={newSegment.capitalizationFrequency || "none"}
										onChange={(e) =>
											setNewSegment({
												...newSegment,
												capitalizationFrequency: e.target.value as CapitalizationFrequency,
											})
										}
									>
										{CAPITALIZATION_OPTIONS.map((cap) => (
											<MenuItem key={cap.value} value={cap.value}>
												{cap.label}
											</MenuItem>
										))}
									</TextField>
								</Grid>
							</>
						) : (
							<Grid item xs={12} sm={5}>
								<TextField
									select
									label="Tasa de Interés"
									size="small"
									fullWidth
									value={newSegment.rate || ""}
									onChange={(e) =>
										setNewSegment({
											...newSegment,
											rate: e.target.value,
										})
									}
								>
									{availableRates.map((rate) => (
										<MenuItem key={rate.value} value={rate.value}>
											{rate.label}
										</MenuItem>
									))}
								</TextField>
							</Grid>
						)}

						<Grid item xs={12} sm={3}>
							<Stack direction="row" spacing={1} justifyContent="flex-end">
								{isCalculating === "new" ? (
									<CircularProgress size={24} />
								) : (
									<>
										<Button variant="contained" size="small" onClick={handleSaveNewSegment} startIcon={<Calculator size={16} />}>
											Calcular
										</Button>
										<Button variant="outlined" size="small" color="error" onClick={handleCancelNew}>
											Cancelar
										</Button>
									</>
								)}
							</Stack>
						</Grid>
					</Grid>

					{/* Mostrar información adicional del capital */}
					{(newSegment.rate || newSegment.interestType === "simple") && (
						<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
							Capital para este tramo: {formatCurrency(getCapitalForSegment(segments.length))}
							{capitalizeInterest && segments.length > 0 && " (capitalizado)"}
							{newSegment.interestType === "simple" &&
								newSegment.startDate &&
								newSegment.endDate &&
								` | Días: ${calculateDaysBetween(newSegment.startDate, newSegment.endDate)}`}
						</Typography>
					)}
				</Card>
			</Collapse>

			{/* Botón agregar tramo */}
			{!isAddingNew && (
				<Button
					variant="outlined"
					startIcon={<Add />}
					onClick={handleAddSegment}
					disabled={disabled || segments.length >= MAX_SEGMENTS}
					fullWidth
				>
					{segments.length === 0 ? "Agregar primer tramo" : "Agregar otro tramo"}
				</Button>
			)}

			{/* Mensaje de límite */}
			{segments.length >= MAX_SEGMENTS && (
				<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
					Se ha alcanzado el límite máximo de {MAX_SEGMENTS} tramos
				</Typography>
			)}

			{/* Información cuando no hay tramos */}
			{segments.length === 0 && !isAddingNew && (
				<Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
					No hay tramos de intereses. Haga clic en el botón para agregar el primer tramo.
				</Typography>
			)}
		</Box>
	);
};

export default InterestSegmentsManager;
