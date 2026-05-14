import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Stack, Typography, Skeleton, Button, Chip } from "@mui/material";

// third party
import { motion } from "framer-motion";
import { TickCircle, Clock, CloseCircle, QuoteUp, ShieldTick, MessageText1 } from "iconsax-react";

// project imports
import FeedbackInviteService, { PublicInvite } from "api/feedbackInvite";
import FeedbackForm, { FeedbackFormValues } from "components/feedback/FeedbackForm";
import SurveyAnswerForm, { SurveyAnswerValues } from "components/feedback/SurveyAnswerForm";
import MainCard from "components/MainCard";
import SectionEyebrow from "sections/landing/SectionEyebrow";

// ============================== TOKENS ============================== //
// Mismo brand-blue del landing — única familia cromática del flujo público.
const BRAND_BLUE = "#3A7BFF";

type InviteError = {
	message: string;
	reason?: "revoked" | "used" | "expired" | "survey_unavailable";
};

const ERROR_LABELS: Record<NonNullable<InviteError["reason"]>, { title: string; description: string }> = {
	revoked: {
		title: "Link revocado",
		description: "Este link fue cancelado por el equipo. Si necesitás dejar tu feedback, pedinos uno nuevo.",
	},
	used: {
		title: "Link ya usado",
		description: "Este link ya fue utilizado para enviar feedback. Cada invitación solo se puede usar una vez.",
	},
	expired: {
		title: "Link expirado",
		description: "Este link superó su fecha de vencimiento. Pedinos uno nuevo si querés dejar tu opinión.",
	},
	survey_unavailable: {
		title: "Encuesta no disponible",
		description: "La encuesta asociada a este link ya no está disponible.",
	},
};

// ============================== ATMOSPHERE ============================== //
// Dos blobs brand-blue + dot grid neutro — réplica reducida del Hero del landing.

const PageAtmosphere = ({ isDark }: { isDark: boolean }) => {
	const theme = useTheme();
	return (
		<>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: { xs: "-10%", md: "-12%" },
					right: { xs: "-25%", md: "-8%" },
					width: { xs: 360, md: 560 },
					height: { xs: 360, md: 560 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)} 0%, transparent 62%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					bottom: { xs: "-18%", md: "-22%" },
					left: { xs: "-28%", md: "-10%" },
					width: { xs: 400, md: 640 },
					height: { xs: 400, md: 640 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.09 : 0.06)} 0%, transparent 62%)`,
					filter: "blur(90px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.05 : 0.04)} 1px, transparent 1px)`,
					backgroundSize: "26px 26px",
					maskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 75%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
		</>
	);
};

// ============================== STATUS CARD ============================== //
// Card centrada usada para los tres estados terminales: success, error, expired.
// Variante de color tomada por prop — verde solo en success; brand-blue en el resto
// para mantener la regla "un solo acento" del landing.

interface StatusCardProps {
	icon: React.ReactNode;
	accent: string;
	eyebrow: string;
	title: string;
	description: string;
	ctaLabel: string;
}

const StatusCard = ({ icon, accent, eyebrow, title, description, ctaLabel }: StatusCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return (
		<motion.div
			initial={{ opacity: 0, translateY: 30 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "spring", stiffness: 150, damping: 30 }}
		>
			<MainCard
				border={false}
				sx={{
					maxWidth: 540,
					mx: "auto",
					p: { xs: 3.5, md: 5 },
					textAlign: "center",
					bgcolor: alpha(accent, isDark ? 0.08 : 0.05),
					border: `1px solid ${alpha(accent, isDark ? 0.28 : 0.18)}`,
					borderRadius: 3,
				}}
			>
				<Stack spacing={2.5} alignItems="center">
					<Box
						sx={{
							width: 72,
							height: 72,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
							color: accent,
						}}
					>
						{icon}
					</Box>
					<SectionEyebrow label={eyebrow} align="center" mb={0} />
					<Typography
						variant="h3"
						sx={{
							fontSize: { xs: "1.5rem", md: "1.875rem" },
							fontWeight: 600,
							lineHeight: 1.15,
							letterSpacing: "-0.025em",
							textWrap: "balance",
							color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
						}}
					>
						{title}
					</Typography>
					<Typography
						color="text.secondary"
						sx={{
							fontSize: { xs: "0.95rem", md: "1rem" },
							lineHeight: 1.55,
							letterSpacing: "-0.005em",
							textWrap: "pretty",
							maxWidth: 420,
						}}
					>
						{description}
					</Typography>
					<Button
						component={RouterLink}
						to="/"
						variant="contained"
						color="primary"
						size="large"
						sx={{
							mt: 1,
							px: 4,
							py: 1.25,
							borderRadius: 2,
							fontWeight: 600,
							fontSize: "0.9375rem",
							boxShadow: theme.shadows[4],
							transition: "all 0.2s ease-in-out",
							"&:hover": {
								boxShadow: theme.shadows[8],
								transform: "translateY(-2px)",
							},
						}}
					>
						{ctaLabel}
					</Button>
				</Stack>
			</MainCard>
		</motion.div>
	);
};

// ============================== INTRO COLUMN ============================== //
// Columna izquierda — solo md+. Eyebrow + título con span brand-blue + bullets
// con beneficios concretos. Misma estructura tipográfica del hero del landing.

const IntroColumn = ({ invite }: { invite: PublicInvite }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isSurvey = invite.type === "survey";

	const bullets = isSurvey
		? [
				{ icon: <MessageText1 size={18} variant="Bulk" />, label: "Tus respuestas alimentan mejoras concretas del producto." },
				{ icon: <ShieldTick size={18} variant="Bulk" />, label: "No publicamos nada sin tu consentimiento explícito." },
		  ]
		: [
				{ icon: <QuoteUp size={18} variant="Bulk" />, label: "Si nos das permiso, tu comentario puede convertirse en testimonio en el sitio." },
				{ icon: <ShieldTick size={18} variant="Bulk" />, label: "Decidís vos cómo firmar y si querés que te contactemos." },
		  ];

	return (
		<motion.div
			initial={{ opacity: 0, translateY: 24 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "spring", stiffness: 150, damping: 30 }}
		>
			<Stack spacing={3}>
				<SectionEyebrow label={isSurvey ? "Encuesta" : "Comentario"} align="left" mb={0} />
				<Typography
					variant="h1"
					sx={{
						fontSize: { xs: "1.875rem", md: "2.5rem", lg: "2.875rem" },
						fontWeight: 600,
						lineHeight: 1.08,
						letterSpacing: "-0.03em",
						textWrap: "balance",
						color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
					}}
				>
					{invite.recipientName ? (
						<>
							Hola{" "}
							<Box component="span" sx={{ color: BRAND_BLUE }}>
								{invite.recipientName}
							</Box>
							, nos interesa lo que pensás
						</>
					) : (
						<>
							Tu opinión <Box component="span" sx={{ color: BRAND_BLUE }}>cambia</Box> cómo evoluciona Law Analytics
						</>
					)}
				</Typography>
				<Typography
					color="text.secondary"
					sx={{
						fontSize: { xs: "1rem", md: "1.0625rem" },
						lineHeight: 1.55,
						letterSpacing: "-0.005em",
						textWrap: "pretty",
						maxWidth: 460,
					}}
				>
					Cinco minutos de tu tiempo nos ayudan a priorizar lo que realmente importa para tu práctica diaria.
				</Typography>

				<Stack spacing={1.5} sx={{ pt: 1 }}>
					{bullets.map((b, i) => (
						<Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
							<Box
								sx={{
									flexShrink: 0,
									width: 32,
									height: 32,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
									color: BRAND_BLUE,
								}}
							>
								{b.icon}
							</Box>
							<Typography
								sx={{
									fontSize: "0.9375rem",
									lineHeight: 1.5,
									color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
									textWrap: "pretty",
								}}
							>
								{b.label}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Stack>
		</motion.div>
	);
};

// ============================== PAGE ============================== //

const FeedbackInvitePage: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const { token } = useParams<{ token: string }>();
	const [invite, setInvite] = useState<PublicInvite | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<InviteError | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await FeedbackInviteService.validate(token);
				if (cancelled) return;
				setInvite(res.invite);
			} catch (e: any) {
				if (cancelled) return;
				const reason = e?.response?.data?.reason;
				setError({
					message: e?.response?.data?.message || "Link no válido",
					reason,
				});
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [token]);

	const handleSubmitComment = async (values: FeedbackFormValues) => {
		if (!token) return;
		try {
			setSubmitting(true);
			await FeedbackInviteService.submit(token, {
				title: values.title || null,
				content: values.content,
				rating: values.rating,
				submittedAs: values.submittedAs,
				consent: {
					allowPublish: values.allowPublish,
					allowContact: values.allowContact,
					displayName: values.displayName || values.submittedAs?.name || null,
				},
			});
			setSuccess(true);
		} catch (e: any) {
			setError({
				message: e?.response?.data?.message || "Error al enviar feedback",
				reason: e?.response?.data?.reason,
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmitSurvey = async (values: SurveyAnswerValues) => {
		if (!token) return;
		try {
			setSubmitting(true);
			await FeedbackInviteService.submit(token, {
				answers: values.answers,
				submittedAs: values.submittedAs,
				consent: values.consent,
			});
			setSuccess(true);
		} catch (e: any) {
			setError({
				message: e?.response?.data?.message || "Error al enviar respuestas",
				reason: e?.response?.data?.reason,
			});
		} finally {
			setSubmitting(false);
		}
	};

	// Wrapper común — atmósfera + container.
	const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
		<Box
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				minHeight: "100dvh",
				bgcolor: theme.palette.background.default,
				py: { xs: 6, md: 9 },
				display: "flex",
				alignItems: "center",
			}}
		>
			<PageAtmosphere isDark={isDark} />
			<Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, width: "100%" }}>
				{children}
			</Container>
		</Box>
	);

	if (loading) {
		return (
			<Wrapper>
				<Box sx={{ maxWidth: 720, mx: "auto" }}>
					<Stack spacing={3}>
						<Skeleton variant="rounded" width={140} height={28} />
						<Skeleton variant="rounded" width="70%" height={56} />
						<Skeleton variant="rounded" width="90%" height={20} />
						<Skeleton variant="rounded" height={320} sx={{ mt: 2, borderRadius: 3 }} />
					</Stack>
				</Box>
			</Wrapper>
		);
	}

	if (success) {
		return (
			<Wrapper>
				<StatusCard
					icon={<TickCircle size={36} variant="Bulk" />}
					accent={BRAND_BLUE}
					eyebrow="Recibido"
					title="Gracias por compartir tu opinión"
					description="Recibimos tu respuesta. Si nos diste consentimiento, vamos a revisarla para publicarla como testimonio."
					ctaLabel="Volver al inicio"
				/>
			</Wrapper>
		);
	}

	if (error) {
		const isExpired = error.reason === "expired";
		const accent = isExpired ? "#F59E0B" : "#EF4444";
		return (
			<Wrapper>
				<StatusCard
					icon={isExpired ? <Clock size={36} variant="Bulk" /> : <CloseCircle size={36} variant="Bulk" />}
					accent={accent}
					eyebrow={isExpired ? "Caducó" : "No disponible"}
					title={error.reason ? ERROR_LABELS[error.reason].title : "Link no válido"}
					description={error.reason ? ERROR_LABELS[error.reason].description : error.message}
					ctaLabel="Ir al inicio"
				/>
			</Wrapper>
		);
	}

	if (!invite) return null;

	const isSurvey = invite.type === "survey";

	return (
		<Wrapper>
			<Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
				{/* Columna izquierda — intro contextual (md+) */}
				<Grid item xs={12} md={5} lg={5}>
					<IntroColumn invite={invite} />
				</Grid>

				{/* Columna derecha — card con el form */}
				<Grid item xs={12} md={7} lg={7}>
					<motion.div
						initial={{ opacity: 0, translateY: 24 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.1 }}
					>
						<MainCard
							border={false}
							sx={{
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
								borderRadius: 3,
								boxShadow: isDark
									? `0 18px 38px ${alpha(theme.palette.common.black, 0.35)}, 0 6px 14px ${alpha(theme.palette.common.black, 0.25)}`
									: `0 20px 40px ${alpha(BRAND_BLUE, 0.06)}, 0 6px 14px ${alpha(theme.palette.common.black, 0.05)}`,
								overflow: "hidden",
							}}
							content={false}
						>
							{/* Header del card — fondo brand tintado */}
							<Box
								sx={{
									px: { xs: 3, md: 4 },
									pt: { xs: 3, md: 3.5 },
									pb: { xs: 2.5, md: 3 },
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
								}}
							>
								<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
									<Chip
										label={isSurvey ? "Encuesta" : "Comentario"}
										size="small"
										sx={{
											height: 22,
											fontSize: "0.68rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12),
											color: BRAND_BLUE,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
										}}
									/>
									{invite.recipientName && (
										<Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>
											Para {invite.recipientName}
										</Typography>
									)}
								</Stack>

								<Typography
									variant="h4"
									sx={{
										fontSize: { xs: "1.25rem", md: "1.5rem" },
										fontWeight: 600,
										lineHeight: 1.2,
										letterSpacing: "-0.02em",
										textWrap: "balance",
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									{isSurvey && invite.survey
										? invite.survey.title
										: invite.recipientName
										? "Contanos cómo te está yendo"
										: "Dejanos tu opinión"}
								</Typography>

								{invite.message && (
									<Box
										sx={{
											mt: 2,
											p: 1.75,
											borderRadius: 1.5,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.07),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
											display: "flex",
											gap: 1.25,
											alignItems: "flex-start",
										}}
									>
										<Box sx={{ color: BRAND_BLUE, lineHeight: 0, mt: 0.25 }}>
											<QuoteUp size={18} variant="Bulk" />
										</Box>
										<Typography
											sx={{
												fontSize: "0.875rem",
												lineHeight: 1.5,
												letterSpacing: "-0.005em",
												whiteSpace: "pre-wrap",
												color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
											}}
										>
											{invite.message}
										</Typography>
									</Box>
								)}
							</Box>

							{/* Body del card — form */}
							<Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 3.5 } }}>
								{isSurvey && invite.survey ? (
									<SurveyAnswerForm
										survey={{
											...invite.survey,
											status: "active",
											type: "custom",
											allowMultipleResponses: false,
										}}
										submitting={submitting}
										requireSubmittedAs
										onSubmit={handleSubmitSurvey}
									/>
								) : (
									<FeedbackForm
										requireSubmittedAs
										allowedTypes={["comment", "suggestion"]}
										submitting={submitting}
										onSubmit={handleSubmitComment}
										helperText="Tu comentario nos ayuda a mejorar Law Analytics. Si nos das permiso, podemos publicarlo como testimonio."
									/>
								)}
							</Box>
						</MainCard>
					</motion.div>
				</Grid>
			</Grid>
		</Wrapper>
	);
};

export default FeedbackInvitePage;
