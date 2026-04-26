import { useState, useEffect } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { Briefcase, Key } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch } from "store";
import { fetchMyCredential } from "store/reducers/seclo";

import SolicitudesTab from "./SolicitudesTab";
import CredencialesTab from "./CredencialesTab";

/**
 * Página principal del módulo SECLO (Audiencias del Ministerio de Trabajo).
 *
 * Estructura:
 *   - Tab "Solicitudes" (default): lista paginada + crear nueva
 *   - Tab "Credenciales":           form único con estado de validación
 *
 * El detalle de cada solicitud vive en su propia ruta:
 *   /herramientas/seclo/solicitudes/:id
 */
export default function SecloPage() {
	const [tab, setTab] = useState(0);

	// Pre-cargar credencial al entrar (necesaria para validar antes de crear solicitudes)
	useEffect(() => {
		dispatch(fetchMyCredential());
	}, []);

	return (
		<MainCard
			title="Audiencias SECLO"
			content={false}
			sx={{ "& .MuiCardHeader-root": { borderBottom: 1, borderColor: "divider" } }}
		>
			<Tabs
				value={tab}
				onChange={(_, v) => setTab(v)}
				sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
				aria-label="Tabs SECLO"
			>
				<Tab icon={<Briefcase size={18} />} iconPosition="start" label="Solicitudes" />
				<Tab icon={<Key size={18} />}       iconPosition="start" label="Credenciales" />
			</Tabs>

			<Box sx={{ p: { xs: 2, sm: 3 } }}>
				{tab === 0 && <SolicitudesTab />}
				{tab === 1 && <CredencialesTab />}
			</Box>
		</MainCard>
	);
}
