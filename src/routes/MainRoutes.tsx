import React from "react";
import { Navigate } from "react-router-dom";

// project-imports
import MainLayout from "layout/MainLayout";
import CommonLayout from "layout/CommonLayout";
import Loadable from "components/Loadable";
import AuthGuard from "utils/route-guard/AuthGuard";
import AdminRoleGuard from "utils/route-guard/AdminRoleGuard";
import { lazyRetry } from "utils/lazyRetry";

// render - dashboard
const DashboardDefault = Loadable(lazyRetry(() => import("pages/dashboard/default"), "DashboardDefault"));
const DashboardAnalytics = Loadable(lazyRetry(() => import("pages/dashboard/analytics"), "DashboardAnalytics"));

// render - applications
const AppChat = Loadable(lazyRetry(() => import("pages/apps/chat")));
const AppCalendar = Loadable(lazyRetry(() => import("pages/apps/calendar/calendar")));
const AppAvailability = Loadable(lazyRetry(() => import("pages/apps/calendar/availability")));
const AppReservations = Loadable(lazyRetry(() => import("pages/apps/calendar/reservations")));

const AppCustomerList = Loadable(lazyRetry(() => import("pages/apps/customer/list")));

const AppInvoiceCreate = Loadable(lazyRetry(() => import("pages/apps/invoice/create")));
const AppInvoiceDashboard = Loadable(lazyRetry(() => import("pages/apps/invoice/dashboard")));
const AppInvoiceList = Loadable(lazyRetry(() => import("pages/apps/invoice/list")));
const AppInvoiceDetails = Loadable(lazyRetry(() => import("pages/apps/invoice/details")));
const AppInvoiceEdit = Loadable(lazyRetry(() => import("pages/apps/invoice/edit")));

const UserProfile = Loadable(lazyRetry(() => import("pages/apps/profiles/user")));
const UserTabPersonal = Loadable(lazyRetry(() => import("sections/apps/profiles/user/TabPersonal")));
const UserTabPayment = Loadable(lazyRetry(() => import("sections/apps/profiles/user/TabPayment")));
const UserTabPassword = Loadable(lazyRetry(() => import("sections/apps/profiles/user/TabPassword")));
const UserTabSettings = Loadable(lazyRetry(() => import("sections/apps/profiles/user/TabSettings")));
const UserTabProfessional = Loadable(lazyRetry(() => import("sections/apps/profiles/user/TabProfessional")));

const AccountProfile = Loadable(lazyRetry(() => import("pages/apps/profiles/account")));
const AccountTabAccount = Loadable(lazyRetry(() => import("sections/apps/profiles/account/TabAccount")));
const AccountTabPassword = Loadable(lazyRetry(() => import("sections/apps/profiles/account/TabPassword")));
const AccountTabRole = Loadable(lazyRetry(() => import("sections/apps/profiles/account/TabRole")));
const AccountTabSettings = Loadable(lazyRetry(() => import("sections/apps/profiles/account/TabSettings")));

// render - folders
const FoldersLayout = Loadable(lazyRetry(() => import("pages/apps/folders/folders")));

// render - calculator
const LaborLayout = Loadable(lazyRetry(() => import("pages/calculator/labor/index")));
const CivilLayouts = Loadable(lazyRetry(() => import("pages/calculator/civil/index")));
const InteresesLayouts = Loadable(lazyRetry(() => import("pages/calculator/intereses/index")));
const AllCalculatorsLayout = Loadable(lazyRetry(() => import("pages/calculator/all/index")));

// render - documents
const DocumentsLayout = Loadable(lazyRetry(() => import("pages/documents/index")));

// pages routing - auth
const AuthLogin = Loadable(lazyRetry(() => import("pages/auth/auth1/login")));
const AuthRegister = Loadable(lazyRetry(() => import("pages/auth/auth1/register")));
const AuthForgotPassword = Loadable(lazyRetry(() => import("pages/auth/auth1/forgot-password")));
const AuthResetPassword = Loadable(lazyRetry(() => import("pages/auth/auth1/reset-password")));
const AuthCheckMail = Loadable(lazyRetry(() => import("pages/auth/auth1/check-mail")));
const AuthCodeVerification = Loadable(lazyRetry(() => import("pages/auth/auth1/code-verification")));

// pages routing - error
const MaintenanceError = Loadable(lazyRetry(() => import("pages/maintenance/error/404")));

// render - sample page
const Details = Loadable(lazyRetry(() => import("pages/apps/folders/details/details")));
const PricingPage = Loadable(lazyRetry(() => import("pages/extra-pages/price/price1")));

// render - booking page
const BookingPage = Loadable(lazyRetry(() => import("pages/booking")));
const ManageBookingPage = Loadable(lazyRetry(() => import("pages/apps/calendar/manage-booking")));

// subscription pages
const SubscriptionSuccess = Loadable(lazyRetry(() => import("pages/apps/subscription/success")));
const SubscriptionError = Loadable(lazyRetry(() => import("pages/apps/subscription/error")));

// help page
const HelpPage = Loadable(lazyRetry(() => import("pages/help")));

// admin pages
const AdminCausasVerifiedPage = Loadable(lazyRetry(() => import("pages/admin/causas/verified")));
const AdminCausasFoldersPage = Loadable(lazyRetry(() => import("pages/admin/causas/folders")));
const AdminCausasWorkersPage = Loadable(lazyRetry(() => import("pages/admin/causas/workers")));
const AdminNotificationsPage = Loadable(lazyRetry(() => import("pages/admin/notifications")));
const AdminJudicialMovementsPage = Loadable(lazyRetry(() => import("pages/admin/notifications/judicial-movements")));
const AdminWorkersMevPage = Loadable(lazyRetry(() => import("pages/admin/workers/mev")));

// render - tasks
const TasksPage = Loadable(lazyRetry(() => import("pages/tasks")));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
	path: "/",
	children: [
		{
			path: "booking/:slug",
			element: <BookingPage />,
		},
		{
			path: "booking",
			element: <BookingPage />,
		},
		{
			path: "manage-booking",
			element: <ManageBookingPage />,
		},
		{
			path: "manage-booking/:token",
			element: <ManageBookingPage />,
		},
		{
			path: "/",
			element: (
				<AuthGuard>
					<MainLayout />
				</AuthGuard>
			),
			children: [
				{
					path: "dashboard",
					children: [
						{
							path: "default",
							element: <DashboardDefault />,
						},
						{
							path: "analytics",
							element: <DashboardAnalytics />,
						},
					],
				},
				{
					path: "apps",
					children: [
						{
							path: "folders",
							children: [
								{
									path: "details/:id",
									element: <Details />,
								},
								{
									path: "list",
									element: <FoldersLayout />,
								},
							],
						},
						{
							path: "chat",
							element: <AppChat />,
						},
						{
							path: "calc",
							children: [
								{
									path: "",
									element: <AllCalculatorsLayout />,
								},
								{
									path: "labor",
									element: <LaborLayout />,
								},
								{
									path: "civil",
									element: <CivilLayouts />,
								},
								{
									path: "intereses",
									element: <InteresesLayouts />,
								},
							],
						},
						{
							path: "documents",
							element: <DocumentsLayout />,
						},
						{
							path: "calendar",
							children: [
								{
									path: "",
									element: <AppCalendar />,
								},
								{
									path: "availability",
									element: <AppReservations />,
								},
								{
									path: "reservations",
									element: <AppReservations />,
								},
								{
									path: "reservations/:id",
									element: <AppReservations />,
								},
								{
									path: "booking-config",
									element: <AppAvailability />,
								},
							],
						},
						{
							path: "customer",
							children: [
								{
									path: "customer-list",
									element: <AppCustomerList />,
								},
							],
						},
						{
							path: "invoice",
							children: [
								{
									path: "dashboard",
									element: <AppInvoiceDashboard />,
								},
								{
									path: "create",
									element: <AppInvoiceCreate />,
								},
								{
									path: "details/:id",
									element: <AppInvoiceDetails />,
								},
								{
									path: "edit/:id",
									element: <AppInvoiceEdit />,
								},
								{
									path: "list",
									element: <AppInvoiceList />,
								},
							],
						},
						{
							path: "profiles",
							children: [
								{
									path: "account",
									element: <AccountProfile />,
									children: [
										{
											path: "my-account",
											element: <AccountTabAccount />,
										},
										{
											path: "password",
											element: <AccountTabPassword />,
										},
										{
											path: "role",
											element: <AccountTabRole />,
										},
										{
											path: "settings",
											element: <AccountTabSettings />,
										},
									],
								},
								{
									path: "user",
									element: <UserProfile />,
									children: [
										{
											path: "personal",
											element: <UserTabPersonal />,
										},
										{
											path: "payment",
											element: <UserTabPayment />,
										},
										{
											path: "password",
											element: <UserTabPassword />,
										},

										{
											path: "professional",
											element: <UserTabProfessional />,
										},
										{
											path: "settings",
											element: <UserTabSettings />,
										},
									],
								},
							],
						},
						{
							path: "subscription",
							children: [
								{
									path: "success",
									element: <SubscriptionSuccess />,
								},
								{
									path: "error",
									element: <SubscriptionError />,
								},
							],
						},
					],
				},
				{
					path: "suscripciones",
					children: [
						{
							path: "tables",
							element: <PricingPage />,
						},
					],
				},
				{
					path: "tareas",
					element: <TasksPage />,
				},
				{
					path: "ayuda",
					element: <HelpPage />,
				},
				{
					path: "admin",
					element: <AdminRoleGuard />,
					children: [
						{
							path: "causas",
							children: [
								{
									path: "",
									element: <Navigate to="verified" replace />,
								},
								{
									path: "verified",
									element: <AdminCausasVerifiedPage />,
								},
								{
									path: "folders",
									element: <AdminCausasFoldersPage />,
								},
								{
									path: "workers",
									element: <AdminCausasWorkersPage />,
								},
							],
						},
						{
							path: "workers",
							children: [
								{
									path: "mev",
									element: <AdminWorkersMevPage />,
								},
							],
						},
						{
							path: "notifications",
							children: [
								{
									path: "",
									element: <AdminNotificationsPage />,
								},
								{
									path: "judicial-movements",
									element: <AdminJudicialMovementsPage />,
								},
							],
						},
					],
				},
			],
		},
		{
			path: "/auth",
			element: <CommonLayout />,
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
					path: "reset-password",
					element: <AuthResetPassword />,
				},
				{
					path: "check-mail",
					element: <AuthCheckMail />,
				},
				{
					path: "code-verification",
					element: <AuthCodeVerification />,
				},
			],
		},
		{
			path: "/maintenance",
			element: <CommonLayout />,
			children: [
				{
					path: "404",
					element: <MaintenanceError />,
				},
			],
		},
	],
};

export default MainRoutes;
