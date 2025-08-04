import { Document, DocumentTemplate } from "types/documents";

export const mockDocuments: Document[] = [
	{
		id: "doc_1",
		title: "Demanda por Despido - García vs. TechCorp S.A.",
		type: "demanda",
		status: "final",
		content: `<h1>DEMANDA LABORAL</h1>
		<p><strong>Sr. Juez:</strong></p>
		<p>Juan García, con domicilio en Av. Corrientes 1234, CABA, con el patrocinio letrado del Dr. [Nombre Abogado], 
		constituyendo domicilio procesal en [Dirección], ante V.S. respetuosamente me presento y digo:</p>
		<h2>I.- OBJETO</h2>
		<p>Que vengo a promover demanda laboral contra TechCorp S.A., con domicilio en...</p>`,
		folderId: "folder_123",
		version: 2,
		createdBy: "Dr. López",
		lastModifiedBy: "Dr. López",
		createdAt: "2024-01-15T00:00:00.000Z",
		updatedAt: "2024-01-20T00:00:00.000Z",
		tags: ["laboral", "despido"],
		metadata: {
			court: "Juzgado Nacional del Trabajo Nº 15",
			caseNumber: "EXP-2024-001234",
			parties: ["Juan García", "TechCorp S.A."],
		},
	},
	{
		id: "doc_2",
		title: "Contestación de Demanda - Pérez c/ Construcciones XYZ",
		type: "contestacion",
		status: "draft",
		content: `<h1>CONTESTA DEMANDA</h1>
		<p>Por la representación que acredito con el poder que acompaño, constituyendo domicilio...</p>`,
		version: 1,
		createdBy: "Dra. Martínez",
		lastModifiedBy: "Dra. Martínez",
		createdAt: "2024-02-01T00:00:00.000Z",
		updatedAt: "2024-02-03T00:00:00.000Z",
		tags: ["civil", "contestación"],
	},
	{
		id: "doc_3",
		title: "Escrito de Prueba - Expediente 2024/789",
		type: "escrito",
		status: "draft",
		content: `<h1>OFRECE PRUEBA</h1>
		<p>En tiempo y forma vengo a ofrecer la siguiente prueba...</p>`,
		folderId: "folder_456",
		version: 3,
		createdBy: "Dr. Rodríguez",
		lastModifiedBy: "Dr. Rodríguez",
		createdAt: "2024-02-10T00:00:00.000Z",
		updatedAt: "2024-02-15T00:00:00.000Z",
	},
];

export const mockTemplates: DocumentTemplate[] = [
	{
		id: "template_1",
		name: "Demanda Laboral - Despido",
		description: "Plantilla para demanda laboral por despido injustificado",
		category: "laboral",
		content: `<h1>DEMANDA LABORAL</h1>
		<p><strong>Sr. Juez:</strong></p>
		<p>{{NOMBRE_ACTOR}}, con domicilio en {{DOMICILIO_ACTOR}}, con el patrocinio letrado del Dr. {{NOMBRE_ABOGADO}}, 
		constituyendo domicilio procesal en {{DOMICILIO_PROCESAL}}, ante V.S. respetuosamente me presento y digo:</p>
		<h2>I.- OBJETO</h2>
		<p>Que vengo a promover demanda laboral contra {{NOMBRE_DEMANDADO}}, con domicilio en {{DOMICILIO_DEMANDADO}}...</p>`,
		variables: [
			{
				id: "var_1",
				name: "NOMBRE_ACTOR",
				label: "Nombre del Actor",
				type: "text",
				required: true,
			},
			{
				id: "var_2",
				name: "DOMICILIO_ACTOR",
				label: "Domicilio del Actor",
				type: "text",
				required: true,
			},
			{
				id: "var_3",
				name: "NOMBRE_ABOGADO",
				label: "Nombre del Abogado",
				type: "text",
				required: true,
			},
			{
				id: "var_4",
				name: "DOMICILIO_PROCESAL",
				label: "Domicilio Procesal",
				type: "text",
				required: true,
			},
			{
				id: "var_5",
				name: "NOMBRE_DEMANDADO",
				label: "Nombre del Demandado",
				type: "text",
				required: true,
			},
			{
				id: "var_6",
				name: "DOMICILIO_DEMANDADO",
				label: "Domicilio del Demandado",
				type: "text",
				required: true,
			},
		],
		isPublic: true,
		createdBy: "Sistema",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
		tags: ["laboral", "despido", "demanda"],
	},
	{
		id: "template_2",
		name: "Poder General Judicial",
		description: "Plantilla para poder general judicial",
		category: "general",
		content: `<h1>PODER GENERAL JUDICIAL</h1>
		<p>En la ciudad de {{CIUDAD}}, a los {{DIA}} días del mes de {{MES}} del año {{AÑO}}, 
		comparece ante mí {{NOMBRE_PODERDANTE}}, con DNI {{DNI_PODERDANTE}}...</p>`,
		variables: [
			{
				id: "var_7",
				name: "CIUDAD",
				label: "Ciudad",
				type: "text",
				required: true,
				defaultValue: "Buenos Aires",
			},
			{
				id: "var_8",
				name: "DIA",
				label: "Día",
				type: "number",
				required: true,
			},
			{
				id: "var_9",
				name: "MES",
				label: "Mes",
				type: "select",
				options: [
					"enero",
					"febrero",
					"marzo",
					"abril",
					"mayo",
					"junio",
					"julio",
					"agosto",
					"septiembre",
					"octubre",
					"noviembre",
					"diciembre",
				],
				required: true,
			},
			{
				id: "var_10",
				name: "AÑO",
				label: "Año",
				type: "number",
				required: true,
				defaultValue: new Date().getFullYear(),
			},
			{
				id: "var_11",
				name: "NOMBRE_PODERDANTE",
				label: "Nombre del Poderdante",
				type: "text",
				required: true,
			},
			{
				id: "var_12",
				name: "DNI_PODERDANTE",
				label: "DNI del Poderdante",
				type: "text",
				required: true,
			},
		],
		isPublic: true,
		createdBy: "Sistema",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
		tags: ["poder", "general"],
	},
];
