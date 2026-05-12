import React, { useState, useEffect } from "react";
import { Fab, Dialog, DialogTitle, DialogContent, Tooltip, Zoom, useTheme } from "@mui/material";
import { MessageQuestion } from "iconsax-react";
import { useLocation } from "react-router-dom";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import FeedbackService from "api/feedback";
import FeedbackForm, { FeedbackFormValues } from "./FeedbackForm";

// Evento global para abrir el dialog desde fuera del widget (ej. menú user)
export const FEEDBACK_OPEN_EVENT = "laFeedback:open";

const FeedbackWidget: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const theme = useTheme();
	const location = useLocation();

	useEffect(() => {
		const handler = () => setOpen(true);
		window.addEventListener(FEEDBACK_OPEN_EVENT, handler);
		return () => window.removeEventListener(FEEDBACK_OPEN_EVENT, handler);
	}, []);

	const handleSubmit = async (values: FeedbackFormValues) => {
		try {
			setSubmitting(true);
			await FeedbackService.create({
				type: values.type,
				title: values.title || null,
				content: values.content,
				rating: values.rating,
				consent: {
					allowPublish: values.allowPublish,
					allowContact: values.allowContact,
					displayName: values.displayName || null,
				},
				context: {
					page: location.pathname,
					feature: "feedback-widget",
				},
			});
			dispatch(
				openSnackbar({
					open: true,
					message: "¡Gracias por tu comentario! Lo revisamos en breve.",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			setOpen(false);
		} catch (e: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: e?.response?.data?.message || "Error al enviar el comentario",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<Zoom in unmountOnExit>
				<Tooltip title="Dejanos tu feedback" placement="left">
					<Fab
						color="primary"
						aria-label="feedback"
						onClick={() => setOpen(true)}
						sx={{
							position: "fixed",
							bottom: { xs: 16, md: 24 },
							right: { xs: 16, md: 24 },
							zIndex: theme.zIndex.speedDial,
						}}
					>
						<MessageQuestion size={24} variant="Bold" />
					</Fab>
				</Tooltip>
			</Zoom>

			<Dialog open={open} onClose={() => !submitting && setOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Dejanos tu opinión</DialogTitle>
				<DialogContent dividers>
					<FeedbackForm
						helperText="Tu comentario nos ayuda a mejorar. Si te parece, podemos publicarlo como testimonio en la web."
						submitting={submitting}
						onSubmit={handleSubmit}
						onCancel={() => setOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default FeedbackWidget;
