import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// project-imports
import { APP_DEFAULT_PATH } from "config";
import useAuth from "hooks/useAuth";

// types
import { GuardProps } from "types/auth";

// Sólo aceptar rutas internas como destino post-login. Previene open-redirect:
// el valor debe empezar con un único "/" (no "//host" protocol-relative ni "/\").
const sanitizeInternalPath = (raw?: string | null): string | null => {
	if (!raw) return null;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
	if (raw === "/login" || raw === "/register") return null;
	return raw;
};

// ==============================|| GUEST GUARD ||============================== //

const GuestGuard = ({ children }: GuardProps) => {
	const { isLoggedIn } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();

	useEffect(() => {
		// Si es la página de verificación de código, permitir acceso incluso si está autenticado
		if (location.pathname === "/code-verification") {
			return;
		}

		// Si tiene el parámetro forceLogin=true y NO está logueado, permitir acceso al login
		// Esto se usa cuando hay estado de autenticación obsoleto (ej: desde invitaciones de equipos)
		if (searchParams.get("forceLogin") === "true" && !isLoggedIn) {
			return;
		}

		// De lo contrario, redirigir tras el login. Prioridad de destino:
		//   1. ?redirect= (ruta completa con query+hash, ej. deep-link a un movimiento)
		//   2. state.from (path-only; lo siguen seteando ServerContext/Unauthorized/invitaciones)
		//   3. APP_DEFAULT_PATH
		if (isLoggedIn) {
			const redirectParam = sanitizeInternalPath(searchParams.get("redirect"));
			const fromState = sanitizeInternalPath(location?.state?.from);
			const destination = redirectParam || fromState || APP_DEFAULT_PATH;
			navigate(destination, {
				state: {
					from: "",
				},
				replace: true,
			});
		}
	}, [isLoggedIn, navigate, location, searchParams]);

	return children;
};

export default GuestGuard;
