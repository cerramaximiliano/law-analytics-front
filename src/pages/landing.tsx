import React from "react";
// project-imports
import Hero from "sections/landing/Header";
import ComoFunciona from "sections/landing/ComoFunciona";
import Technologies from "sections/landing/Technologies";
import Testimonial from "sections/landing/Testimonial";
import Planes from "sections/landing/Planes";
import Faq from "sections/landing/Faq";
import ContactUs from "sections/landing/ContactUs";
import SEO from "components/SEO/SEO";
import SectionTracker from "components/analytics/SectionTracker";
import { LandingSections } from "utils/gtm";

// ==============================|| SAMPLE PAGE ||============================== //

const Landing = () => {
	return (
		<>
			<SEO path="/" />
			<SectionTracker sectionName={LandingSections.HERO}>
				<Hero />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.COMO_FUNCIONA}>
				<ComoFunciona />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.HERRAMIENTAS}>
				<Technologies />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.TESTIMONIOS}>
				<Testimonial />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.PLANES}>
				<Planes />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.FAQ}>
				<Faq />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.CONTACTO}>
				<ContactUs />
			</SectionTracker>
		</>
	);
};

export default Landing;
