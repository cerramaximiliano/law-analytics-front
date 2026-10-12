import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { dispatch } from "store";
import dayjs from "utils/dayjs-config";

// Tipos
export interface InterestRate {
	label: string;
	value: string;
	fechaInicio: Date;
	fechaUltima: Date;
	// Vigencia jurídica (TasasConfig.vigente/avisoVigencia/norma del hub)
	vigente?: boolean;
	avisoVigencia?: string;
	norma?: string;
	tipoIndice?: string;
	// Configuración de la serie (TasasConfig): cómo publica la fuente y hasta dónde hay datos
	periodicidad?: "diaria" | "diariaHabil" | "mensual";
	fuente?: string;
	unidadOrigen?: string;
	ultimoPeriodo?: string;
	fechaUltimaCompleta?: Date | null;
}

export interface InterestRatesState {
	isInitialized: boolean;
	lastFetchedUserId: string | null;
	lastFetchTime: number | null;
	isLoading: boolean;
	error: string | null;
	rates: InterestRate[];
}

// Estado inicial
const initialState: InterestRatesState = {
	isInitialized: false,
	lastFetchedUserId: null,
	lastFetchTime: null,
	isLoading: false,
	error: null,
	rates: [],
};

// Función helper para calcular el próximo tiempo de actualización (9 AM Argentina)
const getNextUpdateTime = (): number => {
	// Argentina está UTC-3
	const now = dayjs();
	const argentinaOffset = -180; // -3 horas en minutos
	const nowArgentina = now.utcOffset(argentinaOffset) as any;

	let nextUpdate = nowArgentina.set("hour", 9).set("minute", 0).set("second", 0).set("millisecond", 0);

	// Si ya pasaron las 9 AM de hoy, configurar para mañana
	if (nowArgentina.isAfter(nextUpdate)) {
		nextUpdate = nextUpdate.add(1, "day");
	}

	return nextUpdate.valueOf();
};

// Verificar si el cache necesita actualizarse
const needsCacheUpdate = (lastFetchTime: number | null): boolean => {
	if (!lastFetchTime) return true;

	const now = Date.now();
	const nextUpdate = getNextUpdateTime();

	// Si el último fetch fue antes del tiempo de actualización actual, necesitamos actualizar
	return lastFetchTime < nextUpdate && now >= nextUpdate;
};

const slice = createSlice({
	name: "interestRates",
	initialState,
	reducers: {
		// START LOADING
		startLoading(state) {
			state.isLoading = true;
			state.error = null;
		},

		// HAS ERROR
		hasError(state, action: PayloadAction<string>) {
			state.isLoading = false;
			state.error = action.payload;
		},

		// SET RATES SUCCESS
		setRatesSuccess(state, action: PayloadAction<{ rates: InterestRate[]; userId: string }>) {
			state.isLoading = false;
			state.error = null;
			state.rates = action.payload.rates;
			state.lastFetchedUserId = action.payload.userId;
			state.lastFetchTime = Date.now();
			state.isInitialized = true;
		},

		// RESET STATE
		resetRates(state) {
			state.isInitialized = false;
			state.lastFetchedUserId = null;
			state.lastFetchTime = null;
			state.isLoading = false;
			state.error = null;
			state.rates = [];
		},
	},
});

// Reducer
export default slice.reducer;

// Actions
export const { startLoading, hasError, setRatesSuccess, resetRates } = slice.actions;

// ----------------------------------------------------------------------

/**
 * Obtiene las tasas de interés
 * @param userId - ID del usuario
 * @param forceRefresh - Forzar actualización ignorando el caché
 */
export function getInterestRates(userId: string, forceRefresh: boolean = false) {
	return async (dispatch: any, getState: any) => {
		const state = getState().interestRates;

		// Verificar si necesitamos hacer la petición
		if (!forceRefresh && state.isInitialized && state.lastFetchedUserId === userId && !needsCacheUpdate(state.lastFetchTime)) {
			// Los datos están en caché y son válidos
			return;
		}

		dispatch(slice.actions.startLoading());

		try {
			const baseURL = import.meta.env.VITE_BASE_URL || "";
			const response = await axios.get(`${baseURL}/api/tasas/listado`, {
				withCredentials: true,
			});

			// Convertir fechas de string a objetos Date
			const tasasConFechas: InterestRate[] = response.data.map((tasa: any) => ({
				label: tasa.label,
				value: tasa.value,
				fechaInicio: dayjs.utc(tasa.fechaInicio).startOf("day").toDate(),
				fechaUltima: dayjs.utc(tasa.fechaUltima).startOf("day").toDate(),
				vigente: tasa.vigente !== false,
				avisoVigencia: tasa.avisoVigencia,
				norma: tasa.norma,
				tipoIndice: tasa.tipoIndice,
				periodicidad: tasa.periodicidad || "diaria",
				fuente: tasa.fuente,
				unidadOrigen: tasa.unidadOrigen,
				ultimoPeriodo: tasa.ultimoPeriodo,
				fechaUltimaCompleta: tasa.fechaUltimaCompleta ? dayjs.utc(tasa.fechaUltimaCompleta).startOf("day").toDate() : null,
			}));

			dispatch(
				slice.actions.setRatesSuccess({
					rates: tasasConFechas,
					userId: userId,
				}),
			);
		} catch (error) {
			let errorMessage = "Error al cargar las tasas de interés";

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					errorMessage = "No autorizado. Por favor inicia sesión nuevamente";
				} else if (error.response?.status === 403) {
					errorMessage = "No tienes permisos para ver esta información";
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				} else if (error.message) {
					errorMessage = error.message === "Wrong Services" ? "Error de conexión con el servidor" : error.message;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			dispatch(slice.actions.hasError(errorMessage));

			// Sin tasas de respaldo: los ids viejos (acta2601, acta2630) no existen en el hub y
			// producían intereses con tasas inventadas. Lista vacía + error visible.
			const fallbackRates: InterestRate[] = [];

			// Establecer las tasas de fallback para que la aplicación siga funcionando
			dispatch(
				slice.actions.setRatesSuccess({
					rates: fallbackRates,
					userId: userId,
				}),
			);

			console.error("Error en getInterestRates:", errorMessage);
		}
	};
}

/**
 * Limpia las tasas del store (útil al cerrar sesión)
 */
export function clearInterestRates() {
	return () => {
		dispatch(slice.actions.resetRates());
	};
}
