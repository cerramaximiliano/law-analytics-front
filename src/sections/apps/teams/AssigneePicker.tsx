// sections/apps/teams/AssigneePicker.tsx
// Selector de responsables del equipo (owner, integrantes, previstos e invitados), con avatar y etiqueta.
// Mismo componente que usa el asistente «Repartir carpetas»; extraído el 14/11/2026 para las cards de reglas
// automáticas (Responsables por ubicación actual y Regla de alta).
import { Autocomplete, Avatar, Box, Chip, Stack, TextField, Typography } from "@mui/material";

import { assigneeTag, TeamAssignee } from "utils/teamAssignees";

export default function AssigneePicker({
	options,
	value,
	onChange,
	placeholder,
	size = "medium",
	multiple = true,
	disabled = false,
}: {
	options: TeamAssignee[];
	value: TeamAssignee[];
	onChange: (next: TeamAssignee[]) => void;
	placeholder?: string;
	size?: "small" | "medium";
	multiple?: boolean;
	disabled?: boolean;
}) {
	return (
		<Autocomplete<TeamAssignee, true>
			multiple
			fullWidth
			size={size}
			disabled={disabled}
			options={options}
			value={value}
			onChange={(_e, next) => onChange(multiple ? next : next.slice(-1))}
			isOptionEqualToValue={(o, v) => o.id === v.id}
			getOptionLabel={(o) => o.name}
			filterSelectedOptions
			noOptionsText="No hay integrantes para asignar"
			renderOption={(props, option) => (
				<Box component="li" {...props} key={option.id}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Avatar src={option.avatar} sx={{ width: 24, height: 24, fontSize: "0.62rem", fontWeight: 700 }}>
							{option.initials}
						</Avatar>
						<Typography variant="body2">
							{option.name}
							{option.isOwner ? " · Propietario" : ""}
							{assigneeTag(option) ? ` · ${assigneeTag(option)}` : ""}
						</Typography>
					</Stack>
				</Box>
			)}
			renderTags={(tagValue, getTagProps) =>
				tagValue.map((option, index) => (
					<Chip
						{...getTagProps({ index })}
						key={option.id}
						size="small"
						label={assigneeTag(option) ? `${option.name} (${assigneeTag(option)})` : option.name}
						variant={assigneeTag(option) ? "outlined" : "filled"}
						avatar={
							<Avatar src={option.avatar} sx={{ fontSize: "0.6rem", fontWeight: 700 }}>
								{option.initials}
							</Avatar>
						}
					/>
				))
			}
			renderInput={(params) => <TextField {...params} placeholder={value.length ? "" : placeholder} />}
		/>
	);
}
