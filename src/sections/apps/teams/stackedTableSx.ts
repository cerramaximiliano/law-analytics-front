// En mobile las tablas de integrantes se apilan: cada fila ocupa el ancho de la tarjeta, sin scroll lateral.
export const MOBILE_ONLY = "@media (max-width:599.95px)";

export const stackedRowSx = {
	display: "block",
	py: 1,
	borderBottom: "1px solid",
	borderColor: "divider",
	"&:last-of-type": { borderBottom: 0 },
};

export const stackedTableSx = {
	[MOBILE_ONLY]: {
		display: "block",
		"& thead": { display: "none" },
		"& tbody": { display: "block" },
		"& tbody tr": stackedRowSx,
		// El tema fija padding en la primera y la última celda: hace falta su misma especificidad.
		"& tbody .MuiTableCell-root, & tbody .MuiTableCell-root:first-of-type, & tbody .MuiTableCell-root:last-of-type": {
			display: "block",
			borderBottom: 0,
			pl: 0,
			pr: 0,
			py: 0.5,
		},
	},
};

// Nombres y correos: en mobile cortan línea en vez de truncarse.
export const wrapOnMobileSx = {
	whiteSpace: { xs: "normal", sm: "nowrap" },
	overflowWrap: { xs: "anywhere", sm: "normal" },
} as const;
