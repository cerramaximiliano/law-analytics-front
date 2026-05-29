import React, { useState, useEffect } from "react";
import {
	Fab,
	Dialog,
	DialogTitle,
	DialogContent,
	Divider,
	Stack,
	Typography,
	Tooltip,
	Zoom,
	useTheme,
} from "@mui/material";
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

			<Dialog
				open={open}
				onClose={() => !submitting && setOpen(false)}
				maxWidth="sm"
				fullWidth
				aria-labelledby="feedback-modal-title"
				PaperProps={{
					elevation: 5,
					sx: {
						borderRadius: 2,
						overflow: "hidden",
					},
				}}
			>
				<DialogTitle
					id="feedback-modal-title"
					sx={{
						bgcolor: theme.palette.primary.lighter,
						p: 3,
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Stack spacing={1}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<MessageQuestion size={24} color={theme.palette.primary.main} variant="Bold" />
							<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
								Dejanos tu opinión
							</Typography>
						</Stack>
						<Typography variant="body2" color="textSecondary">
							Tu comentario nos ayuda a mejorar. Si nos das permiso, podemos publicarlo como testimonio.
						</Typography>
					</Stack>
				</DialogTitle>
				<Divider />

				<DialogContent sx={{ p: 3 }}>
					<FeedbackForm submitting={submitting} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
				</DialogContent>
			</Dialog>
		</>
	);
};

export default FeedbackWidget;
