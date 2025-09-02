/* eslint-disable no-restricted-globals */
// Web Worker para cálculos pesados de indemnizaciones
// Ejecuta en thread separado sin bloquear UI

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

interface CalculationMessage {
	type: "CALCULATE_LABOR" | "CALCULATE_INTEREST" | "CALCULATE_CIVIL";
	data: any;
}

// Cálculo de indemnización laboral
const calculateLabor = (data: any) => {
	const { salary, years, includeInterest } = data;

	// Simular cálculo pesado
	let result = 0;
	const baseAmount = salary * years * 13;

	// Cálculo intensivo
	for (let i = 0; i < 1000000; i++) {
		result = baseAmount * (1 + i / 1000000);
	}

	if (includeInterest) {
		result *= 1.5; // Simplificado
	}

	return {
		total: result,
		breakdown: {
			base: baseAmount,
			interest: result - baseAmount,
		},
	};
};

// Cálculo de intereses
const calculateInterest = (data: any) => {
	const { principal, rate, days } = data;

	// Cálculo complejo de intereses compuestos
	let accumulated = principal;
	for (let day = 0; day < days; day++) {
		accumulated *= 1 + rate / 365;
	}

	return {
		total: accumulated,
		interest: accumulated - principal,
		dailyRate: rate / 365,
	};
};

// Listener del worker
self.addEventListener("message", (event: MessageEvent<CalculationMessage>) => {
	const { type, data } = event.data;

	let result;
	switch (type) {
		case "CALCULATE_LABOR":
			result = calculateLabor(data);
			break;
		case "CALCULATE_INTEREST":
			result = calculateInterest(data);
			break;
		default:
			result = { error: "Unknown calculation type" };
	}

	// Enviar resultado al thread principal
	self.postMessage(result);
});

export {};
