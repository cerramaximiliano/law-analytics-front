import React from "react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "store";

// material-ui
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	Grid,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { Calendar, CardSend, CloseSquare, Crown, InfoCircle, ReceiptItem, Refresh, ReceiptText, Timer1, Warning2 } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Payment } from "store/reducers/ApiService";
import InvoiceView from "./InvoiceView";
import { useNavigate } from "react-router";
import { RootState } from "store";
import { fetchCurrentSubscription, updateSubscription, fetchPaymentHistory, selectPaymentHistory } from "store/reducers/auth";
import { openSnackbar } from "store/reducers/snackbar";
import dayjs from "utils/dayjs-config";
import { useTeam } from "contexts/TeamContext";
import { ROLE_CONFIG } from "types/teams";
import ResourceUsageWidget from "sections/widget/chart/ResourceUsageWidget";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| ACCOUNT PROFILE - SUBSCRIPTION ||============================== //

const getStripeValue = (value: any): string => {
	if (typeof value === "string") return value;
	if (typeof value === "object" && value !== null) {
		const isDevelopment = import.meta.env.VITE_BASE_URL?.includes("localhost") || import.meta.env.MODE === "development";
		if (isDevelopment && value.test) return value.test;
		if (!isDevelopment && value.live) return value.live;
		if (value.test) return value.test;
		if (value.live) return value.live;
	}
	return "No disponible";
};

const TabSubscription = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const { isTeamMode, activeTeam, userRole, isOwner, ownerSubscription } = useTeam();
	const isTeamMember = isTeamMode && !isOwner;

	const subscription = useSelector((state: RootState) => state.auth.subscription);
	const payments = useSelector(selectPaymentHistory) || [];
	const userEmail = useSelector((state: RootState) => state.auth.user?.email || state.auth.email || "");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextPlan, setNextPlan] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [reactivateLoading, setReactivateLoading] = useState(false);

	const [paymentsLoading, setPaymentsLoading] = useState(false);
	const [showAllPayments, setShowAllPayments] = useState(false);
	const [paymentsError, setPaymentsError] = useState<string | null>(null);

	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

	const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
	const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<any>(null);
	const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
	const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
	const [changingPaymentMethod, setChangingPaymentMethod] = useState(false);
	const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
	const [showAllPaymentMethods, setShowAllPaymentMethods] = useState(false);

	const fetchSubscription = async (forceRefresh = true) => {
		try {
			setLoading(true);
			setError(null);
			const subscriptionData = await dispatch(fetchCurrentSubscription(forceRefresh) as any);
			if (subscriptionData && subscriptionData.pendingPlanChange) {
				setNextPlan(getStripeValue(subscriptionData.pendingPlanChange.planId));
			}
		} catch (err: any) {
			if (err.response?.status !== 401) setError("Error al cargar los datos de suscripción");
		} finally {
			setLoading(false);
		}
	};

	const loadPaymentHistory = async () => {
		try {
			setPaymentsLoading(true);
			setPaymentsError(null);
			await dispatch(fetchPaymentHistory() as any);
		} catch (err: any) {
			if (err.response?.status !== 401 && err.response?.status !== 500) {
				setPaymentsError(err.message || "Error al cargar el historial de pagos");
			}
		} finally {
			setPaymentsLoading(false);
		}
	};

	const loadPaymentMethods = async () => {
		try {
			setPaymentMethodsLoading(true);
			setPaymentMethodsError(null);
			const response = await ApiService.getPaymentMethods();
			if (response.success) {
				setPaymentMethods(response.paymentMethods || []);
				setDefaultPaymentMethod(response.defaultPaymentMethod || null);
			} else {
				setPaymentMethodsError(response.message || "Error al cargar métodos de pago");
			}
		} catch (err: any) {
			if (err.response?.status !== 401 && err.response?.status !== 500) {
				setPaymentMethodsError(err.message || "Error al cargar los métodos de pago");
			}
		} finally {
			setPaymentMethodsLoading(false);
		}
	};

	const handleChangePaymentMethod = async (paymentMethodId: string) => {
		try {
			setChangingPaymentMethod(true);
			const response = await ApiService.updatePaymentMethod(paymentMethodId);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Método de pago actualizado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				await loadPaymentMethods();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al actualizar el método de pago",
						variant: "alert",
						alert: { color: "error" },
						close: false,
					}),
				);
			}
		} catch (err: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: err.message || "Error al actualizar el método de pago",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setChangingPaymentMethod(false);
		}
	};

	const handleOpenBillingPortal = async () => {
		try {
			setOpeningBillingPortal(true);
			const returnUrl = window.location.href;
			const response = await ApiService.createBillingPortalSession(returnUrl);
			if (response.success && response.url) {
				window.location.href = response.url;
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al abrir el portal de facturación",
						variant: "alert",
						alert: { color: "error" },
						close: false,
					}),
				);
			}
		} catch (err: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: err.message || "Error al abrir el portal de facturación",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setOpeningBillingPortal(false);
		}
	};

	useEffect(() => {
		fetchSubscription();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (subscription?.pendingPlanChange) setNextPlan(getStripeValue(subscription.pendingPlanChange.planId));
	}, [subscription]);

	useEffect(() => {
		if (subscription && !payments.length) loadPaymentHistory();
	}, [subscription]);

	useEffect(() => {
		if (subscription && subscription.plan !== "free") loadPaymentMethods();
	}, [subscription]);

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "No disponible";
		const date = typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(date);
	};

	const formatAmount = (amount: number, currency: string) => {
		const formatter = new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: currency || "EUR",
			minimumFractionDigits: 2,
		});
		return formatter.format(amount);
	};

	const getPlanName = (planId: string) => {
		switch (planId) {
			case "free":
				return "Plan Gratuito";
			case "standard":
				return "Plan Estándar";
			case "premium":
				return "Plan Premium";
			default:
				return planId;
		}
	};

	const getPlanLimits = (planId: string) => {
		switch (planId) {
			case "free":
				return { folders: 5, calculators: 3, contacts: 10, storage: 50 };
			case "standard":
				return { folders: 50, calculators: 20, contacts: 100, storage: 1024 };
			case "premium":
				return { folders: 999999, calculators: 999999, contacts: 999999, storage: 10240 };
			default:
				return { folders: 0, calculators: 0, contacts: 0, storage: 0 };
		}
	};

	const handleViewInvoice = (payment: Payment) => {
		setSelectedPayment(payment);
		setInvoiceDialogOpen(true);
	};

	const handleCloseInvoiceDialog = () => setInvoiceDialogOpen(false);
	const handleOpenCancelDialog = () => setCancelDialogOpen(true);
	const handleCloseCancelDialog = () => setCancelDialogOpen(false);
	const handleChangePlan = () => {
		window.location.href = "/suscripciones/tables";
	};

	const handleCancelSubscription = async () => {
		try {
			setCancelLoading(true);
			const response = await ApiService.cancelSubscription(true);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tu suscripción se cancelará al final del período actual",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				if (response.data && response.data.subscription) {
					dispatch(updateSubscription(response.data.subscription));
				} else {
					await fetchSubscription();
				}
			} else {
				setError("No se pudo cancelar la suscripción");
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			setError(err.message || "Error al cancelar la suscripción");
			setTimeout(() => setError(null), 5000);
		} finally {
			setCancelLoading(false);
			setCancelDialogOpen(false);
		}
	};

	const handleReactivateSubscription = async () => {
		try {
			setReactivateLoading(true);
			setError(null);
			const response = await ApiService.cancelScheduledDowngrade();
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tu suscripción ha sido reactivada correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				if (response.data && response.data.subscription) {
					dispatch(updateSubscription(response.data.subscription));
				} else if (response.subscription) {
					dispatch(updateSubscription(response.subscription));
				} else {
					await fetchSubscription();
				}
			} else {
				setError("No se pudo reactivar la suscripción: " + (response.message || "Error desconocido"));
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			setError(err.message || "Error al reactivar la suscripción");
			setTimeout(() => setError(null), 5000);
		} finally {
			setReactivateLoading(false);
		}
	};

	const calculateRemainingDays = (expiryDate: string | Date): number => {
		if (!expiryDate) return 0;
		const expiry = new Date(expiryDate);
		const today = new Date();
		const diffTime = expiry.getTime() - today.getTime();
		return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
	};

	const getGracePeriodStatus = (expiryDate: string | Date): "future" | "today" | "past" => {
		if (!expiryDate) return "past";
		const expiry = new Date(expiryDate);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		if (expiry.getTime() > today.getTime()) return "future";
		if (expiry.getTime() === today.getTime()) return "today";
		return "past";
	};

	const getGracePeriodMessage = (expiryDate: string | Date): string => {
		const status = getGracePeriodStatus(expiryDate);
		const formattedDate = formatDate(expiryDate);
		const processedAt = subscription?.downgradeGracePeriod?.processedAt;
		const autoArchiveScheduled = subscription?.downgradeGracePeriod?.autoArchiveScheduled;

		switch (status) {
			case "future":
				return `Tras el cambio de plan, tenés hasta el ${formattedDate} para archivar el contenido que exceda los límites del plan gratuito.`;
			case "today":
				if (processedAt && !autoArchiveScheduled) {
					const processedDate = dayjs(processedAt).format("D [de] MMMM [de] YYYY [a las] HH:mm");
					return `El archivado automático del contenido que excedía los límites del plan gratuito se realizó el ${processedDate}.`;
				}
				return `Hoy es el último día para archivar el contenido que exceda los límites del plan gratuito. El sistema archivará automáticamente el contenido excedente al finalizar el día.`;
			case "past":
				if (processedAt) {
					const processedDate = dayjs(processedAt).format("D [de] MMMM [de] YYYY [a las] HH:mm");
					return `El período de gracia finalizó el ${formattedDate}. El contenido que excedía los límites del plan gratuito fue archivado automáticamente el ${processedDate}.`;
				}
				return `El período de gracia finalizó el ${formattedDate}. El contenido que excedía los límites del plan gratuito ha sido archivado automáticamente.`;
			default:
				return `Tras el cambio de plan, tenés hasta el ${formattedDate} para archivar el contenido que exceda los límites del plan gratuito.`;
		}
	};

	const isInGracePeriod = () => {
		if (!subscription) return false;
		if (subscription.status === "past_due" || subscription.status === "unpaid") return true;
		if (subscription.downgradeGracePeriod?.expiresAt && new Date(subscription.downgradeGracePeriod.expiresAt) > new Date()) return true;
		if (subscription.cancelAtPeriodEnd === true && subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date())
			return true;
		return false;
	};

	const isDowngradeGracePeriodActive = () => {
		if (!subscription || !subscription.downgradeGracePeriod) return false;
		const { downgradeGracePeriod } = subscription;
		if (downgradeGracePeriod.expiresAt && new Date(downgradeGracePeriod.expiresAt) <= new Date()) return false;
		if (!downgradeGracePeriod.previousPlan) return false;
		if (subscription.plan !== downgradeGracePeriod.previousPlan && subscription.plan !== "free") return false;
		return true;
	};

	const getGracePeriodInfo = () => {
		if (!subscription || !isInGracePeriod()) return null;
		let gracePeriodType = "";
		let expiryDate = subscription.currentPeriodEnd;
		let previousPlan = subscription.plan;
		let targetPlan = "free";

		if (subscription.status === "past_due" || subscription.status === "unpaid") {
			gracePeriodType = "payment_failed";
			targetPlan = subscription.plan;
		} else if (subscription.downgradeGracePeriod?.expiresAt && new Date(subscription.downgradeGracePeriod.expiresAt) > new Date()) {
			gracePeriodType = "downgrade";
			expiryDate = subscription.downgradeGracePeriod.expiresAt;
			previousPlan = (subscription.downgradeGracePeriod.previousPlan as "free" | "standard" | "premium") || subscription.plan;
			targetPlan = subscription.downgradeGracePeriod.targetPlan || "free";
		} else if (subscription.cancelAtPeriodEnd === true) {
			gracePeriodType = "cancellation";
			expiryDate = subscription.currentPeriodEnd;
			targetPlan = "free";
		}

		const daysRemaining = calculateRemainingDays(expiryDate);
		const isExpiringSoon = daysRemaining <= 3;
		const willDowngradeToFreePlan = targetPlan === "free";

		return {
			gracePeriodType,
			willDowngradeToFreePlan,
			previousPlanName: getPlanName(previousPlan),
			currentPlanName: getPlanName(subscription.plan),
			targetPlanName: getPlanName(targetPlan),
			expiryDate,
			expiryFormatted: formatDate(expiryDate),
			daysRemaining,
			isExpiringSoon,
			cancellationDate: subscription.currentPeriodEnd,
			cancellationFormatted: formatDate(subscription.currentPeriodEnd),
			title: "Período de gracia",
		};
	};

	// ── Brand helpers ─────────────────────────────────────────────────────────

	const brandPrimarySx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const destructiveBtnSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: errorColor,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(errorColor, 0.88), boxShadow: "none" },
	};
	const destructiveGhostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: errorColor,
		borderRadius: 1.25,
		border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
		px: 2,
		py: 0.75,
		"&:hover": {
			bgcolor: alpha(errorColor, isDark ? 0.14 : 0.08),
			borderColor: alpha(errorColor, isDark ? 0.5 : 0.36),
		},
	};
	const greenGhostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: LIVE_GREEN,
		borderRadius: 1.25,
		border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
		px: 2,
		py: 0.75,
		"&:hover": {
			bgcolor: alpha(LIVE_GREEN, isDark ? 0.14 : 0.08),
			borderColor: alpha(LIVE_GREEN, isDark ? 0.5 : 0.36),
		},
	};

	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};
	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-root": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			color: "text.secondary",
			fontSize: "0.68rem",
			fontWeight: 600,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
			py: 1.25,
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
			fontSize: "0.82rem",
		},
		"& .MuiTableBody-root .MuiTableRow-root:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
		},
	};

	// Pills brand-aware
	const BrandPill = ({ color, label, dot = true }: { color: string; label: string; dot?: boolean }) => (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(color, isDark ? 0.16 : 0.1),
				border: `1px solid ${alpha(color, isDark ? 0.32 : 0.22)}`,
			}}
		>
			{dot && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />}
			<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
				{label}
			</Typography>
		</Box>
	);

	const getStatusPill = (status: string) => {
		if (subscription && subscription.plan === "free") return <BrandPill color={LIVE_GREEN} label="Activa" />;
		switch (status) {
			case "active":
				return <BrandPill color={LIVE_GREEN} label="Activa" />;
			case "canceled":
				return <BrandPill color={errorColor} label="Cancelada" />;
			case "past_due":
				return <BrandPill color={STALE_AMBER} label="Pago pendiente" />;
			case "trialing":
				return <BrandPill color={BRAND_BLUE} label="Período de prueba" />;
			case "incomplete":
				return <BrandPill color={BRAND_BLUE} label="Procesando pago" />;
			default:
				return <BrandPill color={theme.palette.text.secondary} label={status} />;
		}
	};

	const getPaymentStatusPill = (status: string) => {
		switch (status) {
			case "paid":
			case "succeeded":
				return <BrandPill color={LIVE_GREEN} label={status === "paid" ? "Pagada" : "Completado"} />;
			case "open":
			case "pending":
				return <BrandPill color={STALE_AMBER} label="Pendiente" />;
			case "draft":
				return <BrandPill color={theme.palette.text.secondary} label="Borrador" />;
			case "uncollectible":
			case "failed":
				return <BrandPill color={errorColor} label={status === "failed" ? "Fallido" : "Incobrable"} />;
			case "void":
			case "canceled":
			case "cancelled":
				return <BrandPill color={theme.palette.text.secondary} label={status === "void" ? "Anulada" : "Cancelado"} />;
			case "refunded":
				return <BrandPill color={BRAND_BLUE} label="Reembolsado" />;
			case "partially_refunded":
				return <BrandPill color={BRAND_BLUE} label="Reembolso parcial" />;
			case "disputed":
				return <BrandPill color={STALE_AMBER} label="Disputado" />;
			default:
				return <BrandPill color={theme.palette.text.secondary} label={status} />;
		}
	};

	const SectionCard = ({
		eyebrow,
		title,
		subtitle,
		icon,
		rightSlot,
		children,
		tone = "primary",
	}: {
		eyebrow: string;
		title: React.ReactNode;
		subtitle?: string;
		icon: React.ReactNode;
		rightSlot?: React.ReactNode;
		children: React.ReactNode;
		tone?: "primary" | "amber" | "error";
	}) => {
		const color = tone === "error" ? errorColor : tone === "amber" ? STALE_AMBER : BRAND_BLUE;
		return (
			<Box
				sx={{
					borderRadius: 2,
					border: `1px solid ${alpha(color, isDark ? 0.18 : 0.1)}`,
					bgcolor: "background.paper",
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						px: { xs: 2, sm: 2.5 },
						py: 1.75,
						bgcolor: alpha(color, isDark ? 0.05 : 0.025),
						borderBottom: `1px solid ${alpha(color, isDark ? 0.16 : 0.1)}`,
					}}
				>
					<Stack direction="row" spacing={1.25} alignItems="center">
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(color, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
								color,
								flexShrink: 0,
							}}
						>
							{icon}
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.625} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: color }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									{eyebrow}
								</Typography>
							</Stack>
							{typeof title === "string" ? (
								<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
									{title}
								</Typography>
							) : (
								title
							)}
							{subtitle && (
								<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
							)}
						</Stack>
						{rightSlot}
					</Stack>
				</Box>
				<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
			</Box>
		);
	};

	// ── Loading / Error ───────────────────────────────────────────────────────

	if (loading) {
		return (
			<Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ py: 8 }}>
				<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
				<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
					Cargando suscripción…
				</Typography>
			</Stack>
		);
	}

	if (error) {
		return (
			<Box
				sx={{
					p: 2,
					borderRadius: 1.5,
					bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
					border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Stack direction="row" spacing={1} alignItems="center">
					<Warning2 size={16} variant="Bulk" color={errorColor} />
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>{error}</Typography>
				</Stack>
			</Box>
		);
	}

	if (!subscription) {
		return (
			<Box
				sx={{
					p: 2,
					borderRadius: 1.5,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
				}}
			>
				<Stack direction="row" spacing={1} alignItems="center">
					<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} />
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>
						No se encontró información de suscripción. Contactá a soporte.
					</Typography>
				</Stack>
			</Box>
		);
	}

	const showCancelButton =
		subscription && subscription.plan !== "free" && subscription.status === "active" && !subscription.cancelAtPeriodEnd;
	const showReactivateButton =
		subscription && subscription.plan !== "free" && subscription.status === "active" && subscription.cancelAtPeriodEnd;
	const hasRenewalDate = subscription && subscription.currentPeriodEnd && subscription.status === "active";

	// ── Team member view ──────────────────────────────────────────────────────

	if (isTeamMember && activeTeam) {
		const roleConfig = userRole ? ROLE_CONFIG[userRole as keyof typeof ROLE_CONFIG] : null;
		const planDisplayNames: Record<string, string> = { free: "Gratuito", standard: "Estándar", premium: "Premium" };
		const ownerPlanName = ownerSubscription?.planName
			? planDisplayNames[ownerSubscription.planName.toLowerCase()] || ownerSubscription.planName
			: "No disponible";

		return (
			<Stack spacing={2.5}>
				<SectionCard
					eyebrow="Miembro de equipo"
					title="Tu membresía en el equipo"
					subtitle="Estado y plan del equipo al que pertenecés"
					icon={<Crown size={16} variant="Bulk" />}
				>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Box
								sx={{
									p: 1.75,
									borderRadius: 1.5,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
								}}
							>
								<Stack spacing={0.875}>
									<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
										Equipo
									</Typography>
									<Typography sx={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.015em", color: BRAND_BLUE }}>
										{activeTeam.name}
									</Typography>
									{roleConfig && (
										<Stack direction="row" spacing={0.75} alignItems="center" sx={{ pt: 0.5 }}>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Tu rol:</Typography>
											<BrandPill color={BRAND_BLUE} label={roleConfig.label} />
										</Stack>
									)}
								</Stack>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box
								sx={{
									p: 1.75,
									borderRadius: 1.5,
									bgcolor: alpha(LIVE_GREEN, isDark ? 0.08 : 0.04),
									border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.28 : 0.18)}`,
								}}
							>
								<Stack spacing={0.875}>
									<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
										Plan del equipo
									</Typography>
									<Stack direction="row" spacing={1} alignItems="center">
										<Crown size={18} variant="Bulk" color={LIVE_GREEN} />
										<Typography sx={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.015em", color: LIVE_GREEN }}>
											{ownerPlanName}
										</Typography>
									</Stack>
									{ownerSubscription?.status === "active" && <BrandPill color={LIVE_GREEN} label="Activo" />}
								</Stack>
							</Box>
						</Grid>
					</Grid>

					<Box
						sx={{
							mt: 2,
							p: 1.75,
							borderRadius: 1.25,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="flex-start">
							<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
							<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								Como miembro del equipo, tenés acceso a las funcionalidades del plan{" "}
								<Box component="span" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
									{ownerPlanName}
								</Box>
								. Los límites de recursos y facturación los gestiona el propietario del equipo.
							</Typography>
						</Stack>
					</Box>
				</SectionCard>

				<SectionCard
					eyebrow="Funcionalidades"
					title="Características disponibles"
					subtitle="Funciones habilitadas por el plan del equipo"
					icon={<ReceiptItem size={16} variant="Bulk" />}
				>
					{ownerSubscription?.featuresWithDescriptions ? (
						<Stack divider={<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) }} />}>
							{(() => {
								const currentEnv = import.meta.env.PROD ? "production" : "development";
								const isVisibleInCurrentEnv = (visibility: string | undefined) => {
									if (!visibility || visibility === "all") return true;
									if (visibility === "none") return false;
									return visibility === currentEnv;
								};
								return [...ownerSubscription.featuresWithDescriptions]
									.filter((feature: any) => isVisibleInCurrentEnv(feature.visibility))
									.sort((a, b) => (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0));
							})().map((feature: any) => (
								<Stack key={feature.name} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.25 }}>
									<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
										<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
											{feature.displayName || feature.description || feature.name}
										</Typography>
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											{feature.enabled ? "Disponible en tu equipo" : "No incluido en el plan"}
										</Typography>
									</Stack>
									<BrandPill
										color={feature.enabled ? LIVE_GREEN : theme.palette.text.secondary}
										label={feature.enabled ? "Habilitado" : "No disponible"}
										dot={false}
									/>
								</Stack>
							))}
						</Stack>
					) : (
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center", py: 2 }}>
							No hay información de características disponible.
						</Typography>
					)}
				</SectionCard>

				<Box
					sx={{
						p: 1.75,
						borderRadius: 1.5,
						bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
						border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
					}}
				>
					<Stack direction="row" spacing={1} alignItems="flex-start">
						<Warning2 size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
						<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							<Box component="span" sx={{ fontWeight: 600 }}>
								Nota:
							</Box>{" "}
							La facturación, métodos de pago y cambios de plan los gestiona el propietario del equipo. Si necesitás cambios en tu acceso o
							permisos, contactá al administrador.
						</Typography>
					</Stack>
				</Box>
			</Stack>
		);
	}

	// ── Vista normal ──────────────────────────────────────────────────────────

	const gracePeriodInfo = getGracePeriodInfo();

	return (
		<Grid container spacing={2.5}>
			<Grid item xs={12} md={8}>
			{/* Detalles de suscripción */}
			<SectionCard
				eyebrow="Tu suscripción"
				title="Detalles del plan"
				subtitle="Plan actual, renovación y acciones"
				icon={<Crown size={16} variant="Bulk" />}
				rightSlot={getStatusPill(subscription.status)}
			>
				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<Stack spacing={1.5}>
							<Stack spacing={0.25}>
								<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
									Plan actual
								</Typography>
								<Typography sx={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: BRAND_BLUE }}>
									{getPlanName(subscription.plan)}
								</Typography>
							</Stack>

							{hasRenewalDate && !subscription.cancelAtPeriodEnd && (
								<Box
									sx={{
										p: 1.25,
										borderRadius: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
									}}
								>
									<Stack direction="row" spacing={0.75} alignItems="center">
										<Refresh size={14} variant="Bulk" color={BRAND_BLUE} />
										<Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 500, letterSpacing: "-0.005em" }}>
											Se renovará el {formatDate(subscription.currentPeriodEnd)}
										</Typography>
									</Stack>
								</Box>
							)}

							{subscription.cancelAtPeriodEnd && (
								<>
									<Box
										sx={{
											p: 1.25,
											borderRadius: 1.25,
											bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
											border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Stack direction="row" spacing={0.75} alignItems="center">
											<Warning2 size={14} variant="Bulk" color={STALE_AMBER} />
											<Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 500, letterSpacing: "-0.005em" }}>
												{new Date(subscription.currentPeriodEnd) < new Date()
													? `Tu suscripción terminó el ${formatDate(subscription.currentPeriodEnd)}`
													: `Tu suscripción terminará el ${formatDate(subscription.currentPeriodEnd)}`}
											</Typography>
										</Stack>
									</Box>
									{isDowngradeGracePeriodActive() && (
										<Box
											sx={{
												p: 1.5,
												borderRadius: 1.25,
												bgcolor: alpha(STALE_AMBER, isDark ? 0.08 : 0.04),
												border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
											}}
										>
											<Stack direction="row" spacing={1} alignItems="flex-start">
												<Timer1 size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
												<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
													{getGracePeriodMessage(subscription.downgradeGracePeriod?.expiresAt || subscription.currentPeriodEnd)}
												</Typography>
											</Stack>
										</Box>
									)}
								</>
							)}

							{nextPlan && (
								<Box
									sx={{
										p: 1.25,
										borderRadius: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
									}}
								>
									<Stack direction="row" spacing={0.75} alignItems="center">
										<InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} />
										<Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 500, letterSpacing: "-0.005em" }}>
											Cambiarás al {getPlanName(nextPlan)} en la próxima renovación.
										</Typography>
									</Stack>
								</Box>
							)}
						</Stack>
					</Grid>

					<Grid item xs={12} md={6}>
						<Stack spacing={1.25} alignItems={{ xs: "stretch", md: "flex-end" }} sx={{ height: "100%", justifyContent: "center" }}>
							<Button variant="contained" onClick={handleChangePlan} sx={brandPrimarySx}>
								Cambiar plan
							</Button>
							{showCancelButton && (
								<Button onClick={handleOpenCancelDialog} sx={destructiveGhostBtnSx}>
									Cancelar suscripción
								</Button>
							)}
							{showReactivateButton && (
								<Button
									onClick={handleReactivateSubscription}
									disabled={reactivateLoading}
									startIcon={reactivateLoading ? <CircularProgress size={14} color="inherit" /> : <Refresh size={14} variant="Linear" />}
									sx={greenGhostBtnSx}
								>
									Reactivar
								</Button>
							)}
						</Stack>
					</Grid>
				</Grid>

				{subscription.plan !== "free" && (
					<Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03), border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}` }}>
						<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 0.75 }}>
							Información de la suscripción
						</Typography>
						<Stack spacing={0.625}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em", flexShrink: 0 }}>Cliente</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.primary", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
									{getStripeValue(subscription.stripeCustomerId)}
								</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em", flexShrink: 0 }}>Suscripción</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.primary", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
									{getStripeValue(subscription.stripeSubscriptionId)}
								</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
								<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em", flexShrink: 0 }}>Inicio</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
									{formatDate(subscription.currentPeriodStart)}
								</Typography>
							</Stack>
						</Stack>
					</Box>
				)}
			</SectionCard>
			</Grid>

			{/* Uso de recursos */}
			<Grid item xs={12} md={4}>
				<ResourceUsageWidget />
			</Grid>

			{/* Límites de recursos */}
			<Grid item xs={12} md={6}>
				<SectionCard
					eyebrow="Tu plan"
					title="Límites de recursos"
					subtitle="Capacidad disponible por tipo de recurso"
					icon={<ReceiptItem size={16} variant="Bulk" />}
				>
					<Box
						sx={{
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						}}
					>
						{(() => {
							const renderLimitRow = (label: string, limit: any, unit?: string, isLast?: boolean) => (
								<Stack
									key={label}
									direction="row"
									justifyContent="space-between"
									alignItems="center"
									sx={{
										px: 1.5,
										py: 1,
										borderBottom: isLast ? "none" : `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
									}}
								>
									<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{label}</Typography>
									<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
										{limit === undefined ? "No disponible" : limit === 999999 ? "Ilimitado" : unit ? `${limit} ${unit}` : limit}
									</Typography>
								</Stack>
							);

							if (subscription?.limitsWithDescriptions) {
								const items = [...subscription.limitsWithDescriptions]
									.filter((item: any) => {
										const currentEnv = import.meta.env.PROD ? "production" : "development";
										if (!item.visibility || item.visibility === "all") return true;
										if (item.visibility === "none") return false;
										return item.visibility === currentEnv;
									})
									.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
								return items.map((item: any, idx: number) =>
									renderLimitRow(
										item.displayName || item.description || item.name,
										item.limit,
										item.name === "storage" ? "MB" : undefined,
										idx === items.length - 1,
									),
								);
							}
							if (subscription?.limitDetails) {
								const entries = Object.entries(subscription.limitDetails);
								return entries.map(([key, value]: [string, any], idx) =>
									renderLimitRow(value.description || key, value.limit, key === "storage" ? "MB" : undefined, idx === entries.length - 1),
								);
							}
							if (subscription?.limits) {
								const limitNames: { [key: string]: string } = {
									folders: "Carpetas",
									calculators: "Cálculos",
									contacts: "Contactos",
									storage: "Almacenamiento",
								};
								const entries = Object.entries(subscription.limits);
								return entries.map(([key, value]: [string, any], idx) =>
									renderLimitRow(limitNames[key] || key, value, key === "storage" ? "MB" : undefined, idx === entries.length - 1),
								);
							}
							return (
								<Typography sx={{ p: 1.5, fontSize: "0.78rem", color: "text.secondary" }}>No hay límites disponibles</Typography>
							);
						})()}
					</Box>
				</SectionCard>
			</Grid>

			{/* Características */}
			<Grid item xs={12} md={6}>
				<SectionCard
					eyebrow="Tu plan"
					title="Características"
					subtitle="Funciones habilitadas en tu plan"
					icon={<Crown size={16} variant="Bulk" />}
				>
					<Box
						sx={{
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						}}
					>
						{(() => {
							const renderFeatureRow = (label: string, enabled: boolean, isLast: boolean, idx: number) => (
								<Stack
									key={`${label}-${idx}`}
									direction="row"
									justifyContent="space-between"
									alignItems="center"
									sx={{
										px: 1.5,
										py: 1,
										borderBottom: isLast ? "none" : `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
									}}
								>
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", flex: 1, minWidth: 0 }}>
										{label}
									</Typography>
									<BrandPill
										color={enabled ? LIVE_GREEN : theme.palette.text.secondary}
										label={enabled ? "Activo" : "No disponible"}
										dot={enabled}
									/>
								</Stack>
							);

							if (subscription?.featuresWithDescriptions) {
								const items = [...subscription.featuresWithDescriptions]
									.filter((feature: any) => {
										const currentEnv = import.meta.env.PROD ? "production" : "development";
										if (!feature.visibility || feature.visibility === "all") return true;
										if (feature.visibility === "none") return false;
										return feature.visibility === currentEnv;
									})
									.sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99));
								return items.map((feature: any, idx: number) =>
									renderFeatureRow(feature.displayName || feature.description || feature.name, feature.enabled, idx === items.length - 1, idx),
								);
							}
							if (subscription?.featureDetails) {
								const entries = Object.entries(subscription.featureDetails).sort(
									([keyA, valueA]: [string, any], [keyB, valueB]: [string, any]) => {
										if (valueA.enabled === valueB.enabled) return (valueA.description || keyA).localeCompare(valueB.description || keyB);
										return valueA.enabled ? -1 : 1;
									},
								);
								return entries.map(([key, value]: [string, any], idx) =>
									renderFeatureRow(value.description || key, value.enabled, idx === entries.length - 1, idx),
								);
							}
							if (subscription?.features) {
								const entries = Object.entries(subscription.features).sort(([keyA, valueA], [keyB, valueB]) => {
									if (valueA === valueB) return keyA.localeCompare(keyB);
									return valueA ? -1 : 1;
								});
								const featureNames: { [key: string]: string } = {
									advancedAnalytics: "Análisis avanzados",
									exportReports: "Exportación de reportes",
									taskAutomation: "Automatización de tareas",
									bulkOperations: "Operaciones masivas",
									prioritySupport: "Soporte prioritario",
									movements: "Movimientos judiciales",
									vinculateFolders: "Vincular carpetas",
									booking: "Sistema de reservas",
								};
								return entries.map(([key, value], idx) =>
									renderFeatureRow(featureNames[key] || key, Boolean(value), idx === entries.length - 1, idx),
								);
							}
							return (
								<Typography sx={{ p: 1.5, fontSize: "0.78rem", color: "text.secondary" }}>No hay características disponibles</Typography>
							);
						})()}
					</Box>
				</SectionCard>
			</Grid>

			{/* Período de gracia */}
			{isInGracePeriod() && gracePeriodInfo && (
				<Grid item xs={12}>
				<SectionCard
					eyebrow="Período de gracia"
					title={gracePeriodInfo.title}
					subtitle="Plazo para ajustar tus datos a los nuevos límites"
					icon={<Timer1 size={16} variant="Bulk" />}
					tone="amber"
				>
					{gracePeriodInfo.expiryDate && getGracePeriodStatus(gracePeriodInfo.expiryDate) === "past" ? (
						<Box sx={{ p: 1.75, borderRadius: 1.25, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}` }}>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
								<Stack spacing={0.5}>
									<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
										Período de gracia finalizado
									</Typography>
									<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										El período finalizó el {gracePeriodInfo.expiryFormatted}. El contenido que excedía los límites de tu{" "}
										{gracePeriodInfo.willDowngradeToFreePlan ? "plan gratuito" : "plan actual"} ha sido archivado automáticamente.
									</Typography>
								</Stack>
							</Stack>
						</Box>
					) : (
						<Box sx={{ p: 1.75, borderRadius: 1.25, bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05), border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}` }}>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<Warning2 size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
								<Stack spacing={0.5}>
									<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
										{gracePeriodInfo.willDowngradeToFreePlan
											? `Tu plan ${gracePeriodInfo.previousPlanName} cambió al Plan Gratuito el ${gracePeriodInfo.cancellationFormatted}`
											: `Tu plan cambió de ${gracePeriodInfo.previousPlanName} a ${gracePeriodInfo.currentPlanName}`}
									</Typography>
									<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										Tenés hasta el {gracePeriodInfo.expiryFormatted} para ajustar tus datos a los nuevos límites antes de que se archive
										automáticamente el contenido excedente.
									</Typography>
								</Stack>
							</Stack>
						</Box>
					)}

					<Grid container spacing={2} sx={{ mt: 1 }}>
						{[
							{ label: "Plan anterior", value: gracePeriodInfo.previousPlanName, icon: <ReceiptItem size={18} variant="Bulk" />, color: BRAND_BLUE },
							{
								label: "Fecha límite",
								value: gracePeriodInfo.expiryFormatted,
								icon: <Calendar size={18} variant="Bulk" />,
								color: errorColor,
							},
							{
								label: "Días restantes",
								value: `${gracePeriodInfo.daysRemaining} ${gracePeriodInfo.daysRemaining === 1 ? "día" : "días"}`,
								icon: <Timer1 size={18} variant="Bulk" />,
								color: gracePeriodInfo.isExpiringSoon ? errorColor : STALE_AMBER,
								badge: gracePeriodInfo.isExpiringSoon ? <BrandPill color={errorColor} label="Expira pronto" /> : null,
							},
						].map((card, idx) => (
							<Grid item xs={12} sm={4} key={idx}>
								<Box
									sx={{
										p: 2,
										borderRadius: 1.5,
										bgcolor: "background.paper",
										border: `1px solid ${alpha(card.color, isDark ? 0.22 : 0.14)}`,
										height: "100%",
										textAlign: "center",
									}}
								>
									<Stack spacing={1} alignItems="center">
										<Box
											sx={{
												width: 40,
												height: 40,
												borderRadius: 1,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: alpha(card.color, isDark ? 0.16 : 0.08),
												border: `1px solid ${alpha(card.color, isDark ? 0.28 : 0.18)}`,
												color: card.color,
											}}
										>
											{card.icon}
										</Box>
										<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
											{card.label}
										</Typography>
										<Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "text.primary", letterSpacing: "-0.015em", fontVariantNumeric: "tabular-nums" }}>
											{card.value}
										</Typography>
										{card.badge}
									</Stack>
								</Box>
							</Grid>
						))}
					</Grid>

					<Box sx={{ mt: 2, p: 1.75, borderRadius: 1.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03), border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}` }}>
						<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", mb: 0.5 }}>
							{gracePeriodInfo.expiryDate && getGracePeriodStatus(gracePeriodInfo.expiryDate) === "past"
								? "Archivado automático completado"
								: "¿Qué ocurre después?"}
						</Typography>
						<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty", mb: 0.625 }}>
							El sistema archivará automáticamente los elementos que excedan los límites de tu{" "}
							{gracePeriodInfo.willDowngradeToFreePlan ? "nuevo plan gratuito" : "plan actual"}.
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Para evitar pérdida de acceso a tus datos importantes, revisá y ajustá manualmente tu contenido antes del vencimiento.
						</Typography>

						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }} justifyContent="center" flexWrap="wrap" useFlexGap>
							{[
								{ label: "Gestionar carpetas", to: "/apps/folders/list" },
								{ label: "Gestionar cálculos", to: "/apps/calc/labor" },
								{ label: "Gestionar contactos", to: "/apps/customer/customer-list" },
							].map((cta) => (
								<Button key={cta.to} variant="contained" onClick={() => navigate(cta.to)} sx={{ ...brandPrimarySx, minWidth: 180 }}>
									{cta.label}
								</Button>
							))}
						</Stack>
					</Box>
				</SectionCard>
				</Grid>
			)}

			{/* Comparación de límites */}
			{isDowngradeGracePeriodActive() && gracePeriodInfo && (
				<Grid item xs={12}>
				<SectionCard
					eyebrow="Comparativa"
					title="Comparación de límites"
					subtitle="Revisá los cambios en los límites para evitar pérdida de acceso"
					icon={<ReceiptText size={16} variant="Bulk" />}
				>
					<TableContainer
						sx={{
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
						}}
					>
						<Table sx={tableSx} size="small">
							<TableHead>
								<TableRow>
									<TableCell>Recurso</TableCell>
									<TableCell align="center">
										<Stack spacing={0.125} alignItems="center">
											<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "-0.005em", textTransform: "none" }}>
												{gracePeriodInfo.previousPlanName}
											</Typography>
											<Typography sx={{ fontSize: "0.62rem", color: "text.secondary", textTransform: "none", letterSpacing: "0.04em" }}>
												Anterior
											</Typography>
										</Stack>
									</TableCell>
									<TableCell align="center">
										<Stack spacing={0.125} alignItems="center">
											<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "-0.005em", textTransform: "none" }}>
												{gracePeriodInfo.targetPlanName}
											</Typography>
											<Typography sx={{ fontSize: "0.62rem", color: "text.secondary", textTransform: "none", letterSpacing: "0.04em" }}>
												Nuevo
											</Typography>
										</Stack>
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{[
									{
										label: "Carpetas",
										prev:
											subscription.downgradeGracePeriod?.previousPlan === "premium"
												? "Ilimitadas"
												: subscription.downgradeGracePeriod?.previousPlan === "standard"
												? "50"
												: "5",
										next: (() => {
											const t = subscription.downgradeGracePeriod?.targetPlan || "free";
											const l = getPlanLimits(t);
											return l.folders === 999999 ? "Ilimitadas" : String(l.folders);
										})(),
									},
									{
										label: "Cálculos",
										prev:
											subscription.downgradeGracePeriod?.previousPlan === "premium"
												? "Ilimitados"
												: subscription.downgradeGracePeriod?.previousPlan === "standard"
												? "20"
												: "3",
										next: (() => {
											const t = subscription.downgradeGracePeriod?.targetPlan || "free";
											const l = getPlanLimits(t);
											return l.calculators === 999999 ? "Ilimitados" : String(l.calculators);
										})(),
									},
									{
										label: "Contactos",
										prev:
											subscription.downgradeGracePeriod?.previousPlan === "premium"
												? "Ilimitados"
												: subscription.downgradeGracePeriod?.previousPlan === "standard"
												? "100"
												: "10",
										next: (() => {
											const t = subscription.downgradeGracePeriod?.targetPlan || "free";
											const l = getPlanLimits(t);
											return l.contacts === 999999 ? "Ilimitados" : String(l.contacts);
										})(),
									},
									{
										label: "Almacenamiento",
										prev:
											subscription.downgradeGracePeriod?.previousPlan === "premium"
												? "10 GB"
												: subscription.downgradeGracePeriod?.previousPlan === "standard"
												? "1 GB"
												: "50 MB",
										next: (() => {
											const t = subscription.downgradeGracePeriod?.targetPlan || "free";
											const l = getPlanLimits(t);
											return l.storage >= 1024 ? `${l.storage / 1024} GB` : `${l.storage} MB`;
										})(),
									},
								].map((row) => (
									<TableRow key={row.label}>
										<TableCell sx={{ fontWeight: 500 }}>{row.label}</TableCell>
										<TableCell align="center" sx={{ fontWeight: 600, color: BRAND_BLUE, fontVariantNumeric: "tabular-nums" }}>
											{row.prev}
										</TableCell>
										<TableCell align="center" sx={{ fontWeight: 600, color: STALE_AMBER, fontVariantNumeric: "tabular-nums" }}>
											{row.next}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					<Box
						sx={{
							mt: 1.5,
							p: 1.5,
							borderRadius: 1.25,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="flex-start">
							<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
							<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								<Box component="span" sx={{ fontWeight: 600 }}>
									Recomendación:
								</Box>{" "}
								Para evitar la pérdida automática de datos, ajustá manualmente tus recursos a los nuevos límites antes de que finalice el
								período de gracia.
							</Typography>
						</Stack>
					</Box>
				</SectionCard>
				</Grid>
			)}

			{/* Métodos de pago */}
			{subscription.plan !== "free" && (
				<Grid item xs={12} md={6}>
				<SectionCard
					eyebrow="Pagos"
					title="Métodos de pago"
					subtitle="Tarjetas asociadas a tu suscripción"
					icon={<CardSend size={16} variant="Bulk" />}
					rightSlot={
						paymentMethods.length > 0 ? (
							<BrandPill color={BRAND_BLUE} label={`${paymentMethods.length} ${paymentMethods.length === 1 ? "método" : "métodos"}`} dot={false} />
						) : undefined
					}
				>
					{paymentMethodsLoading ? (
						<Stack alignItems="center" sx={{ py: 4 }} spacing={1}>
							<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
							<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Cargando métodos de pago…</Typography>
						</Stack>
					) : paymentMethodsError ? (
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.25,
								bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
							}}
						>
							<Stack direction="row" spacing={1} alignItems="center">
								<Warning2 size={16} variant="Bulk" color={errorColor} />
								<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>{paymentMethodsError}</Typography>
							</Stack>
						</Box>
					) : paymentMethods.length === 0 ? (
						<Stack alignItems="center" spacing={1} sx={{ py: 4, textAlign: "center" }}>
							<Box
								sx={{
									width: 48,
									height: 48,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
								}}
							>
								<CardSend size={22} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
								Sin métodos de pago
							</Typography>
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", maxWidth: 360, textWrap: "pretty" }}>
								Los métodos de pago se agregan automáticamente al suscribirte a un plan.
							</Typography>
						</Stack>
					) : (
						<>
							<TableContainer sx={{ borderRadius: 1.5, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}` }}>
								<Table sx={tableSx} size="small">
									<TableHead>
										<TableRow>
											<TableCell>Tipo de tarjeta</TableCell>
											<TableCell>Número</TableCell>
											<TableCell>Vencimiento</TableCell>
											<TableCell>Estado</TableCell>
											<TableCell align="center">Acciones</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{paymentMethods.slice(0, showAllPaymentMethods ? paymentMethods.length : 3).map((method) => {
											const isDefault = defaultPaymentMethod?.id === method.id;
											return (
												<TableRow key={method.id}>
													<TableCell sx={{ fontWeight: 500 }}>
														{method.card?.brand ? method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1) : "Tarjeta"}
													</TableCell>
													<TableCell sx={{ fontFamily: "monospace" }}>•••• {method.card?.last4 || "****"}</TableCell>
													<TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>
														{method.card?.exp_month && method.card?.exp_year
															? `${String(method.card.exp_month).padStart(2, "0")}/${method.card.exp_year}`
															: "—"}
													</TableCell>
													<TableCell>
														<BrandPill
															color={isDefault ? LIVE_GREEN : theme.palette.text.secondary}
															label={isDefault ? "Predeterminado" : "Disponible"}
															dot={isDefault}
														/>
													</TableCell>
													<TableCell align="center">
														{!isDefault && (
															<Button
																size="small"
																onClick={() => handleChangePaymentMethod(method.id)}
																disabled={changingPaymentMethod}
																startIcon={changingPaymentMethod ? <CircularProgress size={12} color="inherit" /> : undefined}
																sx={{ ...ghostBtnSx, fontSize: "0.72rem", py: 0.5, px: 1.25 }}
															>
																Hacer predeterminada
															</Button>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>

							{paymentMethods.length > 5 && (
								<Stack direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
									<Button onClick={() => setShowAllPaymentMethods(!showAllPaymentMethods)} sx={ghostBtnSx}>
										{showAllPaymentMethods ? "Ver menos" : "Ver todas"}
									</Button>
								</Stack>
							)}

							<Box sx={{ mt: 2, p: 1.5, borderRadius: 1.25, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}` }}>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										<Box component="span" sx={{ fontWeight: 600 }}>
											Nota:
										</Box>{" "}
										El método de pago predeterminado se utilizará para los cargos automáticos de tu suscripción.
									</Typography>
								</Stack>
							</Box>
						</>
					)}

					<Stack alignItems="center" spacing={1} sx={{ mt: 2.5 }}>
						<Button
							variant="contained"
							onClick={handleOpenBillingPortal}
							disabled={openingBillingPortal}
							startIcon={openingBillingPortal ? <CircularProgress size={14} color="inherit" /> : <CardSend size={15} variant="Linear" />}
							sx={{ ...brandPrimarySx, minWidth: 250 }}
						>
							{openingBillingPortal ? "Abriendo portal…" : "Gestionar métodos de pago"}
						</Button>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", textAlign: "center", maxWidth: 400, letterSpacing: "-0.005em" }}>
							Se abrirá el portal seguro de Stripe donde podrás agregar, eliminar o actualizar tus métodos de pago.
						</Typography>
					</Stack>
				</SectionCard>
				</Grid>
			)}

			{/* Historial de facturación */}
			<Grid item xs={12} md={subscription.plan !== "free" ? 6 : 12}>
			<SectionCard
				eyebrow="Facturación"
				title="Historial de facturación"
				subtitle="Facturas y cargos de tu cuenta"
				icon={<ReceiptText size={16} variant="Bulk" />}
				rightSlot={
					payments.length > 0 ? (
						<BrandPill color={BRAND_BLUE} label={`${payments.length} ${payments.length === 1 ? "factura" : "facturas"}`} dot={false} />
					) : undefined
				}
			>
				{paymentsLoading ? (
					<Stack alignItems="center" sx={{ py: 4 }} spacing={1}>
						<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Cargando facturas…</Typography>
					</Stack>
				) : paymentsError ? (
					<Box
						sx={{
							p: 1.5,
							borderRadius: 1.25,
							bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
							border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<Warning2 size={16} variant="Bulk" color={errorColor} />
							<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>{paymentsError}</Typography>
						</Stack>
					</Box>
				) : payments.length === 0 ? (
					<Stack alignItems="center" spacing={1.25} sx={{ py: 4, textAlign: "center" }}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<ReceiptText size={22} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
							Sin facturas todavía
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
							No se encontraron facturas para esta cuenta.
						</Typography>
						<Button size="small" onClick={handleChangePlan} sx={ghostBtnSx}>
							Explorar planes
						</Button>
					</Stack>
				) : (
					<>
						<TableContainer sx={{ borderRadius: 1.5, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}` }}>
							<Table sx={tableSx} size="small">
								<TableHead>
									<TableRow>
										<TableCell>Número</TableCell>
										<TableCell>Fecha</TableCell>
										<TableCell>Importe</TableCell>
										<TableCell>Estado</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{payments.slice(0, showAllPayments ? payments.length : 3).map((payment) => (
										<TableRow key={payment.id}>
											<TableCell sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
												{payment.invoiceNumber || payment.receiptNumber || payment.invoiceId || "N/A"}
											</TableCell>
											<TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>{formatDate(payment.createdAt)}</TableCell>
											<TableCell sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
												{formatAmount(payment.amount, payment.currency)}
											</TableCell>
											<TableCell>{getPaymentStatusPill(payment.status)}</TableCell>
											<TableCell align="center">
												<Button size="small" onClick={() => handleViewInvoice(payment)} sx={{ ...ghostBtnSx, fontSize: "0.72rem", py: 0.5, px: 1.25 }}>
													Ver
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						{payments.length > 3 && (
							<Stack direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
								<Button onClick={() => setShowAllPayments(!showAllPayments)} sx={ghostBtnSx}>
									{showAllPayments ? "Ver menos" : "Ver todas"}
								</Button>
							</Stack>
						)}
					</>
				)}
			</SectionCard>
			</Grid>

			{/* CTA: Explorar planes */}
			<Grid item xs={12}>
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					borderRadius: 2,
					p: { xs: 3, md: 4 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
					textAlign: "center",
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -80,
						left: "50%",
						transform: "translateX(-50%)",
						width: 360,
						height: 360,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 52,
							height: 52,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<Crown size={24} variant="Bulk" />
					</Box>
					<Typography sx={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", textWrap: "balance" }}>
						¿Necesitás más recursos o características?
					</Typography>
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 600, letterSpacing: "-0.005em", textWrap: "pretty" }}>
						Explorá nuestros planes y encontrá la opción perfecta para tu estudio. Todos incluyen soporte y actualizaciones regulares.
					</Typography>
					<Button variant="contained" onClick={handleChangePlan} sx={{ ...brandPrimarySx, mt: 0.5 }}>
						Explorar planes
					</Button>
				</Stack>
			</Box>
			</Grid>

			{/* Dialog cancelar */}
			<Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						p: { xs: 2.25, sm: 2.5 },
						bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
						borderBottom: `1px solid ${alpha(errorColor, isDark ? 0.22 : 0.14)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -60,
							right: -40,
							width: 220,
							height: 220,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(errorColor, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(errorColor, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(errorColor, isDark ? 0.28 : 0.18)}`,
								color: errorColor,
							}}
						>
							<Warning2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
								<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
									Cancelar suscripción
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								¿Confirmás la cancelación?
							</Typography>
						</Stack>
						<IconButton
							onClick={handleCloseCancelDialog}
							sx={{ color: "text.secondary", borderRadius: 1, "&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) } }}
							aria-label="cerrar"
						>
							<CloseSquare size={20} variant="Linear" />
						</IconButton>
					</Stack>
				</Box>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Al cancelar tu suscripción:
						</Typography>
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
							}}
						>
							<Stack spacing={0.625}>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<Box sx={{ width: 4, height: 4, mt: "8px", borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										Tu servicio seguirá activo hasta el {formatDate(subscription.currentPeriodEnd)}
									</Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<Box sx={{ width: 4, height: 4, mt: "8px", borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em" }}>
										Después de esa fecha, no se realizarán más cargos automáticos
									</Typography>
								</Stack>
								{subscription.plan !== "free" && (
									<Stack direction="row" spacing={1} alignItems="flex-start">
										<Box sx={{ width: 4, height: 4, mt: "8px", borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
										<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em" }}>
											Tendrás un período de gracia de 15 días para archivar contenido
										</Typography>
									</Stack>
								)}
							</Stack>
						</Box>
						{subscription.plan !== "free" && (
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								}}
							>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<InfoCircle size={16} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										Después de cancelar tendrás acceso limitado a tus recursos. Archivá o exportá los datos importantes antes de que finalice tu
										suscripción.
									</Typography>
								</Stack>
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={handleCloseCancelDialog} sx={ghostBtnSx}>
						Mantener suscripción
					</Button>
					<Button
						variant="contained"
						onClick={handleCancelSubscription}
						disabled={cancelLoading}
						startIcon={cancelLoading ? <CircularProgress size={14} color="inherit" /> : null}
						sx={destructiveBtnSx}
					>
						{cancelLoading ? "Procesando…" : "Confirmar cancelación"}
					</Button>
				</DialogActions>
			</Dialog>

			<InvoiceView open={invoiceDialogOpen} onClose={handleCloseInvoiceDialog} payment={selectedPayment} userEmail={userEmail} />
		</Grid>
	);
};

export default TabSubscription;
