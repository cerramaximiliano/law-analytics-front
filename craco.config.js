module.exports = {
	webpack: {
		configure: (webpackConfig) => {
			// Ignore source map warnings from problematic modules
			webpackConfig.ignoreWarnings = [
				// Ignore source map warnings from stylis-plugin-rtl
				{
					module: /node_modules[\\/]stylis-plugin-rtl/,
					message: /Failed to parse source map/,
				},
				// Also ignore warnings from other modules with source map issues if needed
				function ignoreSourcemapsloaderWarnings(warning) {
					return (
						warning.module &&
						warning.module.resource &&
						(warning.module.resource.includes("node_modules/stylis-plugin-rtl") || warning.message.includes("source-map-loader"))
					);
				},
			];
			return webpackConfig;
		},
	},
};
