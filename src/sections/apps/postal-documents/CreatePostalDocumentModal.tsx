import { useEffect, useRef, useState } from "react";
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControl,
	FormControlLabel,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, CloseSquare, DocumentDownload, DocumentText, DocumentUpload, FolderOpen, MagicStar, Profile2User, Save2, TickCircle, Trash } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { dispatch, useSelector } from "store";
import {
	fetchPdfTemplates,
	createPostalDocument,
	updatePostalDocument,
	generateDemanda,
	generatePlanilla,
	generateDocument,
	saveDraft,
	deletePostalDocument,
} from "store/reducers/postalDocuments";
import { getContactsByUserId, addContact, updateContact } from "store/reducers/contacts";
import { createPostalTracking, fetchAllTrackings } from "store/reducers/postalTracking";
import { getFoldersByUserId } from "store/reducers/folder";
import { PdfTemplate, PdfTemplateField } from "types/postal-document";
import { Contact } from "types/contact";
import { OBJETOS_JUICIO_CIVIL, ObjetoJuicio } from "data/objetosJuicioCivil";
import { OBJETOS_JUICIO_CIVCOMFED } from "data/objetosJuicioCivComFed";
import { OBJETOS_JUICIO_TRABAJO } from "data/objetosJuicioTrabajo";
import { OBJETOS_JUICIO_COMERCIAL } from "data/objetosJuicioComercial";
import { OBJETOS_JUICIO_CONADMFED } from "data/objetosJuicioConAdmFed";
import { MATERIAS_SCBA_CIVIL_COMERCIAL } from "data/materiasScbaCivilComercial";
import { MATERIAS_SCBA_LABORAL } from "data/materiasScbaLaboral";
import { MATERIAS_SCBA_CONTENCIOSO } from "data/materiasScbaContencioso";
import { FolderData } from "types/folder";
import { PostalTrackingType } from "types/postal-tracking";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

// Nomenclador de objetos de juicio según el fuero de cada modelo de sistema.
const OBJETOS_JUICIO_BY_SLUG: Record<string, ObjetoJuicio[]> = {
	planilla_inicio_civil: OBJETOS_JUICIO_CIVIL,
	formulario_ingreso_demandas_ccf: OBJETOS_JUICIO_CIVCOMFED,
	formulario_inicio_laboral_anexo2: OBJETOS_JUICIO_TRABAJO,
	formulario_inicio_comercial: OBJETOS_JUICIO_COMERCIAL,
	formulario_inicio_conadmfed: OBJETOS_JUICIO_CONADMFED,
};

// SCBA Ley 13.951: la materia depende del fuero marcado en el propio formulario.
const MATERIAS_SCBA_BY_FUERO: { field: string; label: string; materias: ObjetoJuicio[] }[] = [
	{ field: "fuero_civil_comercial", label: "Civil y Comercial", materias: MATERIAS_SCBA_CIVIL_COMERCIAL },
	{ field: "fuero_laboral", label: "Laboral", materias: MATERIAS_SCBA_LABORAL },
	{ field: "fuero_contencioso", label: "Contencioso Administrativo", materias: MATERIAS_SCBA_CONTENCIOSO },
];

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
	open: boolean;
	handleClose: () => void;
	prefilledTrackingId?: string | null;
	preselectedTemplate?: PdfTemplate | null;
	prefilledFolderId?: string | null;
	// Retomar un borrador: prefila los datos cargados y actualiza ese doc al guardar/generar.
	resumeDoc?: { _id: string; title?: string; description?: string; formData?: Record<string, string> } | null;
	showSnackbar: (msg: string, sev: "success" | "error") => void;
}

type ContactGroupKey = "destinatario" | "remitente" | "poderdante";

interface SaveContactDialogState {
	open: boolean;
	group: ContactGroupKey | null;
	contactType: "Humana" | "Jurídica";
	role: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const VALID_CODE_IDS = [
	"CC", "CD", "CL", "CM", "CO", "CP", "DE", "DI", "EC", "EE", "EO", "EP", "GC", "GD", "GE", "GF", "GO", "GR", "GS",
	"HC", "HD", "HE", "HO", "HU", "HX", "IN", "IS", "JP", "LC", "LS", "ND", "MD", "ME", "MC", "MS", "MU", "MX", "OL",
	"PC", "PP", "RD", "RE", "RP", "RR", "SD", "SL", "SP", "SR", "ST", "TC", "TD", "TL", "UP",
];

const GROUP_LABELS: Record<string, string> = {
	destinatario: "Destinatario",
	remitente: "Remitente",
	poderdante: "Poderdante (quien otorga el poder)",
	apoderado: "Apoderado (letrado)",
	cuerpo: "Cuerpo del telegrama",
	tipo: "Tipo de comunicación",
	Objeto: "Objeto del juicio",
};

const RADIO_OPTION_LABELS: Record<string, string> = {
	Opción1: "1 - Comunicación de renuncia",
	Opción2: "2 - Comunicación de ausencia",
	Opción3: "3 - Otro tipo de comunicación",
};

const CONTACT_GROUPS: ContactGroupKey[] = ["destinatario", "remitente", "poderdante"];

const EXCLUSIVE_CHECKBOX_PAIRS: string[][] = [
	["suscribe_sexo_f", "suscribe_sexo_m"],
	["mediacion_ley26589", "mediacion_promesa"],
	["tasa_abonar", "tasa_exento", "tasa_no_alcanzado", "tasa_pago_diferido"],
	// SCBA demandados / inicio: tipo de persona F/J/O por fila
	...[1, 2, 3, 4].map((n) => [`demandado${n}_tipo_f`, `demandado${n}_tipo_j`, `demandado${n}_tipo_o`]),
	...[1, 2].map((n) => [`actor${n}_tipo_f`, `actor${n}_tipo_j`, `actor${n}_tipo_o`]),
	// SCBA inicio (Ley 13.951): fuero y casillero (10)
	["fuero_civil_comercial", "fuero_laboral", "fuero_contencioso"],
	["prorroga_jurisdiccion", "beneficio_litigar", "tasa_justicia"],
];

// Datos de prueba del Formulario Civil (compartido por las copias por-usuario).
const FORMULARIO_CIVIL_FILL = {
	title: "Test Formulario Civil — Pérez c/ Gómez",
	fields: {
		// Actor
		actor_nombre_apellido: "PÉREZ, María Fernanda",
		actor_dni: "28.456.789",
		actor_domicilio: "Av. Rivadavia 4521, Piso 3 Dto. B",
		actor_telefono: "011 4903-5521",
		actor_email: "mfperez@gmail.com",
		actor_licencia: "B1 28456789",
		actor_conyuge: "GÓMEZ, Roberto Luis",
		actor_padre: "PÉREZ, Juan Carlos",
		actor_madre: "LÓPEZ, Ana María",
		actor_ocupacion: "Contadora Pública",
		actor_empresa: "Estudio Contable Sur SRL",
		actor_empresa_domicilio: "Lavalle 1234, CABA",
		actor_hijos: "2 (menores)",
		actor_escuela: "Instituto San José",
		actor_nacionalidad: "Argentina",
		actor_localidad: "CABA",
		actor_celular: "11 6234-5566",
		actor_fecha_nac: "15/03/1981",
		actor_estado_civil: "Casada",
		actor_estudios: "Universitarios",
		actor_ingresos: "$ 850.000",
		// Datos del hecho
		hecho_lugar: "Av. Córdoba y Callao",
		hecho_fecha: "12/05/2026",
		hecho_comisaria: "Comisaría 3ª",
		hecho_ufi: "UFI 12",
		hecho_causa: "45678/26",
		hecho_localidad: "CABA",
		hecho_hora: "14:30",
		hecho_instructor: "Of. Ramírez",
		hecho_juzgado: "Civil N° 45",
		// Demandado
		dem_conductor: "GÓMEZ, Diego Alberto",
		dem_conductor_dni: "30.123.456",
		dem_conductor_domicilio: "Perón 2345, CABA",
		dem_asegurado: "GÓMEZ, Diego Alberto",
		dem_asegurado_dni: "30.123.456",
		dem_asegurado_domicilio: "Perón 2345, CABA",
		dem_titular: "TRANSPORTES DEL SUR SA",
		dem_titular_dni: "30-71234567-8",
		dem_titular_domicilio: "Av. Warnes 890, CABA",
		// Vehículo demandado
		veh_dem_marca: "Ford",
		veh_dem_modelo: "Ranger 2022",
		veh_dem_dominio: "AF345BC",
		veh_dem_seguro: "La Segunda Seguros",
		veh_dem_poliza: "7788990",
		veh_dem_stro: "1122334",
		veh_dem_danos: "Frontal",
		// Vehículo cliente
		veh_cli_marca: "Volkswagen",
		veh_cli_modelo: "Gol Trend 2019",
		veh_cli_dominio: "AC128KJ",
		veh_cli_seguro: "Sancor Seguros",
		veh_cli_stro: "9988776",
		veh_cli_poliza: "5566778",
		veh_cli_danos: "Lateral izq.",
		// Hospitales
		hospital_1: "Hospital Fernández",
		hospital_2: "Sanatorio Güemes",
		hospital_3: "Clínica Bazterrica",
		hospital_4: "Hospital Durand",
		hospital_5: "Clínica del Sol",
		historia_clinica: "HC N° 445.678 — Hospital Fernández, Servicio de Traumatología, ingreso 12/05/2026",
		// Testigos del hecho
		th1_nombre: "MARTÍNEZ, Carla",
		th1_domicilio: "Salguero 456, CABA",
		th1_ocupacion: "Comerciante",
		th1_dni: "27.888.999",
		th1_telefono: "11 5544-3322",
		th2_nombre: "SOSA, Julián",
		th2_domicilio: "Bulnes 789, CABA",
		th2_ocupacion: "Empleado",
		th2_dni: "33.444.555",
		th2_telefono: "11 6677-8899",
		// Testigos del beneficio
		tb1_nombre: "RÍOS, Marta",
		tb1_domicilio: "Medrano 1010, CABA",
		tb1_ocupacion: "Docente",
		tb1_telefono: "11 4455-6677",
		tb2_nombre: "ACOSTA, Pedro",
		tb2_domicilio: "Yatay 222, CABA",
		tb2_ocupacion: "Jubilado",
		tb2_telefono: "11 2233-4455",
		tb3_nombre: "VEGA, Lucía",
		tb3_domicilio: "Gascón 333, CABA",
		tb3_ocupacion: "Enfermera",
		tb3_telefono: "11 8899-0011",
		tb1_dni: "26.111.222",
		tb2_dni: "24.333.444",
		tb3_dni: "31.555.666",
		// Datos del cliente
		cli_propiedades: "Departamento (Rivadavia 4521)",
		cli_tarjetas: "Visa, Mastercard",
		cli_convivientes: "Cónyuge + 2 hijos",
		cli_vivienda: "3 amb., buen estado",
		cli_automovil: "VW Gol 2019",
		cli_moto: "No",
		cli_alquiler: "No (propietaria)",
		cli_viajo_exterior: "No",
		cli_obra_social: "OSDE 210",
		cli_art: "Provincia ART",
		// Campos adicionales para la demanda (capture-only)
		aseg_cuit: "30-68012345-9",
		aseg_domicilio: "Av. Corrientes 456, Piso 10, CABA",
		hospital_1_direccion: "Cerviño 3356, CABA",
		lesion_1: "Traumatismo de cráneo",
		lesion_2: "Fractura de muñeca derecha",
		lesion_3: "Cervicalgia post-traumática",
		taller_nombre: "Taller Mecánico El Rápido",
		taller_direccion: "Av. Warnes 1200, CABA",
		taller_fecha_presupuesto: "20/05/2026",
		doc_bono: "X",
		doc_dni_cedula_licencia: "X",
		doc_acta_mediacion: "X",
		doc_certificados_medicos: "X",
		doc_presupuesto: "X",
		doc_fotos_danos: "X",
		doc_recibo_sueldo: "X",
		// Monto
		monto_reclamado: "$ 2.400.000",
		monto_cod: "01",
		// Datos del letrado (del perfil, editable)
		abogado_nombre: "PÉREZ, María Laura",
		abogado_tomo: "101",
		abogado_folio: "543",
		abogado_pad: "P",
		// Objeto del juicio (select de código: 257 = Daños y Perjuicios)
		objeto_codigo: "257",
		objeto_descripcion: "DAÑOS Y PERJUICIOS",
		// Mediación
		mediacion_juz: "Mediación N° 12",
		mediacion_tipo: "Privada",
		// Defensorías y Fiscalía
		def_menores: "No",
		def_pobres: "No",
		fiscalia: "No",
		// Conexidad
		conexo_juz: "Juzgado Civil N° 45",
		conexo_expediente_nro: "12345",
		conexo_expediente_anio: "2024",
		// Exhorto
		exhorto_nro_exp: "9876/24",
		exhorto_dependencia: "Juzgado Civil N° 5, Córdoba",
		exhorto_juez: "Dr. Rodríguez",
		exhorto_caratula: "Pérez c/ Gómez s/ Daños",
		exhorto_fecha_dia: "01",
		exhorto_fecha_mes: "07",
		exhorto_fecha_anio: "2026",
	},
};

const DEV_FILL_DATA: Record<string, { title: string; fields: Record<string, string> }> = {
	formulario_civil_spoltore: FORMULARIO_CIVIL_FILL,
	formulario_civil_artista: FORMULARIO_CIVIL_FILL,
	planilla_inicio_civil: {
		title: "Test Planilla Civil — González c/ Empresa S.A.",
		fields: {
			solicitud_medidas: "X",
			objeto_codigo: "257",
			objeto_descripcion: "DAÑOS Y PERJUICIOS",
			abogado_pad: "P",
			abogado_tomo: "101",
			abogado_folio: "543",
			abogado_nombre: "PÉREZ, María Laura",
			conexo_juz: "45",
			conexo_expediente_nro: "12345",
			conexo_expediente_anio: "2026",
			mediacion_juz: "12",
			mediacion_tipo: "Judicial",
			def_menores: "No",
			def_pobres: "No",
			fiscalia: "Sí",
			monto_cod: "01",
			monto_valor: "$ 1.500.000",
			actor1_nombre: "GONZÁLEZ, Juan Carlos",
			actor1_tipo_doc: "DNI",
			actor1_numero: "30.123.456",
			actor1_nacionalidad: "Argentina",
			actor2_nombre: "GONZÁLEZ, Ana María",
			actor2_tipo_doc: "DNI",
			actor2_numero: "32.987.654",
			actor2_nacionalidad: "Argentina",
			// Filas 3-6 cubiertas para verificar todos los renglones.
			...Object.fromEntries(
				Array.from({ length: 4 }, (_, i) => i + 3).flatMap((n) => [
					[`actor${n}_nombre`, `ACTOR DE PRUEBA ${n} — RENGLÓN ${n}`],
					[`actor${n}_tipo_doc`, "DNI"],
					[`actor${n}_numero`, `${String(20 + n)}.111.${String(100 + n)}`],
					[`actor${n}_nacionalidad`, "Argentina"],
				]),
			),
			demandado1_nombre: "EMPRESA S.A.",
			demandado1_tipo_doc: "CUIT",
			demandado1_numero: "30-71234567-8",
			demandado1_nacionalidad: "Argentina",
			demandado2_nombre: "SEGUROS DEL SUR S.A.",
			demandado2_tipo_doc: "CUIT",
			demandado2_numero: "30-65432198-2",
			demandado2_nacionalidad: "Argentina",
			// Filas 3-7 cubiertas para verificar todos los renglones.
			...Object.fromEntries(
				Array.from({ length: 5 }, (_, i) => i + 3).flatMap((n) => [
					[`demandado${n}_nombre`, `DEMANDADO DE PRUEBA ${n} S.A. — RENGLÓN ${n}`],
					[`demandado${n}_tipo_doc`, "CUIT"],
					[`demandado${n}_numero`, `30-7000000${n}-5`],
					[`demandado${n}_nacionalidad`, "Argentina"],
				]),
			),
			exhorto_nro_exp: "9876/24",
			exhorto_fecha_dia: "01",
			exhorto_fecha_mes: "07",
			exhorto_fecha_anio: "2026",
			exhorto_dependencia: "Juzgado Civil N° 5",
			exhorto_juez: "Dr. Rodríguez",
			exhorto_caratula: "González c/ Empresa S.A.",
			fecha_formulario_dia: "01",
			fecha_formulario_mes: "07",
			fecha_formulario_anio: "2026",
		},
	},
	formulario_ingreso_demandas_ccf: {
		title: "Test CCF — Pérez c/ Obra Social Unión Personal",
		fields: {
			objeto_codigo: "304",
			objeto_descripcion: "AMPARO DE SALUD",
			abogado1_pa: "P",
			abogado1_tomo: "101",
			abogado1_folio: "543",
			abogado1_nombre: "PÉREZ, María Laura",
			abogado1_cuit: "27-28765432-1",
			abogado2_pa: "A",
			abogado2_tomo: "98",
			abogado2_folio: "222",
			abogado2_nombre: "GÓMEZ, Carlos Alberto",
			abogado2_cuit: "20-22333444-5",
			judicial_juzgado: "7",
			judicial_secretaria: "14",
			judicial_expte_anio: "4521/2024",
			judicial_caratula: "PÉREZ, JUAN C/ OBRA SOCIAL UNIÓN PERSONAL S/ AMPARO DE SALUD",
			admin_organismo: "SSSalud",
			admin_exp_principal: "EX-2024-12345678-APN — PÉREZ JUAN S/ RECLAMO PRESTACIONAL",
			admin_incidente: "INC-2024-555 — MEDIDA CAUTELAR",
			admin_resolucion: "RESOL-2024-99-APN",
			actor1_nombre: "PÉREZ, Juan Carlos",
			actor1_dni: "20-30123456-7",
			actor2_nombre: "PÉREZ, Ana María",
			actor2_dni: "27-32987654-3",
			actor3_nombre: "PÉREZ, Lucía Beatriz",
			actor3_dni: "23-35111222-4",
			actor4_nombre: "SUCESIÓN DE PÉREZ, ROBERTO",
			actor4_dni: "20-08123456-1",
			demandado1_nombre: "OBRA SOCIAL UNIÓN PERSONAL",
			demandado1_dni: "30-54666554-9",
			demandado2_nombre: "ESTADO NACIONAL — MINISTERIO DE SALUD",
			demandado2_dni: "30-54666023-8",
			demandado3_nombre: "SWISS MEDICAL S.A.",
			demandado3_dni: "30-65485264-5",
			demandado4_nombre: "GALENO ARGENTINA S.A.",
			demandado4_dni: "30-68626371-9",
			mediacion_numero: "8877",
			mediacion_anio: "2025",
			mediacion_ley26589: "X",
			mediacion_promesa: "",
			monto_moneda: "PESOS",
			monto_importe: "15.000.000",
			tasa_abonar: "",
			tasa_exento: "X",
			tasa_no_alcanzado: "",
			tasa_pago_diferido: "",
			fecha_formulario: "01/07/2026",
		},
	},
	formulario_inicio_laboral_anexo2: {
		title: "Test Anexo II Laboral — Espinosa c/ Cervecería Quilmes",
		fields: {
			// Todas las filas cubiertas para verificar cada renglón del formulario.
			...Object.fromEntries(
				Array.from({ length: 20 }, (_, i) => i + 1).flatMap((n) => [
					[`actor${n}_poder`, String(n)],
					[`actor${n}_nombre`, `ACTOR DE PRUEBA ${n} — RENGLÓN ${n}`],
					[`actor${n}_dni`, `${String(20 + n)}.111.${String(100 + n)}`],
				]),
			),
			actor1_poder: "1",
			actor1_nombre: "ESPINOSA MARIA PAULA",
			actor1_dni: "25.805.121",
			...Object.fromEntries(
				Array.from({ length: 9 }, (_, i) => i + 1).flatMap((n) => [
					[`demandado${n}_nombre`, `DEMANDADO DE PRUEBA ${n} S.A. CUIT 30-7000000${n}-5 — RENGLÓN ${n}`],
					[`demandado${n}_domicilio`, `CALLE DE PRUEBA ${n * 100}, PISO ${n}, CABA — RENGLÓN ${n}`],
				]),
			),
			demandado1_nombre: "CERVECERÍA Y MALTERÍA QUILMES S.A.I.C.A. y G. CUIT 33-50835825-9",
			demandado1_domicilio: "12 DE OCTUBRE 100, QUILMES (B1878AAB), BUENOS AIRES",
			patrocinante_nombre: "PÉREZ, María Laura",
			patrocinante_tomo: "109",
			patrocinante_folio: "47",
			patrocinante_matricula: "CPACF",
			apoderado_nombre: "GÓMEZ, Carlos Alberto",
			apoderado_tomo: "98",
			apoderado_folio: "222",
			apoderado_matricula: "CPACF",
			objeto_codigo: "1A",
			monto: "26.099.921,84",
			previno_juzgado: "15",
			expte_nro: "4521/2026",
			domicilio_actora: "Av. CALLAO 1103 2º A, CABA",
		},
	},
	formulario_inicio_comercial: {
		title: "Test Comercial — Pérez c/ Distribuidora del Plata",
		fields: {
			objeto_codigo: "13",
			objeto_descripcion: "CONCURSO PREVENTIVO",
			abogado1_pa: "P",
			abogado1_tomo: "109",
			abogado1_folio: "47",
			abogado1_nombre: "PÉREZ, María Laura",
			abogado1_cuit: "27-28765432-1",
			abogado2_pa: "A",
			abogado2_tomo: "98",
			abogado2_folio: "222",
			abogado2_nombre: "GÓMEZ, Carlos Alberto",
			abogado2_cuit: "20-22333444-5",
			monto_moneda: "A",
			monto_importe: "15.000.000",
			// Todas las filas cubiertas para verificar cada renglón.
			...Object.fromEntries(
				Array.from({ length: 7 }, (_, i) => i + 1).flatMap((n) => [
					[`actor${n}_nombre`, `ACTOR DE PRUEBA ${n} — RENGLÓN ${n}`],
					[`actor${n}_tipo_doc`, "DU"],
					[`actor${n}_numero`, `${String(20 + n)}.111.${String(100 + n)}`],
					[`actor${n}_cuit`, `20-${String(20 + n)}111${String(100 + n)}-3`],
				]),
			),
			actor1_nombre: "PÉREZ, Juan Carlos",
			actor1_numero: "30.123.456",
			actor1_cuit: "20-30123456-7",
			...Object.fromEntries(
				Array.from({ length: 4 }, (_, i) => i + 1).flatMap((n) => [
					[`demandado${n}_nombre`, `DEMANDADO DE PRUEBA ${n} S.A. — RENGLÓN ${n}`],
					[`demandado${n}_cuit`, `30-7000000${n}-5`],
				]),
			),
			demandado1_nombre: "DISTRIBUIDORA DEL PLATA S.A.",
			demandado1_cuit: "30-71234567-8",
			mediacion_numero: "8877",
			mediacion_anio: "2025",
			fecha_formulario: "01/07/2026",
		},
	},
	formulario_inicio_conadmfed: {
		title: "Test ConAdmFed — Pérez c/ Estado Nacional",
		fields: {
			tasa_abonar: "",
			tasa_exento: "X",
			tasa_no_alcanzado: "",
			tasa_pago_diferido: "",
			objeto_codigo: "3",
			objeto_descripcion: "EMPLEO PUBLICO",
			...Object.fromEntries(
				Array.from({ length: 3 }, (_, i) => i + 1).flatMap((n) => [
					[`abogado${n}_nombre`, `ABOGADO DE PRUEBA ${n}`],
					[`abogado${n}_pa`, n === 1 ? "P" : "A"],
					[`abogado${n}_tomo`, `10${n}`],
					[`abogado${n}_folio`, `4${n}`],
					[`abogado${n}_cuit`, `20-1112223${n}-4`],
				]),
			),
			abogado1_nombre: "PÉREZ, María Laura",
			expediente_caratula: "PÉREZ C/ EN-M INTERIOR S/ EMPLEO PÚBLICO",
			expediente_nro: "4521/2025",
			sala_juzgado: "JUZG. 7",
			monto_moneda: "A",
			monto_importe: "15.000.000",
			// 12 bloques de actores completos para verificar cada campo de cada bloque.
			...Object.fromEntries(
				Array.from({ length: 12 }, (_, i) => i + 1).flatMap((n) => [
					[`actor${n}_nombre`, `ACTOR DE PRUEBA ${n} — BLOQUE ${n}`],
					[`actor${n}_igj`, n % 3 === 0 ? `IGJ ${1000 + n}` : ""],
					[`actor${n}_tipo_doc`, "DNI"],
					[`actor${n}_numero`, `${String(20 + n)}.111.${String(100 + n)}`],
					[`actor${n}_cuit`, `20-${String(20 + n)}111${String(100 + n)}-3`],
					[`actor${n}_apellido_materno`, `MATERNO ${n}`],
					[`actor${n}_dd_calle`, `CALLE DENUNCIADA ${n * 100}`],
					[`actor${n}_dd_piso`, String(n)],
					[`actor${n}_dd_dto`, "A"],
					[`actor${n}_dd_cp`, `10${String(40 + n)}`],
					[`actor${n}_dd_ciudad`, "CABA"],
					[`actor${n}_dd_provincia`, "BUENOS AIRES"],
					[`actor${n}_dc_calle`, `CALLE CONSTITUIDA ${n * 100}`],
					[`actor${n}_dc_piso`, String(n)],
					[`actor${n}_dc_dto`, "B"],
					[`actor${n}_dc_cp`, `10${String(40 + n)}`],
				]),
			),
			actor1_nombre: "PÉREZ, Juan Carlos",
			...Object.fromEntries(
				Array.from({ length: 4 }, (_, i) => i + 1).map((n) => [`demandado${n}_nombre`, `ESTADO NACIONAL — DEMANDADO ${n} — RENGLÓN ${n}`]),
			),
			fecha_formulario: "01/07/2026",
		},
	},
	formulario_inicio_scba: {
		title: "Test SCBA Inicio 13951 — González c/ Transportes La Costa",
		fields: {
			receptoria_departamento: "Depto. Judicial La Plata",
			urgente: "X",
			sortear_mediador: "X",
			fuero_civil_comercial: "X",
			fuero_laboral: "",
			fuero_contencioso: "",
			materia_codigo: "100",
			actores_cantidad: "2",
			demandados_cantidad: "2",
			formularios_adicionales: "1",
			actor1_tipo_f: "X",
			actor1_tipo_j: "",
			actor1_tipo_o: "",
			actor1_tipo_doc: "D.N.I.",
			actor1_numero: "30.123.456",
			actor1_nombre: "GONZÁLEZ DE PÉREZ, MARÍA LAURA",
			actor2_tipo_f: "",
			actor2_tipo_j: "X",
			actor2_tipo_o: "",
			actor2_tipo_doc: "S.A.",
			actor2_numero: "30-71234567-8",
			actor2_nombre: "EMPRESA ACTORA S.A.",
			demandado1_tipo_f: "",
			demandado1_tipo_j: "X",
			demandado1_tipo_o: "",
			demandado1_tipo_doc: "S.R.L.",
			demandado1_numero: "30-99887766-1",
			demandado1_nombre: "TRANSPORTES LA COSTA S.R.L.",
			demandado2_tipo_f: "",
			demandado2_tipo_j: "",
			demandado2_tipo_o: "X",
			demandado2_tipo_doc: "S. del Edo.",
			demandado2_numero: "30-54666554-9",
			demandado2_nombre: "FISCO DE LA PROVINCIA DE BUENOS AIRES",
			prorroga_jurisdiccion: "",
			beneficio_litigar: "X",
			tasa_justicia: "",
			asignacion1_juzgado: "5",
			asignacion1_causa_anio: "4521/24",
			asignacion1_caratula: "PÉREZ C/ TRANSPORTES S/ DAÑOS — RENGLÓN 1",
			asignacion1_cod_materia: "100",
			asignacion2_juzgado: "7",
			asignacion2_causa_anio: "881/23",
			asignacion2_caratula: "SEGUNDA ASIGNACIÓN DE PRUEBA — RENGLÓN 2",
			asignacion2_cod_materia: "96",
			asignacion3_juzgado: "2",
			asignacion3_causa_anio: "15/22",
			asignacion3_caratula: "TERCERA ASIGNACIÓN DE PRUEBA — RENGLÓN 3",
			asignacion3_cod_materia: "80",
			monto_juicio: "15.000.000",
			localidad: "LA PLATA",
			partido: "LA PLATA",
			complemento_caratula: "DAÑOS Y PERJUICIOS — ACCIDENTE DE TRÁNSITO",
			observaciones: "OBSERVACIONES DE PRUEBA DEL FORMULARIO",
			abogado1_cuit: "27-28765432-1",
			abogado1_jurisdiccion: "6 - La Plata",
			abogado1_nombre: "PÉREZ, María Laura",
			abogado2_cuit: "20-22333444-5",
			abogado2_jurisdiccion: "13 - Quilmes",
			abogado2_nombre: "GÓMEZ, Carlos Alberto",
			organo_denominacion: "DEFENSORÍA CIVIL N° 3 DE LA PLATA",
			organo_numero: "3",
		},
	},
	formulario_demandados_scba: {
		title: "Test SCBA Demandados — González c/ Empresa del Sur",
		fields: {
			receptoria_departamento: "LA PLATA",
			nro_causa: "123456",
			anio: "2026",
			fuero: "Civil y Comercial",
			juzgado_tribunal: "5",
			demandado1_tipo_f: "X",
			demandado1_tipo_j: "",
			demandado1_tipo_o: "",
			demandado1_tipo_doc: "D.N.I.",
			demandado1_numero_doc: "30.123.456",
			demandado1_nombre: "GONZÁLEZ DE PÉREZ, MARÍA LAURA",
			demandado2_tipo_f: "",
			demandado2_tipo_j: "X",
			demandado2_tipo_o: "",
			demandado2_tipo_doc: "S.A.",
			demandado2_numero_doc: "30-71234567-8",
			demandado2_nombre: "EMPRESA CONSTRUCTORA DEL SUR S.A.",
			demandado3_tipo_f: "",
			demandado3_tipo_j: "X",
			demandado3_tipo_o: "",
			demandado3_tipo_doc: "S.R.L.",
			demandado3_numero_doc: "30-99887766-1",
			demandado3_nombre: "TRANSPORTES LA COSTA S.R.L.",
			demandado4_tipo_f: "",
			demandado4_tipo_j: "",
			demandado4_tipo_o: "X",
			demandado4_tipo_doc: "S. del Edo.",
			demandado4_numero_doc: "30-54666554-9",
			demandado4_nombre: "FISCO DE LA PROVINCIA DE BUENOS AIRES",
			cantidad_demandados: "4",
		},
	},
	carta_poder_srt: {
		title: "Test Carta Poder SRT",
		fields: {
			suscribe_nombre: "García Juan Carlos",
			suscribe_tipo_doc: "DNI",
			suscribe_doc: "30.123.456",
			suscribe_sexo_m: "X",
			suscribe_domicilio: "Av. Corrientes 1234",
			suscribe_cp: "1043",
			suscribe_email: "juan@email.com",
			suscribe_telefono: "+54 11 5555-1234",
			apoderado_nombre: "López María Beatriz",
			apoderado_tipo_doc: "CUIT",
			apoderado_doc: "27-28765432-1",
			apoderado_parentesco: "Letrado apoderado",
			apoderado_matricula: "T54 F321",
			apoderado_domicilio: "Florida 890 piso 3",
			apoderado_cp: "1005",
			apoderado_email: "mlopez@estudio.com",
			apoderado_telefono: "+54 11 4444-5678",
		},
	},
	telegrama_laboral: {
		title: "Test Telegrama Laboral",
		fields: {
			dest_nombre: "ACME S.A.",
			dest_ramo: "Comercio",
			dest_domicilio: "Av. Corrientes 1234",
			dest_cp: "1043",
			dest_localidad: "Buenos Aires",
			dest_provincia: "CABA",
			rem_nombre: "García Juan Carlos",
			rem_dni: "30.123.456",
			rem_fecha: "2024-03-14",
			rem_domicilio: "Av. de Mayo 123",
			rem_cp: "1002",
			rem_localidad: "Buenos Aires",
			rem_provincia: "CABA",
			cuerpo: "Por la presente me dirijo a Ud. a fin de comunicarle mi renuncia al cargo desempeñado, con efectos a partir de la fecha.",
			tipo: "Opción1",
		},
	},
	cedula_notificacion_22172: {
		title: "Test Cédula 22.172 (interjurisdiccional)",
		fields: {
			tribunal: "Juzgado Nacional Civil Nro. 82 - Sec. 163",
			juzgado_domicilio: "Av. de los Inmigrantes 1950, CABA",
			destinatario_nombre: "Pérez Roberto Daniel",
			destinatario_domicilio: "Corrientes 3456 Piso 2 Dto. B, Rosario",
			tipo_domicilio: "constituido",
			caracter: "urgente",
			observaciones: "",
			tabla_orden: "001",
			tabla_exp_nro: "12345/2024",
			tabla_zona: "1",
			tabla_fuero: "CIV",
			tabla_juzgado: "82",
			tabla_secretaria: "163",
			tabla_copias: "1",
			tabla_personal: "",
			tabla_observaciones: "",
			expediente_caratulado: "García c/ Pérez s/ daños y perjuicios",
			resolucion: "Córrase traslado de la demanda por el término de ley.",
			notificado_genero: "o",
			fecha_dia: "15",
			fecha_mes: "marzo",
			fecha_anio: "25",
		},
	},
	cedula_notificacion_com: {
		title: "Test Cédula de Notificación Comercial",
		fields: {
			juzgado_nro: "12",
			secretaria_nro: "23",
			juzgado_domicilio: "Av. Corrientes 330",
			destinatario_nombre: "Sociedad Anónima Industrial S.A.",
			destinatario_domicilio: "Av. Córdoba 1234 Piso 5, CABA",
			tipo_domicilio: "constituido",
			caracter: "urgente",
			observaciones: "",
			tabla_orden: "001",
			tabla_exp_nro: "22567/2024",
			tabla_zona: "1",
			tabla_fuero: "COM",
			tabla_juzgado: "12",
			tabla_secretaria: "23",
			tabla_copias: "1",
			tabla_personal: "",
			tabla_observaciones: "",
			expediente_caratulado: "Empresa SA c/ Otra Empresa SA s/ ordinario cobro de pesos",
			resolucion: "Córrase traslado de la demanda por el término de ley.",
			notificado_genero: "o",
			fecha_dia: "15",
			fecha_mes: "marzo",
			fecha_anio: "25",
		},
	},
	cedula_notificacion: {
		title: "Test Cédula de Notificación",
		fields: {
			juzgado_nro: "82",
			secretaria_nro: "163",
			juzgado_domicilio: "Av. de los Inmigrantes 1950",
			destinatario_nombre: "Pérez Roberto Daniel",
			destinatario_domicilio: "Corrientes 3456 Piso 2 Dto. B, CABA",
			tipo_domicilio: "constituido",
			caracter: "urgente",
			observaciones: "Urgente. Habilitación de día y hora inhábil.",
			tabla_orden: "001",
			tabla_exp_nro: "12345/2024",
			tabla_zona: "1",
			tabla_fuero: "CIV",
			tabla_juzgado: "82",
			tabla_secretaria: "163",
			tabla_copias: "1",
			tabla_personal: "",
			tabla_observaciones: "",
			expediente_caratulado:
				"García Rodríguez Juan Carlos c/ Pérez Martínez Roberto Daniel s/ daños y perjuicios derivados de accidente de tránsito",
			resolucion:
				"Córrase traslado de la demanda por el término de ley. Asimismo, fíjase audiencia para el día 20 de abril de 2025 a las 10:00 hs.",
			notificado_genero: "o",
			fecha_dia: "15",
			fecha_mes: "marzo",
			fecha_anio: "25",
		},
	},
};

// ── Validación de obligatorios para GENERAR ──────────────────────────────────
// El borrador solo requiere título; GENERAR exige los campos obligatorios del modelo.
// Devuelve la lista de rótulos faltantes (vacío = se puede generar).
function getMissingRequired(template: PdfTemplate | null, values: Record<string, string>): string[] {
	if (!template) return [];
	const has = (k: string) => !!(values[k] || "").trim();
	const missing: string[] = [];
	const slug = template.slug || "";
	if (slug.startsWith("formulario_civil_")) {
		if (!has("actor_nombre_apellido")) missing.push("Actor: nombre y apellido");
		if (!has("actor_dni")) missing.push("Actor: DNI");
		if (!has("dem_conductor") && !has("dem_titular") && !has("dem_asegurado")) missing.push("Al menos un demandado (conductor, titular o asegurado)");
		if (!has("hecho_lugar")) missing.push("Hecho: lugar");
		if (!has("hecho_fecha")) missing.push("Hecho: fecha");
		if (!has("monto_reclamado")) missing.push("Monto reclamado");
		if (!has("abogado_nombre")) missing.push("Abogado: nombre");
		if (!has("abogado_tomo")) missing.push("Abogado: tomo");
		if (!has("abogado_folio")) missing.push("Abogado: folio");
		if (!has("abogado_pad")) missing.push("Abogado: P/A/D");
		if (!has("objeto_codigo")) missing.push("Objeto del juicio");
		return missing;
	}
	if (slug === "planilla_inicio_civil") {
		if (!has("objeto_codigo")) missing.push("Objeto del juicio");
		if (!has("abogado_nombre")) missing.push("Abogado: nombre");
		if (!has("abogado_tomo")) missing.push("Abogado: tomo");
		if (!has("abogado_folio")) missing.push("Abogado: folio");
		if (!has("abogado_pad")) missing.push("Abogado: P/A/D");
		if (!has("monto_cod")) missing.push("Monto: código");
		if (!has("monto_valor")) missing.push("Monto: valor");
		if (!has("actor1_nombre")) missing.push("Al menos un actor");
		if (!has("demandado1_nombre")) missing.push("Al menos un demandado");
		return missing;
	}
	// Genérico: cualquier campo con required:true en el template.
	for (const f of template.fields || []) {
		if (f.required && f.type !== "ai-prompt" && f.type !== "flow-section" && !has(f.name)) missing.push(f.label || f.name);
	}
	return missing;
}

// ── Mapeo contactos (sin cambios) ────────────────────────────────────────────

function contactToFormValues(contact: Contact, group: ContactGroupKey): Record<string, string> {
	const fullName =
		group === "destinatario" && contact.type === "Jurídica"
			? contact.company || `${contact.name} ${contact.lastName || ""}`.trim()
			: `${contact.name} ${contact.lastName || ""}`.trim();

	if (group === "destinatario") {
		return {
			dest_nombre: fullName,
			dest_ramo: contact.activity || "",
			dest_domicilio: contact.address || "",
			dest_cp: contact.zipCode || "",
			dest_localidad: contact.city || "",
			dest_provincia: contact.state || "",
		};
	}
	if (group === "remitente") {
		return {
			rem_nombre: fullName,
			rem_dni: contact.document || "",
			rem_domicilio: contact.address || "",
			rem_cp: contact.zipCode || "",
			rem_localidad: contact.city || "",
			rem_provincia: contact.state || "",
		};
	}
	return {
		suscribe_nombre: fullName,
		suscribe_doc: contact.document || "",
		suscribe_domicilio: contact.address || "",
		suscribe_cp: contact.zipCode || "",
		suscribe_email: contact.email || "",
		suscribe_telefono: contact.phone || "",
	};
}

// ── Mapeo Planilla Civil (actores / demandados / abogado) ─────────────────────

/** Tipo y número de documento de un contacto (prioriza CUIT). */
function contactDocParts(contact: Contact): { tipo: string; numero: string } {
	if (contact.cuit) return { tipo: "CUIT", numero: contact.cuit };
	if (contact.document) return { tipo: "DNI", numero: contact.document };
	return { tipo: "", numero: "" };
}

/** Nombre a mostrar de un contacto (razón social si es jurídica). */
function contactDisplayName(contact: Contact): string {
	if (contact.type === "Jurídica" && contact.company) return contact.company;
	const full = `${contact.lastName || ""}${contact.lastName ? ", " : ""}${contact.name || ""}`.trim();
	return full || contact.company || "";
}

/** Vuelca una lista de contactos en filas prefijadas (actor1_*, demandado1_*, ...).
 *  El selector es la fuente de verdad: rellena las filas seleccionadas y vacía el resto. */
function contactsToRowValues(contacts: Contact[], prefix: string, maxRows: number): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 0; i < maxRows; i++) {
		const n = i + 1;
		const c = contacts[i];
		const { tipo, numero } = c ? contactDocParts(c) : { tipo: "", numero: "" };
		out[`${prefix}${n}_nombre`] = c ? contactDisplayName(c) : "";
		out[`${prefix}${n}_tipo_doc`] = tipo;
		out[`${prefix}${n}_numero`] = numero;
		out[`${prefix}${n}_nacionalidad`] = c ? contact_nationality(c) : "";
		// Variante CCF: una sola columna de documento (actorN_dni / demandadoN_dni).
		out[`${prefix}${n}_dni`] = numero;
		// Variante SCBA demandados: N° de doc/CUIT + checkboxes de tipo de persona (F/J).
		out[`${prefix}${n}_numero_doc`] = numero;
		out[`${prefix}${n}_tipo_f`] = c ? (c.type === "Jurídica" ? "" : "X") : "";
		out[`${prefix}${n}_tipo_j`] = c && c.type === "Jurídica" ? "X" : "";
		out[`${prefix}${n}_tipo_o`] = "";
		// Variante Anexo II laboral: domicilio del demandado.
		out[`${prefix}${n}_domicilio`] = c?.address || "";
		// Variante Comercial: CUIT/CUIL en columna propia (además del documento).
		out[`${prefix}${n}_cuit`] = c?.cuit || "";
		// Variante ConAdmFed: domicilio denunciado (calle/ciudad/provincia del contacto).
		out[`${prefix}${n}_dd_calle`] = c?.address || "";
		out[`${prefix}${n}_dd_ciudad`] = c?.city || "";
		out[`${prefix}${n}_dd_provincia`] = c?.state || "";
	}
	return out;
}

function contact_nationality(c: Contact): string {
	return c.nationality || "";
}

/** Parsea Tomo/Folio de un registrationNumber tipo "T123 F456", "T° 123 F° 456" o "123/456". */
// Extrae Tomo y Folio de la matrícula guardada como string. Regla: primer número = Tomo,
// segundo número = Folio. Cubre "Tº109Fº47", "Tomo 109 Folio 47", "Tomo109, Folio47", "109/47", etc.
function parseTomoFolio(reg?: string): { tomo: string; folio: string } {
	if (!reg) return { tomo: "", folio: "" };
	const s = String(reg);
	// Patrón explícito T…(número)…F…(número) (prioridad: evita tomar un número suelto previo).
	const tf = s.match(/T[^\d]*(\d+)[^\d]*?F[^\d]*(\d+)/i);
	if (tf) return { tomo: tf[1], folio: tf[2] };
	// Fallback: los primeros dos grupos de números en orden.
	const nums = s.match(/\d+/g);
	if (nums && nums.length >= 2) return { tomo: nums[0], folio: nums[1] };
	if (nums && nums.length === 1) return { tomo: nums[0], folio: "" };
	return { tomo: "", folio: "" };
}

// Nombre exacto del colegio para el fuero nacional (matrícula usada en estos formularios).
const CPACF_NAME = "Colegio Público de Abogados de la Capital Federal";

// Extrae los datos del abogado desde el perfil, matcheando la matrícula del CPACF (fuero nacional).
function getAbogadoFromProfile(user: any): { nombre: string; tomo: string; folio: string; cuit: string; cpacfFound: boolean } {
	const skills = Array.isArray(user?.skill) ? user.skill : [];
	const cpacf = skills.find((s: any) => s?.name === CPACF_NAME);
	const { tomo, folio } = parseTomoFolio(cpacf?.registrationNumber);
	const nombre = `${user?.lastName || ""}${user?.lastName ? ", " : ""}${user?.firstName || user?.name || ""}`.trim();
	const cuit = String(cpacf?.taxCode || skills.find((s: any) => s?.taxCode)?.taxCode || "");
	return { nombre, tomo, folio, cuit, cpacfFound: !!cpacf };
}

/** Rol de parte de un contacto para la Planilla: 'actor' | 'demandado' | null. */
function contactPartyRole(contact: Contact): "actor" | "demandado" | null {
	const tp = (contact.intervinienteRef?.tipoParte || "").toUpperCase();
	if (tp.includes("ACTOR")) return "actor";
	if (tp.includes("DEMANDA")) return "demandado";
	const roles = (Array.isArray(contact.role) ? contact.role : [contact.role || ""]).join(" ").toLowerCase();
	if (/actor|cliente|peticionante|causante/.test(roles)) return "actor";
	if (/demandad|contraparte/.test(roles)) return "demandado";
	return null;
}

// ── Filas repetibles data-driven ──────────────────────────────────────────────
// Detecta grupos con campos tipo `<base><n>_<attr>` (ej. actor1_nombre, demandado3_numero)
// y los agrupa por fila. Data-driven: sirve para cualquier modelo futuro con el mismo patrón.

interface RepeatableRows {
	base: string; // "actor" / "demandado"
	rows: number[]; // índices de fila presentes en el template, ordenados
	byRow: Map<number, PdfTemplateField[]>; // fila → campos de esa fila
}

const REPEATABLE_RE = /^(.+?)(\d+)_(.+)$/;

function parseRepeatableRows(fields: PdfTemplateField[]): RepeatableRows | null {
	const byRow = new Map<number, PdfTemplateField[]>();
	let base: string | null = null;
	for (const f of fields) {
		const m = f.name.match(REPEATABLE_RE);
		if (!m) return null; // algún campo no encaja → no es un grupo repetible
		if (base === null) base = m[1];
		else if (base !== m[1]) return null; // bases mezcladas → no repetible
		const row = Number(m[2]);
		if (!byRow.has(row)) byRow.set(row, []);
		byRow.get(row)!.push(f);
	}
	if (base === null || byRow.size < 2) return null;
	const rows = [...byRow.keys()].sort((a, b) => a - b);
	return { base, rows, byRow };
}

function formValuesToContact(
	values: Record<string, string>,
	group: ContactGroupKey,
	contactType: "Humana" | "Jurídica",
	role: string,
): Partial<Contact> {
	if (group === "destinatario") {
		const raw = values.dest_nombre || "";
		const parts = raw.trim().split(/\s+/);
		return {
			name: parts[0] || raw,
			lastName: parts.slice(1).join(" ") || "-",
			...(contactType === "Jurídica" ? { company: raw } : {}),
			activity: values.dest_ramo || "",
			address: values.dest_domicilio || "",
			zipCode: values.dest_cp || "",
			city: values.dest_localidad || "",
			state: values.dest_provincia || "",
			type: contactType,
			role,
		};
	}
	if (group === "remitente") {
		const raw = values.rem_nombre || "";
		const parts = raw.trim().split(/\s+/);
		return {
			name: parts[0] || raw,
			lastName: parts.slice(1).join(" ") || "-",
			document: values.rem_dni || "",
			address: values.rem_domicilio || "",
			zipCode: values.rem_cp || "",
			city: values.rem_localidad || "",
			state: values.rem_provincia || "",
			type: contactType,
			role,
		};
	}
	const raw = values.suscribe_nombre || "";
	const parts = raw.trim().split(/\s+/);
	return {
		name: parts[0] || raw,
		lastName: parts.slice(1).join(" ") || "-",
		document: values.suscribe_doc || "",
		address: values.suscribe_domicilio || "",
		zipCode: values.suscribe_cp || "",
		email: values.suscribe_email || "",
		phone: values.suscribe_telefono || "",
		type: contactType,
		role,
	};
}

function getInitialFormValues(fields: PdfTemplateField[]): Record<string, string> {
	return fields.reduce((acc, f) => {
		// Los campos IA se precargan con la instrucción del modelo (editable por generación).
		acc[f.name] = f.type === "ai-prompt" ? f.aiPrompt || "" : "";
		return acc;
	}, {} as Record<string, string>);
}

function hasGroupData(formValues: Record<string, string>, group: ContactGroupKey): boolean {
	const nameKey = group === "destinatario" ? "dest_nombre" : group === "remitente" ? "rem_nombre" : "suscribe_nombre";
	return !!formValues[nameKey]?.trim();
}

function groupFieldsForRender(fields: PdfTemplateField[]): (PdfTemplateField | PdfTemplateField[])[] {
	const result: (PdfTemplateField | PdfTemplateField[])[] = [];
	let i = 0;
	while (i < fields.length) {
		if (fields[i].type === "checkbox") {
			const group: PdfTemplateField[] = [fields[i]];
			while (i + 1 < fields.length && fields[i + 1].type === "checkbox") {
				i++;
				group.push(fields[i]);
			}
			result.push(group);
		} else {
			result.push(fields[i]);
		}
		i++;
	}
	return result;
}

function getContactLabel(c: Contact): string {
	const name = `${c.name} ${c.lastName || ""}`.trim();
	const company = c.company ? ` (${c.company})` : "";
	return `${name}${company}`;
}

// ── Brand pill compartido ────────────────────────────────────────────────────

const CategoryPill = ({ label }: { label: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.2)}`,
				alignSelf: "flex-start",
			}}
		>
			<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
				{label}
			</Typography>
		</Box>
	);
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function CreatePostalDocumentModal({
	open,
	handleClose,
	prefilledTrackingId,
	preselectedTemplate,
	prefilledFolderId,
	resumeDoc,
	showSnackbar,
}: Props) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const allContacts: Contact[] = useSelector((state: any) => state.contacts?.contacts || []);
	const allFolders: FolderData[] = useSelector((state: any) => state.folder?.folders || []);
	const allTrackings: PostalTrackingType[] = useSelector((state: any) => state.postalTrackingReducer?.allTrackings || []);
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const user = useSelector((state: any) => state.auth?.user);

	const navigate = useNavigate();
	const [step, setStep] = useState<0 | 1>(0);
	// Documento recién generado → pantalla de resultado (para que el usuario sepa dónde quedó)
	const [generatedDoc, setGeneratedDoc] = useState<any | null>(null);
	const [demandaLoading, setDemandaLoading] = useState(false);
	const [genLoadingSlug, setGenLoadingSlug] = useState<string | null>(null);
	// Paso 2 completado: los documentos finales ya se generaron → cambia el mensaje de la pantalla de resultado.
	const [docsGenerated, setDocsGenerated] = useState(false);
	const [generatedResults, setGeneratedResults] = useState<Array<{ name: string; url?: string }>>([]);
	// Modal de ayuda cuando faltan datos del abogado en el perfil (nombre y/o matrícula del CPACF).
	const [abogadoHelp, setAbogadoHelp] = useState<{ open: boolean; name: boolean; matricula: boolean }>({ open: false, name: false, matricula: false });

	// Genera la demanda (.docx) desde un documento del formulario civil recién generado.
	// Un solo botón genera TODOS los documentos vinculados (generates[]), despachando por slug.
	const handleGenerateAll = async () => {
		if (!generatedDoc?._id) return;
		const gens = selectedTemplate?.generates || [];
		if (!gens.length) return;
		setGenLoadingSlug("__all__");
		let ok = 0;
		let firstError = "";
		const results: Array<{ name: string; url?: string }> = [];
		for (const gen of gens) {
			const thunk =
				gen.slug === "demanda_danos_perjuicios"
					? generateDemanda(generatedDoc._id)
					: gen.slug === "planilla_inicio_civil"
						? generatePlanilla(generatedDoc._id)
						: generateDocument(generatedDoc._id, contextFiles.length ? contextFiles : undefined);
			const res: any = await dispatch(thunk as any);
			if (res?.success) {
				ok += 1;
				results.push({ name: gen.name, url: res.url });
			} else if (!firstError) firstError = res?.error || "";
		}
		setGenLoadingSlug(null);
		setContextFiles([]);
		if (ok) {
			setGeneratedResults(results);
			setDocsGenerated(true);
			showSnackbar(`${ok} documento${ok !== 1 ? "s" : ""} generado${ok !== 1 ? "s" : ""} — en Documentos → Escritos`, "success");
		} else showSnackbar(firstError || "No se pudieron generar los documentos", "error");
	};

	// Genera "el documento" (.docx merged, con campos IA) desde un FORMULARIO self-service recién guardado.
	const handleGenerateDocument = async () => {
		if (!generatedDoc?._id) return;
		setDemandaLoading(true);
		const res: any = await dispatch(generateDocument(generatedDoc._id, contextFiles.length ? contextFiles : undefined) as any);
		setDemandaLoading(false);
		if (res?.success && res.url) {
			setContextFiles([]);
			const docs =
				Array.isArray(res.documents) && res.documents.length
					? res.documents.map((d: any) => ({ name: d.name || "Documento", url: d.url }))
					: [{ name: generatedDoc?.title || "Documento", url: res.url }];
			setGeneratedResults(docs);
			setDocsGenerated(true);
			if ((res.count || 1) === 1) window.open(res.url, "_blank");
			showSnackbar(
				(res.count || 1) > 1 ? `${res.count} documentos generados — en Documentos → Escritos` : "Documento generado — disponible en Documentos → Escritos",
				"success",
			);
		} else {
			showSnackbar(res?.error || "Error al generar el documento", "error");
		}
	};
	const [templates, setTemplates] = useState<PdfTemplate[]>([]);
	const [loadingTemplates, setLoadingTemplates] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
	const [formValues, setFormValues] = useState<Record<string, string>>({});
	const [title, setTitle] = useState("");
	// Flujo de 2 pasos: paso 1 genera "el formulario", paso 2 (pantalla de resultado) genera los documentos.
	// Aplica a docx-merge (self-service) y a formularios overlay que declaran generates[] (ej. civil de Augusto).
	const hasSecondStep = selectedTemplate?.fillMethod === "docx-merge" || (selectedTemplate?.generates?.length ?? 0) > 0;
	// Obligatorios para GENERAR (el borrador solo necesita título).
	const missingRequired = getMissingRequired(selectedTemplate, formValues);
	const canGenerate = title.trim().length > 0 && missingRequired.length === 0;
	const [description, setDescription] = useState("");
	const [generating, setGenerating] = useState(false);
	// Borrador en curso: si está seteado, "Guardar borrador" actualiza ese doc y al generar se finaliza.
	const [currentDocId, setCurrentDocId] = useState<string | null>(null);
	const [savingDraft, setSavingDraft] = useState(false);
	// Documentos de contexto para los campos IA (por generación): se suben junto al "Generar documento".
	const [contextFiles, setContextFiles] = useState<File[]>([]);
	const contextInputRef = useRef<HTMLInputElement>(null);

	const [linkedFolder, setLinkedFolder] = useState<FolderData | null>(null);

	const [trackingMode, setTrackingMode] = useState<"link" | "create">("link");
	const [linkedTracking, setLinkedTracking] = useState<PostalTrackingType | null>(null);
	const [newTrackingCodeId, setNewTrackingCodeId] = useState("TC");
	const [newTrackingNumberId, setNewTrackingNumberId] = useState("");
	const [newTrackingLabel, setNewTrackingLabel] = useState("");

	const [selectedContacts, setSelectedContacts] = useState<Record<ContactGroupKey, Contact | null>>({
		destinatario: null,
		remitente: null,
		poderdante: null,
	});

	// Planilla Civil: selección multi-contacto para las filas de Actores / Demandados
	const [selectedActores, setSelectedActores] = useState<Contact[]>([]);
	const [selectedDemandados, setSelectedDemandados] = useState<Contact[]>([]);
	// Filas visibles por grupo repetible (data-driven): arranca en 1, se amplía con "Agregar".
	const [visibleRows, setVisibleRows] = useState<Record<string, number>>({});

	const [saveDialog, setSaveDialog] = useState<SaveContactDialogState>({
		open: false,
		group: null,
		contactType: "Humana",
		role: "",
	});
	const [savingContact, setSavingContact] = useState(false);

	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);

	// Prefill del letrado (perfil, matrícula CPACF) + objeto del juicio (editables) — formulario civil de Augusto.
	useEffect(() => {
		if (!selectedTemplate || !String(selectedTemplate.slug || "").startsWith("formulario_civil_")) return;
		const { nombre, tomo, folio } = getAbogadoFromProfile(user);
		setFormValues((prev) => {
			const next = { ...prev };
			if (nombre && !prev.abogado_nombre) next.abogado_nombre = nombre;
			if (tomo && !prev.abogado_tomo) next.abogado_tomo = tomo;
			if (folio && !prev.abogado_folio) next.abogado_folio = folio;
			// Objeto por defecto: código 257 = "DAÑOS Y PERJUICIOS" (tabla CPACF). Editable desde el select.
			if (!prev.objeto_codigo) {
				next.objeto_codigo = "257";
				next.objeto_descripcion = "DAÑOS Y PERJUICIOS";
			}
			return next;
		});
	}, [selectedTemplate, user]);

	useEffect(() => {
		if (!open) return;
		if (preselectedTemplate) {
			setSelectedTemplate(preselectedTemplate);
			if (resumeDoc) {
				// Retomar borrador: prefila los datos cargados.
				setFormValues({ ...getInitialFormValues(preselectedTemplate.fields), ...(resumeDoc.formData || {}) });
				setTitle(resumeDoc.title || "");
				setDescription(resumeDoc.description || "");
				setCurrentDocId(resumeDoc._id || null);
			} else {
				setFormValues(getInitialFormValues(preselectedTemplate.fields));
			}
			setStep(1);
		} else {
			setLoadingTemplates(true);
			dispatch(fetchPdfTemplates()).then((res: any) => {
				if (res.success) setTemplates(res.templates || []);
				setLoadingTemplates(false);
			});
		}
		if (userId && allContacts.length === 0) {
			dispatch(getContactsByUserId(userId));
		}
		if (userId && allFolders.length === 0) {
			dispatch(getFoldersByUserId(userId) as any);
		}
		dispatch(fetchAllTrackings() as any);
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!prefilledFolderId || !allFolders.length) return;
		const found = allFolders.find((f) => f._id === prefilledFolderId);
		if (found) setLinkedFolder(found);
	}, [prefilledFolderId, allFolders]); // eslint-disable-line react-hooks/exhaustive-deps

	const resetState = () => {
		setStep(0);
		setGeneratedDoc(null);
		setDocsGenerated(false);
		setGeneratedResults([]);
		setSelectedTemplate(null);
		setFormValues({});
		setTitle("");
		setDescription("");
		setGenerating(false);
		setLinkedFolder(null);
		setTrackingMode("link");
		setLinkedTracking(null);
		setNewTrackingCodeId("TC");
		setNewTrackingNumberId("");
		setNewTrackingLabel("");
		setSelectedContacts({ destinatario: null, remitente: null, poderdante: null });
		setSelectedActores([]);
		setSelectedDemandados([]);
		setVisibleRows({});
		setSaveDialog({ open: false, group: null, contactType: "Humana", role: "" });
		setCurrentDocId(null);
	};

	const handleClose_ = () => {
		resetState();
		handleClose();
	};
	const handleBack = () => {
		setStep(0);
		setSelectedTemplate(null);
		setFormValues({});
		setTitle("");
		setDescription("");
		setLinkedFolder(null);
		setSelectedActores([]);
		setSelectedDemandados([]);
		setVisibleRows({});
		setTrackingMode("link");
		setLinkedTracking(null);
		setNewTrackingCodeId("TC");
		setNewTrackingNumberId("");
		setNewTrackingLabel("");
	};

	const handleSelectTemplate = (tpl: PdfTemplate) => {
		setSelectedTemplate(tpl);
		setFormValues(getInitialFormValues(tpl.fields));
		setStep(1);
	};

	const handleFieldChange = (name: string, value: string) =>
		setFormValues((prev) => {
			const updated = { ...prev, [name]: value };
			if (value === "X") {
				for (const pair of EXCLUSIVE_CHECKBOX_PAIRS) {
					if (pair.includes(name)) {
						for (const other of pair) {
							if (other !== name) updated[other] = "";
						}
					}
				}
			}
			return updated;
		});

	const applyContact = (contact: Contact | null, group: ContactGroupKey) => {
		setSelectedContacts((prev) => ({ ...prev, [group]: contact }));
		if (contact) {
			const mapped = contactToFormValues(contact, group);
			setFormValues((prev) => ({ ...prev, ...mapped }));
		}
	};

	const applyUserToApoderado = () => {
		if (!user) return;
		const skill = user.skill?.[0];
		const fullName = `${user.lastName || ""} ${user.firstName || user.name || ""}`.trim();
		setFormValues((prev) => ({
			...prev,
			apoderado_nombre: fullName,
			apoderado_tipo_doc: skill?.taxCode ? "CUIT" : "",
			apoderado_doc: skill?.taxCode ? String(skill.taxCode) : "",
			apoderado_matricula: skill?.registrationNumber || "",
			apoderado_domicilio: user.address || "",
			apoderado_cp: user.zipCode || "",
			apoderado_email: user.email || "",
			apoderado_telefono: user.contact || user.phone || "",
		}));
	};

	// ── Planilla Civil: autocompletado v1 (abogado + actores + demandados) ────────

	const applyUserToAbogado = () => {
		const { nombre, tomo, folio, cuit, cpacfFound } = getAbogadoFromProfile(user);
		// Prefijo según el template: filas numeradas (abogado1_*, CCF) o campos planos (abogado_*, Planilla Civil).
		const fieldNames = new Set((selectedTemplate?.fields || []).map((f) => f.name));
		const p = fieldNames.has("abogado1_nombre") ? "abogado1_" : "abogado_";
		setFormValues((prev) => ({
			...prev,
			...(nombre ? { [`${p}nombre`]: nombre } : {}),
			...(tomo ? { [`${p}tomo`]: tomo } : {}),
			...(folio ? { [`${p}folio`]: folio } : {}),
			...(cuit && fieldNames.has(`${p}cuit`) ? { [`${p}cuit`]: cuit } : {}),
		}));
		// Si falta el nombre y/o la matrícula del CPACF, guiar al usuario a cargarlos en el perfil.
		const missingName = !nombre;
		const missingMatricula = !cpacfFound || (!tomo && !folio);
		if (missingName || missingMatricula) setAbogadoHelp({ open: true, name: missingName, matricula: missingMatricula });
	};

	// Letrados del Anexo II laboral: mismo perfil profesional, con prefijo por rol.
	const applyUserToLetrado = (prefix: "patrocinante_" | "apoderado_") => {
		const { nombre, tomo, folio, cpacfFound } = getAbogadoFromProfile(user);
		setFormValues((prev) => ({
			...prev,
			...(nombre ? { [`${prefix}nombre`]: nombre } : {}),
			...(tomo ? { [`${prefix}tomo`]: tomo } : {}),
			...(folio ? { [`${prefix}folio`]: folio } : {}),
			...(cpacfFound ? { [`${prefix}matricula`]: "CPACF" } : {}),
		}));
		const missingName = !nombre;
		const missingMatricula = !cpacfFound || (!tomo && !folio);
		if (missingName || missingMatricula) setAbogadoHelp({ open: true, name: missingName, matricula: missingMatricula });
	};

	// Cuántas filas admite el template para un base dado (data-driven, sin hardcodear).
	const rowCountForBase = (base: string): number => {
		const s = new Set<string>();
		(selectedTemplate?.fields || []).forEach((f) => {
			const m = f.name.match(new RegExp(`^${base}(\\d+)_`));
			if (m) s.add(m[1]);
		});
		return s.size || 1;
	};

	// Vuelca una lista de contactos en las filas de un grupo (actor/demandado) y expande la vista.
	const applyContactsToGroup = (contacts: Contact[], base: string, groupKey: string) => {
		const max = rowCountForBase(base);
		const list = contacts.slice(0, max);
		if (base === "actor") setSelectedActores(list);
		if (base === "demandado") setSelectedDemandados(list);
		const values = contactsToRowValues(list, base, max);
		// Si el template define tipo_doc como select (ej. SCBA: "D.N.I.", tipos de sociedad;
		// Comercial: DU/LE/LC/CI/PS), normalizar el valor del contacto ("DNI"/"CUIT") a la
		// opción equivalente o dejar vacío. "DU" es la denominación del DNI en el fuero comercial.
		for (const f of selectedTemplate?.fields || []) {
			if (f.type === "select" && /_tipo_doc$/.test(f.name) && values[f.name] != null && values[f.name] !== "") {
				const norm = (s: string) => s.replace(/[.\s]/g, "").toUpperCase();
				const v = norm(String(values[f.name]));
				const opts = f.options || [];
				const match = opts.find((o) => norm(o) === v) || (v === "DNI" && opts.includes("DU") ? "DU" : undefined);
				values[f.name] = match || "";
			}
		}
		setFormValues((prev) => ({ ...prev, ...values }));
		setVisibleRows((prev) => ({ ...prev, [groupKey]: Math.max(prev[groupKey] || 1, list.length || 1) }));
	};

	// Auto-relleno desde el expediente vinculado (planillas de inicio con filas de partes):
	// reparte los contactos del folder por rol de parte en las filas de actores/demandados.
	useEffect(() => {
		const PLANILLA_SLUGS = [
			"planilla_inicio_civil",
			"formulario_ingreso_demandas_ccf",
			"formulario_inicio_laboral_anexo2",
			"formulario_inicio_comercial",
			"formulario_inicio_conadmfed",
			"formulario_inicio_scba",
		];
		if (!linkedFolder || !PLANILLA_SLUGS.includes(selectedTemplate?.slug || "")) return;
		// El groupKey real de cada base sale del template ("Actores" en Civil, "Actores o peticionarios" en CCF).
		const groupOf = (fieldName: string) => selectedTemplate?.fields?.find((f) => f.name === fieldName)?.group || "";
		const folderContacts = allContacts.filter((c) => c.folderIds?.includes(linkedFolder._id));
		const actores = folderContacts.filter((c) => contactPartyRole(c) === "actor");
		const demandados = folderContacts.filter((c) => contactPartyRole(c) === "demandado");
		if (actores.length) applyContactsToGroup(actores, "actor", groupOf("actor1_nombre") || "Actores");
		if (demandados.length) applyContactsToGroup(demandados, "demandado", groupOf("demandado1_nombre") || "Demandados");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [linkedFolder, selectedTemplate]);

	const newTrackingNumberIdValid = /^\d{9}$/.test(newTrackingNumberId);
	const willCreateTracking =
		selectedTemplate?.supportsTracking && !prefilledTrackingId && !linkedTracking && trackingMode === "create" && newTrackingNumberIdValid;

	const handleSaveDraft = async () => {
		if (!selectedTemplate) return;
		if (!title.trim()) {
			showSnackbar("Poné un título para guardar el borrador", "error");
			return;
		}
		setSavingDraft(true);
		const res: any = await dispatch(
			saveDraft({
				docId: currentDocId || undefined,
				pdfTemplateId: selectedTemplate._id,
				title,
				description,
				formData: formValues,
				linkedFolderId: linkedFolder?._id || null,
			}) as any,
		);
		setSavingDraft(false);
		if (res?.success) {
			setCurrentDocId(res.document?._id || currentDocId);
			showSnackbar("Borrador guardado — retomalo desde Documentos → Escritos", "success");
			handleClose_();
		} else {
			showSnackbar(res?.error || "No se pudo guardar el borrador", "error");
		}
	};

	const handleSubmit = async () => {
		if (!selectedTemplate) return;
		setGenerating(true);

		const result = await dispatch(
			createPostalDocument({
				pdfTemplateId: selectedTemplate._id,
				title,
				description,
				formData: formValues,
				linkedTrackingId: prefilledTrackingId || linkedTracking?._id || null,
				linkedFolderId: linkedFolder?._id || null,
			}),
		);

		if (result.success && willCreateTracking) {
			const docId = result.document?._id;
			const trackingResult = await dispatch(
				createPostalTracking({
					codeId: newTrackingCodeId,
					numberId: newTrackingNumberId,
					label: newTrackingLabel || title,
					documentId: docId,
					...(linkedFolder?._id ? { folderId: linkedFolder._id } : {}),
				}) as any,
			);
			if (trackingResult?.id && docId) {
				await dispatch(updatePostalDocument(docId, { linkedTrackingId: trackingResult.id }) as any);
			}
		}

		setGenerating(false);
		if (result.success) {
			// Si veníamos de un borrador, se finaliza: eliminamos el borrador (quedó el documento generado).
			if (currentDocId) {
				dispatch(deletePostalDocument(currentDocId) as any);
				setCurrentDocId(null);
			}
			showSnackbar(hasSecondStep ? "Formulario generado — ahora generá los documentos" : "Documento generado exitosamente", "success");
			// No cerramos: mostramos la pantalla de resultado con acceso al PDF y a Documentos.
			setDocsGenerated(false);
			setGeneratedResults([]);
			setGeneratedDoc(result.document || { title });
		} else if ((result as any).limitInfo) {
			setLimitErrorMessage(result.error || "Has alcanzado el límite de escritos para tu plan actual");
			setLimitErrorInfo((result as any).limitInfo);
			setLimitErrorOpen(true);
		} else {
			showSnackbar(result.error || "Error al generar", "error");
		}
	};

	const handleUpdateContact = async (group: ContactGroupKey) => {
		const contact = selectedContacts[group];
		if (!contact?._id) return;
		setSavingContact(true);
		const contactData = formValuesToContact(
			formValues,
			group,
			contact.type as "Humana" | "Jurídica",
			Array.isArray(contact.role) ? contact.role[0] : contact.role || "",
		);
		try {
			const result = await dispatch(updateContact(contact._id, contactData));
			if (result?.success !== false) {
				showSnackbar("Contacto actualizado exitosamente", "success");
			} else {
				showSnackbar("Error al actualizar el contacto", "error");
			}
		} catch {
			showSnackbar("Error al actualizar el contacto", "error");
		}
		setSavingContact(false);
	};

	const openSaveDialog = (group: ContactGroupKey) => {
		const defaultType: "Humana" | "Jurídica" = group === "destinatario" ? "Jurídica" : "Humana";
		const defaultRole = group === "destinatario" ? "Empleador" : group === "remitente" ? "Trabajador" : "Poderdante";
		setSaveDialog({ open: true, group, contactType: defaultType, role: defaultRole });
	};

	const handleSaveContact = async () => {
		if (!saveDialog.group) return;
		setSavingContact(true);
		const contactData = formValuesToContact(formValues, saveDialog.group, saveDialog.contactType, saveDialog.role);
		try {
			const result = await dispatch(addContact(contactData as Contact));
			if (result?.success !== false) {
				showSnackbar("Contacto guardado exitosamente", "success");
				setSaveDialog({ open: false, group: null, contactType: "Humana", role: "" });
			} else {
				showSnackbar("Error al guardar el contacto", "error");
			}
		} catch {
			showSnackbar("Error al guardar el contacto", "error");
		}
		setSavingContact(false);
	};

	// ── Brand helpers ────────────────────────────────────────────────────────

	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14), transition: "border-color 0.15s ease" },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
		"& .MuiInputLabel-root.Mui-focused": { color: BRAND_BLUE },
	};

	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.875rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};

	const brandPrimarySx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};

	const smallActionSx = {
		textTransform: "none" as const,
		fontSize: "0.72rem",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		py: 0.4,
		px: 1.25,
		borderRadius: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
		color: BRAND_BLUE,
		bgcolor: "transparent",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.48 : 0.36),
		},
	};

	const iconBtnSx = {
		color: "text.secondary",
		borderRadius: 1,
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	// ── Field renderer ────────────────────────────────────────────────────────

	const renderField = (field: PdfTemplateField) => {
		if (field.type === "checkbox") {
			return (
				<FormControlLabel
					key={field.name}
					control={
						<Checkbox
							size="small"
							checked={formValues[field.name] === "X"}
							onChange={(e) => handleFieldChange(field.name, e.target.checked ? "X" : "")}
							sx={{
								color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
								"&.Mui-checked": { color: BRAND_BLUE },
							}}
						/>
					}
					label={<Typography sx={{ fontSize: "0.82rem", color: "text.primary" }}>{field.label}</Typography>}
				/>
			);
		}
		if (field.type === "radio") {
			return (
				<FormControl key={field.name} fullWidth sx={{ mt: 0.5 }}>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "0.02em", mb: 0.5 }}>
						{field.label}
						{field.required && (
							<Typography component="span" color="error" sx={{ ml: 0.25 }}>
								*
							</Typography>
						)}
					</Typography>
					<RadioGroup row value={formValues[field.name] || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)}>
						{(field.options || []).map((opt) => (
							<FormControlLabel
								key={opt}
								value={opt}
								control={
									<Radio
										size="small"
										sx={{ color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32), "&.Mui-checked": { color: BRAND_BLUE } }}
									/>
								}
								label={<Typography sx={{ fontSize: "0.82rem", color: "text.primary" }}>{RADIO_OPTION_LABELS[opt] || opt}</Typography>}
							/>
						))}
					</RadioGroup>
				</FormControl>
			);
		}
		if (field.type === "multiline") {
			return (
				<TextField
					key={field.name}
					label={field.label}
					required={field.required}
					placeholder={field.placeholder}
					multiline
					rows={6}
					size="small"
					fullWidth
					value={formValues[field.name] || ""}
					onChange={(e) => handleFieldChange(field.name, e.target.value)}
					sx={inputSx}
				/>
			);
		}
		if (field.type === "date") {
			return (
				<TextField
					key={field.name}
					label={field.label}
					required={field.required}
					type="date"
					size="small"
					fullWidth
					InputLabelProps={{ shrink: true }}
					value={formValues[field.name] || ""}
					onChange={(e) => handleFieldChange(field.name, e.target.value)}
					sx={inputSx}
				/>
			);
		}
		if (field.type === "select") {
			return (
				<TextField
					key={field.name}
					label={field.label}
					required={field.required}
					select
					size="small"
					fullWidth
					value={formValues[field.name] || ""}
					onChange={(e) => handleFieldChange(field.name, e.target.value)}
					sx={inputSx}
				>
					<MenuItem value="">
						<em>— sin seleccionar —</em>
					</MenuItem>
					{(field.options || []).map((opt) => (
						<MenuItem key={opt} value={opt}>
							{opt}
						</MenuItem>
					))}
				</TextField>
			);
		}
		return (
			<TextField
				key={field.name}
				label={field.label}
				required={field.required}
				placeholder={field.placeholder}
				size="small"
				fullWidth
				value={formValues[field.name] || ""}
				onChange={(e) => handleFieldChange(field.name, e.target.value)}
				sx={inputSx}
			/>
		);
	};

	const groupHeader = (label: string, action?: React.ReactNode) => (
		<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
			<Stack direction="row" alignItems="center" spacing={0.875}>
				<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
				<Typography
					sx={{
						fontSize: "0.66rem",
						fontWeight: 600,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: BRAND_BLUE,
					}}
				>
					{label}
				</Typography>
			</Stack>
			{action}
		</Stack>
	);

	// Render data-driven de un grupo de filas repetibles (actorN_*, demandadoN_*, ...):
	// muestra 1 fila por defecto (o las que ya tengan datos), en cards, con "Agregar"/"Quitar".
	// Los grupos de partes (Actores/Demandados) suman un selector multi-contacto arriba.
	const renderRepeatableGroup = (groupKey: string, rep: RepeatableRows) => {
		const max = rep.rows.length;
		const contactRole: "actor" | "demandado" | null =
			rep.base === "actor" ? "actor" : rep.base === "demandado" ? "demandado" : null;
		const selected = contactRole === "actor" ? selectedActores : contactRole === "demandado" ? selectedDemandados : [];
		const activeContacts = allContacts.filter((c: Contact) => c.status !== "archived");
		const filled = rep.rows.filter((r) => rep.byRow.get(r)!.some((f) => (formValues[f.name] || "").trim() !== "")).length;
		const visible = Math.min(max, Math.max(1, filled, visibleRows[groupKey] || 0));
		const baseLabel = rep.base.charAt(0).toUpperCase() + rep.base.slice(1);

		const addRow = () =>
			setVisibleRows((prev) => ({ ...prev, [groupKey]: Math.min(max, Math.max(1, filled, prev[groupKey] || 0) + 1) }));
		const removeRow = (idx: number) => {
			const clear: Record<string, string> = {};
			rep.byRow.get(rep.rows[idx])!.forEach((f) => (clear[f.name] = ""));
			setFormValues((prev) => ({ ...prev, ...clear }));
			setVisibleRows((prev) => ({ ...prev, [groupKey]: Math.max(1, visible - 1) }));
			if (contactRole === "actor") setSelectedActores((prev) => prev.filter((_, i) => i !== idx));
			if (contactRole === "demandado") setSelectedDemandados((prev) => prev.filter((_, i) => i !== idx));
		};

		return (
			<Box key={groupKey}>
				{groupHeader(
					GROUP_LABELS[groupKey] || groupKey,
					rep.base === "abogado" ? (
						<Tooltip title="Completar con tus datos profesionales del perfil (nombre, matrícula y CUIT)">
							<Button size="small" startIcon={<Profile2User size={13} variant="Linear" />} onClick={applyUserToAbogado} sx={smallActionSx}>
								Mis datos
							</Button>
						</Tooltip>
					) : undefined,
				)}
				{contactRole && (
					<Autocomplete
						multiple
						size="small"
						options={activeContacts}
						value={selected}
						getOptionLabel={(c: Contact) => getContactLabel(c)}
						isOptionEqualToValue={(opt, val) => opt._id === val._id}
						getOptionDisabled={() => selected.length >= max}
						renderOption={(props, c: Contact) => (
							<Box component="li" {...props} key={c._id}>
								<Stack>
									<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{getContactLabel(c)}</Typography>
									{c.role && (
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
											{Array.isArray(c.role) ? c.role.join(", ") : c.role}
											{c.city ? ` · ${c.city}` : ""}
										</Typography>
									)}
								</Stack>
							</Box>
						)}
						onChange={(_e, contacts) => applyContactsToGroup(contacts as Contact[], rep.base, groupKey)}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={`Buscar contactos para ${groupKey.toLowerCase()}...`}
								sx={inputSx}
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<>
											<Profile2User size={15} style={{ marginRight: 6, opacity: 0.55, color: theme.palette.text.secondary }} />
											{params.InputProps.startAdornment}
										</>
									),
								}}
							/>
						)}
						sx={{ mb: 1.5 }}
						noOptionsText="Sin contactos — podés completar manualmente"
					/>
				)}

				<Stack spacing={1.25}>
					{rep.rows.slice(0, visible).map((rowNum, idx) => (
						<Box
							key={rowNum}
							sx={{
								borderRadius: 1.5,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								p: 1.5,
							}}
						>
							<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
								<Typography
									sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary" }}
								>
									{baseLabel} {idx + 1}
								</Typography>
								{idx + 1 === visible && visible > 1 && (
									<Tooltip title="Quitar">
										<IconButton size="small" onClick={() => removeRow(idx)} sx={iconBtnSx}>
											<Trash size={14} variant="Linear" />
										</IconButton>
									</Tooltip>
								)}
							</Stack>
							<Stack spacing={1.25}>{rep.byRow.get(rowNum)!.map((f) => renderField(f))}</Stack>
						</Box>
					))}
				</Stack>

				{visible < max && (
					<Button size="small" startIcon={<Add size={14} variant="Linear" />} onClick={addRow} sx={{ ...smallActionSx, mt: 1.25 }}>
						Agregar {rep.base}
					</Button>
				)}
			</Box>
		);
	};

	const renderGroup = (groupKey: string, fields: PdfTemplateField[]) => {
		const isContactGroup = (CONTACT_GROUPS as string[]).includes(groupKey);
		const group = groupKey as ContactGroupKey;
		const activeContacts = allContacts.filter((c: Contact) => c.status !== "archived");

		if (groupKey === "apoderado") {
			return (
				<Box key={groupKey}>
					{groupHeader(
						GROUP_LABELS[groupKey],
						<Tooltip title="Completar automáticamente con tus datos profesionales del perfil">
							<Button size="small" startIcon={<Profile2User size={13} variant="Linear" />} onClick={applyUserToApoderado} sx={smallActionSx}>
								Mis datos
							</Button>
						</Tooltip>,
					)}
					<Stack spacing={1.5}>
						{groupFieldsForRender(fields).map((item, i) =>
							Array.isArray(item) ? (
								<Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
									{item.map((f) => renderField(f))}
								</Stack>
							) : (
								renderField(item)
							),
						)}
					</Stack>
				</Box>
			);
		}

		// SCBA Ley 13.951 — Materia: el nomenclador depende del fuero marcado en el formulario.
		if (groupKey === "Materia") {
			const fuero = MATERIAS_SCBA_BY_FUERO.find((f) => formValues[f.field] === "X") || null;
			const materias = fuero?.materias || [];
			const selectedMateria = materias.find((o) => o.code === formValues.materia_codigo) || null;
			return (
				<Box key={groupKey}>
					{groupHeader(GROUP_LABELS[groupKey] || groupKey)}
					<Autocomplete
						size="small"
						options={materias}
						value={selectedMateria}
						disabled={!fuero}
						getOptionLabel={(o: ObjetoJuicio) => `${o.code} - ${o.description}`}
						isOptionEqualToValue={(opt, val) => opt.code === val.code}
						onChange={(_e, o) => setFormValues((prev) => ({ ...prev, materia_codigo: o ? o.code : "" }))}
						renderOption={(props, o: ObjetoJuicio) => (
							<Box component="li" {...props} key={o.code}>
								<Typography sx={{ fontSize: "0.85rem" }}>
									<Box component="span" sx={{ fontWeight: 700 }}>
										{o.code}
									</Box>
									{" - "}
									{o.description}
								</Typography>
							</Box>
						)}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={fuero ? `Buscar materia del fuero ${fuero.label}...` : "Elegí primero el fuero"}
								sx={inputSx}
							/>
						)}
						sx={{ mb: 1.5 }}
						noOptionsText="Sin coincidencias"
					/>
				</Box>
			);
		}

		// Objeto del juicio: select buscable de códigos (número + descripción), con el
		// nomenclador del fuero del template (resuelto por slug; fallback por groupKey).
		if (groupKey === "Objeto" || groupKey === "Objeto de juicio") {
			const objetos =
				OBJETOS_JUICIO_BY_SLUG[selectedTemplate?.slug || ""] ||
				(groupKey === "Objeto de juicio" ? OBJETOS_JUICIO_CIVCOMFED : OBJETOS_JUICIO_CIVIL);
			const selectedObjeto = objetos.find((o) => o.code === formValues.objeto_codigo) || null;
			return (
				<Box key={groupKey}>
					{groupHeader(GROUP_LABELS[groupKey] || groupKey)}
					<Autocomplete
						size="small"
						options={objetos}
						value={selectedObjeto}
						getOptionLabel={(o: ObjetoJuicio) => `${o.code} - ${o.description}`}
						isOptionEqualToValue={(opt, val) => opt.code === val.code}
						onChange={(_e, o) =>
							setFormValues((prev) => ({
								...prev,
								objeto_codigo: o ? o.code : "",
								objeto_descripcion: o ? o.description : "",
							}))
						}
						renderOption={(props, o: ObjetoJuicio) => (
							<Box component="li" {...props} key={o.code}>
								<Typography sx={{ fontSize: "0.85rem" }}>
									<Box component="span" sx={{ fontWeight: 700 }}>
										{o.code}
									</Box>
									{" - "}
									{o.description}
								</Typography>
							</Box>
						)}
						renderInput={(params) => (
							<TextField {...params} placeholder="Buscar objeto por código o descripción..." sx={inputSx} />
						)}
						sx={{ mb: 1.5 }}
						noOptionsText="Sin coincidencias"
					/>
				</Box>
			);
		}

		// Anexo II laboral — Patrocinante / Apoderado: botón "Mis datos" con prefijo por rol.
		if (groupKey === "Patrocinante" || groupKey === "Apoderado") {
			const prefix = groupKey === "Patrocinante" ? ("patrocinante_" as const) : ("apoderado_" as const);
			return (
				<Box key={groupKey}>
					{groupHeader(
						groupKey,
						<Tooltip title="Completar con tus datos profesionales del perfil (nombre, matrícula y colegio)">
							<Button
								size="small"
								startIcon={<Profile2User size={13} variant="Linear" />}
								onClick={() => applyUserToLetrado(prefix)}
								sx={smallActionSx}
							>
								Mis datos
							</Button>
						</Tooltip>,
					)}
					<Stack spacing={1.5}>
						{groupFieldsForRender(fields).map((item, i) =>
							Array.isArray(item) ? (
								<Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
									{item.map((f) => renderField(f))}
								</Stack>
							) : (
								renderField(item)
							),
						)}
					</Stack>
				</Box>
			);
		}

		// Abogados / Datos del letrado: botón "Mis datos" (perfil profesional CPACF → nombre + T°/F°)
		if (groupKey === "Abogados" || groupKey === "Datos del letrado") {
			return (
				<Box key={groupKey}>
					{groupHeader(
						groupKey,
						<Tooltip title="Completar con tus datos profesionales del perfil (nombre y matrícula)">
							<Button size="small" startIcon={<Profile2User size={13} variant="Linear" />} onClick={applyUserToAbogado} sx={smallActionSx}>
								Mis datos
							</Button>
						</Tooltip>,
					)}
					<Stack spacing={1.5}>
						{groupFieldsForRender(fields).map((item, i) =>
							Array.isArray(item) ? (
								<Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
									{item.map((f) => renderField(f))}
								</Stack>
							) : (
								renderField(item)
							),
						)}
					</Stack>
				</Box>
			);
		}

		// Planilla Civil — grupos de filas repetibles (Actores, Demandados y futuros modelos):
		// detección data-driven por el patrón de nombres → cards por fila + "Agregar"/"Quitar".
		const repeatable = parseRepeatableRows(fields);
		if (repeatable) {
			return renderRepeatableGroup(groupKey, repeatable);
		}

		// Grupo compuesto solo por checkboxes mutuamente excluyentes (ej. Tasa de justicia CCF):
		// radio group con opción "Sin indicar" (el campo es optativo en el formulario papel).
		const exclusiveSet = EXCLUSIVE_CHECKBOX_PAIRS.find((set) => fields.every((f) => f.type === "checkbox" && set.includes(f.name)));
		if (exclusiveSet && fields.length > 1) {
			const checkedField = fields.find((f) => formValues[f.name] === "X")?.name || "";
			// Los labels vienen prefijados con el grupo ("Tasa de justicia — Abonar tasa") → mostrar solo la opción.
			const optionLabel = (f: PdfTemplateField) => (f.label || f.name).split("—").slice(-1)[0].trim();
			const radioSx = { color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32), "&.Mui-checked": { color: BRAND_BLUE } };
			return (
				<Box key={groupKey}>
					{groupHeader(GROUP_LABELS[groupKey] || groupKey)}
					<RadioGroup
						value={checkedField}
						onChange={(e) => {
							const sel = e.target.value;
							setFormValues((prev) => {
								const updated = { ...prev };
								fields.forEach((f) => (updated[f.name] = f.name === sel ? "X" : ""));
								// SCBA Ley 13.951: al cambiar el fuero, la materia elegida deja de ser válida.
								if (fields.some((f) => f.name.startsWith("fuero_"))) updated.materia_codigo = "";
								return updated;
							});
						}}
					>
						{fields.map((f) => (
							<FormControlLabel
								key={f.name}
								value={f.name}
								control={<Radio size="small" sx={radioSx} />}
								label={<Typography sx={{ fontSize: "0.82rem", color: "text.primary" }}>{optionLabel(f)}</Typography>}
							/>
						))}
						<FormControlLabel
							value=""
							control={<Radio size="small" sx={radioSx} />}
							label={<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>Sin indicar</Typography>}
						/>
					</RadioGroup>
				</Box>
			);
		}

		return (
			<Box key={groupKey}>
				{groupHeader(
					GROUP_LABELS[groupKey] || groupKey,
					isContactGroup && hasGroupData(formValues, group)
						? selectedContacts[group]
							? (
								<Tooltip title={`Actualizar contacto "${getContactLabel(selectedContacts[group]!)}" con los datos actuales`}>
									<Button
										size="small"
										startIcon={savingContact ? <CircularProgress size={12} color="inherit" /> : <Save2 size={13} variant="Linear" />}
										onClick={() => handleUpdateContact(group)}
										disabled={savingContact}
										sx={smallActionSx}
									>
										Actualizar contacto
									</Button>
								</Tooltip>
							  )
							: (
								<Tooltip title={`Guardar datos de ${GROUP_LABELS[group] || group} como nuevo contacto`}>
									<Button size="small" startIcon={<Save2 size={13} variant="Linear" />} onClick={() => openSaveDialog(group)} sx={smallActionSx}>
										Guardar como contacto
									</Button>
								</Tooltip>
							  )
						: undefined,
				)}

				{isContactGroup && (
					<Autocomplete
						size="small"
						options={activeContacts}
						value={selectedContacts[group] ?? null}
						getOptionLabel={(c: Contact) => getContactLabel(c)}
						isOptionEqualToValue={(opt, val) => opt._id === val._id}
						renderOption={(props, c: Contact) => (
							<Box component="li" {...props} key={c._id}>
								<Stack>
									<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{getContactLabel(c)}</Typography>
									{c.role && (
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
											{Array.isArray(c.role) ? c.role.join(", ") : c.role}
											{c.city ? ` · ${c.city}` : ""}
										</Typography>
									)}
								</Stack>
							</Box>
						)}
						onChange={(_e, contact) => applyContact(contact, group)}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={`Buscar contacto para ${(GROUP_LABELS[group] || group).toLowerCase()}...`}
								sx={inputSx}
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<>
											<Profile2User size={15} style={{ marginRight: 6, opacity: 0.55, color: theme.palette.text.secondary }} />
											{params.InputProps.startAdornment}
										</>
									),
								}}
							/>
						)}
						sx={{ mb: 1.5 }}
						noOptionsText="Sin contactos — podés completar manualmente"
					/>
				)}

				<Stack spacing={1.5}>
					{groupFieldsForRender(fields).map((item, i) =>
						Array.isArray(item) ? (
							<Stack key={i} direction="row" flexWrap="wrap" useFlexGap>
								{item.map((f) => renderField(f))}
							</Stack>
						) : (
							renderField(item)
						),
					)}
				</Stack>
			</Box>
		);
	};

	// ── Dialog header brand atmosférico ──────────────────────────────────────

	const dialogHeader = (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				flexShrink: 0,
				p: { xs: 2.25, sm: 2.5 },
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
				borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: -60,
					right: -40,
					width: 220,
					height: 220,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
					backgroundSize: "20px 20px",
					maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					opacity: 0.55,
					pointerEvents: "none",
				}}
			/>
			<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
				<Box
					sx={{
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
						flexShrink: 0,
					}}
				>
					<DocumentText size={20} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							{step === 0 ? "Nuevo Documento" : "Completar formulario"}
						</Typography>
					</Stack>
					<Typography
						sx={{
							fontSize: "1.05rem",
							fontWeight: 600,
							letterSpacing: "-0.015em",
							color: "text.primary",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{step === 0 ? "Elegí una plantilla" : selectedTemplate?.name || "Plantilla"}
					</Typography>
					<Typography
						sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}
					>
						{step === 0
							? "Seleccioná el modelo que querés usar para tu documento."
							: "Completá los datos para generar el PDF."}
					</Typography>
				</Stack>
				<IconButton onClick={handleClose_} sx={iconBtnSx} aria-label="cerrar">
					<CloseSquare size={20} variant="Linear" />
				</IconButton>
			</Stack>
		</Box>
	);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<>
			<Dialog open={open} onClose={handleClose_} maxWidth={step === 1 ? "lg" : "md"} fullWidth PaperProps={{ sx: dialogPaperSx }}>
				{dialogHeader}

				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					{/* ── Pantalla de resultado: documento generado ── */}
					{generatedDoc && (
						<Stack alignItems="center" spacing={2} sx={{ py: { xs: 3, sm: 5 }, textAlign: "center" }}>
							<Box
								sx={{
									width: 64,
									height: 64,
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(theme.palette.success.main, isDark ? 0.16 : 0.1),
									color: theme.palette.success.main,
								}}
							>
								<TickCircle size={36} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								{!hasSecondStep ? "¡Documento generado!" : docsGenerated ? "¡Documentos generados!" : "¡Formulario generado!"}
							</Typography>
							{generatedDoc.title && (
								<Typography sx={{ fontSize: "0.9rem", color: "text.primary", fontWeight: 500 }}>"{generatedDoc.title}"</Typography>
							)}
							<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", maxWidth: 440, textWrap: "pretty" }}>
								{!hasSecondStep ? (
									<>
										Ya está disponible en{" "}
										<Box component="span" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
											Documentos → Escritos
										</Box>
										. Podés verlo, descargarlo o editarlo desde ahí cuando quieras.
									</>
								) : docsGenerated ? (
									<>
										Tus documentos ya están en{" "}
										<Box component="span" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
											Documentos → Escritos
										</Box>
										. Podés verlos, descargarlos o editarlos desde ahí.
									</>
								) : (
									<>
										El formulario quedó guardado. Ahora generá {(selectedTemplate?.generates?.length ?? 0) > 1 ? "los documentos" : "el documento"} con el botón de
										abajo.
									</>
								)}
							</Typography>
							{docsGenerated && generatedResults.length > 0 && (
								<Stack spacing={0.75} sx={{ width: "100%", maxWidth: 440, mt: 0.5 }}>
									{generatedResults.map((d, i) => (
										<Stack
											key={`${d.name}-${i}`}
											direction="row"
											alignItems="center"
											justifyContent="space-between"
											sx={{
												px: 1.5,
												py: 1,
												borderRadius: 1.25,
												bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.06),
												border: `1px solid ${alpha(theme.palette.success.main, isDark ? 0.28 : 0.18)}`,
											}}
										>
											<Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
												<TickCircle size={16} variant="Bulk" color={theme.palette.success.main} style={{ flexShrink: 0 }} />
												<Typography sx={{ fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
													{d.name}
												</Typography>
											</Stack>
											{d.url && (
												<Button
													size="small"
													onClick={() => window.open(d.url, "_blank")}
													startIcon={<DocumentDownload size={14} variant="Linear" />}
													sx={{ textTransform: "none", fontSize: "0.72rem", color: BRAND_BLUE, flexShrink: 0, minWidth: 0 }}
												>
													Ver
												</Button>
											)}
										</Stack>
									))}
								</Stack>
							)}
						</Stack>
					)}

					{/* Documentos de contexto para la IA (por generación) — sólo si el modelo tiene campos IA */}
					{generatedDoc && !docsGenerated && selectedTemplate?.fillMethod === "docx-merge" && (selectedTemplate?.fields || []).some((f: any) => f.type === "ai-prompt") && (
						<Box
							sx={{
								maxWidth: 520,
								mx: "auto",
								mb: 1,
								p: 2,
								borderRadius: 1.5,
								border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.22)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
							}}
						>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
								<MagicStar size={16} color={BRAND_BLUE} variant="Bulk" />
								<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>Documentos de contexto para la IA (opcional)</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1.25, textWrap: "pretty" }}>
								Adjuntá los hechos, la prueba o un escrito relacionado (PDF, Word o texto). La IA usará su contenido al redactar los campos generados. Máx. 5 archivos.
							</Typography>
							<input
								ref={contextInputRef}
								type="file"
								accept=".pdf,.docx,.txt"
								multiple
								hidden
								onChange={(e) => {
									const files = Array.from(e.target.files || []);
									setContextFiles((prev) => [...prev, ...files].slice(0, 5));
									e.target.value = "";
								}}
							/>
							<Button
								size="small"
								startIcon={<DocumentUpload size={15} variant="Linear" />}
								onClick={() => contextInputRef.current?.click()}
								disabled={contextFiles.length >= 5}
								sx={ghostBtnSx}
							>
								Agregar documentos
							</Button>
							{contextFiles.length > 0 && (
								<Stack spacing={0.5} sx={{ mt: 1.25 }}>
									{contextFiles.map((f, i) => (
										<Stack
											key={`${f.name}-${i}`}
											direction="row"
											spacing={1}
											alignItems="center"
											sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04) }}
										>
											<DocumentText size={14} color={theme.palette.text.secondary} />
											<Typography sx={{ fontSize: "0.75rem", color: "text.primary", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
												{f.name}
											</Typography>
											<IconButton size="small" onClick={() => setContextFiles((prev) => prev.filter((_, j) => j !== i))} sx={{ width: 22, height: 22 }} aria-label="quitar">
												<CloseSquare size={14} color={theme.palette.text.secondary} />
											</IconButton>
										</Stack>
									))}
								</Stack>
							)}
						</Box>
					)}

					{/* ── Step 0: template selection (solo modelos del sistema) ── */}
					{!generatedDoc && step === 0 && (
						<>
							{loadingTemplates ? (
								<Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
									<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
								</Stack>
							) : (
								(() => {
									const filtered = templates.filter((t) => t.source !== "user");
									if (filtered.length === 0) {
										return (
											<Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 6 }}>
												<Box
													sx={{
														width: 52,
														height: 52,
														borderRadius: 1.5,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
														color: BRAND_BLUE,
													}}
												>
													<DocumentText size={24} variant="Bulk" />
												</Box>
												<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
													Sin modelos del sistema
												</Typography>
												<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center", maxWidth: 320, textWrap: "pretty" }}>
													No hay modelos del sistema disponibles en este momento.
												</Typography>
											</Stack>
										);
									}
									return (
										<Grid container spacing={1.5}>
											{filtered.map((tpl) => (
												<Grid item xs={12} sm={6} md={4} key={tpl._id}>
													<Box
														onClick={() => handleSelectTemplate(tpl)}
														sx={{
															p: 1.5,
															height: "100%",
															borderRadius: 1.5,
															cursor: "pointer",
															bgcolor: "background.paper",
															border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
															transition: "border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease",
															display: "flex",
															flexDirection: "column",
															"&:hover": {
																borderColor: alpha(BRAND_BLUE, isDark ? 0.45 : 0.32),
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
																transform: "translateY(-1px)",
															},
														}}
													>
														<Stack spacing={1}>
															<CategoryPill label={tpl.category} />
															<Typography
																sx={{
																	fontSize: "0.95rem",
																	fontWeight: 600,
																	letterSpacing: "-0.005em",
																	color: "text.primary",
																}}
															>
																{tpl.name}
															</Typography>
															<Typography
																sx={{
																	fontSize: "0.78rem",
																	color: "text.secondary",
																	letterSpacing: "-0.005em",
																	textWrap: "pretty",
																}}
															>
																{tpl.description}
															</Typography>
														</Stack>
													</Box>
												</Grid>
											))}
										</Grid>
									);
								})()
							)}
						</>
					)}

					{/* ── Step 1: form ── */}
					{!generatedDoc && step === 1 && selectedTemplate && (
						<Stack spacing={2.5}>
							{/* Document metadata */}
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} sm={7}>
									<TextField
										label="Título del documento"
										required
										size="small"
										fullWidth
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										sx={inputSx}
									/>
								</Grid>
								<Grid item xs={12} sm={4}>
									<TextField
										label="Descripción (opcional)"
										size="small"
										fullWidth
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										sx={inputSx}
									/>
								</Grid>
								{import.meta.env.DEV && selectedTemplate.slug && DEV_FILL_DATA[selectedTemplate.slug] && (
									<Grid item xs={12} sm={1}>
										<Tooltip title="[DEV] Rellenar todos los campos con datos de prueba">
											<Button
												size="small"
												fullWidth
												onClick={() => {
													const dev = DEV_FILL_DATA[selectedTemplate!.slug!];
													// Empieza por los datos curados y completa TODO campo restante con un dummy por tipo.
													const complete: Record<string, string> = { ...dev.fields };
													for (const f of selectedTemplate!.fields || []) {
														if (f.type === "ai-prompt" || f.type === "flow-section") continue;
														// Un "" curado significa "dejar vacío a propósito" (ej. checkboxes excluyentes).
														if (Object.prototype.hasOwnProperty.call(dev.fields, f.name)) continue;
														if (complete[f.name] != null && complete[f.name] !== "") continue;
														if (f.type === "checkbox") complete[f.name] = "X";
														else if (f.type === "radio" || f.type === "select") complete[f.name] = f.options?.[0] || "Opción 1";
														else if (/dni|cuit|doc|numero|matricula/i.test(f.name)) complete[f.name] = "30.123.456";
														else if (/email/i.test(f.name)) complete[f.name] = "test@example.com";
														else if (/telefono|celular/i.test(f.name)) complete[f.name] = "11 5555-5555";
														else if (/fecha/i.test(f.name)) complete[f.name] = "01/07/2026";
														else complete[f.name] = `[${f.label || f.name}]`;
													}
													setFormValues((prev) => ({ ...prev, ...complete }));
													if (!title) setTitle(dev.title);
												}}
												sx={{
													textTransform: "none",
													fontSize: "0.65rem",
													fontWeight: 600,
													py: 0.75,
													whiteSpace: "nowrap",
													borderRadius: 1,
													border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.36 : 0.28)}`,
													color: STALE_AMBER,
													"&:hover": { bgcolor: alpha(STALE_AMBER, isDark ? 0.14 : 0.08), borderColor: alpha(STALE_AMBER, 0.5) },
												}}
											>
												DEV Fill
											</Button>
										</Tooltip>
									</Grid>
								)}
							</Grid>

							<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />

							{/* Template fields grouped */}
							{(() => {
								const { groups, groupOrder } = (() => {
									const gs: Record<string, PdfTemplateField[]> = {};
									const go: string[] = [];
									[...selectedTemplate.fields]
										.sort((a, b) => a.order - b.order)
										.forEach((f) => {
											// Los campos IA se computan al generar (no los completa el usuario).
											if (f.group === "__system" || f.type === "flow-section" || f.type === "ai-prompt") return;
											if (!gs[f.group]) {
												gs[f.group] = [];
												go.push(f.group);
											}
											gs[f.group].push(f);
										});
									return { groups: gs, groupOrder: go };
								})();
								const renderItems: Array<string | [string, string]> = [];
								let ri = 0;
								while (ri < groupOrder.length) {
									if (groupOrder[ri] === "destinatario" && groupOrder[ri + 1] === "remitente") {
										renderItems.push(["destinatario", "remitente"]);
										ri += 2;
									} else {
										renderItems.push(groupOrder[ri]);
										ri++;
									}
								}
								return renderItems.map((item) => {
									if (Array.isArray(item)) {
										const [gk1, gk2] = item;
										return (
											<Grid container spacing={2} key={`${gk1}-${gk2}`} alignItems="flex-start">
												<Grid item xs={12} md={6}>
													{renderGroup(gk1, groups[gk1])}
												</Grid>
												<Grid item xs={12} md={6}>
													{renderGroup(gk2, groups[gk2])}
												</Grid>
											</Grid>
										);
									}
									return (
										<Box key={item}>
											{renderGroup(item, groups[item])}
											{CONTACT_GROUPS.includes(item as ContactGroupKey) && item !== groupOrder[groupOrder.length - 1] && (
												<Box sx={{ height: 1, mt: 2, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
											)}
										</Box>
									);
								});
							})()}

							{/* Campos generados con IA — instrucción editable por generación */}
							{selectedTemplate.fields.some((f) => f.type === "ai-prompt") && (
								<>
									<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
									<Box
										sx={{
											p: 2,
											borderRadius: 1.5,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
										}}
									>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
											<MagicStar size={16} color={BRAND_BLUE} variant="Bulk" />
											<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary" }}>Campos generados con IA</Typography>
										</Stack>
										<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1.5, textWrap: "pretty" }}>
											La IA redacta estos campos al generar el documento (no aparecen en la planilla). Podés ajustar la instrucción para este caso; la IA usará los datos del formulario y los documentos de contexto que adjuntes.
										</Typography>
										<Stack spacing={1.5}>
											{selectedTemplate.fields
												.filter((f) => f.type === "ai-prompt")
												.map((f) => (
													<Box key={f.name}>
														<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "0.02em", mb: 0.5, fontWeight: 600 }}>
															{f.label}
														</Typography>
														<TextField
															fullWidth
															multiline
															minRows={2}
															size="small"
															value={formValues[f.name] ?? ""}
															onChange={(e) => handleFieldChange(f.name, e.target.value)}
															placeholder="Instrucción para la IA…"
															sx={inputSx}
														/>
													</Box>
												))}
										</Stack>
										<Box sx={{ height: 1, my: 1.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
										<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.primary", mb: 0.25 }}>Documentos de contexto (opcional)</Typography>
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mb: 1, textWrap: "pretty" }}>
											Adjuntá los hechos, la prueba o un escrito relacionado (PDF, Word o texto). La IA usará su contenido al redactar. Máx. 5 archivos.
										</Typography>
										<input
											ref={contextInputRef}
											type="file"
											accept=".pdf,.docx,.txt"
											multiple
											hidden
											onChange={(e) => {
												const files = Array.from(e.target.files || []);
												setContextFiles((prev) => [...prev, ...files].slice(0, 5));
												e.target.value = "";
											}}
										/>
										<Button
											size="small"
											startIcon={<DocumentUpload size={15} variant="Linear" />}
											onClick={() => contextInputRef.current?.click()}
											disabled={contextFiles.length >= 5}
											sx={ghostBtnSx}
										>
											Agregar documentos
										</Button>
										{contextFiles.length > 0 && (
											<Stack spacing={0.5} sx={{ mt: 1.25 }}>
												{contextFiles.map((f, i) => (
													<Stack
														key={`${f.name}-${i}`}
														direction="row"
														spacing={1}
														alignItems="center"
														sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04) }}
													>
														<DocumentText size={14} color={theme.palette.text.secondary} />
														<Typography sx={{ fontSize: "0.75rem", color: "text.primary", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
															{f.name}
														</Typography>
														<IconButton size="small" onClick={() => setContextFiles((prev) => prev.filter((_, j) => j !== i))} sx={{ width: 22, height: 22 }} aria-label="quitar">
															<CloseSquare size={14} color={theme.palette.text.secondary} />
														</IconButton>
													</Stack>
												))}
											</Stack>
										)}
									</Box>
								</>
							)}

							{/* Vincular */}
							<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
							<Box>
								{groupHeader("Vincular (opcional)")}
								<Stack spacing={1.5}>
									<Autocomplete
										size="small"
										options={allFolders.filter((f) => f.status !== "archived")}
										value={linkedFolder}
										getOptionLabel={(f: FolderData) => f.folderName || f.folderId || ""}
										isOptionEqualToValue={(opt, val) => opt._id === val._id}
										onChange={(_e, val) => setLinkedFolder(val)}
										renderOption={(props, f: FolderData) => (
											<Box component="li" {...props} key={f._id}>
												<Stack>
													<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{f.folderName}</Typography>
													{f.folderFuero && (
														<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{f.folderFuero}</Typography>
													)}
												</Stack>
											</Box>
										)}
										renderInput={(params) => <TextField {...params} label="Vincular con carpeta" placeholder="Buscar carpeta..." sx={inputSx} />}
										noOptionsText="Sin carpetas disponibles"
									/>
									{selectedTemplate.supportsTracking && !prefilledTrackingId && (
										<Box>
											<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
												{(["link", "create"] as const).map((mode) => {
													const active = trackingMode === mode;
													return (
														<Button
															key={mode}
															size="small"
															onClick={() => setTrackingMode(mode)}
															sx={{
																textTransform: "none",
																fontSize: "0.75rem",
																fontWeight: 600,
																letterSpacing: "-0.005em",
																py: 0.4,
																px: 1.25,
																borderRadius: 1,
																border: `1px solid ${active ? alpha(BRAND_BLUE, 0.55) : alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
																bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : "transparent",
																color: active ? BRAND_BLUE : "text.secondary",
																"&:hover": {
																	bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.06),
																	borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.3),
																	color: BRAND_BLUE,
																},
															}}
														>
															{mode === "link" ? "Vincular existente" : "Crear seguimiento"}
														</Button>
													);
												})}
											</Stack>

											{trackingMode === "link" && (
												<Autocomplete
													size="small"
													options={allTrackings}
													value={linkedTracking}
													getOptionLabel={(t: PostalTrackingType) => t.label || `${t.codeId} ${t.numberId}`.trim()}
													isOptionEqualToValue={(opt, val) => opt._id === val._id}
													onChange={(_e, val) => setLinkedTracking(val)}
													renderOption={(props, t: PostalTrackingType) => (
														<Box component="li" {...props} key={t._id}>
															<Stack>
																<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
																	{t.label || `${t.codeId} ${t.numberId}`}
																</Typography>
																<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
																	{t.trackingStatus || t.processingStatus}
																</Typography>
															</Stack>
														</Box>
													)}
													renderInput={(params) => <TextField {...params} label="Buscar seguimiento..." sx={inputSx} />}
													noOptionsText="Sin seguimientos disponibles"
												/>
											)}

											{trackingMode === "create" && (
												<Stack spacing={1.5}>
													<Stack direction="row" spacing={1.5}>
														<FormControl size="small" sx={{ minWidth: 90 }}>
															<InputLabel>Prefijo</InputLabel>
															<Select
																label="Prefijo"
																value={newTrackingCodeId}
																onChange={(e) => setNewTrackingCodeId(e.target.value)}
																sx={selectSx}
															>
																{VALID_CODE_IDS.map((c) => (
																	<MenuItem key={c} value={c}>
																		{c}
																	</MenuItem>
																))}
															</Select>
														</FormControl>
														<TextField
															size="small"
															label="Número (9 dígitos)"
															fullWidth
															value={newTrackingNumberId}
															onChange={(e) => setNewTrackingNumberId(e.target.value.replace(/\D/g, "").slice(0, 9))}
															error={newTrackingNumberId.length > 0 && !newTrackingNumberIdValid}
															helperText={newTrackingNumberId.length > 0 && !newTrackingNumberIdValid ? "9 dígitos exactos" : ""}
															inputProps={{ inputMode: "numeric" }}
															sx={inputSx}
														/>
													</Stack>
													<TextField
														size="small"
														label="Etiqueta del seguimiento (opcional)"
														fullWidth
														value={newTrackingLabel}
														placeholder={title || "Se usará el título del documento"}
														onChange={(e) => setNewTrackingLabel(e.target.value)}
														sx={inputSx}
													/>
												</Stack>
											)}
										</Box>
									)}
									{prefilledTrackingId && selectedTemplate.supportsTracking && (
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											Seguimiento postal vinculado automáticamente.
										</Typography>
									)}
								</Stack>
							</Box>
						</Stack>
					)}
				</DialogContent>

				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					{generatedDoc ? (
						<>
							<Button onClick={handleClose_} sx={ghostBtnSx}>
								Cerrar
							</Button>
							{generatedDoc.documentUrl && (
								<Button
									onClick={() => window.open(generatedDoc.documentUrl, "_blank")}
									startIcon={<DocumentDownload size={16} variant="Linear" />}
									sx={ghostBtnSx}
								>
									{selectedTemplate?.fillMethod === "docx-merge" ? "Ver planilla" : "Ver PDF"}
								</Button>
							)}
							{!docsGenerated && selectedTemplate?.fillMethod !== "docx-merge" && (selectedTemplate?.generates?.length ?? 0) > 0 && (
								<Button
									onClick={handleGenerateAll}
									disabled={genLoadingSlug === "__all__"}
									startIcon={
										genLoadingSlug === "__all__" ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DocumentText size={16} variant="Linear" />
									}
									sx={brandPrimarySx}
								>
									{genLoadingSlug === "__all__" ? "Generando…" : `Generar documentos (${selectedTemplate?.generates?.length})`}
								</Button>
							)}
							{!docsGenerated && selectedTemplate?.fillMethod === "docx-merge" && (
								<Button
									onClick={handleGenerateDocument}
									disabled={demandaLoading}
									startIcon={demandaLoading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <DocumentText size={16} variant="Linear" />}
									sx={brandPrimarySx}
								>
									{demandaLoading
										? "Generando…"
										: (selectedTemplate?.generates?.length ?? 0) > 1
											? `Generar documentos (${selectedTemplate?.generates?.length})`
											: "Generar documento"}
								</Button>
							)}
							<Button
								onClick={() => {
									handleClose_();
									navigate("/documentos/escritos");
								}}
								startIcon={<FolderOpen size={16} variant="Linear" />}
								sx={brandPrimarySx}
							>
								Ir a Documentos
							</Button>
						</>
					) : step === 0 ? (
						<Button onClick={handleClose_} sx={ghostBtnSx}>
							Cancelar
						</Button>
					) : (
						<>
							<Button onClick={preselectedTemplate ? handleClose_ : handleBack} sx={ghostBtnSx}>
								{preselectedTemplate ? "Cancelar" : "Volver"}
							</Button>
							<Button
								onClick={handleSaveDraft}
								disabled={savingDraft || !title.trim()}
								startIcon={savingDraft ? <CircularProgress size={14} color="inherit" /> : <Save2 size={16} variant="Linear" />}
								sx={ghostBtnSx}
							>
								{savingDraft ? "Guardando…" : "Guardar borrador"}
							</Button>
							<Tooltip
								title={
									!title.trim()
										? "Poné un título"
										: missingRequired.length > 0
											? `Faltan campos obligatorios: ${missingRequired.join(", ")}`
											: ""
								}
								arrow
							>
								<Box component="span" sx={{ display: "inline-flex" }}>
									<Button
										onClick={handleSubmit}
										disabled={generating || !canGenerate}
										startIcon={generating ? <CircularProgress size={14} color="inherit" /> : undefined}
										sx={brandPrimarySx}
									>
										{generating ? "Generando…" : hasSecondStep ? "Generar formulario" : "Generar documento"}
									</Button>
								</Box>
							</Tooltip>
						</>
					)}
				</DialogActions>
			</Dialog>

			{/* ── Save as contact dialog ── */}
			<Dialog
				open={saveDialog.open}
				onClose={() => setSaveDialog((s) => ({ ...s, open: false }))}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: dialogPaperSx }}
			>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						flexShrink: 0,
						p: { xs: 2.25, sm: 2.5 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: -60,
							right: -40,
							width: 200,
							height: 200,
							borderRadius: "50%",
							background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
							pointerEvents: "none",
						}}
					/>
					<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Save2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Nuevo contacto
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Guardar como contacto
							</Typography>
						</Stack>
						<IconButton onClick={() => setSaveDialog((s) => ({ ...s, open: false }))} sx={iconBtnSx} aria-label="cerrar">
							<CloseSquare size={20} variant="Linear" />
						</IconButton>
					</Stack>
				</Box>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Los datos de{" "}
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
								{saveDialog.group ? GROUP_LABELS[saveDialog.group] : ""}
							</Box>{" "}
							se guardarán como un nuevo contacto.
						</Typography>

						<TextField
							size="small"
							label="Nombre del contacto"
							disabled
							fullWidth
							value={
								saveDialog.group === "destinatario"
									? formValues.dest_nombre || ""
									: saveDialog.group === "remitente"
									? formValues.rem_nombre || ""
									: formValues.suscribe_nombre || ""
							}
							sx={inputSx}
						/>

						<FormControl size="small" fullWidth>
							<InputLabel>Tipo de contacto</InputLabel>
							<Select
								label="Tipo de contacto"
								value={saveDialog.contactType}
								onChange={(e) =>
									setSaveDialog((s) => ({
										...s,
										contactType: e.target.value as "Humana" | "Jurídica",
									}))
								}
								sx={selectSx}
							>
								<MenuItem value="Humana">Persona física</MenuItem>
								<MenuItem value="Jurídica">Persona jurídica / Empresa</MenuItem>
							</Select>
						</FormControl>

						<TextField
							size="small"
							label="Rol / Relación"
							fullWidth
							placeholder="Ej: Empleador, Trabajador, Cliente..."
							value={saveDialog.role}
							onChange={(e) => setSaveDialog((s) => ({ ...s, role: e.target.value }))}
							sx={inputSx}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={() => setSaveDialog((s) => ({ ...s, open: false }))} sx={ghostBtnSx}>
						Cancelar
					</Button>
					<Button
						onClick={handleSaveContact}
						disabled={savingContact || !saveDialog.role.trim()}
						startIcon={savingContact ? <CircularProgress size={14} color="inherit" /> : undefined}
						sx={brandPrimarySx}
					>
						Guardar contacto
					</Button>
				</DialogActions>
			</Dialog>

			{/* Ayuda: cómo cargar los datos del abogado (nombre y/o matrícula CPACF) en el perfil */}
			<Dialog
				open={abogadoHelp.open}
				onClose={() => setAbogadoHelp((h) => ({ ...h, open: false }))}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: dialogPaperSx }}
			>
				<Box
					sx={{
						position: "relative",
						overflow: "hidden",
						p: { xs: 2.25, sm: 2.5 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Profile2User size={20} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
							{abogadoHelp.name && abogadoHelp.matricula ? "Completá tus datos" : abogadoHelp.name ? "Cargá tu nombre" : "Cargá tu matrícula"}
						</Typography>
					</Stack>
				</Box>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Stack spacing={1.75}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textWrap: "pretty" }}>
							Para completar los datos del abogado con un clic, cargá {abogadoHelp.name && abogadoHelp.matricula ? "estos datos" : "este dato"} en tu
							perfil:
						</Typography>
						{abogadoHelp.name && (
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.03),
								}}
							>
								<Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", mb: 0.25 }}>Nombre y apellido</Typography>
								<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", textWrap: "pretty" }}>
									En{" "}
									<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
										Perfil → Usuario → Información Personal
									</Box>
									, cargá tu nombre y apellido.
								</Typography>
							</Box>
						)}
						{abogadoHelp.matricula && (
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.03),
								}}
							>
								<Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", mb: 0.25 }}>Matrícula (fuero nacional)</Typography>
								<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", textWrap: "pretty" }}>
									En{" "}
									<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
										Perfil → Usuario → Información Profesional
									</Box>
									, agregá el “Colegio Público de Abogados de la Capital Federal” y cargá tu matrícula (por ejemplo Tº 109 Fº 47).
								</Typography>
							</Box>
						)}
						<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textWrap: "pretty" }}>
							Una vez guardado, el botón “Mis datos” lo completará automáticamente. Mientras tanto, podés escribirlo a mano.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={() => setAbogadoHelp((h) => ({ ...h, open: false }))} sx={ghostBtnSx}>
						Cerrar
					</Button>
					<Button
						onClick={() => {
							setAbogadoHelp((h) => ({ ...h, open: false }));
							navigate(abogadoHelp.matricula ? "/apps/profiles/user/professional" : "/apps/profiles/user/personal");
						}}
						startIcon={<Profile2User size={16} variant="Linear" />}
						sx={brandPrimarySx}
					>
						Ir a mi perfil
					</Button>
				</DialogActions>
			</Dialog>

			<LimitErrorModal
				open={limitErrorOpen}
				onClose={() => setLimitErrorOpen(false)}
				message={limitErrorMessage}
				limitInfo={limitErrorInfo}
				upgradeRequired
			/>
		</>
	);
}
