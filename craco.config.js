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
				runtimeChunk: "single",
				splitChunks: {
					chunks: "all",
					maxInitialRequests: 10,
					maxAsyncRequests: 30,
					minSize: 20000,
					cacheGroups: {
						default: false,
						vendors: false,
						// React core libraries
						react: {
							test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
							name: "react",
							priority: 40,
							chunks: "all",
						},
						// Material-UI en su propio chunk
						mui: {
							test: /[\\/]node_modules[\\/]@mui[\\/]/,
							name: "mui",
							priority: 35,
							chunks: "all",
						},
						// FullCalendar en su propio chunk
						fullcalendar: {
							test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
							name: "fullcalendar",
							priority: 35,
							chunks: "all",
						},
						// React PDF en su propio chunk
						reactpdf: {
							test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
							name: "reactpdf",
							priority: 35,
							chunks: "all",
						},
						// Apexcharts en su propio chunk
						apexcharts: {
							test: /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
							name: "apexcharts",
							priority: 35,
							chunks: "all",
						},
						// AWS/Cognito
						aws: {
							test: /[\\/]node_modules[\\/](aws-sdk|amazon-cognito|@aws)[\\/]/,
							name: "aws",
							priority: 30,
							chunks: "all",
						},
						// Redux y herramientas de estado
						redux: {
							test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux|immer)[\\/]/,
							name: "redux",
							priority: 30,
							chunks: "all",
						},
						// Emotion (estilos)
						emotion: {
							test: /[\\/]node_modules[\\/]@emotion[\\/]/,
							name: "emotion",
							priority: 30,
							chunks: "all",
						},
						// Formik y validación
						forms: {
							test: /[\\/]node_modules[\\/](formik|yup)[\\/]/,
							name: "forms",
							priority: 30,
							chunks: "all",
						},
						// Date libraries
						dates: {
							test: /[\\/]node_modules[\\/](date-fns|dayjs|moment|luxon)[\\/]/,
							name: "dates",
							priority: 30,
							chunks: "all",
						},
						// Otros vendors
						vendor: {
							test: /[\\/]node_modules[\\/]/,
							name: "vendor",
							priority: 10,
							chunks: "all",
							reuseExistingChunk: true,
						},
						// Common chunk
						common: {
							minChunks: 2,
							priority: 5,
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
