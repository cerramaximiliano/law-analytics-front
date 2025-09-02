import { useCallback, useRef, useEffect, useMemo } from "react";

// Debounce hook - retrasa ejecución hasta que pase un tiempo sin llamadas
export const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const callbackRef = useRef(callback);

	// Actualizar ref si callback cambia
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	) as T;

	// Cleanup
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
};

// Throttle hook - limita frecuencia de ejecución
export const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
	const lastRun = useRef(Date.now() - delay);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const throttledCallback = useCallback(
		(...args: Parameters<T>) => {
			const now = Date.now();
			const timeSinceLastRun = now - lastRun.current;

			if (timeSinceLastRun >= delay) {
				callbackRef.current(...args);
				lastRun.current = now;
			} else {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(() => {
					callbackRef.current(...args);
					lastRun.current = Date.now();
				}, delay - timeSinceLastRun);
			}
		},
		[delay],
	) as T;

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return throttledCallback;
};

// Hook para búsqueda optimizada
export const useOptimizedSearch = (searchFunction: (query: string) => void, delay = 300) => {
	const debouncedSearch = useDebounce(searchFunction, delay);

	return useMemo(
		() => ({
			search: debouncedSearch,
			immediate: searchFunction,
		}),
		[debouncedSearch, searchFunction],
	);
};

// Hook para scroll optimizado
export const useOptimizedScroll = (handleScroll: () => void, delay = 100) => {
	return useThrottle(handleScroll, delay);
};
