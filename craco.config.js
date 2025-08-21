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

			// Optimización de chunks para reducir el tamaño del bundle
			webpackConfig.optimization = {
				...webpackConfig.optimization,
				splitChunks: {
					chunks: "all",
					cacheGroups: {
						default: false,
						vendors: false,
						// Vendor code splitting
						vendor: {
							name: "vendor",
							chunks: "all",
							test: /node_modules/,
							priority: 20,
						},
						// Material-UI en su propio chunk
						mui: {
							test: /[\\/]node_modules[\\/]@mui[\\/]/,
							name: "mui",
							priority: 30,
							chunks: "all",
						},
						// FullCalendar en su propio chunk
						fullcalendar: {
							test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
							name: "fullcalendar",
							priority: 30,
							chunks: "all",
						},
						// React PDF en su propio chunk
						reactpdf: {
							test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
							name: "reactpdf",
							priority: 30,
							chunks: "all",
						},
						// Apexcharts en su propio chunk
						apexcharts: {
							test: /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
							name: "apexcharts",
							priority: 30,
							chunks: "all",
						},
						// Common chunk
						common: {
							minChunks: 2,
							priority: 10,
							reuseExistingChunk: true,
							enforce: true,
						},
					},
				},
			};

			return webpackConfig;
		},
	},
};
