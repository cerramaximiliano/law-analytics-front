// Validación del formulario del haber de caja con Yup (el mismo mecanismo que el retroactivo previsional).
// El esquema se arma con el catálogo del hub: las categorías de autónomos que no se pueden cargar en un período salen de ahí.
import * as Yup from "yup";
import { bloqueoDeCategoria, CatalogoHaberCaja, leerImporte, normalizarPeriodo } from "services/haberCajaService";
import {
	CAUSA_VINCULADA,
	FilaAutonomoForm,
	filaAutonomoVacia,
	FilaRemuneracionForm,
	filaRemuneracionVacia,
	porcentajeDe,
	tiempoDe,
	tiempoVacio,
} from "./haberCajaFormModel";

// El motor calcula para FAD desde la vigencia de la Ley 24.241 (lo valida también el hub)
const INICIO_LEY_24241 = "1994-07";
const RX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const mesLegible = (p: string) => `${Number(p.slice(5, 7))}/${p.slice(0, 4)}`;
const mesesEntre = (desde: string, hasta: string) =>
	(Number(hasta.slice(0, 4)) - Number(desde.slice(0, 4))) * 12 + Number(hasta.slice(5, 7)) - Number(desde.slice(5, 7)) + 1;

const fecha = (obligatoria?: string) => {
	const base = Yup.string().test("fecha-valida", "Fecha inválida", (v) => !v || (RX_FECHA.test(v) && !Number.isNaN(Date.parse(v))));
	return obligatoria ? base.required(obligatoria) : base;
};

const porcentaje = (mensaje: string) =>
	Yup.mixed().test("porcentaje", mensaje, (v) => {
		const n = porcentajeDe(v);
		return n === undefined || (Number.isFinite(n) && n > 0 && n <= 100);
	});

const periodoOpcional = (mensaje: string) => Yup.string().test("periodo", mensaje, (v) => !v || !v.trim() || !!normalizarPeriodo(v));

const tiempo = Yup.object().test("tiempo", "Años, meses (0 a 11) y días (0 a 30) en números enteros", (t: any) => tiempoDe(t) !== null);
const tramo = Yup.object({ antes: tiempo, despues: tiempo });

export default function crearValidationSchema(catalogo?: CatalogoHaberCaja | null) {
	const maxRemuneraciones = catalogo?.limites?.remuneraciones || 1500;
	const maxAutonomos = catalogo?.limites?.periodosAutonomo || 300;
	const maxMesesRenglon = catalogo?.limites?.mesesRenglon || 600;

	const filaRemuneracion = Yup.mixed<FilaRemuneracionForm>().test("fila-remuneracion", "", function (f) {
		if (!f || filaRemuneracionVacia(f)) return true;
		const periodo = normalizarPeriodo(f.periodo);
		if (!periodo) return this.createError({ path: `${this.path}.periodo`, message: "Período inválido (MM/AAAA o AAAA-MM)" });
		const importe = leerImporte(f.importe);
		if (importe === null || importe < 0) return this.createError({ path: `${this.path}.importe`, message: "Importe inválido" });
		if (f.hasta && f.hasta.trim()) {
			const hasta = normalizarPeriodo(f.hasta);
			if (!hasta) return this.createError({ path: `${this.path}.hasta`, message: "Hasta inválido (MM/AAAA o AAAA-MM)" });
			if (hasta < periodo) return this.createError({ path: `${this.path}.hasta`, message: "El hasta es anterior al período" });
			if (mesesEntre(periodo, hasta) > maxMesesRenglon)
				return this.createError({ path: `${this.path}.hasta`, message: `El renglón abarca más de ${maxMesesRenglon} meses` });
		}
		return true;
	});

	const filaAutonomo = Yup.mixed<FilaAutonomoForm>().test("fila-autonomo", "", function (f) {
		if (!f || filaAutonomoVacia(f)) return true;
		const desde = normalizarPeriodo(f.desde);
		if (!desde) return this.createError({ path: `${this.path}.desde`, message: "Desde inválido (MM/AAAA o AAAA-MM)" });
		const hasta = normalizarPeriodo(f.hasta);
		if (!hasta) return this.createError({ path: `${this.path}.hasta`, message: "Hasta inválido (MM/AAAA o AAAA-MM)" });
		if (hasta < desde) return this.createError({ path: `${this.path}.hasta`, message: "El hasta es anterior al desde" });
		// el motor saltea sin avisar un período sin categoría: acá es obligatoria
		if (!f.categoria || !f.categoria.trim())
			return this.createError({
				path: `${this.path}.categoria`,
				message: `Elegí la categoría del período ${mesLegible(desde)} a ${mesLegible(hasta)}`,
			});
		const bloqueo = bloqueoDeCategoria(catalogo, f.categoria, desde, hasta);
		if (bloqueo) return this.createError({ path: `${this.path}.categoria`, message: bloqueo });
		return true;
	});

	return Yup.object({
		reclamante: Yup.string()
			.trim()
			.required("Ingrese un nombre o seleccione una carpeta")
			.test("carpeta", "Seleccione una carpeta", (v) => v !== CAUSA_VINCULADA),
		prestacion: Yup.string()
			.oneOf(["jubilacion", "pension", "edadAvanzada"], "Seleccione una prestación")
			.required("Seleccione una prestación"),
		programa: Yup.string().oneOf(["ansesPrpa", "bluecorp"]).required(),
		porcentajePension: porcentaje("Entre 0 y 100"),
		anticipadaPorcentaje: porcentaje("Entre 0 y 100"),
		reciprocidad: porcentaje("Entre 0 y 100"),
		fad: fecha("Ingrese la fecha de adquisición del derecho").test(
			"ley-24241",
			"El haber de caja se calcula para FAD desde 7/1994 (Ley 24.241)",
			(v) => !v || v.slice(0, 7) >= INICIO_LEY_24241,
		),
		cese: fecha().when("prestacion", {
			is: "pension",
			then: (s) => s,
			otherwise: (s) => s.required("Ingrese la fecha de cese"),
		}),
		solicitud: fecha("Ingrese la fecha de solicitud"),
		alta: fecha("Ingrese la fecha de alta"),
		acuerdo: fecha().test("acuerdo-con-actualizacion", "Ingrese la fecha de acuerdo para actualizar a ese mes", function (v) {
			return this.parent.mesActualizacion !== "acuerdo" || !!v;
		}),
		promedioDesde: periodoOpcional("Período inválido (MM/AAAA o AAAA-MM)").test(
			"par",
			"Complete el desde del período del promedio",
			function (v) {
				return !(this.parent.promedioHasta || "").trim() || !!(v || "").trim();
			},
		),
		promedioHasta: periodoOpcional("Período inválido (MM/AAAA o AAAA-MM)")
			.test("par", "Complete el hasta del período del promedio", function (v) {
				return !(this.parent.promedioDesde || "").trim() || !!(v || "").trim();
			})
			.test("orden", "El hasta es anterior al desde", function (v) {
				const d = normalizarPeriodo(this.parent.promedioDesde || "");
				const h = normalizarPeriodo(v || "");
				return !d || !h || h >= d;
			}),
		servicios: Yup.object({ n: tramo, m: tramo, p: tramo }).test("algun-servicio", "Cargue los años de servicios", (s: any) => {
			const tiempos = ["n", "m", "p"].flatMap((k) => [tiempoDe(s?.[k]?.antes), tiempoDe(s?.[k]?.despues)]);
			// los tiempos inválidos ya tienen su propio error
			return tiempos.some((t) => t === null) || tiempos.some((t) => !tiempoVacio(t));
		}),
		remuneraciones: Yup.array()
			.of(filaRemuneracion)
			.test(
				"tope",
				`No más de ${maxRemuneraciones} remuneraciones`,
				(l) => (l || []).filter((f) => f && !filaRemuneracionVacia(f)).length <= maxRemuneraciones,
			)
			.test("algun-ingreso", "Cargue al menos una remuneración o un período de autónomos", function (l) {
				const hayRemuneraciones = (l || []).some((f) => f && !filaRemuneracionVacia(f));
				const hayAutonomos = (this.parent.autonomos || []).some((f: FilaAutonomoForm) => f && !filaAutonomoVacia(f));
				return hayRemuneraciones || hayAutonomos;
			}),
		autonomos: Yup.array()
			.of(filaAutonomo)
			.test(
				"tope",
				`No más de ${maxAutonomos} períodos de autónomos`,
				(l) => (l || []).filter((f) => f && !filaAutonomoVacia(f)).length <= maxAutonomos,
			)
			.test("sin-superposicion", "", function (l) {
				const filas = (l || [])
					.map((f, i) => ({ i, desde: f ? normalizarPeriodo(f.desde) : null, hasta: f ? normalizarPeriodo(f.hasta) : null }))
					.filter((f) => f.desde && f.hasta)
					.sort((x, y) => (x.desde as string).localeCompare(y.desde as string));
				for (let k = 1; k < filas.length; k++) {
					if ((filas[k].desde as string) <= (filas[k - 1].hasta as string))
						return this.createError({
							path: `${this.path}[${filas[k].i}].desde`,
							message: `El período que empieza en ${mesLegible(filas[k].desde as string)} se superpone con otro`,
						});
				}
				return true;
			}),
	});
}
