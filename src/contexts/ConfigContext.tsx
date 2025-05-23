import { createContext, ReactNode } from "react";

// project-imports
import config from "config";
import useLocalStorage from "hooks/useLocalStorage";

// types
import { CustomizationProps, FontFamily, MenuOrientation, PresetColor, ThemeDirection, ThemeMode } from "types/config";

// initial state
const initialState: CustomizationProps = {
	...config,
	onChangeContainer: () => {},
	onChangeMode: (mode: ThemeMode) => {},
	onChangePresetColor: (theme: PresetColor) => {},
	onChangeDirection: (direction: ThemeDirection) => {},
	onChangeMiniDrawer: (miniDrawer: boolean) => {},
	onChangeMenuOrientation: (menuOrientation: MenuOrientation) => {},
	onChangeMenuCaption: () => {},
	onChangeFontFamily: (fontFamily: FontFamily) => {},
	onChangeContrast: () => {},
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext(initialState);

type ConfigProviderProps = {
	children: ReactNode;
};

function ConfigProvider({ children }: ConfigProviderProps) {
	const [config, setConfig] = useLocalStorage("able-pro-material-react-ts-config", initialState);

	const onChangeContainer = () => {
		setConfig({
			...config,
			container: !config.container,
		});
	};

	// La función onChangeLocalization se ha eliminado ya que no usamos el sistema de traducción

	const onChangeMode = (mode: ThemeMode) => {
		setConfig({
			...config,
			mode,
		});
	};

	const onChangePresetColor = (theme: PresetColor) => {
		setConfig({
			...config,
			presetColor: theme,
		});
	};

	const onChangeDirection = (direction: ThemeDirection) => {
		setConfig({
			...config,
			themeDirection: direction,
		});
	};

	const onChangeMiniDrawer = (miniDrawer: boolean) => {
		setConfig({
			...config,
			miniDrawer,
		});
	};

	const onChangeContrast = () => {
		setConfig({
			...config,
			themeContrast: !config.themeContrast,
		});
	};

	const onChangeMenuCaption = () => {
		setConfig({
			...config,
			menuCaption: !config.menuCaption,
		});
	};

	const onChangeMenuOrientation = (layout: MenuOrientation) => {
		setConfig({
			...config,
			menuOrientation: layout,
		});
	};

	const onChangeFontFamily = (fontFamily: FontFamily) => {
		setConfig({
			...config,
			fontFamily,
		});
	};

	return (
		<ConfigContext.Provider
			value={{
				...config,
				onChangeContainer,
				onChangeMode,
				onChangePresetColor,
				onChangeDirection,
				onChangeMiniDrawer,
				onChangeMenuOrientation,
				onChangeMenuCaption,
				onChangeFontFamily,
				onChangeContrast,
			}}
		>
			{children}
		</ConfigContext.Provider>
	);
}

export { ConfigProvider, ConfigContext };
