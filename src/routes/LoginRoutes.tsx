import React from "react";
import { lazyRetry } from "utils/lazyRetry";

// project-imports
import GuestGuard from "utils/route-guard/GuestGuard";
import CommonLayout from "layout/CommonLayout";
import Loadable from "components/Loadable";

// render - login
const AuthLogin = Loadable(lazyRetry(() => import("pages/auth/auth1/login")));
const AuthRegister = Loadable(lazyRetry(() => import("pages/auth/auth1/register")));
const AuthForgotPassword = Loadable(lazyRetry(() => import("pages/auth/auth1/forgot-password")));
const AuthCheckMail = Loadable(lazyRetry(() => import("pages/auth/auth1/check-mail")));
const AuthResetPassword = Loadable(lazyRetry(() => import("pages/auth/auth1/reset-password")));
const AuthCodeVerification = Loadable(lazyRetry(() => import("pages/auth/auth1/code-verification")));

// ==============================|| AUTH ROUTES ||============================== //

const LoginRoutes = {
	path: "/",
	children: [
		{
			path: "/",
			element: (
				<GuestGuard>
					<CommonLayout />
				</GuestGuard>
			),
			children: [
				{
					path: "login",
					element: <AuthLogin />,
				},
				{
					path: "register",
					element: <AuthRegister />,
				},
				{
					path: "forgot-password",
					element: <AuthForgotPassword />,
				},
				{
					path: "check-mail",
					element: <AuthCheckMail />,
				},
				{
					path: "reset-password",
					element: <AuthResetPassword />,
				},
				{
					path: "code-verification",
					element: <AuthCodeVerification />,
				},
			],
		},
	],
};

export default LoginRoutes;
