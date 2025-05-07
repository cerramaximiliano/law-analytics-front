import { useEffect } from "react";
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

	useEffect(() => {
		// If not logged in or not an admin, redirect to dashboard
		if (!isLoggedIn || user?.role !== "ADMIN_ROLE") {
			navigate("/dashboard/default", { replace: true });
		}
	}, [isLoggedIn, user, navigate]);

	// Don't render children until we've verified the user has admin role
	if (!isLoggedIn || user?.role !== "ADMIN_ROLE") {
		return null;
	}

	return <Outlet />;
};

export default AdminRoleGuard;
