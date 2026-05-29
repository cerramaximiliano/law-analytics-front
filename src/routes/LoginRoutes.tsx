import React from "react";
import { Navigate } from "react-router-dom";
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

// OAuth (MCP server connection) — Phase 2. Sin GuestGuard porque users con sesión
// activa en lawanalytics igual necesitan re-autenticar ante Hydra (cookies del
// hub no se comparten con Hydra). El flow es válido logged-in o logged-out.
const OauthLogin = Loadable(lazyRetry(() => import("pages/oauth/login")));
const OauthConsent = Loadable(lazyRetry(() => import("pages/oauth/consent")));
const OauthUpgradeRequired = Loadable(lazyRetry(() => import("pages/oauth/upgrade-required")));

// Landing pública de conectores AI (Claude.ai + ChatGPT) — Phase 7 PR 7.3.
// Renombrada de /integraciones/claude-ai a /integraciones/conectores-ai
// cuando el conector pasó a soportar también ChatGPT. La URL vieja se
// mantiene como redirect para preservar links externos y SEO.
const IntegracionConectoresAi = Loadable(lazyRetry(() => import("pages/integraciones/conectores-ai")));

// Landing dedicada para ChatGPT — steps y FAQ orientados al flow de OpenAI.
const IntegracionChatGpt = Loadable(lazyRetry(() => import("pages/integraciones/chatgpt")));

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
		// OAuth rutas — fuera del GuestGuard
		{
			path: "/",
			element: <CommonLayout />,
			children: [
				{
					path: "oauth/login",
					element: <OauthLogin />,
				},
				{
					path: "oauth/consent",
					element: <OauthConsent />,
				},
				{
					path: "oauth/upgrade-required",
					element: <OauthUpgradeRequired />,
				},
				{
					path: "integraciones/conectores-ai",
					element: <IntegracionConectoresAi />,
				},
				{
					path: "integraciones/chatgpt",
					element: <IntegracionChatGpt />,
				},
				{
					// Redirect de la URL vieja para preservar links externos.
					// `replace` evita que el back del browser vuelva al path viejo.
					// Para SEO real (301) hay que sumar regla nginx en el server —
					// React Router hace 302 client-side.
					path: "integraciones/claude-ai",
					element: <Navigate to="/integraciones/conectores-ai" replace />,
				},
			],
		},
	],
};

export default LoginRoutes;
