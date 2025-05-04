import { lazy } from "react";
import { useRoutes } from "react-router-dom";

// project-imports
import CommonLayout from "layout/CommonLayout";
import Loadable from "components/Loadable";
//import ComponentsRoutes from "./ComponentsRoutes";
import LoginRoutes from "./LoginRoutes";
import MainRoutes from "./MainRoutes";
const MaintenanceError = Loadable(lazy(() => import("pages/maintenance/error/404")));

// render - landing and static pages
const PagesLanding = Loadable(lazy(() => import("pages/landing")));
const GuidesPage = Loadable(lazy(() => import("pages/guides")));
const FaqPage = Loadable(lazy(() => import("pages/faq")));
const PrivacyPolicy = Loadable(lazy(() => import("pages/privacy-policy")));
const CookiesPolicy = Loadable(lazy(() => import("pages/cookies-policy")));
const UnsubscribePage = Loadable(lazy(() => import("pages/unsubscribe")));
const TermsPage = Loadable(lazy(() => import("pages/terms")));

// ==============================|| ROUTES RENDER ||============================== //

export default function ThemeRoutes() {
	return useRoutes([
		{
			path: "/",
			element: <CommonLayout layout="landing" />,
			children: [
				{
					path: "/",
					element: <PagesLanding />,
				},
				{
					path: "guides",
					element: <GuidesPage />,
				},
				{
					path: "faq",
					element: <FaqPage />,
				},
				{
					path: "privacy-policy",
					element: <PrivacyPolicy />,
				},
				{
					path: "cookies-policy",
					element: <CookiesPolicy />,
				},
				{
					path: "unsubscribe",
					element: <UnsubscribePage />,
				},
				{
					path: "terms",
					element: <TermsPage />,
				},
			],
		},
		LoginRoutes,
		//ComponentsRoutes,
		MainRoutes,
		{
			path: "*",
			element: <MaintenanceError />,
		},
	]);
}
