import React, { useEffect, useMemo, useRef, useState } from "react";

// material-ui
import { Box, Button, Chip, Link, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme, Theme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import { BRAND_BLUE, LIVE_GREEN, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";

// icons
import { Add, ArrowRight, CloseCircle, FolderAdd, Link21, Profile2User, Calendar, TickCircle } from "iconsax-react";

// hooks
import { useNavigate } from "react-router-dom";

// services — para detectar estado de cred en background
import pjnCredentialsService from "api/pjnCredentials";
import scbaCredentialsService from "api/scbaCredentials";
import ApiService from "store/reducers/ApiService";

// tracking
import {
	trackOnboardingShown,
	trackOnboardingStepClicked,
	trackOnboardingStepCompleted,
	trackOnboardingJudicialLogoClicked,
	trackOnboardingExampleFolderUsed,
	trackOnboardingDismissed,
	trackOnboardingCompleted,
} from "utils/gtm";

// types
import { ThemeMode } from "types/config";

// assets — logos de portales judiciales (reusa los del flujo de register)
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoMEV from "assets/images/logos/logo_pj_buenos_aires.svg";

// Logo EJE — hosted Cloudinary, ya usado en register.tsx y Header.tsx
const LOGO_EJE = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";

// =============================================================================
// ONBOARDING CHECKLIST — componente único que reemplaza el banner + educational
// block + 4 cards. Persistente hasta completarse o ser dismissado explícito.
//
// Origen: el funnel post-registro mostró 0% vinculación de cred judicial y 10%
// retención a 7 días entre activados. El onboarding anterior solo empujaba a
// "crear carpeta", sin siguiente paso. Este checklist incluye el step crítico
// "conectar cuenta judicial" (cred PJN/SCBA o vincular expediente individual
// PJN/MEV/EJE) que mueve la propuesta de valor real del producto.
// =============================================================================

// ── Tipos del step ──────────────────────────────────────────────────────────
type StepId = "first_folder" | "judicial_connection" | "first_contact" | "first_deadline";
type StepStatus = "pending" | "in_progress" | "done";

interface Step {
	id: StepId;
	status: StepStatus;
	icon: React.ElementType;
	title: string;
	description: string;
	expandedHint?: React.ReactNode; // contenido extra cuando es el "next focus"
}

// ── Props ───────────────────────────────────────────────────────────────────
interface OnboardingChecklistProps {
	userName?: string;
	hasFolders: boolean; // dashboardData.folders.total > 0
	hasPjnCredentials: boolean; // PJN cred enabled
	hasScbaCredentials: boolean; // SCBA cred enabled
	hasContacts?: boolean; // futuro — backend wire-up pendiente
	hasDeadlines?: boolean; // futuro — backend wire-up pendiente
	onDismiss: () => void;
}

// ── Componente principal ────────────────────────────────────────────────────
const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
	userName,
	hasFolders,
	hasPjnCredentials,
	hasScbaCredentials,
	hasContacts = false,
	hasDeadlines = false,
	onDismiss,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const isShortViewport = useMediaQuery("(max-height: 980px)");
	const isTightViewport = useMediaQuery("(max-height: 760px)");
	const navigate = useNavigate();

	// Build de los 4 steps con su status calculado.
	// judicial_connection: done si cred PJN o SCBA. in_progress si tiene
	// carpetas (asume que vinculó individual o creó manual y por eso ya
	// "tocó" el sistema). pending si nada.
	const judicialStatus: StepStatus = hasPjnCredentials || hasScbaCredentials ? "done" : hasFolders ? "in_progress" : "pending";

	const steps: Step[] = useMemo(
		() => [
			{
				id: "first_folder",
				status: hasFolders ? "done" : "pending",
				icon: FolderAdd,
				title: "Crear tu primera carpeta",
				description:
					"Un expediente, una causa o un cliente. Es donde organizás documentos, contactos, vencimientos y cálculos en un solo lugar.",
			},
			{
				id: "judicial_connection",
				status: judicialStatus,
				icon: Link21,
				title: "Conectar con el Poder Judicial",
				description: "Sin esto, vas a cargar todo a mano. Conectalo una vez y Law·Analytics trae los movimientos automáticamente.",
			},
			{
				id: "first_contact",
				status: hasContacts ? "done" : "pending",
				icon: Profile2User,
				title: "Agregar tu primer contacto",
				description: "Cliente, contraparte o profesional. Vinculá personas a tus carpetas para tener todo a mano.",
			},
			{
				id: "first_deadline",
				status: hasDeadlines ? "done" : "pending",
				icon: Calendar,
				title: "Configurar tu primera alerta de vencimiento",
				description: "Recibí notificaciones antes de cada fecha clave para no perder un plazo procesal.",
			},
		],
		[hasFolders, hasContacts, hasDeadlines, judicialStatus],
	);

	const completedCount = steps.filter((s) => s.status === "done").length;
	const totalSteps = steps.length;
	const progressPct = (completedCount / totalSteps) * 100;
	const allDone = completedCount === totalSteps;

	// Próximo step recomendado: primer "pending" o "in_progress".
	const nextStepIdx = steps.findIndex((s) => s.status !== "done");
	const nextStepId = nextStepIdx >= 0 ? steps[nextStepIdx].id : null;

	// ── Tracking lifecycle ──
	// onboarding_shown: una vez al mount. Dispara GTM (analytics) +
	// OnboardingEvent en Mongo (admin tab Eventos del panel).
	const shownRef = useRef(false);
	useEffect(() => {
		if (!shownRef.current) {
			shownRef.current = true;
			trackOnboardingShown(completedCount, totalSteps);
			ApiService.trackOnboardingEvent("onboarding_shown", {
				completed_count: completedCount,
				total_steps: totalSteps,
			});
		}
	}, [completedCount, totalSteps]);

	// onboarding_step_completed: dispara cuando el status de un step
	// transiciona a "done". Usa ref para evitar dispatches al primer render.
	const prevStatusesRef = useRef<Record<StepId, StepStatus> | null>(null);
	useEffect(() => {
		const current: Record<StepId, StepStatus> = steps.reduce((acc, s) => {
			acc[s.id] = s.status;
			return acc;
		}, {} as Record<StepId, StepStatus>);

		if (prevStatusesRef.current) {
			for (const step of steps) {
				const prev = prevStatusesRef.current[step.id];
				if (prev && prev !== "done" && step.status === "done") {
					trackOnboardingStepCompleted(step.id);
					ApiService.trackOnboardingEvent("onboarding_step_completed", { step_id: step.id });
				}
			}
		}
		prevStatusesRef.current = current;
	}, [steps]);

	// onboarding_completed: 4/4. Dispara GTM + backend (el endpoint del back
	// `trackOnboardingEvent` con event="onboarding_completed" persiste
	// onboarding.onboardingComplete=true en User). El próximo getOnboardingStatus
	// va a devolver complete y el dashboard ocultará el checklist.
	const completedDispatchedRef = useRef(false);
	useEffect(() => {
		if (allDone && !completedDispatchedRef.current) {
			completedDispatchedRef.current = true;
			trackOnboardingCompleted();
			ApiService.trackOnboardingEvent("onboarding_completed", { total_steps: totalSteps });
			ApiService.updateOnboarding({ step: "first_feature" }).catch(() => {
				// silencioso: si falla, el checklist sigue visible al próximo login
				// y el user puede dismissarlo manual o intentaremos de nuevo
			});
		}
	}, [allDone, totalSteps]);

	// ── Handlers de navegación ──
	// Cada handler dispara: GTM (analytics) + OnboardingEvent (admin UI).
	// Ambos son fire-and-forget — no bloquean la navegación.
	const goCreateFolder = () => {
		trackOnboardingStepClicked("first_folder");
		ApiService.trackOnboardingEvent("onboarding_step_clicked", { step_id: "first_folder" });
		navigate("/apps/folders/list?onboarding=true&action=create");
	};

	const goCreateExampleFolder = () => {
		trackOnboardingExampleFolderUsed();
		ApiService.trackOnboardingEvent("onboarding_example_folder_used");
		// Mismo destino, con flag de ejemplo. La página de folders puede leer
		// `example=true` y pre-llenar el form con datos demo. Si todavía no
		// está implementado del lado de folders, simplemente abre el create.
		navigate("/apps/folders/list?onboarding=true&action=create&example=true");
	};

	const goLinkCredential = (jurisdiction: "PJN" | "SCBA") => {
		trackOnboardingStepClicked("judicial_connection");
		trackOnboardingJudicialLogoClicked(jurisdiction, "credential");
		ApiService.trackOnboardingEvent("onboarding_judicial_logo_clicked", { jurisdiction, mode: "credential" });
		// Ambas creds viven en el mismo tab `/apps/profiles/account/pjn` —
		// el componente `TabPjnIntegration` lee el query param `view=pjn|scba`
		// para decidir cuál card mostrar (ver `TabPjnIntegration.tsx:44`).
		const view = jurisdiction === "SCBA" ? "scba" : "pjn";
		navigate(`/apps/profiles/account/pjn?view=${view}`);
	};

	const goLinkIndividualFolder = (jurisdiction: "PJN" | "MEV" | "EJE") => {
		trackOnboardingStepClicked("judicial_connection");
		trackOnboardingJudicialLogoClicked(jurisdiction, "individual");
		ApiService.trackOnboardingEvent("onboarding_judicial_logo_clicked", { jurisdiction, mode: "individual" });
		navigate(`/apps/folders/list?onboarding=true&action=create&jurisdiction=${jurisdiction}`);
	};

	const goAddContact = () => {
		trackOnboardingStepClicked("first_contact");
		ApiService.trackOnboardingEvent("onboarding_step_clicked", { step_id: "first_contact" });
		navigate("/apps/customer/customer-list?onboarding=true&action=create");
	};

	const goAddDeadline = () => {
		trackOnboardingStepClicked("first_deadline");
		ApiService.trackOnboardingEvent("onboarding_step_clicked", { step_id: "first_deadline" });
		navigate("/apps/calendar?onboarding=true&action=create");
	};

	const handleDismiss = () => {
		trackOnboardingDismissed(completedCount, totalSteps);
		ApiService.trackOnboardingEvent("onboarding_dismissed", { completed_count: completedCount, total_steps: totalSteps });
		onDismiss();
	};

	// ── Estilo compartido del container — atmósfera blob + dot grid (mismo
	//    lenguaje que el WelcomeBanner anterior, para no romper continuidad). ──
	const containerSx = {
		position: "relative" as const,
		overflow: "hidden",
		bgcolor: theme.palette.background.paper,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
		boxShadow: `0 4px 18px ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
		p: 0,
	};

	// ── Header (eyebrow + título + progreso) ──
	const headline = allDone
		? "Onboarding completo"
		: completedCount === 0
		? userName
			? `Bienvenido, ${userName}`
			: "Bienvenido a Law·Analytics"
		: userName
		? `Bien hecho, ${userName}`
		: "Bien hecho";

	const subline = allDone
		? "Ya tenés todo configurado. Law·Analytics está trabajando por vos."
		: completedCount === 0
		? `${totalSteps} pasos para que Law·Analytics empiece a trabajar por vos.`
		: `${totalSteps - completedCount} ${totalSteps - completedCount === 1 ? "paso más" : "pasos más"} para activar todo el potencial.`;

	const eyebrowLabel = allDone ? "TODO LISTO" : completedCount === 0 ? "EMPEZÁ ACÁ" : completedCount >= 3 ? "CASI LISTO" : "SEGUÍ ASÍ";

	return (
		<MainCard border={false} sx={containerSx}>
			{/* Atmósfera — blob brand-blue arriba derecha */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "-40%",
					right: "-15%",
					width: { xs: 320, md: 460 },
					height: { xs: 320, md: 460 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.13)} 0%, transparent 65%)`,
					filter: "blur(60px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			{/* Dot grid con mask radial */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.08 : 0.06)} 1px, transparent 1px)`,
					backgroundSize: "26px 26px",
					maskImage: "radial-gradient(ellipse 60% 80% at 80% 30%, #000 0%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 60% 80% at 80% 30%, #000 0%, transparent 75%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Stack
				spacing={{
					xs: isTightViewport ? 1.5 : isShortViewport ? 2 : 2.75,
					sm: isTightViewport ? 1.75 : isShortViewport ? 2.25 : 3,
				}}
				sx={{
					px: { xs: 2.5, sm: 3.5, md: 4 },
					py: {
						xs: isTightViewport ? 2 : isShortViewport ? 2.5 : 3.25,
						sm: isTightViewport ? 2.25 : isShortViewport ? 2.75 : 3.75,
					},
					position: "relative",
					zIndex: 1,
				}}
			>
				{/* ── Header ── */}
				<Stack spacing={1.25}>
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								px: 1.25,
								py: 0.4,
								borderRadius: 1,
								bgcolor: alpha(allDone ? LIVE_GREEN : BRAND_BLUE, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(allDone ? LIVE_GREEN : BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 600,
									letterSpacing: "0.14em",
									textTransform: "uppercase",
									color: allDone ? LIVE_GREEN : BRAND_BLUE,
								}}
							>
								{eyebrowLabel}
							</Typography>
						</Box>

						<Tooltip title="Podés volver a abrir esta guía desde Ayuda" placement="left" arrow>
							<Link
								component="button"
								variant="caption"
								onClick={handleDismiss}
								sx={{
									color: alpha(theme.palette.text.primary, 0.5),
									textDecoration: "none",
									cursor: "pointer",
									fontSize: "0.72rem",
									border: "none",
									background: "none",
									display: "inline-flex",
									alignItems: "center",
									gap: 0.5,
									transition: "color 0.2s ease",
									"&:hover": { color: theme.palette.text.primary, textDecoration: "underline", textUnderlineOffset: "2px" },
								}}
							>
								<CloseCircle size={13} variant="Bulk" />
								Ocultar guía
							</Link>
						</Tooltip>
					</Stack>

					<Stack spacing={0.5}>
						<Typography
							component="h2"
							sx={{
								fontSize: {
									xs: isTightViewport ? "1.125rem" : isShortViewport ? "1.25rem" : "1.5rem",
									sm: isTightViewport ? "1.25rem" : isShortViewport ? "1.5rem" : "1.75rem",
								},
								fontWeight: 600,
								letterSpacing: "-0.025em",
								lineHeight: 1.15,
								color: "text.primary",
								textWrap: "balance",
							}}
						>
							{headline}
						</Typography>
						<Typography
							sx={{
								fontSize: { xs: "0.875rem", sm: "0.95rem" },
								color: "text.secondary",
								lineHeight: 1.5,
								maxWidth: 620,
								textWrap: "pretty",
							}}
						>
							{subline}
						</Typography>
					</Stack>

					{/* Progress bar — width animada */}
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ pt: 0.5 }}>
						<Box
							sx={{
								flex: 1,
								height: 6,
								borderRadius: 3,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
								overflow: "hidden",
								position: "relative",
							}}
						>
							<Box
								sx={{
									position: "absolute",
									inset: 0,
									width: `${progressPct}%`,
									bgcolor: allDone ? LIVE_GREEN : BRAND_BLUE,
									transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1), background-color 400ms ease",
									borderRadius: 3,
								}}
							/>
						</Box>
						<Typography
							sx={{
								fontSize: "0.78rem",
								fontWeight: 600,
								color: "text.secondary",
								fontVariantNumeric: "tabular-nums",
								whiteSpace: "nowrap",
							}}
						>
							{completedCount} de {totalSteps}
						</Typography>
					</Stack>
				</Stack>

				{/* ── Lista de steps ── */}
				<Stack spacing={1.25}>
					{steps.map((step) => {
						const isNext = step.id === nextStepId;
						const isDone = step.status === "done";

						return (
							<StepRow
								key={step.id}
								step={step}
								isNext={isNext}
								isDark={isDark}
								theme={theme}
								onPrimaryClick={
									step.id === "first_folder"
										? goCreateFolder
										: step.id === "first_contact"
										? goAddContact
										: step.id === "first_deadline"
										? goAddDeadline
										: undefined
								}
								onSecondaryClick={step.id === "first_folder" ? goCreateExampleFolder : undefined}
								renderExtra={
									step.id === "judicial_connection" && !isDone
										? () => (
												<JudicialConnectionPanel
													hasPjnCredentials={hasPjnCredentials}
													hasScbaCredentials={hasScbaCredentials}
													hasFolders={hasFolders}
													isDark={isDark}
													theme={theme}
													onLinkCredential={goLinkCredential}
													onLinkIndividual={goLinkIndividualFolder}
												/>
										  )
										: undefined
								}
							/>
						);
					})}
				</Stack>
			</Stack>
		</MainCard>
	);
};

// =============================================================================
// StepRow — fila individual del checklist
// =============================================================================

interface StepRowProps {
	step: Step;
	isNext: boolean;
	isDark: boolean;
	theme: Theme;
	onPrimaryClick?: () => void;
	onSecondaryClick?: () => void;
	renderExtra?: () => React.ReactNode;
}

const StepRow: React.FC<StepRowProps> = ({ step, isNext, isDark, theme, onPrimaryClick, onSecondaryClick, renderExtra }) => {
	const isDone = step.status === "done";
	const StepIcon = step.icon;

	// Coloring: done = verde tintado, next = brand-blue reforzado, otros = neutral
	const accent = isDone ? LIVE_GREEN : BRAND_BLUE;
	const rowBg = isDone
		? alpha(LIVE_GREEN, isDark ? 0.08 : 0.05)
		: isNext
		? alpha(BRAND_BLUE, isDark ? 0.07 : 0.04)
		: theme.palette.background.default;
	const rowBorder = isDone
		? alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)
		: isNext
		? alpha(BRAND_BLUE, isDark ? 0.36 : 0.26)
		: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.07);
	const rowBorderWidth = isNext && !isDone ? "1.5px" : "1px";

	return (
		<Box
			sx={{
				borderRadius: 1.5,
				bgcolor: rowBg,
				border: `${rowBorderWidth} solid ${rowBorder}`,
				transition: "background-color 0.3s ease, border-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
				...(isNext && !isDone && { boxShadow: `0 4px 16px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }),
				...(!isDone && {
					"&:hover": {
						borderColor: alpha(BRAND_BLUE, isDark ? 0.42 : 0.32),
						transform: "translateY(-1px)",
						boxShadow: `0 6px 18px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
					},
				}),
			}}
		>
			<Stack direction="row" spacing={2} alignItems="flex-start" sx={{ p: { xs: 1.75, sm: 2 } }}>
				{/* Status indicator: ✓ done | ● next (con pulse) | ○ pending */}
				<Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0, mt: 0.25 }}>
					{isDone ? (
						<Box
							sx={{
								width: 28,
								height: 28,
								borderRadius: "50%",
								bgcolor: LIVE_GREEN,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#fff",
								boxShadow: `0 4px 12px ${alpha(LIVE_GREEN, 0.32)}`,
							}}
						>
							<TickCircle size={20} variant="Bold" color="#fff" />
						</Box>
					) : (
						<Box
							sx={{
								width: 28,
								height: 28,
								borderRadius: "50%",
								border: `2px solid ${alpha(accent, isNext ? 1 : 0.42)}`,
								bgcolor: isNext ? accent : "transparent",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: isNext ? "#fff" : accent,
								fontSize: "0.8rem",
								fontWeight: 700,
							}}
						>
							{isNext && (
								<Box
									aria-hidden
									sx={{
										position: "absolute",
										inset: -2,
										borderRadius: "50%",
										bgcolor: BRAND_BLUE,
										animation: "la-live-pulse 2.4s ease-out infinite",
										zIndex: -1,
									}}
								/>
							)}
							<StepIcon size={14} variant="Bulk" color={isNext ? "#fff" : accent} />
						</Box>
					)}
					<Box sx={LIVE_PULSE_KEYFRAMES} />
				</Box>

				{/* Contenido del step */}
				<Stack spacing={isNext && !isDone ? 1.5 : 0.5} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
						<Typography
							sx={{
								fontSize: "1rem",
								fontWeight: 600,
								letterSpacing: "-0.01em",
								color: isDone ? "text.secondary" : "text.primary",
								textDecoration: isDone ? "line-through" : "none",
								textDecorationColor: alpha(LIVE_GREEN, 0.5),
								lineHeight: 1.3,
							}}
						>
							{step.title}
						</Typography>
						{isDone && (
							<Typography
								sx={{
									fontSize: "0.72rem",
									fontWeight: 600,
									color: LIVE_GREEN,
									letterSpacing: "0.04em",
									textTransform: "uppercase",
									whiteSpace: "nowrap",
								}}
							>
								Listo
							</Typography>
						)}
					</Stack>

					{!isDone && (
						<Typography
							sx={{
								fontSize: "0.875rem",
								color: "text.secondary",
								lineHeight: 1.5,
								textWrap: "pretty",
							}}
						>
							{step.description}
						</Typography>
					)}

					{/* Extra content (panel del step judicial) o CTAs del step "next" */}
					{!isDone && renderExtra && renderExtra()}

					{!isDone && !renderExtra && isNext && onPrimaryClick && (
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }} sx={{ pt: 0.5 }}>
							<Button
								variant="contained"
								onClick={onPrimaryClick}
								startIcon={<Add size={16} />}
								sx={{
									bgcolor: BRAND_BLUE,
									color: "#fff",
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									borderRadius: 1.25,
									fontSize: "0.875rem",
									px: 2,
									py: 0.85,
									whiteSpace: "nowrap",
									alignSelf: { xs: "stretch", sm: "flex-start" },
									boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.24)}`,
									transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
									"&:hover": {
										bgcolor: alpha(BRAND_BLUE, 0.92),
										boxShadow: `0 10px 22px ${alpha(BRAND_BLUE, 0.32)}`,
										transform: "translateY(-1px)",
									},
									"&:active": { transform: "translateY(0)" },
								}}
							>
								Empezar ahora
							</Button>

							{onSecondaryClick && (
								<Button
									variant="text"
									onClick={onSecondaryClick}
									sx={{
										color: BRAND_BLUE,
										textTransform: "none",
										fontWeight: 500,
										fontSize: "0.85rem",
										letterSpacing: "-0.005em",
										alignSelf: { xs: "stretch", sm: "flex-start" },
										"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
									}}
								>
									o usar datos de ejemplo
								</Button>
							)}
						</Stack>
					)}

					{!isDone && !renderExtra && !isNext && onPrimaryClick && (
						<Link
							component="button"
							onClick={onPrimaryClick}
							sx={{
								alignSelf: "flex-start",
								color: BRAND_BLUE,
								fontWeight: 500,
								fontSize: "0.85rem",
								textDecoration: "none",
								cursor: "pointer",
								border: "none",
								background: "none",
								p: 0,
								display: "inline-flex",
								alignItems: "center",
								gap: 0.5,
								mt: 0.5,
								"&:hover": { textDecoration: "underline", textUnderlineOffset: "2px" },
							}}
						>
							Hacerlo ahora
							<ArrowRight size={14} />
						</Link>
					)}
				</Stack>
			</Stack>
		</Box>
	);
};

// =============================================================================
// JudicialConnectionPanel — sub-componente del step #2
//
// Muestra los dos paths para conectar con el Poder Judicial:
//   (a) Credencial → PJN o SCBA (sincroniza TODOS los expedientes automáticamente)
//   (b) Individual → PJN, MEV o EJE (vinculá expediente por número, sin login)
//
// Si ya tiene una cred parcial (ej. PJN OK pero SCBA no), el panel adapta el
// copy para sugerir lo que falta.
// =============================================================================

interface JudicialConnectionPanelProps {
	hasPjnCredentials: boolean;
	hasScbaCredentials: boolean;
	hasFolders: boolean;
	isDark: boolean;
	theme: Theme;
	onLinkCredential: (jurisdiction: "PJN" | "SCBA") => void;
	onLinkIndividual: (jurisdiction: "PJN" | "MEV" | "EJE") => void;
}

interface JudicialOption {
	jurisdiction: "PJN" | "MEV" | "SCBA" | "EJE";
	label: string;
	logo: string;
	bgColor: string;
	hasBorder: boolean;
}

const CREDENTIAL_OPTIONS: JudicialOption[] = [
	{ jurisdiction: "PJN", label: "PJN", logo: logoPJNacion, bgColor: "#232D4F", hasBorder: false },
	// SCBA usa el logo del PJ Buenos Aires (misma jurisdicción)
	{ jurisdiction: "SCBA", label: "SCBA", logo: logoMEV, bgColor: "#FFFFFF", hasBorder: true },
];

const INDIVIDUAL_OPTIONS: JudicialOption[] = [
	{ jurisdiction: "PJN", label: "PJN", logo: logoPJNacion, bgColor: "#232D4F", hasBorder: false },
	{ jurisdiction: "MEV", label: "MEV", logo: logoMEV, bgColor: "#FFFFFF", hasBorder: true },
	{ jurisdiction: "EJE", label: "EJE", logo: LOGO_EJE, bgColor: "#FFFFFF", hasBorder: true },
];

const JudicialConnectionPanel: React.FC<JudicialConnectionPanelProps> = ({
	hasPjnCredentials,
	hasScbaCredentials,
	hasFolders,
	isDark,
	theme,
	onLinkCredential,
	onLinkIndividual,
}) => {
	// Copy del sub-encabezado del path "Credencial" — adapta según estado.
	let credentialHint = "Una sola vez. Traemos todos tus expedientes y los mantenemos sincronizados.";
	if (hasPjnCredentials && !hasScbaCredentials) {
		credentialHint = "Tu cuenta del PJN ya está conectada. ¿También usás la SCBA?";
	} else if (hasScbaCredentials && !hasPjnCredentials) {
		credentialHint = "Tu cuenta de la SCBA ya está conectada. ¿También usás el PJN?";
	} else if (hasFolders) {
		credentialHint = "Sumá automatización completa. Conectá tu cuenta y traemos todos tus expedientes futuros.";
	}

	return (
		<Stack spacing={2.25} sx={{ pt: 0.5 }}>
			{/* Chip "+80% del valor" — señal de prioridad para este step */}
			<Box
				sx={{
					display: "inline-flex",
					alignSelf: "flex-start",
					alignItems: "center",
					gap: 0.5,
					px: 1.25,
					py: 0.4,
					borderRadius: 1,
					bgcolor: alpha(LIVE_GREEN, isDark ? 0.18 : 0.1),
					border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box
					aria-hidden
					sx={{
						width: 7,
						height: 7,
						borderRadius: "50%",
						bgcolor: LIVE_GREEN,
						boxShadow: `0 0 8px ${alpha(LIVE_GREEN, 0.5)}`,
					}}
				/>
				<Typography
					sx={{
						fontSize: "0.68rem",
						fontWeight: 700,
						letterSpacing: "0.04em",
						color: isDark ? alpha(LIVE_GREEN, 0.95) : "#0F7A3F",
						textTransform: "uppercase",
					}}
				>
					Activa el 80% del valor de Law·Analytics
				</Typography>
			</Box>

			{/* Path A: Credencial */}
			<Stack spacing={1.25}>
				<Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
					<Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
						Opción A — Conectá tu cuenta
					</Typography>
					<Chip
						label="Recomendado"
						size="small"
						sx={{
							height: 18,
							fontSize: "0.62rem",
							fontWeight: 700,
							letterSpacing: "0.04em",
							textTransform: "uppercase",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.1),
							color: BRAND_BLUE,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
							"& .MuiChip-label": { px: 0.75 },
						}}
					/>
				</Stack>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>{credentialHint}</Typography>
				<Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
					{CREDENTIAL_OPTIONS.map((opt) => {
						const isConnected = (opt.jurisdiction === "PJN" && hasPjnCredentials) || (opt.jurisdiction === "SCBA" && hasScbaCredentials);
						return (
							<LogoTile
								key={`cred-${opt.jurisdiction}`}
								option={opt}
								isConnected={isConnected}
								isDark={isDark}
								theme={theme}
								onClick={() => onLinkCredential(opt.jurisdiction as "PJN" | "SCBA")}
							/>
						);
					})}
				</Stack>
			</Stack>

			{/* Divider sutil */}
			<Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.6) }} />

			{/* Path B: Individual */}
			<Stack spacing={1.25}>
				<Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
					Opción B — Vinculá expedientes uno por uno
				</Typography>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
					Ideal si solo trackeás algunas causas puntuales o si no tenés cuenta del portal.
				</Typography>
				<Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
					{INDIVIDUAL_OPTIONS.map((opt) => (
						<LogoTile
							key={`ind-${opt.jurisdiction}`}
							option={opt}
							isDark={isDark}
							theme={theme}
							onClick={() => onLinkIndividual(opt.jurisdiction as "PJN" | "MEV" | "EJE")}
						/>
					))}
				</Stack>
			</Stack>
		</Stack>
	);
};

// =============================================================================
// LogoTile — tile cuadrado clickeable con logo del portal judicial
//
// Reutiliza el patrón visual de los tiles del Header del landing y de
// FeatureContextPanel en register.tsx — logo dentro de tile coloreado, sigla
// debajo, hover translateY + shadow tintada.
// =============================================================================

interface LogoTileProps {
	option: JudicialOption;
	isConnected?: boolean;
	isDark: boolean;
	theme: Theme;
	onClick: () => void;
}

const LogoTile: React.FC<LogoTileProps> = ({ option, isConnected, isDark, theme, onClick }) => {
	const isDarkTile = option.hasBorder === false;
	const baseShadow = isDarkTile
		? "0 4px 12px rgba(35, 45, 79, 0.28), 0 2px 5px rgba(0, 0, 0, 0.1)"
		: "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 5px rgba(0, 0, 0, 0.05)";

	return (
		<Stack
			component="button"
			onClick={onClick}
			alignItems="center"
			spacing={0.75}
			sx={{
				width: 72,
				border: "none",
				background: "none",
				p: 0,
				cursor: "pointer",
				transition: "transform 0.2s ease",
				"&:hover": { transform: "translateY(-2px)" },
				"&:hover .logo-tile-inner": {
					borderColor: alpha(BRAND_BLUE, 0.42),
					boxShadow: isDarkTile
						? "0 8px 20px rgba(35, 45, 79, 0.4), 0 3px 8px rgba(0, 0, 0, 0.15)"
						: `0 8px 20px ${alpha(BRAND_BLUE, 0.18)}, 0 3px 8px rgba(0, 0, 0, 0.08)`,
				},
				"&:focus-visible": { outline: `2px solid ${BRAND_BLUE}`, outlineOffset: 4, borderRadius: 1.5 },
			}}
		>
			<Box
				className="logo-tile-inner"
				sx={{
					position: "relative",
					width: 56,
					height: 56,
					borderRadius: 1.5,
					bgcolor: option.bgColor,
					border: option.hasBorder ? `1px solid ${alpha("#000000", 0.1)}` : "none",
					boxShadow: baseShadow,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 0.75,
					transition: "border-color 0.2s ease, box-shadow 0.2s ease",
				}}
			>
				<Box
					component="img"
					src={option.logo}
					alt={`Logo ${option.label}`}
					sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
				/>
				{isConnected && (
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							top: -4,
							right: -4,
							width: 18,
							height: 18,
							borderRadius: "50%",
							bgcolor: LIVE_GREEN,
							border: `2px solid ${theme.palette.background.paper}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxShadow: `0 2px 6px ${alpha(LIVE_GREEN, 0.4)}`,
						}}
					>
						<TickCircle size={11} variant="Bold" color="#fff" />
					</Box>
				)}
			</Box>
			<Typography
				sx={{
					fontSize: "0.72rem",
					fontWeight: 600,
					letterSpacing: "-0.005em",
					color: isConnected ? LIVE_GREEN : "text.secondary",
					textAlign: "center",
					lineHeight: 1.25,
				}}
			>
				{option.label}
			</Typography>
		</Stack>
	);
};

// =============================================================================
// Hook auxiliar — fetch del estado de cred PJN/SCBA con cache simple
//
// Reutiliza los services existentes (pjnCredentialsService, scbaCredentialsService).
// Evita re-fetch en re-renders dentro de la misma sesión del componente.
// =============================================================================

export interface JudicialConnectionState {
	loading: boolean;
	hasPjnCredentials: boolean;
	hasScbaCredentials: boolean;
}

export function useJudicialConnectionState(skip = false): JudicialConnectionState {
	const [state, setState] = useState<JudicialConnectionState>({
		loading: !skip,
		hasPjnCredentials: false,
		hasScbaCredentials: false,
	});

	useEffect(() => {
		if (skip) {
			setState({ loading: false, hasPjnCredentials: false, hasScbaCredentials: false });
			return;
		}

		let cancelled = false;
		Promise.allSettled([pjnCredentialsService.getCredentialsStatus(), scbaCredentialsService.getCredentialsStatus()]).then(
			([pjnResult, scbaResult]) => {
				if (cancelled) return;

				const pjnOk = pjnResult.status === "fulfilled" && !!pjnResult.value?.hasCredentials && !!pjnResult.value?.data?.enabled;
				const scbaOk =
					scbaResult.status === "fulfilled" && !!scbaResult.value?.hasCredentials && !!(scbaResult.value as any)?.data?.enabled;

				setState({ loading: false, hasPjnCredentials: pjnOk, hasScbaCredentials: scbaOk });
			},
		);

		return () => {
			cancelled = true;
		};
	}, [skip]);

	return state;
}

export default OnboardingChecklist;
