import { useCallback, useEffect, useRef } from "react";
import { useGoogleLogin, useGoogleOAuth } from "@react-oauth/google";

import { releaseGsi } from "utils/gsiDeferral";

// Envoltorio de `useGoogleLogin` (flujo implícito) para /login y /register: el script de
// Google se retiene hasta que hace falta (ver utils/gsiDeferral). `login()` mantiene el
// comportamiento previo: si el cliente aún no cargó, lo pide y abre el popup al terminar.
interface GoogleLoginOptions {
	onSuccess: (response: any) => void;
	onError?: (error?: any) => void;
	scope?: string;
}

export const useDeferredGoogleLogin = (options: GoogleLoginOptions) => {
	const googleLogin = useGoogleLogin({ ...options, flow: "implicit" });
	const { scriptLoadedSuccessfully } = useGoogleOAuth();
	const pendingClick = useRef(false);

	// Clic antes de que el cliente cargue: se abre el popup apenas queda listo.
	useEffect(() => {
		if (scriptLoadedSuccessfully && pendingClick.current) {
			pendingClick.current = false;
			(googleLogin as () => void)();
		}
	}, [scriptLoadedSuccessfully, googleLogin]);

	const warm = useCallback(() => releaseGsi(), []);

	const login = useCallback(() => {
		if (scriptLoadedSuccessfully) {
			(googleLogin as () => void)();
		} else {
			pendingClick.current = true;
			releaseGsi();
		}
	}, [scriptLoadedSuccessfully, googleLogin]);

	// Primera interacción con la página: el formulario ya es usable, cargamos el cliente.
	useEffect(() => {
		const events = ["pointerdown", "keydown", "touchstart"] as const;
		const once = () => {
			events.forEach((e) => document.removeEventListener(e, once));
			releaseGsi();
		};
		events.forEach((e) => document.addEventListener(e, once, { passive: true }));
		return () => events.forEach((e) => document.removeEventListener(e, once));
	}, []);

	return { login, warm };
};
