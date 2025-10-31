import { Dialog, DialogProps } from "@mui/material";
import { FC } from "react";

/**
 * ResponsiveDialog - Wrapper component for Dialog that provides consistent behavior across devices
 *
 * Features:
 * - Maintains consistent sizing across all screen sizes
 * - Uses maxWidth and fullWidth props for responsive behavior
 * - Fully compatible with standard Dialog props
 *
 * Usage:
 * ```tsx
 * <ResponsiveDialog maxWidth="md" open={open} onClose={handleClose}>
 *   <DialogTitle>Title</DialogTitle>
 *   <DialogContent>Content</DialogContent>
 * </ResponsiveDialog>
 * ```
 *
 * @param maxWidth - Maximum width of dialog ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param props - All standard MUI Dialog props are supported
 */
export const ResponsiveDialog: FC<DialogProps> = ({ maxWidth = "md", fullWidth = true, PaperProps, sx, ...props }) => {
	return (
		<Dialog
			{...props}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
			PaperProps={{
				...PaperProps,
				sx: {
					...(PaperProps?.sx || {}),
				},
			}}
			sx={{
				...sx,
			}}
		/>
	);
};

export default ResponsiveDialog;
