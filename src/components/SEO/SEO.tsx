import React from "react";
import { Helmet } from "react-helmet-async";
import { defaultSEO, pageSEO, legalStructuredData } from "../../config/seo.config";

interface SEOProps {
	title?: string;
	description?: string;
	keywords?: string[];
	path?: string;
	structuredData?: any;
	noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, path = "", structuredData, noindex = false }) => {
	const pageConfig = path ? pageSEO[path] : null;

	const finalTitle = title || pageConfig?.title || defaultSEO.title;
	const finalDescription = description || pageConfig?.description || defaultSEO.description;
	const finalKeywords = keywords || pageConfig?.keywords || defaultSEO.keywords;
	const finalStructuredData = structuredData || pageConfig?.structuredData;

	const canonicalUrl = `https://lawanalytics.app${path}`;

	return (
		<Helmet>
			{/* Basic Meta Tags */}
			<title>{finalTitle}</title>
			<meta name="description" content={finalDescription} />
			<meta name="keywords" content={finalKeywords.join(", ")} />

			{/* Canonical URL */}
			<link rel="canonical" href={canonicalUrl} />

			{/* Robots */}
			{noindex && <meta name="robots" content="noindex, nofollow" />}

			{/* Open Graph Tags */}
			<meta property="og:title" content={finalTitle} />
			<meta property="og:description" content={finalDescription} />
			<meta property="og:type" content="website" />
			<meta property="og:url" content={canonicalUrl} />
			<meta property="og:image" content="https://lawanalytics.app/og-image.png" />
			<meta property="og:site_name" content="Law Analytics" />
			<meta property="og:locale" content="es_AR" />

			{/* Twitter Card Tags */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={finalTitle} />
			<meta name="twitter:description" content={finalDescription} />
			<meta name="twitter:image" content="https://lawanalytics.app/og-image.png" />
			<meta name="twitter:site" content="@lawanalytics" />

			{/* Additional Meta Tags */}
			<meta name="author" content="Law Analytics" />
			<meta name="generator" content="React" />
			<meta name="application-name" content="Law Analytics" />

			{/* Mobile Web App */}
			<meta name="mobile-web-app-capable" content="yes" />
			<meta name="apple-mobile-web-app-capable" content="yes" />
			<meta name="apple-mobile-web-app-status-bar-style" content="default" />
			<meta name="apple-mobile-web-app-title" content="Law Analytics" />

			{/* Structured Data */}
			{finalStructuredData && <script type="application/ld+json">{JSON.stringify(finalStructuredData)}</script>}

			{/* Organization Structured Data (on all pages) */}
			<script type="application/ld+json">{JSON.stringify(legalStructuredData)}</script>
		</Helmet>
	);
};

export default SEO;
