import { useEffect, useRef, useCallback } from "react";
import {
	trackScrollSection,
	trackCTAClick,
	trackFeatureInterest,
	trackHighScrollNoCTA,
	getUTMSource,
	GTMEvents,
	LandingSections,
} from "utils/gtm";

/**
 * Hook to track when a section becomes visible using Intersection Observer
 * @param sectionName - Name of the section to track
 * @param threshold - Visibility threshold (0-1), default 0.5 (50% visible)
 */
export const useSectionTracking = (sectionName: string, threshold = 0.5) => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const hasTracked = useRef(false);

	useEffect(() => {
		const element = sectionRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !hasTracked.current) {
						trackScrollSection(sectionName);
						hasTracked.current = true;
					}
				});
			},
			{ threshold }
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [sectionName, threshold]);

	return sectionRef;
};

/**
 * Hook to track CTA clicks
 */
export const useCTATracking = () => {
	const trackHeroCTA = useCallback(() => {
		trackCTAClick(GTMEvents.CTA_CLICK_HERO, "hero");
	}, []);

	const trackCitasCTA = useCallback(() => {
		trackCTAClick(GTMEvents.CTA_CLICK_CITAS, "citas");
	}, []);

	const trackPruebaPagarCTA = useCallback(() => {
		trackCTAClick(GTMEvents.CTA_CLICK_PRUEBA_PAGAR, "prueba_pagar");
	}, []);

	return {
		trackHeroCTA,
		trackCitasCTA,
		trackPruebaPagarCTA,
	};
};

/**
 * Hook to track feature interest (clicks on feature cards)
 */
export const useFeatureTracking = () => {
	const trackFeature = useCallback((featureName: string) => {
		trackFeatureInterest(featureName);
	}, []);

	return { trackFeature };
};

/**
 * Hook to detect high scroll without CTA click (for Instagram traffic)
 * Triggers when user scrolls past "herramientas" section but doesn't click any CTA
 */
export const useHighScrollNoCTATracking = () => {
	const hasScrolledToHerramientas = useRef(false);
	const hasClickedCTA = useRef(false);
	const hasTrackedHighScroll = useRef(false);

	const markScrolledToHerramientas = useCallback(() => {
		hasScrolledToHerramientas.current = true;
	}, []);

	const markCTAClicked = useCallback(() => {
		hasClickedCTA.current = true;
	}, []);

	// Check on page unload if user scrolled but didn't click CTA
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (hasScrolledToHerramientas.current && !hasClickedCTA.current && !hasTrackedHighScroll.current) {
				const source = getUTMSource();
				if (source === "instagram") {
					trackHighScrollNoCTA("instagram");
					hasTrackedHighScroll.current = true;
				}
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	return {
		markScrolledToHerramientas,
		markCTAClicked,
	};
};

/**
 * Combined hook for all landing page analytics
 */
export const useLandingAnalytics = () => {
	const { trackHeroCTA, trackCitasCTA, trackPruebaPagarCTA } = useCTATracking();
	const { trackFeature } = useFeatureTracking();
	const { markScrolledToHerramientas, markCTAClicked } = useHighScrollNoCTATracking();

	// Wrap CTA trackers to also mark CTA as clicked
	const handleHeroCTA = useCallback(() => {
		markCTAClicked();
		trackHeroCTA();
	}, [markCTAClicked, trackHeroCTA]);

	const handleCitasCTA = useCallback(() => {
		markCTAClicked();
		trackCitasCTA();
	}, [markCTAClicked, trackCitasCTA]);

	const handlePruebaPagarCTA = useCallback(() => {
		markCTAClicked();
		trackPruebaPagarCTA();
	}, [markCTAClicked, trackPruebaPagarCTA]);

	return {
		// CTA tracking
		trackHeroCTA: handleHeroCTA,
		trackCitasCTA: handleCitasCTA,
		trackPruebaPagarCTA: handlePruebaPagarCTA,
		// Feature tracking
		trackFeature,
		// High scroll tracking
		markScrolledToHerramientas,
		// Section names for reference
		sections: LandingSections,
	};
};

export default useLandingAnalytics;
