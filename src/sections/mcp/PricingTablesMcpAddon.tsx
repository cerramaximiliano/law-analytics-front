/**
 * Sección del add-on "Conectores de IA" en /suscripciones/tables (vista logueada de planes).
 *
 * Reusa McpAddonCard (variant="plans") con la misma regla de visibilidad que el resto de las
 * superficies (isMcpAddonVisible: venta abierta, add-on ya activo, grant o adminBypass) y el
 * mismo flujo de alta/baja/reactivación (useMcpAddonActions dentro de la tarjeta).
 *
 *  - Plan gratuito: "Mejorar mi plan" baja a la grilla de planes de esta misma página.
 *  - Cambio de plan exitoso en la página: `subscriptionKey` cambia y se vuelve a pedir el
 *    estado del add-on (Free → Estándar pasa de "Mejorar mi plan" a "Activar").
 *  - Deep link /suscripciones/tables#conectores-ia.
 */

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";

import McpAddonCard from "sections/mcp/McpAddonCard";
import useMcpAddon from "hooks/useMcpAddon";
import { openSnackbar } from "store/reducers/snackbar";
import { MCP_ADDON_ANCHOR, MCP_ADDON_NAME, isMcpAddonVisible } from "utils/mcpAddonState";

interface Props {
	/** id del contenedor de la grilla de planes, destino del CTA "Mejorar mi plan". */
	gridAnchorId: string;
	/**
	 * Huella del estado de la suscripción en la página (plan, baja programada, cambio
	 * programado). Cuando cambia respecto de un valor previo no nulo, se refresca el add-on.
	 * null mientras la página todavía no cargó la suscripción.
	 */
	subscriptionKey: string | null;
}

const PricingTablesMcpAddon = ({ gridAnchorId, subscriptionKey }: Props) => {
	const dispatch = useDispatch();
	const { hash } = useLocation();
	const { addon, refresh } = useMcpAddon();
	const show = isMcpAddonVisible(addon);

	// Refrescar después de un cambio de plan: solo ante un cambio real (no en la carga inicial).
	const prevKey = useRef<string | null>(subscriptionKey);
	useEffect(() => {
		const prev = prevKey.current;
		prevKey.current = subscriptionKey;
		if (prev === null || subscriptionKey === null || prev === subscriptionKey) return;
		refresh().catch(() => {});
	}, [subscriptionKey, refresh]);

	// Deep link #conectores-ia: bajar a la tarjeta cuando aparece.
	useEffect(() => {
		if (hash !== `#${MCP_ADDON_ANCHOR}` || !show) return;
		const t = setTimeout(() => document.getElementById(MCP_ADDON_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
		return () => clearTimeout(t);
	}, [hash, show]);

	// Plan gratuito → subir a la grilla de planes (ya estás en la página de planes).
	const handleUpgrade = () => {
		const grid = document.getElementById(gridAnchorId);
		if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
		else window.scrollTo({ top: 0, behavior: "smooth" });
		dispatch(
			openSnackbar({
				open: true,
				message: `Elegí un plan Estándar, Pro o Premium para sumar ${MCP_ADDON_NAME}.`,
				variant: "alert",
				alert: { color: "info" },
				close: true,
			}),
		);
	};

	if (!show) return null;

	return (
		<Box id={MCP_ADDON_ANCHOR} data-testid="pricing-tables-mcp-addon" sx={{ mt: { xs: 2, md: 3 }, scrollMarginTop: 96 }}>
			<McpAddonCard variant="plans" location="pricing_tables" onUpgradeClick={handleUpgrade} />
		</Box>
	);
};

export default PricingTablesMcpAddon;
