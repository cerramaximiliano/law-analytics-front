import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Container, Paper, Stack, Typography, Alert, Skeleton, Button, Chip } from "@mui/material";
import { TickCircle, Clock, CloseCircle } from "iconsax-react";
import FeedbackInviteService, { PublicInvite } from "api/feedbackInvite";
import FeedbackForm, { FeedbackFormValues } from "components/feedback/FeedbackForm";
import SurveyAnswerForm, { SurveyAnswerValues } from "components/feedback/SurveyAnswerForm";

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

const FeedbackInvitePage: React.FC = () => {
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

	return (
		<Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
			<Paper variant="outlined" sx={{ p: { xs: 3, md: 5 } }}>
				{loading ? (
					<Stack spacing={2}>
						<Skeleton variant="text" width="60%" height={40} />
						<Skeleton variant="rectangular" height={120} />
						<Skeleton variant="rectangular" height={60} />
					</Stack>
				) : success ? (
					<Stack spacing={3} alignItems="center" textAlign="center">
						<TickCircle size={64} color="#22c55e" variant="Bold" />
						<Typography variant="h4">¡Gracias por tu feedback!</Typography>
						<Typography variant="body1" color="textSecondary">
							Recibimos tu respuesta. Si nos diste consentimiento, vamos a revisarla para publicarla como testimonio.
						</Typography>
						<Button component={RouterLink} to="/" variant="contained">
							Volver al inicio
						</Button>
					</Stack>
				) : error ? (
					<Stack spacing={3} alignItems="center" textAlign="center">
						{error.reason === "expired" ? (
							<Clock size={64} color="#f59e0b" variant="Bold" />
						) : (
							<CloseCircle size={64} color="#ef4444" variant="Bold" />
						)}
						<Typography variant="h5">{error.reason ? ERROR_LABELS[error.reason].title : "Link no válido"}</Typography>
						<Typography variant="body1" color="textSecondary">
							{error.reason ? ERROR_LABELS[error.reason].description : error.message}
						</Typography>
						<Button component={RouterLink} to="/" variant="outlined">
							Ir al inicio
						</Button>
					</Stack>
				) : invite ? (
					<Stack spacing={3}>
						<Box>
							<Chip
								label={invite.type === "survey" ? "Encuesta" : "Comentario"}
								size="small"
								color="primary"
								variant="outlined"
								sx={{ mb: 1 }}
							/>
							<Typography variant="h4" gutterBottom>
								{invite.type === "survey" && invite.survey
									? invite.survey.title
									: invite.recipientName
									? `Hola ${invite.recipientName}, nos encantaría tu opinión`
									: "Dejanos tu opinión"}
							</Typography>
							{invite.message && (
								<Alert severity="info" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
									{invite.message}
								</Alert>
							)}
						</Box>

						{invite.type === "survey" && invite.survey ? (
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
					</Stack>
				) : null}
			</Paper>
		</Container>
	);
};

export default FeedbackInvitePage;
