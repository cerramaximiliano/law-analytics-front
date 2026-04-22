import React from "react";
import { useEffect, useRef, ReactElement } from "react";

// third party
import { useInView } from "react-intersection-observer";
import { motion, useAnimation } from "framer-motion";

// =============================|| LANDING - FADE IN ANIMATION ||============================= //

// Fallback delay (ms): if IntersectionObserver doesn't fire within this time
// (e.g. Playwright screenshots, reduced-motion, or element already in viewport
// before observer subscribes), force the visible state so content is never
// permanently hidden.
const FALLBACK_DELAY_MS = 600;

function FadeInWhenVisible({ children }: { children: ReactElement }) {
	const controls = useAnimation();
	const [ref, inView] = useInView({ triggerOnce: true });
	const hasAnimated = useRef(false);

	// Respect prefers-reduced-motion: skip animation entirely.
	const prefersReducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	useEffect(() => {
		if (prefersReducedMotion) {
			controls.set("visible");
			hasAnimated.current = true;
			return;
		}

		if (inView && !hasAnimated.current) {
			hasAnimated.current = true;
			controls.start("visible");
		}
	}, [controls, inView, prefersReducedMotion]);

	// Fallback: guarantee visibility even if IntersectionObserver never fires
	// (static renders, Playwright captures, iframes, etc.)
	useEffect(() => {
		const timer = setTimeout(() => {
			if (!hasAnimated.current) {
				hasAnimated.current = true;
				controls.set("visible");
			}
		}, FALLBACK_DELAY_MS);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (prefersReducedMotion) {
		return <>{children}</>;
	}

	return (
		<motion.div
			ref={ref}
			animate={controls}
			initial="hidden"
			transition={{ duration: 0.4 }}
			variants={{
				visible: { opacity: 1, translateY: 0 },
				hidden: { opacity: 0, translateY: 30 },
			}}
		>
			{children}
		</motion.div>
	);
}

export default FadeInWhenVisible;
