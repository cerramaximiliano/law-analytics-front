// /funciones — vista de aterrizaje para el tráfico de anuncios.
//
// Por qué existe: los anuncios mandaban directo a /register y, sobre 188 visitas
// de una semana, nadie escribió un carácter en el formulario (19/09/2026). Acá la
// persona ve qué hace el producto, con maquetas dibujadas de la interfaz, y el
// registro aparece recién cuando ya sabe para qué es. El `source` del anuncio
// se propaga al registro para no perder la atribución.

import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Box } from "@mui/material";

import SEO from "components/SEO/SEO";
import FuncionesHero from "sections/funciones/FuncionesHero";
import FuncionBloque from "sections/funciones/FuncionBloque";
import CierreFunciones, { BarraFija } from "sections/funciones/CierreFunciones";
import { FUNCIONES, Funcion } from "sections/funciones/funcionesData";
import { pushGTMEvent, trackFeatureInterest, trackViewFeaturesSection } from "utils/gtm";

const Funciones = () => {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const source = params.get("source") || "funciones";

	useEffect(() => {
		trackViewFeaturesSection();
	}, []);

	const irARegistro = useCallback(
		(feature?: string, ubicacion = "funciones") => {
			pushGTMEvent("cta_click_funciones", { cta_location: ubicacion, source, feature: feature || null });
			const qs = new URLSearchParams({ source });
			if (feature) qs.set("feature", feature);
			navigate(`/register?${qs.toString()}`);
		},
		[navigate, source]
	);

	const alUsarFuncion = useCallback(
		(funcion: Funcion) => {
			if (funcion.featureKey) trackFeatureInterest(funcion.featureKey);
			irARegistro(funcion.featureKey, `funcion_${funcion.id}`);
		},
		[irARegistro]
	);

	const bajarAFunciones = useCallback(() => {
		document.getElementById(FUNCIONES[0].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	return (
		<>
			<SEO path="/funciones" />
			<Box component="main" sx={{ pb: { xs: 9, md: 0 } }}>
				<FuncionesHero onEmpezar={() => irARegistro(undefined, "hero")} onVerFunciones={bajarAFunciones} />

				<Box component="section" aria-label="Funciones de Law Analytics">
					{FUNCIONES.map((funcion, i) => (
						<FuncionBloque key={funcion.id} funcion={funcion} indice={i} onCtaClick={alUsarFuncion} />
					))}
				</Box>

				<CierreFunciones onEmpezar={() => irARegistro(undefined, "cierre")} />
			</Box>
			<BarraFija onEmpezar={() => irARegistro(undefined, "barra_fija")} />
		</>
	);
};

export default Funciones;
