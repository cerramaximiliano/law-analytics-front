/**
 * /handoff — aterrizaje del traspaso de sesión desde la app móvil (utils/sessionHandoff.ts).
 *
 * 1. Lee `#t=<token>&next=<ruta>` y borra el fragmento de la barra y del historial enseguida.
 * 2. `POST /api/auth/handoff/redeem` (con cookies): el hub canjea el token de un solo uso y
 *    setea `auth_token` / `refresh_token` / `device_id` como en un login normal.
 * 3. Recarga en `next` (`location.replace`): ServerContext arranca con la cookie y queda logueado.
 * Si falla (vencido, ya usado, cuenta bloqueada) va al login conservando el destino.
 */
import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";

import AuthWrapper from "sections/auth/AuthWrapper";
import Logo from "components/logo";
import axiosInstance from "utils/axios";
import { loginFallbackPath, parseHandoffHash } from "utils/sessionHandoff";

const Handoff = () => {
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const { token, next } = parseHandoffHash(window.location.hash);
		// El token no debe quedar en la barra, el historial ni en un posible Referer.
		window.history.replaceState(null, "", window.location.pathname);

		if (!token) {
			window.location.replace(loginFallbackPath(next));
			return;
		}

		axiosInstance
			.post("/api/auth/handoff/redeem", { token }, { withCredentials: true })
			.then(() => window.location.replace(next))
			.catch(() => {
				setError("El enlace venció o ya se usó. Te llevamos al inicio de sesión.");
				window.setTimeout(() => window.location.replace(loginFallbackPath(next)), 2500);
			});
	}, []);

	return (
		<AuthWrapper>
			<Stack alignItems="center" spacing={3} sx={{ py: 4 }}>
				<Logo to="/" animation="letters" />
				{error ? (
					<Alert severity="warning" sx={{ maxWidth: 420 }}>
						{error}
					</Alert>
				) : (
					<Box textAlign="center">
						<CircularProgress size={32} />
						<Typography variant="body1" sx={{ mt: 2 }}>
							Abriendo tu sesión…
						</Typography>
					</Box>
				)}
			</Stack>
		</AuthWrapper>
	);
};

export default Handoff;
