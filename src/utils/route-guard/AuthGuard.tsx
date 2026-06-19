import React from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "hooks/useAuth";

// ==============================|| AUTH GUARD ||============================== //

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
	const { isLoggedIn, needsVerification } = useAuth();

	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (isLoggedIn && needsVerification) {
			navigate("/code-verification", { replace: true });
		} else if (!isLoggedIn) {
			// Preservar la ruta COMPLETA (path + query + hash) para volver a ella tras
			// el login. Antes solo se guardaba `pathname` en state.from, que perdía el
			// query string (ej. el deep-link ?movement=<id> de la vista pública /m/:token).
			// Lo pasamos como `?redirect=` en vez de state porque sobrevive a refresh del
			// /login y a entradas frías desde links externos (donde state de RR se pierde).
			const target = `${location.pathname}${location.search}${location.hash}`;
			navigate(`/login?redirect=${encodeURIComponent(target)}`, {
				state: { from: location.pathname },
				replace: true,
			});
		}
	}, [isLoggedIn, needsVerification, navigate, location]);

	if (!isLoggedIn || needsVerification) {
		return null; // Opcionalmente, puedes mostrar un Loader aquí mientras esperas a que se inicialicen los estados
	}

	return <>{children}</>;
};

export default AuthGuard;
