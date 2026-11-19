import { ChangeEvent, ReactNode } from "react";
import { CircularProgress, Stack, Switch, Typography } from "@mui/material";

// Fila de preferencia de las integraciones: título y descripción a la izquierda, interruptor (diseño del tema) a la derecha.
const PreferenceRow = ({
	title,
	badge,
	description,
	checked,
	onChange,
	disabled,
	loading,
	children,
}: {
	title: string;
	badge?: ReactNode;
	description: ReactNode;
	checked: boolean;
	onChange: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
	disabled?: boolean;
	loading?: boolean;
	children?: ReactNode;
}) => (
	<Stack direction="row" spacing={2} alignItems="flex-start">
		<Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
			<Stack direction="row" spacing={1} alignItems="center">
				<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary" }}>{title}</Typography>
				{badge}
			</Stack>
			<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", textWrap: "pretty" }}>{description}</Typography>
			{children}
		</Stack>
		<Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.25, flexShrink: 0 }}>
			{loading && <CircularProgress size={16} />}
			<Switch checked={checked} onChange={onChange} disabled={disabled || loading} inputProps={{ "aria-label": title }} />
		</Stack>
	</Stack>
);

export default PreferenceRow;
