import React, { useState, useEffect, useMemo, useCallback, useRef, ReactNode, SyntheticEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
	Skeleton,
	Box,
	Tab,
	Tabs,
	Typography,
	useTheme,
	alpha,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	useMediaQuery,
} from "@mui/material";
import {
	ExportSquare,
	InfoCircle,
	Activity,
	Briefcase,
	Category,
	TableDocument,
	DocumentText,
	FolderCross,
	ArrowLeft,
	TickCircle,
	CloseCircle,
	Clock,
	Warning2,
} from "iconsax-react";
import MainCard from "components/MainCard";
import { useBreadcrumb } from "contexts/BreadcrumbContext";
import useSubscription from "hooks/useSubscription";
import { useScbaCredentialError } from "hooks/useScbaCredentialError";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { formatFolderName } from "utils/formatFolderName";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// Components
import FolderDataCompact from "./components/FolderDataCompact";
import FolderPreJudDataCompact from "./components/FolderPreJudDataCompact";
import FolderJudDataCompact from "./components/FolderJudDataCompact";
import FolderDataImproved from "./components/FolderDataImproved";
import FolderPreJudDataImproved from "./components/FolderPreJudDataImproved";
import FolderJudDataImproved from "./components/FolderJudDataImproved";
import ActivityTables from "./components/ActivityTables";
import HistorialTab from "./components/HistorialTab";
import LinkToJudicialPower from "sections/apps/folders/LinkToJudicialPower";
import LinkToPJBuenosAires from "sections/apps/folders/LinkToPJBuenosAires";
import NavigationControls from "./components/NavigationControls";
import InfoTabsVertical from "./components/InfoTabsVertical";

// Actions
import { dispatch } from "store";
import { getFolderById } from "store/reducers/folder";
import { filterContactsByFolder, getContactsByUserId } from "store/reducers/contacts";
import GestionTabImproved from "./alternatives/GestionTabImproved";
import FolderRecursosTab from "./components/FolderRecursosTab";
import PendingVerificationView, { VerificationGate } from "sections/apps/folders/PendingVerificationView";

interface StateType {
	folder: {
		folder: any;
		isLoader: boolean;
	};
	contacts: {
		contacts: any[];
		selectedContacts: any[];
		isLoader: boolean;
	};
	auth: {
		user: {
			_id: string;
		};
	};
}

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`folder-tabpanel-${index}`} aria-labelledby={`folder-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 2, px: 2, pb: 2 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `folder-tab-${index}`,
		"aria-controls": `folder-tabpanel-${index}`,
	};
}

const Details = () => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");
	const isDetailedView = viewMode === "detailed";
	const [openLinkJudicial, setOpenLinkJudicial] = useState(false);
	const [openLinkPJBA, setOpenLinkPJBA] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [tabValue, setTabValue] = useState(0);
	const [folderNotFound, setFolderNotFound] = useState(false);
	// const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // Removed: Using icon tabs instead
	const { setCustomLabel, clearCustomLabel } = useBreadcrumb();

	// Media queries for responsive design
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));

	// Usar el hook de suscripción para verificar características
	const { canVinculateFolders } = useSubscription();

	// Optimized selectors with specific state slices
	const folder = useSelector((state: StateType) => state.folder.folder);
	const isLoader = useSelector((state: StateType) => state.folder.isLoader);
	const contacts = useSelector((state: StateType) => state.contacts.contacts);
	const userId = useSelector((state: StateType) => state.auth.user?._id);

	// Memoized data fetching function
	const fetchData = useCallback(async () => {
		if (!id || id === "undefined") return;

		try {
			// Ejecutar las promesas en paralelo pero sin mezclar tipos
			const folderPromise = dispatch(getFolderById(id));
			const contactsPromise = userId ? dispatch(getContactsByUserId(userId)) : Promise.resolve();

			const [folderResult] = await Promise.all([folderPromise, contactsPromise]);

			// Check if folder was not found
			if (!folderResult.success) {
				setFolderNotFound(true);
			}
		} catch (error) {
			setFolderNotFound(true);
		}
	}, [id, userId]);

	// Data fetch when id changes
	useEffect(() => {
		// Reset folder not found state when id changes
		setFolderNotFound(false);
		fetchData();
		// Reset tab to first tab when changing folders
		setTabValue(0);
	}, [id, fetchData]);

	// Handle folder not found - redirect after showing message
	useEffect(() => {
		if (folderNotFound) {
			const timer = setTimeout(() => {
				navigate("/apps/folders/list");
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [folderNotFound, navigate]);

	// Contacts filtering with debounce
	useEffect(() => {
		if (!id || id === "undefined" || !contacts?.length) return;

		const timeoutId = setTimeout(() => {
			dispatch(filterContactsByFolder(id));
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [id, contacts]);

	// Track the previous folder name to avoid unnecessary updates
	const prevFolderNameRef = useRef<string>();

	// Set placeholder in breadcrumb when ID changes (loading state)
	useEffect(() => {
		if (!id) return;

		// Set a non-breaking space as placeholder to maintain height
		setCustomLabel(`apps/folders/details/${id}`, "\u00A0");

		return () => {
			clearCustomLabel(`apps/folders/details/${id}`);
		};
	}, [id, setCustomLabel, clearCustomLabel]);

	// Update breadcrumb with folder name when loaded
	useEffect(() => {
		if (!folder?.folderName || !id || isLoader) return;

		// Only update if the folder name has actually changed
		if (prevFolderNameRef.current === folder.folderName) return;

		const formattedName = formatFolderName(folder.folderName);
		setCustomLabel(`apps/folders/details/${id}`, formattedName);
		prevFolderNameRef.current = folder.folderName;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [folder?.folderName, id, isLoader]);

	const handleOpenLinkJudicial = useCallback(() => {
		// Verificar si el usuario tiene acceso a la característica de vincular carpetas
		const { canAccess, featureInfo } = canVinculateFolders();
		console.log(canAccess, featureInfo);
		if (canAccess) {
			// Si tiene acceso, mostrar el modal de vinculación
			setOpenLinkJudicial(true);
		} else {
			// Si no tiene acceso, mostrar el modal de error de límite
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	}, [canVinculateFolders]);

	const handleCloseLinkJudicial = useCallback(() => {
		setOpenLinkJudicial(false);
	}, []);

	const handleOpenLinkPJBA = useCallback(() => {
		// Verificar si el usuario tiene acceso a la característica de vincular carpetas
		const { canAccess, featureInfo } = canVinculateFolders();

		if (canAccess) {
			// Si tiene acceso, mostrar el modal de vinculación de Buenos Aires
			setOpenLinkPJBA(true);
		} else {
			// Si no tiene acceso, mostrar el modal de error de límite
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	}, []);

	const handleCloseLinkPJBA = useCallback(() => {
		setOpenLinkPJBA(false);
	}, []);

	const handleCloseLimitErrorModal = useCallback(() => {
		setLimitErrorOpen(false);
	}, []);

	const handleTabChange = useCallback((event: SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
		// Mobile drawer removed - no longer needed with icon tabs
	}, []);

	// Drawer functions removed: Using icon tabs instead

	// Tab items configuration
	// Tab configuration with icons and labels
	interface TabItem {
		value: number;
		label: string;
		icon: React.ReactElement;
		shortLabel: string;
		ariaLabel: string;
	}

	const tabItems = useMemo<TabItem[]>(
		() => [
			{
				value: 0,
				label: "Información General",
				icon: <InfoCircle size="20" />,
				shortLabel: "Info",
				ariaLabel: "Información General",
			},
			{
				value: 1,
				label: "Actividad",
				icon: <Activity size="20" />,
				shortLabel: "Actividad",
				ariaLabel: "Actividad",
			},
			{
				value: 2,
				label: "Gestión",
				icon: <Briefcase size="20" />,
				shortLabel: "Gestión",
				ariaLabel: "Gestión",
			},
			{
				value: 3,
				label: "Recursos",
				icon: <DocumentText size="20" />,
				shortLabel: "Recursos",
				ariaLabel: "Recursos",
			},
			{
				value: 4,
				label: "Historial",
				icon: <Clock size="20" />,
				shortLabel: "Historial",
				ariaLabel: "Historial de Cambios",
			},
		],
		[],
	);

	// Flags de causa removida del listado origen (afectan el styling del chip).
	// Soporta listRemoved + listRemovedSource (nuevo) y pjnNotFound (legacy).
	// El tracking de "Mis Causas" sólo aplica a causas agregadas por los workers
	// de login (source = *-login). Las causas individuales (agregadas vía
	// pjn-workers / mev-workers / manual) no participan del listado y no deben
	// mostrar este aviso aunque el flag esté seteado por error.
	const isPjnFromMisCausas = folder?.pjn === true && folder?.source === "pjn-login";
	const isMevFromMisCausas = folder?.mev === true && folder?.source === "mev-login";
	const isScbaFromMisCausas = folder?.scba === true && folder?.source === "scba-login";
	const isListRemovedPjn =
		isPjnFromMisCausas && ((folder?.listRemoved === true && folder?.listRemovedSource === "pjn") || folder?.pjnNotFound === true);
	const isListRemovedMev = isMevFromMisCausas && folder?.listRemoved === true && folder?.listRemovedSource === "mev";
	const isListRemovedScba = isScbaFromMisCausas && folder?.listRemoved === true && folder?.listRemovedSource === "scba";

	// Causa PJN reservada (privacy-checker): solo aplica a causas individuales
	// (source !== 'pjn-login'). Las pjn-login mantienen su ruta de acceso vía
	// Mis Causas autenticado y no se les muestra este aviso aunque la causa
	// figure como privada en el modelo.
	const isPjnPrivateRestricted = folder?.pjn === true && folder?.causaIsPrivate === true && folder?.source !== "pjn-login";

	const isDark = theme.palette.mode === "dark";

	// Estado de la cred SCBA del user: si está en error, los folders SCBA del user
	// quedan sin sync hasta que actualice. Se muestra en la pill como warning.
	const scbaCredError = useScbaCredentialError();

	// Unified binding pill — replaces rainbow PJN/MEV/SCBA boxes with brand pattern.
	// Includes optional verification dot indicator at bottom-right (válida/inválida/pendiente).
	const renderJudicialLink = useMemo(() => {
		if (isLoader) {
			return <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 1 }} />;
		}

		type BindingState = {
			label: string;
			accent: string;
			icon: React.ReactNode;
			tooltip?: string;
			onClick?: () => void;
		};

		let state: BindingState;

		if (folder?.pjn) {
			const accent = isPjnPrivateRestricted ? theme.palette.error.main : isListRemovedPjn ? STALE_AMBER : LIVE_GREEN;
			state = {
				label: isPjnPrivateRestricted ? "PJN — Causa reservada" : isListRemovedPjn ? "PJN — Ya no en la lista" : "Vinculado con PJN",
				accent,
				icon:
					isPjnPrivateRestricted || isListRemovedPjn ? (
						<Warning2 size={14} variant="Bulk" color={accent} />
					) : (
						<ExportSquare size={14} variant="Bulk" color={accent} />
					),
				tooltip: isPjnPrivateRestricted
					? "Esta causa fue marcada como reservada — el tribunal restringió la consulta web pública. El sistema sigue verificando si vuelve a estar accesible."
					: isListRemovedPjn
					? "Esta causa ya no aparece en tu lista de Mis Causas del portal PJN. Puede haber sido archivada o desvinculada por el tribunal."
					: undefined,
			};
		} else if (folder?.mev) {
			const accent = isListRemovedMev ? STALE_AMBER : LIVE_GREEN;
			state = {
				label: isListRemovedMev ? "MEV — Ya no en la lista" : "Vinculado con MEV",
				accent,
				icon: isListRemovedMev ? (
					<Warning2 size={14} variant="Bulk" color={accent} />
				) : (
					<ExportSquare size={14} variant="Bulk" color={accent} />
				),
				tooltip: isListRemovedMev
					? "Esta causa ya no aparece en tu lista de Mis Causas del portal MEV. Puede haber sido archivada o desvinculada por el tribunal."
					: undefined,
			};
		} else if (folder?.scba) {
			// Prioridad de estados: removida del listado > credenciales en error > OK.
			// "Cred en error" es por user (afecta a todos sus folders SCBA), no por
			// folder. La señal viene de `useScbaCredentialError` que lee el estado
			// global de la cred SCBA del user.
			if (isListRemovedScba) {
				state = {
					label: "SCBA — Ya no en la lista",
					accent: STALE_AMBER,
					icon: <Warning2 size={14} variant="Bulk" color={STALE_AMBER} />,
					tooltip:
						'Esta causa ya no aparece en "Mis Causas" del portal SCBA. Puede haber sido archivada o desvinculada por el tribunal.',
				};
			} else if (scbaCredError.hasError) {
				state = {
					label: "SCBA — Sincronización pausada",
					accent: STALE_AMBER,
					icon: <Warning2 size={14} variant="Bulk" color={STALE_AMBER} />,
					tooltip:
						"Tus credenciales SCBA fueron rechazadas por el portal. Actualizalas desde Perfil → Cuentas Judiciales para reanudar la sincronización.",
				};
			} else {
				state = {
					label: "Vinculado con SCBA",
					accent: LIVE_GREEN,
					icon: <ExportSquare size={14} variant="Bulk" color={LIVE_GREEN} />,
				};
			}
		} else if (folder?.previousSyncSource) {
			// Folder desvinculado via modo "keep" (PJN/SCBA). Bloqueamos la
			// re-vinculación individual: el matching por fuero+numero+año
			// puede asociar a una causa distinta de la original (sobre todo
			// en PJN colapsado) y los workers de PJN-login/SCBA-login
			// requieren credenciales que se gestionan desde Perfil.
			const sourceLabel = folder.previousSyncSource.toUpperCase();
			state = {
				label: `Sincronización pausada (era ${sourceLabel})`,
				accent: STALE_AMBER,
				icon: <Warning2 size={14} variant="Bulk" color={STALE_AMBER} />,
				tooltip: `Esta carpeta fue desvinculada de ${sourceLabel}. Conserva el histórico de movimientos pero no recibe actualizaciones. Para reanudar la sincronización, vinculá tu cuenta desde Perfil → Cuentas Judiciales.`,
			};
		} else {
			state = {
				label: "Vincular con Poder Judicial",
				accent: BRAND_BLUE,
				icon: <ExportSquare size={14} variant="Linear" color={BRAND_BLUE} />,
				onClick: handleOpenLinkJudicial,
			};
		}

		const showVerify =
			(folder?.pjn || folder?.mev || folder?.scba) &&
			(folder?.causaVerified === false || (folder?.causaVerified === true && folder?.causaIsValid !== undefined));
		const verifyTooltip =
			folder?.causaVerified === false ? "Pendiente de verificación" : folder?.causaIsValid ? "Causa válida" : "Causa inválida";
		const verifyIcon =
			folder?.causaVerified === false ? (
				<InfoCircle size={14} variant="Bold" color={STALE_AMBER} />
			) : folder?.causaIsValid ? (
				<TickCircle size={14} variant="Bold" color={LIVE_GREEN} />
			) : (
				<CloseCircle size={14} variant="Bold" color={theme.palette.error.main} />
			);

		return (
			<Box sx={{ position: "relative", display: "inline-flex" }}>
				<Tooltip title={state.tooltip ?? ""} disableHoverListener={!state.tooltip}>
					<Box
						onClick={state.onClick}
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.75,
							px: 1.25,
							py: 0.625,
							height: 36,
							borderRadius: 1,
							cursor: state.onClick ? "pointer" : "default",
							bgcolor: alpha(state.accent, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(state.accent, isDark ? 0.32 : 0.22)}`,
							transition: "all 180ms ease",
							...(state.onClick && {
								"&:hover": {
									bgcolor: alpha(state.accent, isDark ? 0.22 : 0.14),
									borderColor: alpha(state.accent, isDark ? 0.48 : 0.36),
								},
							}),
						}}
					>
						{state.icon}
						<Typography
							sx={{
								fontSize: "0.78rem",
								fontWeight: 600,
								color: state.accent,
								letterSpacing: "-0.005em",
								lineHeight: 1.4,
							}}
						>
							{state.label}
						</Typography>
					</Box>
				</Tooltip>
				{showVerify && (
					<Tooltip title={verifyTooltip}>
						<Box
							sx={{
								position: "absolute",
								bottom: -6,
								right: -6,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 18,
								height: 18,
								bgcolor: theme.palette.background.paper,
								borderRadius: "50%",
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								boxShadow: `0 2px 4px ${alpha("#000", 0.08)}`,
							}}
						>
							{verifyIcon}
						</Box>
					</Tooltip>
				)}
			</Box>
		);
	}, [
		folder?.pjn,
		folder?.mev,
		folder?.scba,
		folder?.previousSyncSource,
		isListRemovedPjn,
		isListRemovedMev,
		isListRemovedScba,
		isPjnPrivateRestricted,
		folder?.causaVerified,
		folder?.causaIsValid,
		handleOpenLinkJudicial,
		isLoader,
		theme,
		isDark,
		scbaCredError.hasError,
	]);

	// Memoized components - switch between compact and improved based on isDetailedView
	const MemoizedFolderData = useMemo(
		() =>
			isDetailedView ? (
				<FolderDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderDataCompact isLoader={isLoader} folder={folder} type="general" />
			),
		[isLoader, folder, isDetailedView],
	);

	const MemoizedPreJudData = useMemo(
		() =>
			isDetailedView ? (
				<FolderPreJudDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderPreJudDataCompact isLoader={isLoader} folder={folder} type="mediacion" />
			),
		[isLoader, folder, isDetailedView],
	);

	const MemoizedJudData = useMemo(
		() =>
			isDetailedView ? (
				<FolderJudDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderJudDataCompact isLoader={isLoader} folder={folder} type="judicial" />
			),
		[isLoader, folder, isDetailedView],
	);

	// Verification gate: si la carpeta es automática (PJN/MEV/EJE/SCBA) y todavía
	// no fue verificada/asociada/válida, bloqueamos la vista de detalle y
	// mostramos PendingVerificationView con acciones acotadas (reintentar,
	// soporte, eliminar). Esto evita que un usuario acceda al detalle por URL
	// directa cuando no hay datos sincronizados que mostrar.
	// Importante: sólo evaluamos cuando ya cargó el folder correcto (folder._id === id)
	// y no está en loading — caso contrario el gate puede ser un falso positivo
	// mientras llega la respuesta del backend.
	const verificationGate: VerificationGate | null = useMemo(() => {
		if (!folder || folder._id !== id || isLoader) return null;
		const isAutoFolder =
			folder.source === "auto" || folder.pjn === true || folder.mev === true || folder.eje === true || folder.scba === true;
		if (!isAutoFolder) return null;

		if (folder.causaAssociationStatus === "pending_selection") return "pending_selection";
		if (folder.causaAssociationStatus === "failed") return "failed";
		if (folder.causaVerified === true && folder.causaIsValid === false) return "invalid";
		if (folder.causaVerified !== true) return "pending";
		return null;
	}, [folder, id, isLoader]);

	if (verificationGate) {
		return <PendingVerificationView folder={folder} gate={verificationGate} />;
	}

	// Show folder not found message
	if (folderNotFound) {
		const errorColor = theme.palette.error.main;
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "60vh",
					px: 2,
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Atmospheric backdrop */}
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						pointerEvents: "none",
						background: `radial-gradient(circle at 50% 30%, ${alpha(errorColor, isDark ? 0.1 : 0.05)} 0%, transparent 60%)`,
					}}
				/>
				<Box
					sx={{
						position: "relative",
						width: "100%",
						maxWidth: 480,
						p: { xs: 3, md: 4 },
						borderRadius: 2,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.025),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
					}}
				>
					<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
						{/* Icon ring — sober destructive */}
						<Box
							sx={{
								width: 64,
								height: 64,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
								color: errorColor,
							}}
						>
							<FolderCross size={28} variant="Bulk" />
						</Box>

						{/* Eyebrow + title + body */}
						<Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
							<Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.625 }}>
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: errorColor }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Sin acceso al recurso
								</Typography>
							</Box>
							<Typography
								sx={{
									fontSize: { xs: "1.1rem", md: "1.2rem" },
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									textWrap: "balance" as any,
								}}
							>
								Carpeta no encontrada
							</Typography>
							<Typography
								sx={{
									fontSize: "0.85rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									lineHeight: 1.5,
									textWrap: "pretty" as any,
									maxWidth: 380,
								}}
							>
								La carpeta a la que intentás acceder no existe o no tenés permisos para verla.
							</Typography>
						</Box>

						{/* Redirect notice */}
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.875,
								px: 1.5,
								py: 0.875,
								borderRadius: 1,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							}}
						>
							<ArrowLeft size={16} variant="Bulk" color={BRAND_BLUE} />
							<Typography
								sx={{
									fontSize: "0.78rem",
									fontWeight: 600,
									color: BRAND_BLUE,
									letterSpacing: "-0.005em",
								}}
							>
								Redirigiendo a la lista de carpetas…
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			key={id}
			sx={{
				position: "relative",
				"@keyframes fadeIn": {
					from: { opacity: 0.7 },
					to: { opacity: 1 },
				},
				animation: "fadeIn 0.3s ease-in-out",
			}}
		>
			{/* Navigation controls positioned at breadcrumb level */}
			{id && (
				<Box
					sx={{
						position: "absolute",
						top: { xs: -56, md: -60 }, // Moved up by 8px
						right: 0,
						zIndex: 1100, // Higher than breadcrumb
						display: "flex",
						alignItems: "center",
						height: 36, // Match breadcrumb height
						// Agregar fondo para asegurar que el texto no se vea detrás
						backgroundColor: theme.palette.background.default,
						paddingLeft: 2,
					}}
				>
					<NavigationControls currentFolderId={id} inline />
				</Box>
			)}

			{/* Mobile Drawer for Navigation - Removed: Now using icon tabs */}

			<MainCard
				content={false}
				sx={{
					"& .MuiCardContent-root": { p: 0 },
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					boxShadow: "none",
				}}
			>
				<Box sx={{ width: "100%", position: "relative" }}>
					{/* Tab header — brand-tinted chrome */}
					<Box
						sx={{
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
							px: { xs: 1.5, sm: 2 },
							pt: { xs: 1.5, sm: 2 },
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: { xs: "column", sm: "column", md: "row" },
								justifyContent: { md: "space-between" },
								alignItems: { xs: "stretch", md: "center" },
								gap: { xs: 1.5, md: 0 },
								mb: { xs: 1.5, md: 0 },
							}}
						>
							{/* Mobile icon tabs */}
							{isMobile ? (
								<Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
									<Box sx={{ display: "flex", gap: 0.5 }}>
										{tabItems.map((tab) => {
											const active = tabValue === tab.value;
											return (
												<Tooltip key={tab.value} title={tab.label} arrow>
													<Box
														onClick={() => setTabValue(tab.value)}
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															width: 44,
															height: 44,
															borderRadius: 1,
															cursor: "pointer",
															color: active ? BRAND_BLUE : theme.palette.text.secondary,
															bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) : "transparent",
															border: `1px solid ${active ? alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) : "transparent"}`,
															transition: "all 180ms ease",
															"&:hover": {
																color: BRAND_BLUE,
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
															},
														}}
														aria-label={tab.ariaLabel}
														role="tab"
														aria-selected={active}
														tabIndex={0}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																setTabValue(tab.value);
															}
														}}
													>
														{React.cloneElement(tab.icon, {
															size: 22,
															variant: active ? "Bulk" : "Linear",
														})}
													</Box>
												</Tooltip>
											);
										})}
									</Box>
								</Box>
							) : (
								<Tabs
									value={tabValue}
									onChange={handleTabChange}
									aria-label="folder detail tabs"
									variant="scrollable"
									scrollButtons="auto"
									TabIndicatorProps={{
										sx: {
											height: 2,
											borderRadius: "2px 2px 0 0",
											bgcolor: BRAND_BLUE,
										},
									}}
									sx={{
										minHeight: 44,
										"& .MuiTab-root": {
											minHeight: 44,
											textTransform: "none",
											fontSize: { xs: "0.78rem", sm: "0.82rem" },
											fontWeight: 600,
											letterSpacing: "-0.005em",
											px: { xs: 1.25, sm: 1.75 },
											py: 1,
											minWidth: { xs: "auto", sm: 110 },
											color: theme.palette.text.secondary,
											transition: "color 180ms ease",
											"&:hover": { color: BRAND_BLUE },
											"&.Mui-selected": { color: BRAND_BLUE },
										},
										"& .MuiTab-iconWrapper": {
											marginRight: { xs: 0.5, sm: 0.875 },
										},
									}}
								>
									{tabItems.map((tab) => {
										const active = tabValue === tab.value;
										return (
											<Tab
												key={tab.value}
												label={isTablet ? tab.shortLabel : tab.label}
												icon={React.cloneElement(tab.icon, {
													size: isTablet ? 16 : 18,
													variant: active ? "Bulk" : "Linear",
												})}
												iconPosition="start"
												{...a11yProps(tab.value)}
											/>
										);
									})}
								</Tabs>
							)}

							{/* View mode toggle + judicial link */}
							<Box
								sx={{
									display: "flex",
									gap: 1.25,
									alignItems: "center",
									justifyContent: { xs: "center", sm: "flex-start", md: "flex-end" },
									flexWrap: { xs: "wrap", sm: "nowrap" },
									pb: { xs: 1, md: 0.75 },
								}}
							>
								{/* View Mode Toggle — only on Info tab */}
								{tabValue === 0 && (
									<ToggleButtonGroup
										value={viewMode}
										exclusive
										onChange={(_, newViewMode) => newViewMode && setViewMode(newViewMode)}
										size="small"
										sx={{
											bgcolor: theme.palette.background.paper,
											borderRadius: 1,
											"& .MuiToggleButton-root": {
												px: 1.25,
												py: 0.625,
												height: 32,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
												color: theme.palette.text.secondary,
												textTransform: "none",
												letterSpacing: "-0.005em",
												transition: "all 180ms ease",
												"&:first-of-type": {
													borderTopLeftRadius: 8,
													borderBottomLeftRadius: 8,
												},
												"&:last-of-type": {
													borderTopRightRadius: 8,
													borderBottomRightRadius: 8,
												},
												"&:hover": {
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
													borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22),
													color: BRAND_BLUE,
												},
												"&.Mui-selected": {
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
													borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.3),
													color: BRAND_BLUE,
													"&:hover": {
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.12),
													},
												},
											},
										}}
									>
										<ToggleButton value="compact">
											<Tooltip title="Vista compacta">
												<Box sx={{ display: "flex", alignItems: "center", gap: 0.625 }}>
													<TableDocument size={14} variant="Bulk" />
													<Typography sx={{ fontSize: "0.74rem", fontWeight: 600, letterSpacing: "-0.005em" }}>Compacta</Typography>
												</Box>
											</Tooltip>
										</ToggleButton>
										<ToggleButton value="detailed">
											<Tooltip title="Vista detallada con mejor aprovechamiento del espacio">
												<Box sx={{ display: "flex", alignItems: "center", gap: 0.625 }}>
													<Category size={14} variant="Bulk" />
													<Typography sx={{ fontSize: "0.74rem", fontWeight: 600, letterSpacing: "-0.005em" }}>Detallada</Typography>
												</Box>
											</Tooltip>
										</ToggleButton>
									</ToggleButtonGroup>
								)}
								{renderJudicialLink}
							</Box>
						</Box>
					</Box>

					{/* Tab 1: Información General */}
					<TabPanel value={tabValue} index={0}>
						<InfoTabsVertical
							folderData={folder}
							basicDataComponent={MemoizedFolderData}
							mediationDataComponent={MemoizedPreJudData}
							judicialDataComponent={MemoizedJudData}
							isLoader={isLoader}
						/>
					</TabPanel>

					{/* Tab 2: Actividad */}
					<TabPanel value={tabValue} index={1}>
						<ActivityTables folderName={folder?.folderName} />
					</TabPanel>

					{/* Tab 3: Gestión */}
					<TabPanel value={tabValue} index={2}>
						{folder && <GestionTabImproved folder={folder} isDetailedView={isDetailedView} />}
					</TabPanel>

					{/* Tab 4: Recursos */}
					<TabPanel value={tabValue} index={3}>
						{id && <FolderRecursosTab folderId={id} folderName={folder?.folderName} />}
					</TabPanel>

					{/* Tab 5: Historial */}
					<TabPanel value={tabValue} index={4}>
						{id && <HistorialTab folderId={id} />}
					</TabPanel>
				</Box>

				{/* LinkToJudicialPower Modal */}
				{id && folder && (
					<LinkToJudicialPower
						openLink={openLinkJudicial}
						onCancelLink={handleCloseLinkJudicial}
						folderId={id}
						folderName={folder.folderName}
						onSelectBuenosAires={handleOpenLinkPJBA}
					/>
				)}

				{/* LinkToPJBuenosAires Modal */}
				{id && folder && (
					<LinkToPJBuenosAires
						open={openLinkPJBA}
						onCancel={handleCloseLinkPJBA}
						onBack={() => {
							setOpenLinkPJBA(false);
							setOpenLinkJudicial(true);
						}}
						folderId={id}
						folderName={folder.folderName}
					/>
				)}

				{/* Modal de error cuando no se tiene acceso a la característica */}
				<LimitErrorModal
					open={limitErrorOpen}
					onClose={handleCloseLimitErrorModal}
					message="Esta característica no está disponible en tu plan actual."
					featureInfo={limitErrorInfo}
					upgradeRequired={true}
				/>
			</MainCard>
		</Box>
	);
};

export default Details;
