import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { CloseCircle } from "iconsax-react";
import { useLocation } from "react-router-dom";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import useAuth from "hooks/useAuth";
import SurveyService, { Survey } from "api/surveys";
import SurveyAnswerForm, { SurveyAnswerValues } from "./SurveyAnswerForm";

// Tiempo en ms para no volver a mostrar la misma encuesta tras un dismiss
const SNOOZE_MS = 24 * 60 * 60 * 1000; // 24h

const SNOOZE_KEY = "laFeedback_surveySnooze";

type SnoozeMap = Record<string, number>; // surveyId -> timestamp expiración del snooze

function readSnooze(): SnoozeMap {
	try {
		const raw = localStorage.getItem(SNOOZE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as SnoozeMap;
	} catch {
		return {};
	}
}

function writeSnooze(map: SnoozeMap) {
	try {
		localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
	} catch {
		// ignore
	}
}

const ActiveSurveyModal: React.FC = () => {
	const { isLoggedIn } = useAuth();
	const location = useLocation();
	const [survey, setSurvey] = useState<Survey | null>(null);
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		if (!isLoggedIn || checked) return;
		setChecked(true); // marcar inmediatamente para no chequear en cada navegación
		let cancelled = false;
		(async () => {
			try {
				const res = await SurveyService.getActive();
				if (cancelled) return;
				if (!res.success || !res.surveys || res.surveys.length === 0) return;
				const snooze = readSnooze();
				const now = Date.now();
				const candidate = res.surveys.find((s) => !snooze[s._id] || snooze[s._id] < now);
				if (candidate) {
					setSurvey(candidate);
					setOpen(true);
				}
			} catch {
				// silencioso — encuestas son nice-to-have
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn, checked]);

	const dismissAndSnooze = () => {
		if (survey) {
			const snooze = readSnooze();
			snooze[survey._id] = Date.now() + SNOOZE_MS;
			writeSnooze(snooze);
		}
		setOpen(false);
	};

	const handleSubmit = async (values: SurveyAnswerValues) => {
		if (!survey) return;
		try {
			setSubmitting(true);
			await SurveyService.respond(survey._id, {
				answers: values.answers,
				consent: values.consent,
				context: {
					page: location.pathname,
					feature: `survey-modal:${survey.slug}`,
				},
			});
			dispatch(
				openSnackbar({
					open: true,
					message: "¡Gracias por responder!",
					variant: "alert",
					alert: { color: "success" },
					close: true,
				}),
			);
			// El backend ya bloquea respuestas duplicadas, pero por las dudas tambien snoozear largo
			if (survey) {
				const snooze = readSnooze();
				snooze[survey._id] = Date.now() + 365 * 24 * 60 * 60 * 1000;
				writeSnooze(snooze);
			}
			setOpen(false);
		} catch (e: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: e?.response?.data?.message || "Error al enviar respuestas",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!survey) return null;

	return (
		<Dialog open={open} onClose={(_, reason) => reason !== "backdropClick" && dismissAndSnooze()} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">{survey.title}</Typography>
					<IconButton size="small" onClick={dismissAndSnooze} disabled={submitting}>
						<CloseCircle size={20} />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				<SurveyAnswerForm survey={survey} submitting={submitting} onSubmit={handleSubmit} onCancel={dismissAndSnooze} />
			</DialogContent>
		</Dialog>
	);
};

export default ActiveSurveyModal;
