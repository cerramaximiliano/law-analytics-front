import React, { useState } from "react";
import {
	Box,
	Stack,
	TextField,
	Typography,
	Rating,
	Checkbox,
	FormControlLabel,
	Button,
	Alert,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Collapse,
	Divider,
	InputAdornment,
} from "@mui/material";
import { Edit2 } from "iconsax-react";
import { FeedbackType } from "api/feedback";

const TYPE_LABEL: Record<FeedbackType, string> = {
	comment: "Comentario general",
	suggestion: "Sugerencia",
	bug: "Reporte de bug",
	rating: "Valoración",
	nps: "NPS",
	survey_response: "Respuesta de encuesta",
};

export interface FeedbackFormValues {
	type: FeedbackType;
	title: string;
	content: string;
	rating: number | null;
	allowPublish: boolean;
	displayName: string;
	allowContact: boolean;
	submittedAs?: { name: string; email: string };
}

interface FeedbackFormProps {
	allowedTypes?: FeedbackType[];
	defaultType?: FeedbackType;
	showRating?: boolean;
	showTitle?: boolean;
	showConsent?: boolean;
	requireSubmittedAs?: boolean; // true en flow público
	submitting?: boolean;
	onSubmit: (values: FeedbackFormValues) => void | Promise<void>;
	onCancel?: () => void;
	helperText?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
	allowedTypes = ["comment", "suggestion", "bug", "rating"],
	defaultType = "comment",
	showRating = true,
	showTitle = true,
	showConsent = true,
	requireSubmittedAs = false,
	submitting = false,
	onSubmit,
	onCancel,
	helperText,
}) => {
	const [type, setType] = useState<FeedbackType>(defaultType);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [rating, setRating] = useState<number | null>(null);
	const [allowPublish, setAllowPublish] = useState(false);
	const [displayName, setDisplayName] = useState("");
	const [allowContact, setAllowContact] = useState(true);
	const [authorName, setAuthorName] = useState("");
	const [authorEmail, setAuthorEmail] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		setError(null);
		if (!content.trim() && rating === null) {
			setError("Dejanos un comentario o una valoración");
			return;
		}
		if (requireSubmittedAs && !authorName.trim()) {
			setError("Tu nombre es obligatorio");
			return;
		}
		if (allowPublish && !displayName.trim() && !requireSubmittedAs) {
			// Si publica, sugerimos nombre para firma — pero no es bloqueante
		}
		await onSubmit({
			type,
			title: title.trim(),
			content: content.trim(),
			rating,
			allowPublish,
			displayName: displayName.trim() || (requireSubmittedAs ? authorName.trim() : ""),
			allowContact,
			submittedAs: requireSubmittedAs ? { name: authorName.trim(), email: authorEmail.trim() } : undefined,
		});
	};

	return (
		<Stack spacing={2}>
			{helperText && (
				<Alert severity="info" variant="outlined">
					{helperText}
				</Alert>
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

			{allowedTypes.length > 1 && (
				<FormControl size="small" fullWidth>
					<InputLabel>Tipo</InputLabel>
					<Select value={type} label="Tipo" onChange={(e) => setType(e.target.value as FeedbackType)}>
						{allowedTypes.map((t) => (
							<MenuItem key={t} value={t}>
								{TYPE_LABEL[t]}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			)}

			{showTitle && (
				<TextField
					label="Título (opcional)"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					fullWidth
					size="small"
					inputProps={{ maxLength: 200 }}
				/>
			)}

			<TextField
				label="Tu comentario"
				value={content}
				onChange={(e) => setContent(e.target.value)}
				fullWidth
				multiline
				rows={5}
				placeholder="Contanos qué pensás..."
				inputProps={{ maxLength: 5000 }}
				helperText={`${content.length}/5000`}
			/>

			{showRating && (
				<Box>
					<Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
						Valoración (opcional)
					</Typography>
					<Rating value={rating} onChange={(_, v) => setRating(v)} size="large" precision={1} max={5} />
				</Box>
			)}

			{showConsent && (
				<Box>
					<FormControlLabel
						control={<Checkbox checked={allowPublish} onChange={(e) => setAllowPublish(e.target.checked)} />}
						label={<Typography variant="body2">Acepto que este comentario pueda ser publicado en la web como testimonio</Typography>}
					/>
					<Collapse in={allowPublish} timeout={350} unmountOnExit>
						<TextField
							label="¿Cómo querés firmar?"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							fullWidth
							size="small"
							placeholder="Ej: Juan P. — Abogado"
							helperText="Si lo dejás vacío, usamos tu nombre"
							sx={{ mt: 1.5, mb: 0.5 }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Edit2 size={16} />
									</InputAdornment>
								),
							}}
						/>
					</Collapse>
					<FormControlLabel
						control={<Checkbox checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)} />}
						label={<Typography variant="body2">Pueden contactarme si necesitan más detalle</Typography>}
					/>
				</Box>
			)}

			{error && <Alert severity="error">{error}</Alert>}

			<Divider sx={{ mt: 1 }} />
			<Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
				{onCancel && (
					<Button onClick={onCancel} color="error" disabled={submitting}>
						Cancelar
					</Button>
				)}
				<Button variant="contained" onClick={handleSubmit} disabled={submitting}>
					{submitting ? "Enviando..." : "Enviar"}
				</Button>
			</Stack>
		</Stack>
	);
};

export default FeedbackForm;
