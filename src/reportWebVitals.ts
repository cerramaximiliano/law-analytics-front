import type { Metric } from "web-vitals";

type ReportHandler = (metric: Metric) => void;

// web-vitals v3: INP reemplaza a FID como métrica de interactividad.
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
	if (onPerfEntry && onPerfEntry instanceof Function) {
		import("web-vitals")
			.then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
				onCLS(onPerfEntry);
				onINP(onPerfEntry);
				onFCP(onPerfEntry);
				onLCP(onPerfEntry);
				onTTFB(onPerfEntry);
			})
			.catch(() => {});
	}
};

export default reportWebVitals;
