import React, { useState } from "react";
import {
	Box,
	Stack,
	TextField,
	Typography,
	Rating,
	Radio,
	RadioGroup,
	FormControl,
	FormControlLabel,
	Checkbox,
	FormGroup,
	Slider,
	Button,
	Alert,
	Switch,
} from "@mui/material";
import { Survey, SurveyQuestion } from "api/surveys";
import { FeedbackAnswer, FeedbackConsent } from "api/feedback";

type AnswerMap = Record<string, Partial<FeedbackAnswer>>;

export interface SurveyAnswerValues {
	answers: FeedbackAnswer[];
	consent: FeedbackConsent;
	submittedAs?: { name: string; email: string };
}

interface Props {
	survey: Survey;
	submitting?: boolean;
	requireSubmittedAs?: boolean; // true en flow público de invite
	showConsent?: boolean;
	onSubmit: (values: SurveyAnswerValues) => void | Promise<void>;
	onCancel?: () => void;
}

const SurveyAnswerForm: React.FC<Props> = ({
	survey,
	submitting = false,
	requireSubmittedAs = false,
	showConsent = true,
	onSubmit,
	onCancel,
}) => {
	const [answers, setAnswers] = useState<AnswerMap>({});
	const [allowPublish, setAllowPublish] = useState(false);
	const [allowContact, setAllowContact] = useState(true);
	const [authorName, setAuthorName] = useState("");
	const [authorEmail, setAuthorEmail] = useState("");
	const [error, setError] = useState<string | null>(null);

	const setAnswer = (q: SurveyQuestion, partial: Partial<FeedbackAnswer>) => {
		setAnswers((prev) => ({
			...prev,
			[q.id]: {
				questionId: q.id,
				valueType: mapValueType(q.type),
				...prev[q.id],
				...partial,
			},
		}));
	};

	function mapValueType(qType: SurveyQuestion["type"]): FeedbackAnswer["valueType"] {
		if (qType === "rating") return "rating";
		if (qType === "scale") return "scale";
		if (qType === "single_choice") return "single_choice";
		if (qType === "multi_choice") return "multi_choice";
		if (qType === "boolean") return "boolean";
		return "text";
	}

	const handleSubmit = async () => {
		setError(null);
		// Validar required
		for (const q of survey.questions) {
			if (!q.required) continue;
			const a = answers[q.id];
			const empty =
				!a ||
				(q.type === "text" && (!a.valueText || !a.valueText.trim())) ||
				(q.type === "long_text" && (!a.valueText || !a.valueText.trim())) ||
				((q.type === "rating" || q.type === "scale") && (a.valueNumber === null || a.valueNumber === undefined)) ||
				(q.type === "single_choice" && (!a.valueText || !a.valueText.trim())) ||
				(q.type === "multi_choice" && (!a.valueArray || a.valueArray.length === 0)) ||
				(q.type === "boolean" && (a.valueBoolean === null || a.valueBoolean === undefined));
			if (empty) {
				setError(`Falta responder: ${q.question}`);
				return;
			}
		}
		if (requireSubmittedAs && !authorName.trim()) {
			setError("Tu nombre es obligatorio");
			return;
		}

		const finalAnswers: FeedbackAnswer[] = Object.values(answers).map((a) => ({
			questionId: a.questionId!,
			valueType: a.valueType!,
			valueText: a.valueText ?? null,
			valueNumber: a.valueNumber ?? null,
			valueArray: a.valueArray,
			valueBoolean: a.valueBoolean ?? null,
		}));

		await onSubmit({
			answers: finalAnswers,
			consent: {
				allowPublish,
				allowContact,
				displayName: authorName.trim() || null,
			},
			submittedAs: requireSubmittedAs ? { name: authorName.trim(), email: authorEmail.trim() } : undefined,
		});
	};

	return (
		<Stack spacing={3}>
			{survey.description && (
				<Typography variant="body2" color="textSecondary">
					{survey.description}
				</Typography>
			)}

			{requireSubmittedAs && (
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<TextField label="Tu nombre" value={authorName} onChange={(e) => setAuthorName(e.target.value)} fullWidth required size="small" />
					<TextField
						label="Email (opcional)"
						value={authorEmail}
						onChange={(e) => setAuthorEmail(e.target.value)}
						fullWidth
						type="email"
						size="small"
					/>
				</Stack>
			)}

			{survey.questions.map((q, idx) => {
				const a = answers[q.id] || {};
				return (
					<Box key={q.id}>
						<Typography variant="subtitle2" gutterBottom>
							{idx + 1}. {q.question}
							{q.required && (
								<Typography component="span" color="error" sx={{ ml: 0.5 }}>
									*
								</Typography>
							)}
						</Typography>
						{q.description && (
							<Typography variant="caption" color="textSecondary" display="block" gutterBottom>
								{q.description}
							</Typography>
						)}

						{q.type === "text" && (
							<TextField fullWidth size="small" value={a.valueText || ""} onChange={(e) => setAnswer(q, { valueText: e.target.value })} />
						)}

						{q.type === "long_text" && (
							<TextField
								fullWidth
								multiline
								rows={4}
								value={a.valueText || ""}
								onChange={(e) => setAnswer(q, { valueText: e.target.value })}
							/>
						)}

						{q.type === "rating" && (
							<Rating value={a.valueNumber ?? null} onChange={(_, v) => setAnswer(q, { valueNumber: v })} max={q.max ?? 5} size="large" />
						)}

						{q.type === "scale" && (
							<Box sx={{ px: 1 }}>
								<Slider
									value={a.valueNumber ?? q.min ?? 0}
									onChange={(_, v) => setAnswer(q, { valueNumber: v as number })}
									min={q.min ?? 0}
									max={q.max ?? 10}
									step={1}
									marks
									valueLabelDisplay="auto"
								/>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="caption">{q.minLabel || q.min || 0}</Typography>
									<Typography variant="caption">{q.maxLabel || q.max || 10}</Typography>
								</Stack>
							</Box>
						)}

						{q.type === "single_choice" && q.options && (
							<FormControl>
								<RadioGroup value={a.valueText || ""} onChange={(e) => setAnswer(q, { valueText: e.target.value })}>
									{q.options.map((opt) => (
										<FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
									))}
								</RadioGroup>
							</FormControl>
						)}

						{q.type === "multi_choice" && q.options && (
							<FormGroup>
								{q.options.map((opt) => {
									const current = a.valueArray || [];
									const checked = current.includes(opt.value);
									return (
										<FormControlLabel
											key={opt.value}
											control={
												<Checkbox
													size="small"
													checked={checked}
													onChange={() => {
														const next = checked ? current.filter((v) => v !== opt.value) : [...current, opt.value];
														setAnswer(q, { valueArray: next });
													}}
												/>
											}
											label={opt.label}
										/>
									);
								})}
							</FormGroup>
						)}

						{q.type === "boolean" && (
							<FormControlLabel
								control={<Switch checked={!!a.valueBoolean} onChange={(e) => setAnswer(q, { valueBoolean: e.target.checked })} />}
								label={a.valueBoolean ? "Sí" : "No"}
							/>
						)}
					</Box>
				);
			})}

			{showConsent && (
				<Box>
					<FormControlLabel
						control={<Checkbox checked={allowPublish} onChange={(e) => setAllowPublish(e.target.checked)} />}
						label={<Typography variant="body2">Pueden publicar mis respuestas anonimizadas</Typography>}
					/>
					<FormControlLabel
						control={<Checkbox checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)} />}
						label={<Typography variant="body2">Pueden contactarme si necesitan más detalle</Typography>}
					/>
				</Box>
			)}

			{error && <Alert severity="error">{error}</Alert>}

			<Stack direction="row" spacing={1} justifyContent="flex-end">
				{onCancel && (
					<Button onClick={onCancel} disabled={submitting}>
						Cancelar
					</Button>
				)}
				<Button variant="contained" onClick={handleSubmit} disabled={submitting}>
					{submitting ? "Enviando..." : "Enviar respuestas"}
				</Button>
			</Stack>
		</Stack>
	);
};

export default SurveyAnswerForm;
