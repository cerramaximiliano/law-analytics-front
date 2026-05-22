import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";
// material-ui
import { Box, Tab, Tabs, IconButton, Tooltip, Skeleton, Stack, Grid, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { Calculator, DocumentCloud, InfoCircle, DocumentText1 } from "iconsax-react";
import InteresesWizard from "sections/forms/wizard/calc-intereses";
import SavedIntereses from "./components/SavedIntereses";
import { GuideIntereses } from "components/guides";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`intereses-tabpanel-${index}`} aria-labelledby={`intereses-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: { xs: 2.5, sm: 3 } }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `intereses-tab-${index}`,
		"aria-controls": `intereses-tabpanel-${index}`,
	};
}

interface PanelHeaderProps {
	eyebrow: string;
	title: string;
	subtitle: string;
}

const PanelHeader = ({ eyebrow, title, subtitle }: PanelHeaderProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Stack spacing={0.625}>
			<Box
				sx={{
					display: "inline-flex",
					alignSelf: "flex-start",
					alignItems: "center",
					px: 1,
					py: 0.3,
					borderRadius: 0.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
				}}
			>
				<Typography
					sx={{
						fontSize: "0.62rem",
						fontWeight: 600,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						color: BRAND_BLUE,
						lineHeight: 1,
					}}
				>
					{eyebrow}
				</Typography>
			</Box>
			<Typography
				sx={{
					fontSize: { xs: "1.1rem", sm: "1.25rem" },
					fontWeight: 600,
					letterSpacing: "-0.02em",
					lineHeight: 1.2,
					color: "text.primary",
					textWrap: "balance",
				}}
			>
				{title}
			</Typography>
			<Typography
				sx={{
					fontSize: "0.875rem",
					color: "text.secondary",
					lineHeight: 1.5,
					textWrap: "pretty",
				}}
			>
				{subtitle}
			</Typography>
		</Stack>
	);
};

export default function InteresesTabs() {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [value, setValue] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const { id } = useSelector((state: any) => state.auth?.user);
	const [guideOpen, setGuideOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const folderParam = searchParams.get("folder");
	const currentFolder = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

	const handleFolderChange = (newFolderId: string | null) => {
		if (newFolderId) {
			setSearchParams({ folder: newFolderId });
		} else {
			setSearchParams({});
		}
	};

	useEffect(() => {
		if (id && folderParam) {
			dispatch(getFoldersByUserId(id));
		}
	}, [dispatch, id, folderParam]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 150);
		return () => clearTimeout(timer);
	}, []);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderName = value !== 1 && folderParam && currentFolder?.folderName;

	const tabsSx = {
		flex: 1,
		minHeight: 44,
		"& .MuiTabs-indicator": {
			height: 2.5,
			borderRadius: 1,
			bgcolor: BRAND_BLUE,
		},
		"& .MuiTab-root": {
			textTransform: "none",
			fontWeight: 500,
			fontSize: "0.875rem",
			letterSpacing: "-0.005em",
			minHeight: 44,
			py: 1,
			color: "text.secondary",
			transition: "color 0.15s ease, background-color 0.15s ease",
			"&:hover": {
				color: BRAND_BLUE,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.04),
			},
			"&.Mui-selected": {
				color: BRAND_BLUE,
				fontWeight: 600,
			},
		},
		"& .MuiTab-iconWrapper": {
			marginRight: 0.75,
		},
	} as const;

	if (isLoading) {
		return (
			<MainCard>
				<Box sx={{ width: "100%" }}>
					<Box
						sx={{
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							pb: 1,
						}}
					>
						<Stack direction="row" spacing={2}>
							<Skeleton variant="rounded" width={170} height={36} />
							<Skeleton variant="rounded" width={120} height={36} />
						</Stack>
						<Skeleton variant="circular" width={32} height={32} />
					</Box>
					<Box sx={{ pt: 3 }}>
						<Stack spacing={2.5}>
							<Stack spacing={0.625}>
								<Skeleton variant="rounded" width={120} height={20} />
								<Skeleton variant="text" width="55%" height={32} />
								<Skeleton variant="text" width="80%" height={18} />
							</Stack>
							<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1) }} />
							<Grid container spacing={2.5}>
								<Grid item xs={12} md={6}>
									<Stack spacing={1.5}>
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
									</Stack>
								</Grid>
								<Grid item xs={12} md={6}>
									<Stack spacing={1.5}>
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
										<Skeleton variant="text" width="40%" height={20} />
										<Skeleton variant="rounded" height={42} />
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack direction="row" spacing={1.5} justifyContent="flex-end">
										<Skeleton variant="rounded" width={90} height={36} />
										<Skeleton variant="rounded" width={110} height={36} />
									</Stack>
								</Grid>
							</Grid>
						</Stack>
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
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
					}}
				>
					<Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons={false} aria-label="Calculadora de intereses" sx={tabsSx}>
						<Tab label="Cálculo de intereses" icon={<Calculator size={18} variant="Bulk" />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Guardados" icon={<DocumentCloud size={18} variant="Bulk" />} iconPosition="start" {...a11yProps(1)} />
					</Tabs>

					{shouldShowFolderName && (
						<Tooltip title="Carpeta vinculada al cálculo" arrow placement="top">
							<Box
								sx={{
									display: "inline-flex",
									alignItems: "center",
									gap: 0.625,
									px: 1,
									py: 0.4,
									mr: 1,
									borderRadius: 1,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
									maxWidth: { xs: 180, sm: 260 },
								}}
							>
								<DocumentText1 size={14} variant="Bulk" color={BRAND_BLUE} />
								<Typography
									sx={{
										fontSize: "0.74rem",
										fontWeight: 600,
										color: BRAND_BLUE,
										letterSpacing: "-0.005em",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{currentFolder.folderName}
								</Typography>
							</Box>
						</Tooltip>
					)}

					<Tooltip title="Ver guía" arrow placement="top">
						<IconButton
							onClick={() => setGuideOpen(true)}
							size="small"
							sx={{
								color: "text.secondary",
								transition: "background-color 0.15s ease, color 0.15s ease",
								"&:hover": {
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
									color: BRAND_BLUE,
								},
							}}
						>
							<InfoCircle variant="Bulk" size={20} />
						</IconButton>
					</Tooltip>
				</Box>

				<TabPanel value={value} index={0}>
					<Stack spacing={2.5}>
						<PanelHeader
							eyebrow="Intereses"
							title="Liquidación de intereses"
							subtitle="Calculá intereses sobre capital aplicando tasas BCRA, Acta 2601, Acta 2630 y otras."
						/>
						<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1) }} />
						<InteresesWizard folder={currentFolder} onFolderChange={handleFolderChange} />
					</Stack>
				</TabPanel>

				<TabPanel value={value} index={1}>
					<SavedIntereses />
				</TabPanel>
			</Box>
			<GuideIntereses open={guideOpen} onClose={() => setGuideOpen(false)} />
		</MainCard>
	);
}
