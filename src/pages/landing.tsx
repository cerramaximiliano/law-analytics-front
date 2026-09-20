import React, { lazy } from "react";
// project-imports
import Hero from "sections/landing/Header";
import ComoFunciona from "sections/landing/ComoFunciona";
import DiscountBanner from "sections/landing/DiscountBanner";
import AlAcercarse from "components/AlAcercarse";

// Lo que queda bajo el pliegue se carga cuando la persona se acerca. Solo el
// encabezado y "cómo funciona" se montan de entrada (2026-09-20).
const Technologies = lazy(() => import("sections/landing/Technologies"));
const VistaProducto = lazy(() => import("sections/landing/VistaProducto"));
const Testimonial = lazy(() => import("sections/landing/Testimonial"));
const Planes = lazy(() => import("sections/landing/Planes"));
const Faq = lazy(() => import("sections/landing/Faq"));
const ContactUs = lazy(() => import("sections/landing/ContactUs"));
import SEO from "components/SEO/SEO";
import SectionTracker from "components/analytics/SectionTracker";
import { LandingSections } from "utils/gtm";

// ==============================|| SAMPLE PAGE ||============================== //

const Landing = () => {
	return (
		<>
			<SEO path="/" />
			<DiscountBanner />
			<SectionTracker sectionName={LandingSections.HERO}>
				<Hero />
			</SectionTracker>
			<SectionTracker sectionName={LandingSections.COMO_FUNCIONA}>
				<ComoFunciona />
			</SectionTracker>
			<AlAcercarse altoMinimo={420}>
				<SectionTracker sectionName={LandingSections.HERRAMIENTAS}>
					<Technologies />
				</SectionTracker>
			</AlAcercarse>
			{/* El producto se ve recién acá: antes el recorrido era todo texto. */}
			<AlAcercarse altoMinimo={720}>
				<VistaProducto />
			</AlAcercarse>
			<AlAcercarse altoMinimo={520}>
				<SectionTracker sectionName={LandingSections.TESTIMONIOS}>
					<Testimonial />
				</SectionTracker>
			</AlAcercarse>
			<AlAcercarse altoMinimo={760}>
				<SectionTracker sectionName={LandingSections.PLANES}>
					<Planes />
				</SectionTracker>
			</AlAcercarse>
			<AlAcercarse altoMinimo={520}>
				<SectionTracker sectionName={LandingSections.FAQ}>
					<Faq />
				</SectionTracker>
			</AlAcercarse>
			<AlAcercarse altoMinimo={420}>
				<SectionTracker sectionName={LandingSections.CONTACTO}>
					<ContactUs />
				</SectionTracker>
			</AlAcercarse>
		</>
	);
};

export default Landing;
