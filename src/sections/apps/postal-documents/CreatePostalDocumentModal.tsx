import { useEffect, useState } from "react";
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
import { Add, CloseSquare, DocumentText, Profile2User, Save2, Trash } from "iconsax-react";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, createPostalDocument, updatePostalDocument } from "store/reducers/postalDocuments";
import { getContactsByUserId, addContact, updateContact } from "store/reducers/contacts";
import { createPostalTracking, fetchAllTrackings } from "store/reducers/postalTracking";
import { getFoldersByUserId } from "store/reducers/folder";
import { PdfTemplate, PdfTemplateField } from "types/postal-document";
import { Contact } from "types/contact";
import { OBJETOS_JUICIO_CIVIL, ObjetoJuicio } from "data/objetosJuicioCivil";
import { FolderData } from "types/folder";
import { PostalTrackingType } from "types/postal-tracking";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
	open: boolean;
	handleClose: () => void;
	prefilledTrackingId?: string | null;
	preselectedTemplate?: PdfTemplate | null;
	prefilledFolderId?: string | null;
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

const EXCLUSIVE_CHECKBOX_PAIRS: [string, string][] = [["suscribe_sexo_f", "suscribe_sexo_m"]];

const DEV_FILL_DATA: Record<string, { title: string; fields: Record<string, string> }> = {
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
	}
	return out;
}

function contact_nationality(c: Contact): string {
	return c.nationality || "";
}

/** Parsea Tomo/Folio de un registrationNumber tipo "T123 F456", "T° 123 F° 456" o "123/456". */
function parseTomoFolio(reg?: string): { tomo: string; folio: string } {
	if (!reg) return { tomo: "", folio: "" };
	const m = reg.match(/T[°º.\s]*(\d+)\s*F[°º.\s]*(\d+)/i) || reg.match(/^(\d+)\s*\/\s*(\d+)$/);
	return m ? { tomo: m[1], folio: m[2] } : { tomo: "", folio: "" };
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
		acc[f.name] = "";
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
	showSnackbar,
}: Props) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const allContacts: Contact[] = useSelector((state: any) => state.contacts?.contacts || []);
	const allFolders: FolderData[] = useSelector((state: any) => state.folder?.folders || []);
	const allTrackings: PostalTrackingType[] = useSelector((state: any) => state.postalTrackingReducer?.allTrackings || []);
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const user = useSelector((state: any) => state.auth?.user);

	const [step, setStep] = useState<0 | 1>(0);
	const [templates, setTemplates] = useState<PdfTemplate[]>([]);
	const [loadingTemplates, setLoadingTemplates] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
	const [formValues, setFormValues] = useState<Record<string, string>>({});
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [generating, setGenerating] = useState(false);

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

	useEffect(() => {
		if (!open) return;
		if (preselectedTemplate) {
			setSelectedTemplate(preselectedTemplate);
			setFormValues(getInitialFormValues(preselectedTemplate.fields));
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
		if (!user) return;
		const skill = user.skill?.[0];
		const fullName = `${user.lastName || ""}${user.lastName ? ", " : ""}${user.firstName || user.name || ""}`.trim();
		const { tomo, folio } = parseTomoFolio(skill?.registrationNumber);
		setFormValues((prev) => ({
			...prev,
			abogado_nombre: fullName,
			abogado_tomo: tomo,
			abogado_folio: folio,
		}));
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
		setFormValues((prev) => ({ ...prev, ...contactsToRowValues(list, base, max) }));
		setVisibleRows((prev) => ({ ...prev, [groupKey]: Math.max(prev[groupKey] || 1, list.length || 1) }));
	};

	// Auto-relleno desde el expediente vinculado (solo para la Planilla Civil):
	// reparte los contactos del folder por rol de parte en las filas de actores/demandados.
	useEffect(() => {
		if (!linkedFolder || selectedTemplate?.slug !== "planilla_inicio_civil") return;
		const folderContacts = allContacts.filter((c) => c.folderIds?.includes(linkedFolder._id));
		const actores = folderContacts.filter((c) => contactPartyRole(c) === "actor");
		const demandados = folderContacts.filter((c) => contactPartyRole(c) === "demandado");
		if (actores.length) applyContactsToGroup(actores, "actor", "Actores");
		if (demandados.length) applyContactsToGroup(demandados, "demandado", "Demandados");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [linkedFolder, selectedTemplate]);

	const newTrackingNumberIdValid = /^\d{9}$/.test(newTrackingNumberId);
	const willCreateTracking =
		selectedTemplate?.supportsTracking && !prefilledTrackingId && !linkedTracking && trackingMode === "create" && newTrackingNumberIdValid;

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
			showSnackbar("Documento generado exitosamente", "success");
			resetState();
			handleClose();
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
			groupKey === "Actores" ? "actor" : groupKey === "Demandados" ? "demandado" : null;
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
				{groupHeader(GROUP_LABELS[groupKey] || groupKey)}
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

		// Planilla Civil — Objeto del juicio: select buscable de códigos (número + descripción)
		if (groupKey === "Objeto") {
			const selectedObjeto = OBJETOS_JUICIO_CIVIL.find((o) => o.code === formValues.objeto_codigo) || null;
			return (
				<Box key={groupKey}>
					{groupHeader(GROUP_LABELS[groupKey] || groupKey)}
					<Autocomplete
						size="small"
						options={OBJETOS_JUICIO_CIVIL}
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

		// Planilla Civil — Abogados: botón "Mis datos" (perfil profesional → nombre + T°/F°)
		if (groupKey === "Abogados") {
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
					{/* ── Step 0: template selection (solo modelos del sistema) ── */}
					{step === 0 && (
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
					{step === 1 && selectedTemplate && (
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
													setFormValues((prev) => ({ ...prev, ...dev.fields }));
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
											if (f.group === "__system" || f.type === "flow-section") return;
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
					{step === 0 && (
						<Button onClick={handleClose_} sx={ghostBtnSx}>
							Cancelar
						</Button>
					)}
					{step === 1 && (
						<>
							<Button onClick={handleBack} sx={ghostBtnSx}>
								Volver
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={generating || !title.trim()}
								startIcon={generating ? <CircularProgress size={14} color="inherit" /> : undefined}
								sx={brandPrimarySx}
							>
								Generar documento
							</Button>
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
