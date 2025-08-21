import React from "react";
import { useState, ReactNode, useEffect } from "react";
import { Box, Collapse, IconButton, Stack, Typography, Paper, useTheme, alpha } from "@mui/material";
import { ArrowDown2 } from "iconsax-react";

interface CollapsibleSectionProps {
	title: string;
	children: ReactNode;
	defaultExpanded?: boolean;
	icon?: ReactNode;
	subtitle?: string;
}

const CollapsibleSection = ({ title, children, defaultExpanded = true, icon, subtitle }: CollapsibleSectionProps) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const theme = useTheme();

	useEffect(() => {
		setExpanded(defaultExpanded);
	}, [defaultExpanded]);

	const handleToggle = () => {
		setExpanded(!expanded);
	};

	return (
		<Paper
			elevation={0}
			sx={{
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: 2,
				overflow: "hidden",
				transition: "all 0.3s ease",
				"&:hover": {
					borderColor: theme.palette.primary.main,
					boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
				},
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				onClick={handleToggle}
				sx={{
					cursor: "pointer",
					py: 2,
					px: 3,
					bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.grey[800], 0.5) : alpha(theme.palette.grey[50], 0.5),
					transition: "all 0.2s ease-in-out",
					"&:hover": {
						bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.grey[800], 0.8) : alpha(theme.palette.grey[100], 0.8),
					},
				}}
			>
				<Stack direction="row" spacing={2} alignItems="center">
					{icon && (
						<Box
							sx={{
								color: theme.palette.primary.main,
								display: "flex",
								alignItems: "center",
								opacity: 0.8,
							}}
						>
							{icon}
						</Box>
					)}
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
							{title}
						</Typography>
						{subtitle && (
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
								{subtitle}
							</Typography>
						)}
					</Box>
				</Stack>
				<IconButton
					size="small"
					sx={{
						transition: "all 0.3s ease",
						transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
					}}
				>
					<ArrowDown2 size={20} />
				</IconButton>
			</Stack>
			<Collapse in={expanded} timeout="auto" unmountOnExit>
				<Box sx={{ bgcolor: "background.paper" }}>{children}</Box>
			</Collapse>
		</Paper>
	);
};

export default CollapsibleSection;
