import type { AuditRoute } from "./routes";

// Rutas públicas y de autenticación — no requieren storageState.
// GuestGuard redirige a /dashboard si ya hay sesión activa, por eso se corre sin auth.

export const PUBLIC_ROUTES: AuditRoute[] = [
	// Landing y páginas estáticas
	{
		name: "landing",
		path: "/",
		description: "Landing principal",
		componentPath: "src/pages/landing",
	},
	{
		name: "guides",
		path: "/guides",
		description: "Guías",
		componentPath: "src/pages/guides",
	},
	{
		name: "faq",
		path: "/faq",
		description: "Preguntas frecuentes",
		componentPath: "src/pages/faq",
	},
	{
		name: "privacy-policy",
		path: "/privacy-policy",
		description: "Política de privacidad",
		componentPath: "src/pages/privacy-policy",
	},
	{
		name: "cookies-policy",
		path: "/cookies-policy",
		description: "Política de cookies",
		componentPath: "src/pages/cookies-policy",
	},
	{
		name: "terms",
		path: "/terms",
		description: "Términos y condiciones",
		componentPath: "src/pages/terms",
	},
	{
		name: "plans",
		path: "/plans",
		description: "Planes y precios (landing)",
		componentPath: "src/pages/plans",
	},
	{
		name: "unsubscribe",
		path: "/unsubscribe",
		description: "Desuscripción",
		componentPath: "src/pages/unsubscribe",
	},
	// Auth (GuestGuard)
	{
		name: "login",
		path: "/login",
		description: "Login",
		componentPath: "src/pages/auth/auth1/login",
	},
	{
		name: "register",
		path: "/register",
		description: "Registro",
		componentPath: "src/pages/auth/auth1/register",
	},
	{
		name: "forgot-password",
		path: "/forgot-password",
		description: "Olvidé mi contraseña",
		componentPath: "src/pages/auth/auth1/forgot-password",
	},
	{
		name: "check-mail",
		path: "/check-mail",
		description: "Revisá tu email",
		componentPath: "src/pages/auth/auth1/check-mail",
	},
	{
		name: "reset-password",
		path: "/reset-password",
		description: "Restablecer contraseña",
		componentPath: "src/pages/auth/auth1/reset-password",
	},
	{
		name: "code-verification",
		path: "/code-verification",
		description: "Verificación por código",
		componentPath: "src/pages/auth/auth1/code-verification",
	},
];
