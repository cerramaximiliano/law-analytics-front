//AlertFolderDelete.tsx
import { Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";
// assets
import { Trash } from "iconsax-react";
import { dispatch } from "store";
import { deleteFolderById } from "store/reducers/folder";
import { useContext, useEffect } from "react";
import AuthContext from "contexts/ServerContext";

// types
import { PropsAlert } from "types/folders";
// ==============================|| FOLDER - DELETE ||============================== //
export default function AlertFolderDelete({ title, open, handleClose, id, onDelete }: PropsAlert) {
	// Obtener el contexto para verificar errores de restricción
	const authContext = useContext(AuthContext);
	// Verificar si hay un error de restricción del plan para evitar proceder
	const handleClick = () => {
		// Prevenir la eliminación si hay un error reciente de restricción del plan
		if (authContext && authContext.hasPlanRestrictionError) {
			handleClose(false); // Cerrar sin eliminar
			return;
		}

		// Continuar normalmente si no hay restricciones
		handleClose(true);
		if (id) {
			dispatch(deleteFolderById(id));
			// Llamar al callback de eliminación si existe
			if (onDelete) {
				onDelete();
			}
		}
	};

	// Efecto para cerrar automáticamente este modal cuando hay un error de restricción
	useEffect(() => {
		// Cerrar por estado de restricción del plan
		if (open && authContext && authContext.hasPlanRestrictionError) {
			handleClose(false);
		}

		// Manejador para eventos de restricción de plan
		const handlePlanRestriction = () => {
			if (open) {
				handleClose(false);
			}
		};

		// Verificar periódicamente si hay una flag global para cerrar modales
		const checkGlobalFlag = () => {
			if ((window as any).FORCE_CLOSE_ALL_MODALS && open) {
				handleClose(false);
			}
		};

		// Agregar listener para el evento
		window.addEventListener("planRestrictionError", handlePlanRestriction);

		// Configurar intervalo para verificar la flag global
		const intervalId = setInterval(checkGlobalFlag, 200);

		// Limpieza
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
			clearInterval(intervalId);
		};
	}, [open, authContext, handleClose]);
	return (
		<Dialog
			open={open}
			onClose={() => handleClose(false)}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			aria-labelledby="column-delete-title"
			aria-describedby="column-delete-description"
		>
			<DialogContent sx={{ mt: 2, my: 1 }}>
				<Stack alignItems="center" spacing={3.5}>
					<Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
						<Trash variant="Bold" />
					</Avatar>
					<Stack spacing={2}>
						<Typography variant="h4" align="center">
							¿Estás seguro que deseas eliminarlo?
						</Typography>
						<Typography align="center">
							Eliminando el elemento
							<Typography variant="subtitle1" component="span">
								{" "}
								"{title}"{" "}
							</Typography>
							no podrás luego recuperar sus datos.
						</Typography>
					</Stack>

					<Stack direction="row" spacing={2} sx={{ width: 1 }}>
						<Button fullWidth onClick={() => handleClose(false)} color="secondary" variant="outlined">
							Cancelar
						</Button>
						<Button
							fullWidth
							color="error"
							variant="contained"
							onClick={() => {
								handleClick();
							}}
							autoFocus
						>
							Eliminar
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
