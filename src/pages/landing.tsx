import React from "react";
// project-imports
import Hero from "sections/landing/Header";
import Technologies from "sections/landing/Technologies";
import Combo from "sections/landing/Combo";
//import Apps from "sections/landing/Apps";
import Free from "sections/landing/Free";
import Testimonial from "sections/landing/Testimonial";
//import Partner from "sections/landing/Partner";
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
			<SectionTracker sectionName={LandingSections.HERRAMIENTAS}>
				<Technologies />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.INTEGRACIONES}>
				<Combo />
			</SectionTracker>
			{/* <Apps /> */}
			<SectionTracker sectionName={LandingSections.PRUEBA_PAGAR}>
				<Free />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.TESTIMONIOS}>
				<Testimonial />
			</SectionTracker>
			{/* <Partner /> */}
			<SectionTracker sectionName={LandingSections.CONTACTO}>
				<ContactUs />
			</SectionTracker>
		</>
	);
};

export default Landing;
