// Modo revisión SOLO en desarrollo (vite dev). En el build de producción `import.meta.env.DEV`
// es false y todo esto se elimina. Se activa con `?revision=1` en cualquier URL (queda en la
// pestaña) y se apaga con `?revision=0`. Sirve para revisar pantallas de onboarding con
// cuentas que ya tienen carpetas o están en el tope del plan:
//   - el dashboard muestra "Primera causa" aunque haya carpetas;
//   - el cliente no frena el alta por límite (el hub lo sigue validando en el POST).
const KEY = "la_dev_review";

export const isDevReview = (): boolean => {
	if (!import.meta.env.DEV || typeof window === "undefined") return false;
	try {
		const param = new URLSearchParams(window.location.search).get("revision");
		if (param === "1") sessionStorage.setItem(KEY, "1");
		if (param === "0") sessionStorage.removeItem(KEY);
		return sessionStorage.getItem(KEY) === "1";
	} catch {
		return false;
	}
};
