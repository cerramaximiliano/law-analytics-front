import React, { ReactNode } from "react";
import { Box } from "@mui/material";
import { useSectionTracking } from "hooks/useLandingAnalytics";

interface SectionTrackerProps {
	sectionName: string;
	children: ReactNode;
	threshold?: number;
	onVisible?: () => void;
}

/**
 * Wrapper component that tracks when a section becomes visible
 * Uses Intersection Observer for efficient scroll tracking
 */
const SectionTracker: React.FC<SectionTrackerProps> = ({ sectionName, children, threshold = 0.3, onVisible }) => {
	const sectionRef = useSectionTracking(sectionName, threshold);

	return (
		<Box ref={sectionRef} component="section" data-section={sectionName}>
			{children}
		</Box>
	);
};

export default SectionTracker;
