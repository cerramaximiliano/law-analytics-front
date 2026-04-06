import React from "react";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";

interface AiSparklesIconProps extends Omit<SvgIconProps, "fontSize"> {
	/** Pixel size shorthand — maps to sx.fontSize. */
	size?: number;
	/** Enable the subtle twinkle animation on the small sparks. Default: true. */
	animated?: boolean;
}

const AI_COLOR = "#9c27b0";

/**
 * Sparkles icon — the universal "AI" symbol (ChatGPT, GitHub Copilot, Notion AI,
 * Google Gemini, Claude/Anthropic). The two small crosses animate with a subtle
 * alternating twinkle to signal "AI is active".
 */
const AiSparklesIcon = ({ size, animated = true, sx, ...props }: AiSparklesIconProps) => (
	<SvgIcon
		viewBox="0 0 24 24"
		sx={{
			fill: "none",
			stroke: AI_COLOR,
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			...(size ? { fontSize: size } : {}),
			...(animated && {
				"& .spark-a": {
					transformOrigin: "21px 5px",
					animation: "sparkTwinkle 2.8s ease-in-out infinite",
					"@keyframes sparkTwinkle": {
						"0%, 100%": { opacity: 1, transform: "scale(1)" },
						"50%": { opacity: 0.25, transform: "scale(0.6)" },
					},
				},
				"& .spark-b": {
					transformOrigin: "4px 18px",
					animation: "sparkTwinkle 2.8s ease-in-out infinite",
					animationDelay: "1.4s",
				},
			}),
			...sx,
		}}
		{...props}
	>
		{/* Main star */}
		<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
		{/* Small cross — top right (animates first) */}
		<g className="spark-a">
			<path d="M20 3v4" />
			<path d="M22 5h-4" />
		</g>
		{/* Small cross — bottom left (animates offset by half period) */}
		<g className="spark-b">
			<path d="M4 17v2" />
			<path d="M5 18H3" />
		</g>
	</SvgIcon>
);

export default AiSparklesIcon;
