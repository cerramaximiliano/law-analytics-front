import { lazy } from "react";

// project-imports
import MainLayout from "layout/MainLayout";
import CommonLayout from "layout/CommonLayout";
import Loadable from "components/Loadable";
import AuthGuard from "utils/route-guard/AuthGuard";

// render - dashboard
const DashboardDefault = Loadable(lazy(() => import("pages/dashboard/default")));
//const DashboardAnalytics = Loadable(lazy(() => import("pages/dashboard/analytics")));

// render - widget
//const WidgetStatistics = Loadable(lazy(() => import("pages/widget/statistics")));
//const WidgetData = Loadable(lazy(() => import("pages/widget/data")));
//const WidgetChart = Loadable(lazy(() => import("pages/widget/chart")));

// render - applications
const AppChat = Loadable(lazy(() => import("pages/apps/chat")));
const AppCalendar = Loadable(lazy(() => import("pages/apps/calendar")));

//const AppKanban = Loadable(lazy(() => import("pages/apps/kanban")));
//const AppKanbanBacklogs = Loadable(lazy(() => import("sections/apps/kanban/Backlogs")));
//const AppKanbanBoard = Loadable(lazy(() => import("sections/apps/kanban/Board")));

const AppCustomerList = Loadable(lazy(() => import("pages/apps/customer/list")));

const AppInvoiceCreate = Loadable(lazy(() => import("pages/apps/invoice/create")));
const AppInvoiceDashboard = Loadable(lazy(() => import("pages/apps/invoice/dashboard")));
const AppInvoiceList = Loadable(lazy(() => import("pages/apps/invoice/list")));
const AppInvoiceDetails = Loadable(lazy(() => import("pages/apps/invoice/details")));
const AppInvoiceEdit = Loadable(lazy(() => import("pages/apps/invoice/edit")));

const UserProfile = Loadable(lazy(() => import("pages/apps/profiles/user")));
const UserTabPersonal = Loadable(lazy(() => import("sections/apps/profiles/user/TabPersonal")));
const UserTabPayment = Loadable(lazy(() => import("sections/apps/profiles/user/TabPayment")));
const UserTabPassword = Loadable(lazy(() => import("sections/apps/profiles/user/TabPassword")));
const UserTabSettings = Loadable(lazy(() => import("sections/apps/profiles/user/TabSettings")));
const UserTabProfessional = Loadable(lazy(() => import("sections/apps/profiles/user/TabProfessional")));

const AccountProfile = Loadable(lazy(() => import("pages/apps/profiles/account")));
const AccountTabProfile = Loadable(lazy(() => import("sections/apps/profiles/account/TabProfile")));
const AccountTabPersonal = Loadable(lazy(() => import("sections/apps/profiles/account/TabPersonal")));
const AccountTabAccount = Loadable(lazy(() => import("sections/apps/profiles/account/TabAccount")));
const AccountTabPassword = Loadable(lazy(() => import("sections/apps/profiles/account/TabPassword")));
const AccountTabRole = Loadable(lazy(() => import("sections/apps/profiles/account/TabRole")));
const AccountTabSettings = Loadable(lazy(() => import("sections/apps/profiles/account/TabSettings")));

//const AppECommProducts = Loadable(lazy(() => import("pages/apps/e-commerce/product")));
//const AppECommProductDetails = Loadable(lazy(() => import("pages/apps/e-commerce/product-details")));
//const AppECommProductList = Loadable(lazy(() => import("pages/apps/e-commerce/products-list")));
//const AppECommCheckout = Loadable(lazy(() => import("pages/apps/e-commerce/checkout")));
//const AppECommAddProduct = Loadable(lazy(() => import("pages/apps/e-commerce/add-product")));

// render - folders
const FoldersLayout = Loadable(lazy(() => import("pages/apps/folders/folders")));

// render - calculator
const LaborLayout = Loadable(lazy(() => import("pages/calculator/labor/index")));
const CivilLayouts = Loadable(lazy(() => import("pages/calculator/civil/index")));
const InteresesLayouts = Loadable(lazy(() => import("pages/calculator/intereses/index")));

// render - forms & tables
//const FormsValidation = Loadable(lazy(() => import("pages/forms/validation")));
//const FormsWizard = Loadable(lazy(() => import("pages/forms/wizard")));

//const FormsLayoutBasic = Loadable(lazy(() => import("pages/forms/layouts/basic")));
//const FormsLayoutMultiColumn = Loadable(lazy(() => import("pages/forms/layouts/multi-column")));
//const FormsLayoutActionBar = Loadable(lazy(() => import("pages/forms/layouts/action-bar")));
//const FormsLayoutStickyBar = Loadable(lazy(() => import("pages/forms/layouts/sticky-bar")));

//const FormsPluginsMask = Loadable(lazy(() => import("pages/forms/plugins/mask")));
//const FormsPluginsClipboard = Loadable(lazy(() => import("pages/forms/plugins/clipboard")));
//const FormsPluginsRecaptcha = Loadable(lazy(() => import("pages/forms/plugins/re-captcha")));
//vconst FormsPluginsEditor = Loadable(lazy(() => import("pages/forms/plugins/editor")));
//const FormsPluginsDropzone = Loadable(lazy(() => import("pages/forms/plugins/dropzone")));

//const ReactTableBasic = Loadable(lazy(() => import("pages/tables/react-table/basic")));
//const ReactTableSorting = Loadable(lazy(() => import("pages/tables/react-table/sorting")));
//const ReactTableFiltering = Loadable(lazy(() => import("pages/tables/react-table/filtering")));
//const ReactTableGrouping = Loadable(lazy(() => import("pages/tables/react-table/grouping")));
//const ReactTablePagination = Loadable(lazy(() => import("pages/tables/react-table/pagination")));
//const ReactTableRowSelection = Loadable(lazy(() => import("pages/tables/react-table/row-selection")));
//const ReactTableExpanding = Loadable(lazy(() => import("pages/tables/react-table/expanding")));
//const ReactTableEditable = Loadable(lazy(() => import("pages/tables/react-table/editable")));
//const ReactTableDragDrop = Loadable(lazy(() => import("pages/tables/react-table/drag-drop")));
//const ReactTableColumnHiding = Loadable(lazy(() => import("pages/tables/react-table/column-hiding")));
//const ReactTableColumnResizing = Loadable(lazy(() => import("pages/tables/react-table/column-resizing")));
//const ReactTableStickyTable = Loadable(lazy(() => import("pages/tables/react-table/sticky")));
//const ReactTableUmbrella = Loadable(lazy(() => import("pages/tables/react-table/umbrella")));
//const ReactTableEmpty = Loadable(lazy(() => import("pages/tables/react-table/empty")));

// render - charts & map
//const ChartApexchart = Loadable(lazy(() => import("pages/charts/apexchart")));
//const ChartOrganization = Loadable(lazy(() => import("pages/charts/org-chart")));

// table routing
//const MuiTableBasic = Loadable(lazy(() => import("pages/tables/mui-table/basic")));
//const MuiTableDense = Loadable(lazy(() => import("pages/tables/mui-table/dense")));
//const MuiTableEnhanced = Loadable(lazy(() => import("pages/tables/mui-table/enhanced")));
//const MuiTableDatatable = Loadable(lazy(() => import("pages/tables/mui-table/datatable")));
//const MuiTableCustom = Loadable(lazy(() => import("pages/tables/mui-table/custom")));
//const MuiTableFixedHeader = Loadable(lazy(() => import("pages/tables/mui-table/fixed-header")));
//const MuiTableCollapse = Loadable(lazy(() => import("pages/tables/mui-table/collapse")));

// pages routing
const AuthLogin = Loadable(lazy(() => import("pages/auth/auth1/login")));
const AuthRegister = Loadable(lazy(() => import("pages/auth/auth1/register")));
const AuthForgotPassword = Loadable(lazy(() => import("pages/auth/auth1/forgot-password")));
const AuthResetPassword = Loadable(lazy(() => import("pages/auth/auth1/reset-password")));
const AuthCheckMail = Loadable(lazy(() => import("pages/auth/auth1/check-mail")));
const AuthCodeVerification = Loadable(lazy(() => import("pages/auth/auth1/code-verification")));

const AuthLogin2 = Loadable(lazy(() => import("pages/auth/auth2/login2")));
const AuthRegister2 = Loadable(lazy(() => import("pages/auth/auth2/register2")));
const AuthForgotPassword2 = Loadable(lazy(() => import("pages/auth/auth2/forgot-password2")));
const AuthResetPassword2 = Loadable(lazy(() => import("pages/auth/auth2/reset-password2")));
const AuthCheckMail2 = Loadable(lazy(() => import("pages/auth/auth2/check-mail2")));
const AuthCodeVerification2 = Loadable(lazy(() => import("pages/auth/auth2/code-verification2")));

const AuthLogin3 = Loadable(lazy(() => import("pages/auth/auth3/login3")));

//const MaintenanceError = Loadable(lazy(() => import("pages/maintenance/error/404")));
//const MaintenanceError500 = Loadable(lazy(() => import("pages/maintenance/error/500")));
//const MaintenanceUnderConstruction = Loadable(lazy(() => import("pages/maintenance/under-construction/under-construction")));
//const MaintenanceUnderConstruction2 = Loadable(lazy(() => import("pages/maintenance/under-construction/under-construction2")));
//const MaintenanceComingSoon = Loadable(lazy(() => import("pages/maintenance/coming-soon/coming-soon")));
//const MaintenanceComingSoon2 = Loadable(lazy(() => import("pages/maintenance/coming-soon/coming-soon2")));

// render - sample page
const Details = Loadable(lazy(() => import("pages/apps/folders/details/details")));
//const Landing = Loadable(lazy(() => import("pages/landing")));
//const ContactUS = Loadable(lazy(() => import("pages/contact-us")));
const PricingPage = Loadable(lazy(() => import("pages/extra-pages/price/price1")));
//const PricingPage2 = Loadable(lazy(() => import("pages/extra-pages/price/price2")));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
	path: "/",
	children: [
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
							path: "calendar",
							element: <AppCalendar />,
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
											path: "basic",
											element: <AccountTabProfile />,
										},
										{
											path: "personal",
											element: <AccountTabPersonal />,
										},
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
			],
		},
		/* 		{
			path: "/",
			element: <CommonLayout layout="landing" />,
			children: [
				{
					path: "landing",
					element: <Landing />,
				},
			],
		}, */
		/* 		{
			path: "/",
			element: <CommonLayout layout="simple" />,
			children: [
				{
					path: "contact-us",
					element: <ContactUS />,
				},
			],
		}, */
		/* 		{
			path: "/maintenance",
			element: <CommonLayout />,
			children: [
				{
					path: "404",
					element: <MaintenanceError />,
				},
				{
					path: "500",
					element: <MaintenanceError500 />,
				},
				{
					path: "under-construction",
					element: <MaintenanceUnderConstruction />,
				},
				{
					path: "under-construction2",
					element: <MaintenanceUnderConstruction2 />,
				},
				{
					path: "coming-soon",
					element: <MaintenanceComingSoon />,
				},
				{
					path: "coming-soon2",
					element: <MaintenanceComingSoon2 />,
				},
			],
		}, */
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
				{
					path: "login2",
					element: <AuthLogin2 />,
				},
				{
					path: "register2",
					element: <AuthRegister2 />,
				},
				{
					path: "forgot-password2",
					element: <AuthForgotPassword2 />,
				},
				{
					path: "reset-password2",
					element: <AuthResetPassword2 />,
				},
				{
					path: "check-mail2",
					element: <AuthCheckMail2 />,
				},
				{
					path: "code-verification2",
					element: <AuthCodeVerification2 />,
				},
				{
					path: "login3",
					element: <AuthLogin3 />,
				},
			],
		},
	],
};

export default MainRoutes;
