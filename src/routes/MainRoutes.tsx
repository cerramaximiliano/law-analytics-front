import React from "react";
import { Navigate } from "react-router-dom";

// project-imports
import MainLayout from "layout/MainLayout";
import CommonLayout from "layout/CommonLayout";
import Loadable from "components/Loadable";
import AuthGuard from "utils/route-guard/AuthGuard";
import AdminRoleGuard from "utils/route-guard/AdminRoleGuard";
import { lazyWithRetry } from "utils/lazyWithRetry";

// render - dashboard
const DashboardDefault = Loadable(lazyWithRetry(() => import("pages/dashboard/default")));
const DashboardAnalytics = Loadable(lazyWithRetry(() => import("pages/dashboard/analytics")));

// render - applications
const AppChat = Loadable(lazyWithRetry(() => import("pages/apps/chat")));
const AppCalendar = Loadable(lazyWithRetry(() => import("pages/apps/calendar/calendar")));
const AppAvailability = Loadable(lazyWithRetry(() => import("pages/apps/calendar/availability")));
const AppReservations = Loadable(lazyWithRetry(() => import("pages/apps/calendar/reservations")));

const AppCustomerList = Loadable(lazyWithRetry(() => import("pages/apps/customer/list")));

const AppInvoiceCreate = Loadable(lazyWithRetry(() => import("pages/apps/invoice/create")));
const AppInvoiceDashboard = Loadable(lazyWithRetry(() => import("pages/apps/invoice/dashboard")));
const AppInvoiceList = Loadable(lazyWithRetry(() => import("pages/apps/invoice/list")));
const AppInvoiceDetails = Loadable(lazyWithRetry(() => import("pages/apps/invoice/details")));
const AppInvoiceEdit = Loadable(lazyWithRetry(() => import("pages/apps/invoice/edit")));

const UserProfile = Loadable(lazyWithRetry(() => import("pages/apps/profiles/user")));
const UserTabPersonal = Loadable(lazyWithRetry(() => import("sections/apps/profiles/user/TabPersonal")));
const UserTabPayment = Loadable(lazyWithRetry(() => import("sections/apps/profiles/user/TabPayment")));
const UserTabPassword = Loadable(lazyWithRetry(() => import("sections/apps/profiles/user/TabPassword")));
const UserTabSettings = Loadable(lazyWithRetry(() => import("sections/apps/profiles/user/TabSettings")));
const UserTabProfessional = Loadable(lazyWithRetry(() => import("sections/apps/profiles/user/TabProfessional")));

const AccountProfile = Loadable(lazyWithRetry(() => import("pages/apps/profiles/account")));
const AccountTabAccount = Loadable(lazyWithRetry(() => import("sections/apps/profiles/account/TabAccount")));
const AccountTabPassword = Loadable(lazyWithRetry(() => import("sections/apps/profiles/account/TabPassword")));
const AccountTabRole = Loadable(lazyWithRetry(() => import("sections/apps/profiles/account/TabRole")));
const AccountTabSettings = Loadable(lazyWithRetry(() => import("sections/apps/profiles/account/TabSettings")));

// render - folders
const FoldersLayout = Loadable(lazyWithRetry(() => import("pages/apps/folders/folders")));

// render - calculator
const LaborLayout = Loadable(lazyWithRetry(() => import("pages/calculator/labor/index")));
const CivilLayouts = Loadable(lazyWithRetry(() => import("pages/calculator/civil/index")));
const InteresesLayouts = Loadable(lazyWithRetry(() => import("pages/calculator/intereses/index")));
const AllCalculatorsLayout = Loadable(lazyWithRetry(() => import("pages/calculator/all/index")));

// render - documents
const DocumentsLayout = Loadable(lazyWithRetry(() => import("pages/documents/index")));

// pages routing - auth
const AuthLogin = Loadable(lazyWithRetry(() => import("pages/auth/auth1/login")));
const AuthRegister = Loadable(lazyWithRetry(() => import("pages/auth/auth1/register")));
const AuthForgotPassword = Loadable(lazyWithRetry(() => import("pages/auth/auth1/forgot-password")));
const AuthResetPassword = Loadable(lazyWithRetry(() => import("pages/auth/auth1/reset-password")));
const AuthCheckMail = Loadable(lazyWithRetry(() => import("pages/auth/auth1/check-mail")));
const AuthCodeVerification = Loadable(lazyWithRetry(() => import("pages/auth/auth1/code-verification")));

// pages routing - error
const MaintenanceError = Loadable(lazyWithRetry(() => import("pages/maintenance/error/404")));

// render - sample page
const Details = Loadable(lazyWithRetry(() => import("pages/apps/folders/details/details")));
const PricingPage = Loadable(lazyWithRetry(() => import("pages/extra-pages/price/price1")));

// render - booking page
const BookingPage = Loadable(lazyWithRetry(() => import("pages/booking")));
const ManageBookingPage = Loadable(lazyWithRetry(() => import("pages/apps/calendar/manage-booking")));

// subscription pages
const SubscriptionSuccess = Loadable(lazyWithRetry(() => import("pages/apps/subscription/success")));
const SubscriptionError = Loadable(lazyWithRetry(() => import("pages/apps/subscription/error")));

// help page
const HelpPage = Loadable(lazyWithRetry(() => import("pages/help")));

// admin pages
const AdminMailingPage = Loadable(lazyWithRetry(() => import("pages/admin/marketing/mailing")));
const AdminTemplatesPage = Loadable(lazyWithRetry(() => import("pages/admin/marketing/templates")));
const AdminContactsPage = Loadable(lazyWithRetry(() => import("pages/admin/marketing/contacts")));
const AdminPlansPage = Loadable(lazyWithRetry(() => import("pages/admin/plans")));
const AdminUsersPage = Loadable(lazyWithRetry(() => import("pages/admin/users")));
const AdminServerStatusPage = Loadable(lazyWithRetry(() => import("pages/admin/server-status")));
const AdminCausasVerifiedPage = Loadable(lazyWithRetry(() => import("pages/admin/causas/verified")));
const AdminCausasFoldersPage = Loadable(lazyWithRetry(() => import("pages/admin/causas/folders")));
const AdminCausasWorkersPage = Loadable(lazyWithRetry(() => import("pages/admin/causas/workers")));
const AdminNotificationsPage = Loadable(lazyWithRetry(() => import("pages/admin/notifications")));

// render - tasks
const TasksPage = Loadable(lazyWithRetry(() => import("pages/tasks")));

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
							path: "marketing",
							children: [
								{
									path: "mailing",
									element: <AdminMailingPage />,
								},
								{
									path: "templates",
									element: <AdminTemplatesPage />,
								},
								{
									path: "contacts",
									element: <AdminContactsPage />,
								},
							],
						},
						{
							path: "plans",
							element: <AdminPlansPage />,
						},
						{
							path: "users",
							element: <AdminUsersPage />,
						},
						{
							path: "server-status",
							element: <AdminServerStatusPage />,
						},
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
							path: "notifications",
							element: <AdminNotificationsPage />,
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
