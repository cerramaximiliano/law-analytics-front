// Document templates for legal documents
// These will eventually come from the backend

import { DocumentTemplate, DocumentCategory } from "types/documents";

// Legacy interface for backward compatibility with local templates
export interface TemplateVariable {
	name: string;
	path: string;
	type: "contact" | "folder" | "user" | "other";
	required: boolean;
	label: string;
	description?: string;
	fallback?: string;
}

export const documentTemplates: DocumentTemplate[] = [
	{
		id: "blank",
		name: "Documento en Blanco",
		description: "Comience con un documento vacío",
		category: "general" as DocumentCategory,
		content: "",
		// isDefault: true, // This field is not in the new DocumentTemplate type
	},
	{
		id: "presentacion_patrocinante",
		name: "Presentación como Patrocinante",
		description: "Acápite de presentación para actuar como letrado patrocinante",
		category: "general" as DocumentCategory,
		content: `<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. decimos:</p>`,
		variables: ["contact", "user", "folder"],
		variableDetails: [
			{
				// name: "contact.name", // Not needed in new format
				model: "Contact" as const,
				property: "name",
				displayName: "NOMBRE_CLIENTE",
				path: "contact.name",
				type: "contact",
				required: true,
				label: "Nombre del Cliente",
				description: "Nombre del cliente que será representado",
				fallback: "{{NOMBRE_CLIENTE}}",
			},
			{
				// name: "contact.lastName", // Not needed in new format
				model: "Contact" as const,
				property: "lastName",
				displayName: "APELLIDO_CLIENTE",
				path: "contact.lastName",
				type: "contact",
				required: true,
				label: "Apellido del Cliente",
				description: "Apellido del cliente que será representado",
				fallback: "{{APELLIDO_CLIENTE}}",
			},
			{
				// name: "contact.document", // Not needed in new format
				model: "Contact" as const,
				property: "document",
				displayName: "DNI_CLIENTE",
				path: "contact.document",
				type: "contact",
				required: true,
				label: "DNI del Cliente",
				description: "Número de documento del cliente",
				fallback: "{{DNI_CLIENTE}}",
			},
			{
				// name: "contact.address", // Not needed in new format
				model: "Contact" as const,
				property: "address",
				displayName: "DIRECCION_CLIENTE",
				path: "contact.address",
				type: "contact",
				required: true,
				label: "Dirección del Cliente",
				description: "Domicilio real del cliente",
				fallback: "{{DIRECCION_CLIENTE}}",
			},
			{
				// name: "folder.folderName", // Not needed in new format
				model: "Folder" as const,
				property: "folderName",
				displayName: "NOMBRE_CARPETA",
				path: "folder.folderName",
				type: "folder",
				required: true,
				label: "Nombre de la Causa",
				description: "Carátula del expediente",
				fallback: "{{NOMBRE_CARPETA}}",
			},
			{
				// name: "folder.judFolder.numberJudFolder", // Not needed in new format
				model: "JudFolder" as const,
				property: "numberJudFolder",
				displayName: "NUMERO_EXPEDIENTE",
				path: "folder.judFolder.numberJudFolder",
				type: "folder",
				required: true,
				label: "Número de Expediente",
				description: "Número del expediente judicial",
				fallback: "{{NUMERO_EXPEDIENTE}}",
			},
		],
		tags: ["presentación", "patrocinio", "acápite"],
	},
	{
		id: "presentacion_apoderado",
		name: "Presentación como Apoderado",
		description: "Acápite de presentación para actuar como apoderado en juicio",
		category: "general" as DocumentCategory,
		content: `<p>Sr. Juez:</p>
<p>{{user.firstName}} {{user.lastName}}, abogado inscripto {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, en mi carácter de apoderado de {{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conforme poder que acompaño, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. digo:</p>`,
		variables: ["user", "contact", "folder"],
		tags: ["presentación", "apoderamiento", "acápite"],
	},
	{
		id: "demanda_laboral",
		name: "Demanda Laboral",
		description: "Plantilla base para demanda laboral por despido",
		category: "laboral" as DocumentCategory,
		content: `<h1 style="text-align: center;">PROMUEVE DEMANDA</h1>
<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, condición tributaria {{user.skill.taxCondition}}, CUIT {{user.skill.taxCode}}, a V.S. respetuosamente digo:</p>
<h2>I.- OBJETO</h2>
<p>Que vengo por la presente a promover formal demanda laboral contra {{NOMBRE_DEMANDADO}}, CUIT {{CUIT_DEMANDADO}}, con domicilio en {{DIRECCION_DEMANDADO}}, por cobro de {{CONCEPTOS_RECLAMADOS}}, conforme los hechos y el derecho que paso a exponer.</p>
<h2>II.- HECHOS</h2>
<p>{{RELATO_HECHOS}}</p>
<h2>III.- DERECHO</h2>
<p>Fundo el derecho de esta parte en lo dispuesto por {{NORMATIVA_APLICABLE}}.</p>
<h2>IV.- PRUEBA</h2>
<p>A fin de acreditar los extremos invocados, ofrezco la siguiente prueba:</p>
<h2>V.- PETITORIO</h2>
<p>Por todo lo expuesto, a V.S. solicito:</p>
<p>1) Me tenga por presentado, por parte y por constituido el domicilio procesal indicado.</p>
<p>2) Se tenga por promovida formal demanda.</p>
<p>3) Oportunamente, se haga lugar a la demanda en todas sus partes, con costas.</p>
<p>Proveer de conformidad,</p>
<p style="text-align: center;">SERÁ JUSTICIA</p>`,
		variables: ["contact", "user", "folder"],
		tags: ["demanda", "laboral", "despido"],
	},
	{
		id: "contestacion_demanda",
		name: "Contestación de Demanda",
		description: "Plantilla para contestar demanda y oponer excepciones",
		category: "general" as DocumentCategory,
		content: `<h1 style="text-align: center;">CONTESTA DEMANDA - OPONE EXCEPCIONES</h1>
<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, con domicilio en {{contact.address}}, {{contact.city}}, {{contact.state}}, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, con domicilio electrónico {{user.skill.electronicAddress}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. respetuosamente digo:</p>
<h2>I.- OBJETO</h2>
<p>Que vengo en tiempo y forma a contestar la demanda instaurada en mi contra, solicitando su rechazo con costas, conforme a las consideraciones de hecho y derecho que paso a exponer.</p>
<h2>II.- NEGATIVAS</h2>
<p>{{NEGATIVA_HECHOS}}</p>
<h2>III.- EXCEPCIONES</h2>
<p>{{EXCEPCIONES_PROCESALES}}</p>
<h2>IV.- HECHOS</h2>
<p>{{VERSION_HECHOS_DEMANDADO}}</p>
<h2>V.- DERECHO</h2>
<p>Fundo el derecho de esta parte en {{NORMATIVA_APLICABLE}}.</p>
<h2>VI.- PRUEBA</h2>
<p>Ofrezco la siguiente prueba:</p>
<h2>VII.- PETITORIO</h2>
<p>Por lo expuesto, solicito:</p>
<p>1) Me tenga por presentado y por contestada la demanda en tiempo y forma.</p>
<p>2) Se rechace la demanda en todas sus partes, con costas.</p>
<p>Proveer de conformidad,</p>
<p style="text-align: center;">SERÁ JUSTICIA</p>`,
		variables: ["contact", "user", "folder"],
		tags: ["contestación", "excepciones", "defensa"],
	},
	{
		id: "recurso_apelacion",
		name: "Recurso de Apelación",
		description: "Plantilla para interponer recurso de apelación",
		category: "general" as DocumentCategory,
		content: `<h1 style="text-align: center;">INTERPONE RECURSO DE APELACIÓN</h1>
<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. respetuosamente digo:</p>
<h2>I.- OBJETO</h2>
<p>Que vengo en legal tiempo y forma a interponer RECURSO DE APELACIÓN contra la resolución de fecha {{FECHA_RESOLUCION}}, notificada el {{FECHA_NOTIFICACION}}, por resultar la misma gravosa a los intereses de mi parte.</p>
<h2>II.- FUNDAMENTOS</h2>
<p>{{AGRAVIOS}}</p>
<h2>III.- PETITORIO</h2>
<p>Por lo expuesto, solicito:</p>
<p>1) Se tenga por interpuesto en tiempo y forma el recurso de apelación.</p>
<p>2) Se conceda el recurso y se eleven los autos a la Excma. Cámara.</p>
<p>Proveer de conformidad,</p>
<p style="text-align: center;">SERÁ JUSTICIA</p>`,
		variables: ["contact", "user", "folder"],
		tags: ["apelación", "recurso", "agravios"],
	},
	{
		id: "medida_cautelar",
		name: "Solicitud de Medida Cautelar",
		description: "Plantilla para solicitar medidas cautelares",
		category: "general" as DocumentCategory,
		content: `<h1 style="text-align: center;">SOLICITA MEDIDA CAUTELAR</h1>
<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. respetuosamente digo:</p>
<h2>I.- OBJETO</h2>
<p>Que vengo a solicitar se decrete {{TIPO_MEDIDA_CAUTELAR}} contra {{NOMBRE_DEMANDADO}}, conforme los fundamentos que paso a exponer.</p>
<h2>II.- VEROSIMILITUD DEL DERECHO</h2>
<p>{{VEROSIMILITUD_DERECHO}}</p>
<h2>III.- PELIGRO EN LA DEMORA</h2>
<p>{{PELIGRO_DEMORA}}</p>
<h2>IV.- CONTRACAUTELA</h2>
<p>Ofrezco {{TIPO_CONTRACAUTELA}}.</p>
<h2>V.- PETITORIO</h2>
<p>Por lo expuesto, solicito:</p>
<p>1) Se decrete la medida cautelar solicitada.</p>
<p>2) Se libre el mandamiento correspondiente.</p>
<p>Proveer de conformidad,</p>
<p style="text-align: center;">SERÁ JUSTICIA</p>`,
		variables: ["contact", "user", "folder"],
		tags: ["cautelar", "embargo", "urgente"],
	},
	{
		id: "escrito_simple",
		name: "Escrito Simple",
		description: "Plantilla básica para escritos judiciales",
		category: "general" as DocumentCategory,
		content: `<p>Sr. Juez:</p>
<p>{{contact.name}} {{contact.lastName}}, DNI {{contact.document}}, por derecho propio, conjuntamente con mi letrado patrocinante Dr. {{user.firstName}} {{user.lastName}}, {{user.skill.registrationNumber}} - {{user.skill.name}}, en autos "{{folder.folderName}} s/ {{folder.materia}}", EXPTE. {{folder.judFolder.numberJudFolder}}, a V.S. respetuosamente digo:</p>
<p>{{CONTENIDO_ESCRITO}}</p>
<p>Por lo expuesto, solicito:</p>
<p>{{PETITORIO}}</p>
<p>Proveer de conformidad,</p>
<p style="text-align: center;">SERÁ JUSTICIA</p>`,
		variables: ["contact", "user", "folder"],
		tags: ["escrito", "general"],
	},
];

// Function to get template by ID
// Now this is just a fallback for local templates
export const getTemplateById = (id: string): DocumentTemplate | undefined => {
	return documentTemplates.find((template) => template.id === id);
};

// Note: documentTemplates is already exported as const above

// Function to get templates by category
export const getTemplatesByCategory = (category: string): DocumentTemplate[] => {
	return documentTemplates.filter((template) => template.category === category);
};

// Function to search templates
export const searchTemplates = (searchTerm: string): DocumentTemplate[] => {
	const term = searchTerm.toLowerCase();
	return documentTemplates.filter(
		(template) =>
			template.name.toLowerCase().includes(term) ||
			template.description.toLowerCase().includes(term) ||
			template.tags?.some((tag) => tag.toLowerCase().includes(term)),
	);
};
