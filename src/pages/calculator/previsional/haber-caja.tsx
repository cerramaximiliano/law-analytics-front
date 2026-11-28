import React, { SyntheticEvent, useCallback, useEffect, useState } from "react";
// material-ui
import { Box, Button, Grid, Skeleton, Stack, Tab, Tabs } from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";

// project-imports
import MainCard from "components/MainCard";
import DowngradeGracePeriodAlert from "components/DowngradeGracePeriodAlert";
import HaberCajaCalculadora from "./components/HaberCajaCalculadora";
import SavedHaberCaja from "./components/SavedHaberCaja";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { getCalculatorsByUserId } from "store/reducers/calculator";
import { esHaberCajaGuardado } from "sections/forms/wizard/calc-previsional/haber-caja/formModel/valoresDesdeGuardado";

// assets
import { ArrowLeft, Calculator, DocumentCloud } from "iconsax-react";

// ==============================|| HABER DE CAJA (Ley 24.241) ||============================== //

function HaberCajaLayout() {
	const [pestana, setPestana] = useState(0);
	// Cada cálculo nuevo o reabierto monta el formulario de cero
	const [version, setVersion] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const user = useSelector((state: any) => state.auth?.user);
	const id = user?._id || user?.id;
	const { calculators, isInitialized, lastFetchedUserId } = useSelector((state: any) => state.calculator);

	const folderParam = searchParams.get("folder");
	const editParam = searchParams.get("edit");
	const carpeta = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

	// Haber de caja guardado que se reabre (`?edit=<id>`): se busca en el store y, si el listado no está cargado, se pide
	const enEdicion = editParam ? calculators.find((c: any) => c._id === editParam && esHaberCajaGuardado(c)) || null : null;
	const cargadas = isInitialized && lastFetchedUserId === id;

	const actualizarParams = useCallback(
		(cambios: { folder?: string | null; edit?: string | null }) => {
			const next = new URLSearchParams(searchParams);
			(["folder", "edit"] as const).forEach((k) => {
				if (!(k in cambios)) return;
				const v = cambios[k];
				if (v) next.set(k, v);
				else next.delete(k);
			});
			setSearchParams(next, { replace: true });
		},
		[searchParams, setSearchParams],
	);
	const salirEdicion = useCallback(() => {
		actualizarParams({ edit: null });
		setVersion((v) => v + 1);
	}, [actualizarParams]);
	const alGuardarEdicion = useCallback(() => {
		actualizarParams({ edit: null });
		setVersion((v) => v + 1);
		setPestana(1);
	}, [actualizarParams]);

	useEffect(() => {
		if (id && folderParam) dispatch(getFoldersByUserId(id));
	}, [id, folderParam]);

	// Con `?edit=` siempre se muestra el formulario, y se carga el listado si hace falta
	useEffect(() => {
		if (!editParam) return;
		setPestana(0);
		if (id && !cargadas) dispatch(getCalculatorsByUserId(id));
	}, [editParam, id, cargadas]);

	// Listado cargado y el id no existe (borrado, de otro usuario o no es un haber de caja): se avisa y se sale de la edición
	useEffect(() => {
		if (editParam && cargadas && !enEdicion) {
			enqueueSnackbar("No se encontró el haber de caja guardado que querés editar", { variant: "warning" });
			actualizarParams({ edit: null });
		}
	}, [editParam, cargadas, enEdicion, actualizarParams]);

	return (
		<>
			<DowngradeGracePeriodAlert />
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<MainCard
						title="Haber de caja"
						secondary={
							<Button component={RouterLink} to="/apps/calc/previsional" size="small" startIcon={<ArrowLeft size={16} />}>
								Calculadora previsional
							</Button>
						}
					>
						<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
							<Tabs value={pestana} onChange={(_e: SyntheticEvent, v: number) => setPestana(v)} aria-label="haber de caja">
								<Tab label="Calcular" icon={<Calculator />} iconPosition="start" />
								<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" />
							</Tabs>
						</Box>
						{/* El formulario queda montado al mirar los guardados: no se pierde lo cargado */}
						<Box hidden={pestana !== 0}>
							{editParam && !enEdicion ? (
								<Stack spacing={2}>
									<Skeleton variant="rounded" height={48} />
									<Skeleton variant="rounded" height={200} />
								</Stack>
							) : (
								<HaberCajaCalculadora
									key={`${enEdicion?._id || "nuevo"}-${version}`}
									folder={carpeta}
									onFolderChange={(folderId) => actualizarParams({ folder: folderId })}
									calculadoraEnEdicion={enEdicion}
									onSalirEdicion={salirEdicion}
									onGuardado={alGuardarEdicion}
								/>
							)}
						</Box>
						{pestana === 1 && <SavedHaberCaja />}
					</MainCard>
				</Grid>
			</Grid>
		</>
	);
}

export default HaberCajaLayout;
