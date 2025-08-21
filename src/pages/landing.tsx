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

// ==============================|| SAMPLE PAGE ||============================== //

const Landing = () => {
	return (
		<>
			<SEO path="/" />
			<Hero />
			<Technologies />
			<Combo />
			{/* <Apps /> */}
			<Free />
			<Testimonial />
			{/* <Partner /> */}
			<ContactUs />
		</>
	);
};

export default Landing;
