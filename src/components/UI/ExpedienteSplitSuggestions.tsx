import { Box, Chip, Typography } from "@mui/material";
import type { ExpedienteSplitSuggestion } from "utils/expedienteInput";

interface ExpedienteSplitSuggestionsProps {
	suggestions: ExpedienteSplitSuggestion[];
	onPick: (suggestion: ExpedienteSplitSuggestion) => void;
}

/**
 * Bloque chico para debajo del campo "Número de expediente" cuando el usuario pegó número y año
 * juntos ("6952015"): ofrece las lecturas plausibles ("695/2015", "69520/2015") como chips.
 * Todo son <span> para poder ir dentro del helperText del TextField (que renderiza un <p>).
 */
const ExpedienteSplitSuggestions = ({ suggestions, onPick }: ExpedienteSplitSuggestionsProps) => {
	if (!suggestions.length) return null;
	return (
		<Box component="span" sx={{ display: "block", mt: 0.25 }}>
			<Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
				Parece número y año juntos. ¿Quisiste decir…?
			</Typography>
			<Box component="span" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
				{suggestions.map((s) => (
					<Chip
						key={`${s.number}/${s.year}`}
						component="span"
						size="small"
						variant="outlined"
						color="primary"
						clickable
						label={`${s.number}/${s.year}`}
						onClick={() => onPick(s)}
					/>
				))}
			</Box>
		</Box>
	);
};

export default ExpedienteSplitSuggestions;
