import { useState, useEffect, useRef } from "react";
import { ScrapingProgress } from "types/movements";

interface StoredScrapingProgress {
	progress: ScrapingProgress;
	timestamp: number;
	folderId: string;
}

const STORAGE_KEY = "scrapingProgress";
const STALE_TIME = 10 * 60 * 1000; // 10 minutos
const COMPLETING_TRANSITION_TIME = 2000; // 2 segundos para mostrar 100%
const COMPLETED_DISPLAY_TIME = 5000; // 5 segundos

/**
 * Hook personalizado para gestionar el estado de scrapingProgress
 * Maneja la transición suave cuando el servidor deja de enviar el progreso
 */
export const useScrapingProgress = (serverProgress: ScrapingProgress | undefined, folderId: string | undefined) => {
	const [displayProgress, setDisplayProgress] = useState<ScrapingProgress | undefined>(serverProgress);
	const [showCompleted, setShowCompleted] = useState(false);
	const previousProgressRef = useRef<ScrapingProgress | undefined>();
	const completingTimeoutRef = useRef<NodeJS.Timeout>();
	const completedTimeoutRef = useRef<NodeJS.Timeout>();

	// Cargar progreso guardado en el mount
	useEffect(() => {
		if (!folderId) return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const data: StoredScrapingProgress = JSON.parse(stored);

				// Verificar si es para el mismo folder y no está stale
				if (data.folderId === folderId && Date.now() - data.timestamp < STALE_TIME) {
					// Solo restaurar si no viene del servidor
					if (!serverProgress) {
						previousProgressRef.current = data.progress;
					}
				} else {
					// Limpiar datos stale
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		} catch (error) {
			console.error("Error loading scraping progress from localStorage:", error);
			localStorage.removeItem(STORAGE_KEY);
		}
	}, [folderId]);

	// Gestionar transiciones y guardar en localStorage
	useEffect(() => {
		if (!folderId) return;

		const previousProgress = previousProgressRef.current;

		// Caso 1: Servidor envía progreso → guardar y mostrar
		// Pero ignorar si está en estado 'pending' con totalProcessed === 0 (scraping nunca realmente empezó)
		const isStuckInPending = serverProgress?.status === "pending" && serverProgress?.totalProcessed === 0;

		if (serverProgress && !isStuckInPending) {
			// Guardar en localStorage
			try {
				const data: StoredScrapingProgress = {
					progress: serverProgress,
					timestamp: Date.now(),
					folderId,
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			} catch (error) {
				console.error("Error saving scraping progress to localStorage:", error);
			}

			// Actualizar refs y estado
			previousProgressRef.current = serverProgress;
			setDisplayProgress(serverProgress);
			setShowCompleted(false);

			// Limpiar timeouts si existen
			if (completingTimeoutRef.current) {
				clearTimeout(completingTimeoutRef.current);
				completingTimeoutRef.current = undefined;
			}
			if (completedTimeoutRef.current) {
				clearTimeout(completedTimeoutRef.current);
				completedTimeoutRef.current = undefined;
			}
		}
		// Caso 2: Transición - había progreso pero ahora no
		else if (previousProgress && !previousProgress.isComplete && previousProgress.status !== "completed") {
			// Paso 1: Mostrar estado "completing" con 100%
			const completingProgress: ScrapingProgress = {
				status: "completing",
				isComplete: false,
				totalExpected: previousProgress.totalExpected,
				// Si totalExpected es 0, mantener totalProcessed actual; si no, usar totalExpected para mostrar 100%
				totalProcessed: previousProgress.totalExpected === 0 ? previousProgress.totalProcessed : previousProgress.totalExpected,
			};

			setDisplayProgress(completingProgress);
			setShowCompleted(false);

			// Paso 2: Después de 2 segundos, cambiar a "completed"
			completingTimeoutRef.current = setTimeout(() => {
				const completedProgress: ScrapingProgress = {
					status: "completed",
					isComplete: true,
					totalExpected: previousProgress.totalExpected,
					// Si totalExpected es 0, mantener totalProcessed actual; si no, usar totalExpected
					totalProcessed: previousProgress.totalExpected === 0 ? previousProgress.totalProcessed : previousProgress.totalExpected,
				};

				setDisplayProgress(completedProgress);
				setShowCompleted(true);

				// Paso 3: Auto-ocultar después de 5 segundos adicionales
				completedTimeoutRef.current = setTimeout(() => {
					setDisplayProgress(undefined);
					setShowCompleted(false);
					previousProgressRef.current = undefined;

					// Limpiar localStorage
					try {
						localStorage.removeItem(STORAGE_KEY);
					} catch (error) {
						console.error("Error removing scraping progress from localStorage:", error);
					}
				}, COMPLETED_DISPLAY_TIME);
			}, COMPLETING_TRANSITION_TIME);
		}
		// Caso 3: No hay progreso y no había antes → no mostrar nada
		else if (!previousProgress) {
			setDisplayProgress(undefined);
			setShowCompleted(false);
		}

		// Cleanup
		return () => {
			if (completingTimeoutRef.current) {
				clearTimeout(completingTimeoutRef.current);
			}
			if (completedTimeoutRef.current) {
				clearTimeout(completedTimeoutRef.current);
			}
		};
	}, [serverProgress, folderId]);

	return {
		scrapingProgress: displayProgress,
		isShowingCompleted: showCompleted,
	};
};
