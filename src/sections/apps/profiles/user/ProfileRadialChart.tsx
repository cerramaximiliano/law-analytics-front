import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import ReactApexChart, { Props as ChartProps } from "react-apexcharts";
import { ThemeMode } from "types/config";
import { useSelector } from "store";
import { UserProfile } from "types/auth";

// chart options
const redialBarChartOptions = {
	plotOptions: {
		radialBar: {
			hollow: {
				margin: 0,
				size: "75%",
			},
			track: {
				margin: 0,
			},
			dataLabels: {
				name: {
					show: false,
				},
				value: {
					offsetY: 5,
				},
			},
		},
	},
	labels: ["Completado"],
};

export interface ApexRedialBarChartProps extends ChartProps {}

const ProfileRadialChart = (props: ApexRedialBarChartProps) => {
	const theme = useTheme();
	const mode = theme.palette.mode;

	// Obtener la información del usuario del store de Redux
	const user = useSelector((state) => state.auth.user) as UserProfile | null;

	// Calcular el porcentaje de completitud manualmente si no existe
	const calculateProfileCompletion = () => {
		if (!user) {
			return 0;
		}

		// Array de campos requeridos para un perfil completo
		const requiredFields = ["firstName", "lastName", "email", "dob", "contact", "designation", "address", "country", "state"] as const;

		// Contador de campos completados
		let completedFields = 0;
		const fieldStatus: Record<string, boolean> = {};

		// Verificar cada campo y registrar su estado
		for (const field of requiredFields) {
			// Verificación especial para 'dob' ya que puede ser un objeto Date o string
			if (field === "dob") {
				fieldStatus[field] = Boolean(user[field]);
			} else {
				fieldStatus[field] = Boolean(user[field] !== undefined && user[field] !== null && String(user[field]).trim() !== "");
			}

			if (fieldStatus[field]) {
				completedFields++;
			}
		}

		// Calcular porcentaje de completitud (asegurar que sea al menos 1 si hay algún campo)
		const percentage = Math.round((completedFields / requiredFields.length) * 100);

		return percentage > 0 ? percentage : user.firstName ? 10 : 0; // Dar al menos 10% si tiene nombre
	};

	// Verificar si hay un valor explícito de profileCompletionScore
	const hasExplicitScore = user?.profileCompletionScore !== undefined;

	// Obtener el porcentaje de completitud del perfil
	let completionPercentage = 0;

	if (hasExplicitScore && typeof user?.profileCompletionScore === "number") {
		completionPercentage = user.profileCompletionScore;
	} else if (user) {
		completionPercentage = calculateProfileCompletion();
	}
	// Asegurar que el valor nunca sea NaN o menos que 0
	completionPercentage = isNaN(completionPercentage) ? 0 : Math.max(0, completionPercentage);

	const textPrimary = theme.palette.text.primary;
	const primary = theme.palette.primary.main;
	const grey0 = theme.palette.common.white;
	const grey200 = theme.palette.secondary[200];

	const [series, setSeries] = useState<number[]>([completionPercentage]);
	const [options, setOptions] = useState<ChartProps>(redialBarChartOptions);

	useEffect(() => {
		let percentage = 0;
		if (user?.profileCompletionScore !== undefined && user.profileCompletionScore !== null) {
			percentage = user.profileCompletionScore;
		} else if (user) {
			percentage = calculateProfileCompletion();
		}

		// Asegurar que el valor sea un número válido
		percentage = isNaN(percentage) ? 0 : Math.max(0, percentage);

		// Actualizar el estado
		setSeries([percentage]);
	}, [user]);

	// Actualizar opciones cuando cambien dependencias
	useEffect(() => {
		setOptions((prevState) => ({
			...prevState,
			colors: [primary],
			plotOptions: {
				radialBar: {
					track: {
						background: mode === ThemeMode.DARK ? grey200 : grey0,
					},
					dataLabels: {
						value: {
							fontSize: "1rem",
							fontWeight: 600,
							offsetY: 5,
							color: textPrimary,
							formatter: function (val: number) {
								return `${Math.round(val)}%`;
							},
						},
					},
				},
			},
			theme: {
				mode: mode === ThemeMode.DARK ? "dark" : "light",
			},
		}));
	}, [mode, grey200, grey0, textPrimary, primary]);

	return (
		<div id="chart">
			<ReactApexChart options={options} series={series} type="radialBar" width={136} height={136} />
		</div>
	);
};

export default ProfileRadialChart;
