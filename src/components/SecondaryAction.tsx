import { ReactNode } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Avatar, ButtonBase, Link, Tooltip } from "@mui/material";

// ==============================|| CARD - SECONDARY ACTION ||============================== //

interface Props {
	title?: string;
	link?: string;
	icon?: ReactNode | string;
}

const CardSecondaryAction = ({ title, link, icon }: Props) => {
	const theme = useTheme();

	return (
		<Tooltip title={title || "Reference"} placement="left">
			<ButtonBase>
				{!icon && (
					<Avatar
						component={Link}
						href={link}
						target="_blank"
						alt="MUI Logo"
						sx={{
							width: 28,
							height: 28,
							bgcolor: "transparent",
							border: `2px solid ${theme.palette.primary.light}`,
						}}
					>
						<svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clipPath="url(#clip0)">
								<path d="M100 260.9V131L212.5 195.95V239.25L137.5 195.95V282.55L100 260.9Z" fill={theme.palette.primary.dark} />
								<path
									d="M212.5 195.95L325 131V260.9L250 304.2L212.5 282.55L287.5 239.25V195.95L212.5 239.25V195.95Z"
									fill={theme.palette.primary.main}
								/>
								<path d="M212.5 282.55V325.85L287.5 369.15V325.85L212.5 282.55Z" fill={theme.palette.primary.dark} />
								<path
									d="M287.5 369.15L400 304.2V217.6L362.5 239.25V282.55L287.5 325.85V369.15ZM362.5 195.95V152.65L400 131V174.3L362.5 195.95Z"
									fill={theme.palette.primary.main}
								/>
							</g>
							<defs>
								<clipPath id="clip0">
									<rect width="300" height="238.3" fill="white" transform="translate(100 131)" />
								</clipPath>
							</defs>
						</svg>
					</Avatar>
				)}
				{icon && (
					<Avatar
						component={Link}
						href={link}
						target="_blank"
						sx={{
							width: 28,
							height: 28,
							bgcolor: "transparent",
							border: `2px solid ${theme.palette.primary.light}`,
						}}
					>
						{icon}
					</Avatar>
				)}
			</ButtonBase>
		</Tooltip>
	);
};

export default CardSecondaryAction;
