/**
 * ChatGptLogo — logo oficial del OpenAI "monoblossom" mark.
 *
 * Assets provistos por el usuario (descargados del OpenAI Brand Kit). Viven
 * en src/assets/images/integrations/chatgpt-logo-{black,white}.svg. El
 * componente elige automáticamente la variante según el theme:
 *   - light mode → versión negra
 *   - dark mode  → versión blanca
 *
 * Drop-in con la signature de ClaudeAiLogo / iconsax-react: props
 * `size`, `color`, `variant`. El prop `color` se acepta pero NO altera el
 * logo (el branding viene fijado por la elección black vs white del asset).
 */

import { type HTMLAttributes } from "react";
import { useTheme } from "@mui/material/styles";

import logoBlack from "assets/images/integrations/chatgpt-logo-black.svg";
import logoWhite from "assets/images/integrations/chatgpt-logo-white.svg";

interface ChatGptLogoProps extends Omit<HTMLAttributes<HTMLImageElement>, "color"> {
	size?: number | string;
	/** Ignorado — el branding lo da el asset SVG (black/white según theme). */
	color?: string;
	/** Ignorado — compatibilidad con iconsax `variant`. */
	variant?: string;
	/** Forzar variante. Si se omite se decide por theme. */
	forceVariant?: "black" | "white";
}

const ChatGptLogo = ({ size = 24, color: _color, variant: _variant, forceVariant, style, ...rest }: ChatGptLogoProps) => {
	const theme = useTheme();
	const numericSize = typeof size === "number" ? size : parseFloat(size);
	const variant = forceVariant ?? (theme.palette.mode === "dark" ? "white" : "black");
	const src = variant === "white" ? logoWhite : logoBlack;
	return (
		<img
			src={src}
			alt="ChatGPT"
			width={numericSize}
			height={numericSize}
			style={{ flexShrink: 0, display: "inline-block", ...style }}
			{...rest}
		/>
	);
};

export default ChatGptLogo;
