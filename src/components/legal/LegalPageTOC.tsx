import React, { useState, useEffect, useCallback } from "react";
// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Paper,
	Typography,
	List,
	ListItemButton,
	ListItemText,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useMediaQuery,
} from "@mui/material";
import { ArrowDown2 } from "iconsax-react";

// ==============================|| LEGAL PAGE TOC ||============================== //

export interface TocItem {
	id: string;
	label: string;
}

export interface LegalPageTOCProps {
	items: TocItem[];
	ariaLabel?: string;
	/** Optional override: called with the item id instead of the default scrollIntoView behaviour */
	onItemClick?: (id: string) => void;
	/** Externally-controlled active item id (overrides IntersectionObserver tracking) */
	activeItemId?: string;
}

export const LegalPageTOC = ({ items, ariaLabel = "Índice de contenido", onItemClick, activeItemId }: LegalPageTOCProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [activeId, setActiveId] = useState<string>("");

	// IntersectionObserver to track which section is currently visible
	// Only runs when no external activeItemId is provided
	useEffect(() => {
		if (items.length === 0 || activeItemId !== undefined) return;

		const observerOptions: IntersectionObserverInit = {
			root: null,
			rootMargin: "-20% 0px -70% 0px",
			threshold: 0,
		};

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					setActiveId(entry.target.id);
					break;
				}
			}
		}, observerOptions);

		const elements = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];

		elements.forEach((el) => observer.observe(el));

		return () => {
			elements.forEach((el) => observer.unobserve(el));
		};
	}, [items, activeItemId]);

	const handleClick = useCallback(
		(id: string) => {
			if (onItemClick) {
				onItemClick(id);
				return;
			}
			const el = document.getElementById(id);
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		},
		[onItemClick],
	);

	const tocList = (
		<List disablePadding dense>
			{items.map((item) => {
				const isActive = activeItemId !== undefined ? activeItemId === item.id : activeId === item.id;
				return (
					<ListItemButton
						key={item.id}
						onClick={() => handleClick(item.id)}
						selected={isActive}
						sx={{
							borderRadius: 1,
							mb: 0.5,
							py: 0.75,
							px: 1.5,
							color: isActive ? "primary.main" : "text.secondary",
							borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
							transition: "all 0.2s ease",
							"&.Mui-selected": {
								backgroundColor: `${theme.palette.primary.main}14`,
								"&:hover": {
									backgroundColor: `${theme.palette.primary.main}1f`,
								},
							},
							"&:hover": {
								color: "primary.main",
							},
						}}
					>
						<ListItemText
							primary={item.label}
							primaryTypographyProps={{
								variant: "body2",
								fontWeight: isActive ? 600 : 400,
								lineHeight: 1.4,
							}}
						/>
					</ListItemButton>
				);
			})}
		</List>
	);

	// Mobile: collapsible Accordion
	if (isMobile) {
		return (
			<Accordion
				disableGutters
				elevation={0}
				sx={{
					mb: 3,
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 1,
					"&:before": { display: "none" },
				}}
			>
				<AccordionSummary
					expandIcon={<ArrowDown2 size={18} />}
					aria-label={ariaLabel}
					sx={{
						px: 2,
						minHeight: 48,
						"& .MuiAccordionSummary-content": { my: 0 },
					}}
				>
					<Typography variant="subtitle2" fontWeight={600}>
						Contenido
					</Typography>
				</AccordionSummary>
				<AccordionDetails sx={{ pt: 0, pb: 1, px: 1 }}>{tocList}</AccordionDetails>
			</Accordion>
		);
	}

	// Desktop: sticky sidebar
	return (
		<Box
			component="nav"
			aria-label={ariaLabel}
			sx={{
				position: "sticky",
				top: 88,
				maxHeight: "calc(100vh - 120px)",
				overflowY: "auto",
				pr: 1,
			}}
		>
			<Paper
				variant="outlined"
				sx={{
					p: 2,
					borderRadius: 2,
					backgroundColor: theme.palette.background.paper,
				}}
			>
				<Typography
					variant="subtitle2"
					fontWeight={700}
					sx={{
						mb: 1.5,
						pb: 1,
						borderBottom: `1px solid ${theme.palette.divider}`,
						color: "text.primary",
						letterSpacing: "0.02em",
						textTransform: "uppercase",
						fontSize: "0.7rem",
					}}
				>
					Contenido
				</Typography>
				{tocList}
			</Paper>
		</Box>
	);
};

export default LegalPageTOC;
