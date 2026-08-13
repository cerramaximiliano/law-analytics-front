import { useEffect } from "react";
import axios from "utils/axios";

// ----------------------------------------------------------------------
// Registro de visitas atribuidas a emails de notificación.
//
// Los CTAs de los emails llegan con ?source=email_<tipo>_cta (o _banner /
// _feature). Si el usuario está logueado (axios lleva la sesión), se registra
// la visita en el backend — la señal que interesa no es la apertura ni el
// click (eso ya lo cubre SES) sino que el usuario efectivamente ENTRÓ al
// servicio a mirar lo que el email le avisó.
//
// Best-effort: si no hay sesión (401) o falla, se ignora en silencio.
// El guard de sessionStorage evita duplicar por re-renders o navegación
// interna con el parámetro todavía en la URL.
// ----------------------------------------------------------------------

const SOURCE_RE = /^email_[a-z0-9_]{2,60}$/;

export default function EmailVisitTracker() {
	useEffect(() => {
		try {
			const params = new URLSearchParams(window.location.search);
			const source = params.get("source");
			if (!source || !SOURCE_RE.test(source)) return;

			const guardKey = `email-visit:${source}`;
			if (sessionStorage.getItem(guardKey)) return;
			sessionStorage.setItem(guardKey, "1");

			axios
				.post("/api/email-engagement/visit", { source, path: window.location.pathname })
				.catch(() => {
					// Sin sesión o error de red: métrica best-effort, no molestar.
				});
		} catch {
			// window/sessionStorage no disponibles: ignorar.
		}
	}, []);

	return null;
}
