import React from "react";
import { Button, ButtonProps, useTheme, useMediaQuery, Tooltip } from "@mui/material";

interface ResponsiveButtonProps extends ButtonProps {
	mobileText?: string;
	desktopText?: string;
	mobileIcon?: React.ReactNode;
	tooltip?: string;
	hideTextOnMobile?: boolean;
	hideTextOnTablet?: boolean;
}

/**
 * Responsive button component that adapts text and layout based on screen size
 *
 * @param mobileText - Text to show on mobile devices (optional, defaults to shorter version)
 * @param desktopText - Text to show on desktop (optional, defaults to children)
 * @param mobileIcon - Icon to show on mobile when text is hidden
 * @param tooltip - Tooltip text for mobile when text is hidden
 * @param hideTextOnMobile - Hide text completely on mobile, show only icon
 * @param hideTextOnTablet - Hide text on tablets too
 */
const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
	children,
	mobileText,
	desktopText,
	mobileIcon,
	tooltip,
	hideTextOnMobile = false,
	hideTextOnTablet = false,
	startIcon,
	fullWidth,
	...props
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));

	// Determine what text to show
	const getText = () => {
		if (isMobile && hideTextOnMobile) return null;
		if (isTablet && hideTextOnTablet) return null;
		if (isMobile && mobileText) return mobileText;
		if (desktopText && !isMobile) return desktopText;
		return children;
	};

	// Determine icon
	const getIcon = () => {
		if (isMobile && hideTextOnMobile && mobileIcon) return mobileIcon;
		return startIcon;
	};

	// Button content
	const buttonContent = (
		<Button
			{...props}
			startIcon={getIcon()}
			fullWidth={isMobile ? true : fullWidth}
			sx={{
				minWidth: isMobile && hideTextOnMobile ? "auto" : undefined,
				px: isMobile && hideTextOnMobile ? 1.5 : undefined,
				...props.sx,
			}}
		>
			{getText()}
		</Button>
	);

	// Wrap with tooltip if needed
	if (isMobile && hideTextOnMobile && tooltip) {
		return <Tooltip title={tooltip}>{buttonContent}</Tooltip>;
	}

	return buttonContent;
};

export default ResponsiveButton;
