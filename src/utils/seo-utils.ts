export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: items.map((item, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: item.name,
		item: `https://lawanalytics.app${item.url}`,
	})),
});

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqs.map((faq) => ({
		"@type": "Question",
		name: faq.question,
		acceptedAnswer: {
			"@type": "Answer",
			text: faq.answer,
		},
	})),
});

export const generateLegalServiceSchema = () => ({
	"@context": "https://schema.org",
	"@type": "LegalService",
	name: "Law Analytics - Software Legal",
	description: "Plataforma integral de gestión legal para abogados y estudios jurídicos",
	provider: {
		"@type": "Organization",
		name: "Law Analytics",
		url: "https://lawanalytics.app",
	},
	serviceType: "Software de Gestión Legal",
	areaServed: {
		"@type": "Country",
		name: "Argentina",
	},
	hasOfferCatalog: {
		"@type": "OfferCatalog",
		name: "Planes de Suscripción",
		itemListElement: [
			{
				"@type": "Offer",
				itemOffered: {
					"@type": "Service",
					name: "Plan Básico",
					description: "Ideal para abogados independientes",
				},
			},
			{
				"@type": "Offer",
				itemOffered: {
					"@type": "Service",
					name: "Plan Profesional",
					description: "Para estudios jurídicos pequeños y medianos",
				},
			},
			{
				"@type": "Offer",
				itemOffered: {
					"@type": "Service",
					name: "Plan Enterprise",
					description: "Para grandes estudios y corporaciones",
				},
			},
		],
	},
});

export const generateReviewSchema = () => ({
	"@context": "https://schema.org",
	"@type": "Product",
	name: "Law Analytics",
	description: "Software de gestión legal inteligente",
	brand: {
		"@type": "Brand",
		name: "Law Analytics",
	},
	aggregateRating: {
		"@type": "AggregateRating",
		ratingValue: "4.8",
		reviewCount: "150",
	},
	review: [
		{
			"@type": "Review",
			reviewRating: {
				"@type": "Rating",
				ratingValue: "5",
				bestRating: "5",
			},
			author: {
				"@type": "Person",
				name: "Dr. María González",
			},
			reviewBody: "Excelente herramienta para gestionar mi estudio. La calculadora laboral es muy precisa y me ahorra mucho tiempo.",
		},
	],
});

export const cleanMetaDescription = (text: string): string => {
	// Remove line breaks, extra spaces, and trim
	return text.replace(/\s+/g, " ").trim().substring(0, 160);
};
