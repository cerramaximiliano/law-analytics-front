import React from "react";
import { useEffect, ReactElement } from "react";

// third party
import { useInView } from "react-intersection-observer";
import { motion, useAnimation } from "framer-motion";

// =============================|| LANDING - FADE IN ANIMATION ||============================= //

function FadeInWhenVisible({ children }: { children: ReactElement }) {
	const controls = useAnimation();
	const [ref, inView] = useInView();

	useEffect(() => {
		if (inView) {
			controls.start("visible");
		}
	}, [controls, inView]);

	return (
		<motion.div
			ref={ref}
			animate={controls}
			initial="hidden"
			transition={{ duration: 0.4 }}
			variants={{
				visible: { opacity: 1, translateY: 0 },
				hidden: { opacity: 0, translateY: 300 },
			}}
			// Propagamos height:100% para que MainCards envueltas con esta animación
			// puedan estirarse a la altura del Grid item (necesario en Planes para
			// alinear las 3 columnas cuando alignItems=stretch).
			style={{ height: "100%" }}
		>
			{children}
		</motion.div>
	);
}

export default FadeInWhenVisible;
