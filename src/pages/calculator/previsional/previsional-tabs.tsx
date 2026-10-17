import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect, useCallback } from "react";

// material-ui
import { Box, Tab, Tabs, Skeleton, Stack, Grid, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import SavedPrevisional from "./components/SavedPrevisional";
import PrevisionalRetroactivoWizard from "sections/forms/wizard/calc-previsional/retroactivo";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { getCalculatorsByUserId } from "store/reducers/calculator";

// assets
import { Calculator, DocumentCloud } from "iconsax-react";

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`previsional-tabpanel-${index}`}
			aria-labelledby={`previsional-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `previsional-tab-${index}`,
		"aria-controls": `previsional-tabpanel-${index}`,
	};
}

// ==============================|| PREVISIONAL TABS ||============================== //

export default function PrevisionalTabs() {
	const [value, setValue] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const user = useSelector((state: any) => state.auth?.user);
	const id = user?._id || user?.id;
	const { calculators, isInitialized, lastFetchedUserId } = useSelector((state: any) => state.calculator);
	const [isLoading, setIsLoading] = useState(true);

	const folderParam = searchParams.get("folder");
	const editParam = searchParams.get("edit");
	const currentFolder = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

	// Cálculo guardado que se reabre para editar (`?edit=<id>`): se busca en el store y, si el
	// listado del usuario todavía no está cargado, se pide.
	const calculadoraEnEdicion = editParam ? calculators.find((c: any) => c._id === editParam) || null : null;
	const calculadorasCargadas = isInitialized && lastFetchedUserId === id;

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

	const handleFolderChange = (newFolderId: string | null) => {
		actualizarParams({ folder: newFolderId });
	};

	const salirEdicion = useCallback(() => actualizarParams({ edit: null }), [actualizarParams]);

	const handleGuardadoEdicion = useCallback(() => {
		actualizarParams({ edit: null });
		setValue(1);
	}, [actualizarParams]);

	useEffect(() => {
		if (id && folderParam) {
			dispatch(getFoldersByUserId(id));
		}
	}, [id, folderParam]);

	// Con `?edit=` siempre se muestra el wizard, y se carga el listado si hace falta
	useEffect(() => {
		if (!editParam) return;
		setValue(0);
		if (id && !calculadorasCargadas) {
			dispatch(getCalculatorsByUserId(id));
		}
	}, [editParam, id, calculadorasCargadas]);

	// Listado cargado y el id no existe (borrado o de otro usuario): se avisa y se sale de la edición
	useEffect(() => {
		if (editParam && calculadorasCargadas && !calculadoraEnEdicion) {
			enqueueSnackbar("No se encontró el cálculo guardado que querés editar", { variant: "warning" });
			salirEdicion();
		}
	}, [editParam, calculadorasCargadas, calculadoraEnEdicion, salirEdicion]);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 150);
		return () => clearTimeout(timer);
	}, []);

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderName = value !== 1 && folderParam && currentFolder?.folderName;

	if (isLoading) {
		return (
			<MainCard>
				<Box sx={{ width: "100%" }}>
					<Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
							<Skeleton variant="rounded" width={160} height={42} />
							<Skeleton variant="rounded" width={140} height={42} />
						</Stack>
					</Box>
					<Box sx={{ pt: 2 }}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									{[1, 2, 3].map((i) => (
										<React.Fragment key={i}>
											<Skeleton variant="text" width="40%" height={24} />
											<Skeleton variant="rounded" height={56} />
										</React.Fragment>
									))}
								</Stack>
							</Grid>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									{[1, 2, 3].map((i) => (
										<React.Fragment key={i}>
											<Skeleton variant="text" width="40%" height={24} />
											<Skeleton variant="rounded" height={56} />
										</React.Fragment>
									))}
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack direction="row" spacing={2} justifyContent="flex-end">
									<Skeleton variant="rounded" width={100} height={36} />
									<Skeleton variant="rounded" width={100} height={36} />
								</Stack>
							</Grid>
						</Grid>
					</Box>
				</Box>
			</MainCard>
		);
	}

	return (
		<MainCard>
			<Box sx={{ width: "100%" }}>
				<Box
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Tabs
						value={value}
						onChange={handleChange}
						variant="scrollable"
						scrollButtons="auto"
						aria-label="previsional tabs"
						sx={{ flex: 1 }}
					>
						<Tab label="Retroactivo" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(1)} />
					</Tabs>
					{shouldShowFolderName && (
						<Typography variant="subtitle1" sx={{ ml: 2, mr: 2, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
							<DocumentCloud size={20} />
							{currentFolder.folderName}
						</Typography>
					)}
				</Box>

				<TabPanel value={value} index={0}>
					{editParam && !calculadoraEnEdicion ? (
						<Stack spacing={2}>
							<Skeleton variant="rounded" height={48} />
							<Skeleton variant="rounded" height={200} />
						</Stack>
					) : (
						<PrevisionalRetroactivoWizard
							key={calculadoraEnEdicion?._id || "nuevo"}
							folder={currentFolder}
							onFolderChange={handleFolderChange}
							calculadoraEnEdicion={calculadoraEnEdicion}
							onSalirEdicion={salirEdicion}
							onGuardado={handleGuardadoEdicion}
						/>
					)}
				</TabPanel>

				<TabPanel value={value} index={1}>
					<SavedPrevisional />
				</TabPanel>
			</Box>
		</MainCard>
	);
}
