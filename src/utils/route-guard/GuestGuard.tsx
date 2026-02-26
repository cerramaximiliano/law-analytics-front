import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

// project-imports
import { APP_DEFAULT_PATH } from "config";
import useAuth from "hooks/useAuth";

// types
import { GuardProps } from "types/auth";

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

		// De lo contrario, redirigir a la ruta por defecto si está autenticado
		if (isLoggedIn) {
			navigate(location?.state?.from ? location?.state?.from : APP_DEFAULT_PATH, {
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
