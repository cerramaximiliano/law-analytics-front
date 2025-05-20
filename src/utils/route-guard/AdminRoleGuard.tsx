import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import useAuth from "hooks/useAuth";

// ==============================|| ADMIN ROLE GUARD ||============================== //

/**
 * Guard component that restricts access to admin routes
 * Only users with "ADMIN_ROLE" can access the protected routes
 */
const AdminRoleGuard = () => {
	const { isLoggedIn, user } = useAuth();
	const navigate = useNavigate();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Log verificación de permisos
		console.log("AdminRoleGuard - Verificando permisos:", { isLoggedIn, userRole: user?.role });

		// Si el usuario está logueado pero no es admin, redirigir al dashboard
		if (isLoggedIn && user?.role !== "ADMIN_ROLE") {
			console.log("AdminRoleGuard - Redirigiendo a dashboard: No es admin");
			navigate("/dashboard/default", { replace: true });
		}
		// Si no está logueado, redirigir al login
		else if (!isLoggedIn) {
			console.log("AdminRoleGuard - Redirigiendo a login: No está autenticado");
			navigate("/login", { replace: true });
		}

		// Marcar que terminamos la verificación
		setIsChecking(false);
	}, [isLoggedIn, user, navigate]);

	// Mostrar un mensaje mientras verificamos los permisos
	if (isChecking) {
		return <div>Verificando permisos...</div>;
	}

	// No renderizar nada hasta que hayamos verificado que el usuario tiene rol de admin
	if (!isLoggedIn || user?.role !== "ADMIN_ROLE") {
		return null;
	}

	return <Outlet />;
};

export default AdminRoleGuard;
