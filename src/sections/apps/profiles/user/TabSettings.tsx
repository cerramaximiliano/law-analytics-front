import { useState } from "react";

// material-ui
import {
	Button,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Switch,
	Typography,
	Collapse,
	Box
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Sms, ArrowDown2, ArrowUp2 } from "iconsax-react";

// ==============================|| USER PROFILE - SETTINGS ||============================== //

const TabSettings = () => {
	// Estado para los elementos principales
	const [checked, setChecked] = useState(["oc", "sen", "usn", "lc"]);

	// Estado para los elementos expandidos
	const [expanded, setExpanded] = useState<string[]>([]);

	// Estado para los elementos hijos
	const [childChecked, setChildChecked] = useState<string[]>([
		// Notificaciones de usuario
		"email-calendar",
		"email-expiration",
		"email-inactivity",
		// Notificaciones de sistema
		"system-alerts",
		"system-news",
		"system-user-activity"
	]);

	const handleToggle = (value: string) => () => {
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];

		if (currentIndex === -1) {
			newChecked.push(value);

			// Si se activa un padre, activar todos sus hijos
			if (value === "sen") {
				setChildChecked(prevState => {
					const newState = [...prevState];
					["email-calendar", "email-expiration", "email-inactivity"].forEach(item => {
						if (newState.indexOf(item) === -1) {
							newState.push(item);
						}
					});
					return newState;
				});
			}
			else if (value === "usn") {
				setChildChecked(prevState => {
					const newState = [...prevState];
					["system-alerts", "system-news", "system-user-activity"].forEach(item => {
						if (newState.indexOf(item) === -1) {
							newState.push(item);
						}
					});
					return newState;
				});
			}
		} else {
			newChecked.splice(currentIndex, 1);

			// Si se desactiva un padre, desactivar todos sus hijos
			if (value === "sen") {
				setChildChecked(prevState =>
					prevState.filter(item => !item.startsWith("email-"))
				);
			}
			else if (value === "usn") {
				setChildChecked(prevState =>
					prevState.filter(item => !item.startsWith("system-"))
				);
			}
		}

		setChecked(newChecked);
	};

	const handleChildToggle = (value: string) => () => {
		const currentIndex = childChecked.indexOf(value);
		const newChecked = [...childChecked];

		if (currentIndex === -1) {
			newChecked.push(value);
		} else {
			newChecked.splice(currentIndex, 1);
		}

		setChildChecked(newChecked);
	};

	const handleExpand = (value: string) => () => {
		const currentIndex = expanded.indexOf(value);
		const newExpanded = [...expanded];

		if (currentIndex === -1) {
			newExpanded.push(value);
		} else {
			newExpanded.splice(currentIndex, 1);
		}

		setExpanded(newExpanded);
	};

	const isExpanded = (value: string) => expanded.indexOf(value) !== -1;

	return (
		<MainCard title="Configuración">
			<List sx={{ "& .MuiListItem-root": { p: 2 } }}>


				{/* Notificaciones por correo con opciones desplegables */}
				<ListItem divider sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
					<Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
						<ListItemIcon sx={{ color: "primary.main", mr: 2, display: { xs: "none", sm: "block" } }}>
							<Sms style={{ fontSize: "1.5rem" }} />
						</ListItemIcon>
						<ListItemText
							id="switch-list-label-sen"
							primary={
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									<Typography variant="h5">Notificaciones de usuario</Typography>
									<Box
										sx={{ ml: 1, cursor: 'pointer' }}
										onClick={handleExpand("sen")}
									>
										{isExpanded("sen") ?
											<ArrowUp2 size="16" /> :
											<ArrowDown2 size="16" />
										}
									</Box>
								</Box>
							}
							secondary="Reciba notificaciones por correo electrónico de actividad, vencimientos, calendario"
						/>
						<Switch
							edge="end"
							onChange={handleToggle("sen")}
							checked={checked.indexOf("sen") !== -1}
							inputProps={{
								"aria-labelledby": "switch-list-label-sen",
							}}
						/>
					</Box>

					{/* Opciones desplegables para notificaciones por correo */}
					<Collapse in={isExpanded("sen")} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
						<List component="div" disablePadding>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-email-calendar"
									primary={<Typography variant="body2">Notificar eventos del calendario</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("email-calendar")}
									checked={checked.indexOf("sen") !== -1 && childChecked.indexOf("email-calendar") !== -1}
									disabled={checked.indexOf("sen") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-email-calendar",
									}}
								/>
							</ListItem>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-email-expiration"
									primary={<Typography variant="body2">Notificar vencimientos</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("email-expiration")}
									checked={checked.indexOf("sen") !== -1 && childChecked.indexOf("email-expiration") !== -1}
									disabled={checked.indexOf("sen") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-email-expiration",
									}}
								/>
							</ListItem>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-email-inactivity"
									primary={<Typography variant="body2">Notificar inactividad de causas</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("email-inactivity")}
									checked={checked.indexOf("sen") !== -1 && childChecked.indexOf("email-inactivity") !== -1}
									disabled={checked.indexOf("sen") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-email-inactivity",
									}}
								/>
							</ListItem>
						</List>
					</Collapse>
				</ListItem>

				{/* Notificaciones de sistema con opciones desplegables */}
				<ListItem divider sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
					<Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
						<ListItemIcon sx={{ color: "primary.main", mr: 2, display: { xs: "none", sm: "block" } }}>
							<Sms style={{ fontSize: "1.5rem" }} />
						</ListItemIcon>
						<ListItemText
							id="switch-list-label-usn"
							primary={
								<Box sx={{ display: 'flex', alignItems: 'center' }}>
									<Typography variant="h5">Notificaciones de sistema</Typography>
									<Box
										sx={{ ml: 1, cursor: 'pointer' }}
										onClick={handleExpand("usn")}
									>
										{isExpanded("usn") ?
											<ArrowUp2 size="16" /> :
											<ArrowDown2 size="16" />
										}
									</Box>
								</Box>
							}
							secondary="Reciba notificaciones sobre el sistema y sus actualizaciones"
						/>
						<Switch
							edge="end"
							onChange={handleToggle("usn")}
							checked={checked.indexOf("usn") !== -1}
							inputProps={{
								"aria-labelledby": "switch-list-label-usn",
							}}
						/>
					</Box>

					{/* Opciones desplegables para notificaciones de sistema */}
					<Collapse in={isExpanded("usn")} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
						<List component="div" disablePadding>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-system-alerts"
									primary={<Typography variant="body2">Notificar alertas</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("system-alerts")}
									checked={checked.indexOf("usn") !== -1 && childChecked.indexOf("system-alerts") !== -1}
									disabled={checked.indexOf("usn") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-system-alerts",
									}}
								/>
							</ListItem>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-system-news"
									primary={<Typography variant="body2">Notificar novedades</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("system-news")}
									checked={checked.indexOf("usn") !== -1 && childChecked.indexOf("system-news") !== -1}
									disabled={checked.indexOf("usn") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-system-news",
									}}
								/>
							</ListItem>
							<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
								<ListItemText
									id="switch-list-label-system-user-activity"
									primary={<Typography variant="body2">Notificar actividad de usuarios</Typography>}
									sx={{ my: 0 }}
								/>
								<Switch
									edge="end"
									size="small"
									onChange={handleChildToggle("system-user-activity")}
									checked={checked.indexOf("usn") !== -1 && childChecked.indexOf("system-user-activity") !== -1}
									disabled={checked.indexOf("usn") === -1}
									inputProps={{
										"aria-labelledby": "switch-list-label-system-user-activity",
									}}
								/>
							</ListItem>
						</List>
					</Collapse>
				</ListItem>


			</List>
			<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
				<Button color="error">Cancelar</Button>
				<Button variant="contained">Guardar</Button>
			</Stack>
		</MainCard>
	);
};

export default TabSettings;