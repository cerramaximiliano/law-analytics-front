// Identificación del titular del servicio.
//
// Un dato, un lugar: lo usan Términos y Política de privacidad, y es lo que
// consultan tanto un usuario que quiere saber con quién contrata como los
// procesos de verificación de empresa (Meta, pasarelas de pago), que cotejan
// razón social, domicilio y teléfono del sitio contra la documentación
// societaria. Si cambia el domicilio, se cambia acá.

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Link, Stack, Typography } from "@mui/material";

export const LEGAL_ENTITY = {
	legalName: "RUMBA LLC",
	brand: "Law||Analytics",
	jurisdiction: "sociedad de responsabilidad limitada constituida en el Estado de Delaware, Estados Unidos",
	address: "20 Penn Mart Shopping Ctr, PMB 576, New Castle, DE 19720, Estados Unidos",
	phone: "+1 302 613 4370",
	email: "soporte@lawanalytics.app",
	site: "www.lawanalytics.app",
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1 }}>
		<Typography variant="body2" color="text.secondary" sx={{ minWidth: 132, fontWeight: 500 }}>
			{label}
		</Typography>
		<Typography variant="body2">{children}</Typography>
	</Stack>
);

const LegalEntityBlock = ({ title = "Identificación del titular" }: { title?: string }) => {
	const theme = useTheme();

	return (
		<Box
			component="section"
			id="titular-del-servicio"
			sx={{
				mt: 3,
				p: { xs: 2, md: 2.5 },
				borderRadius: 2,
				border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
				bgcolor: alpha(theme.palette.primary.main, 0.03),
			}}
		>
			<Typography variant="h5" sx={{ mb: 1.5 }}>
				{title}
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				{LEGAL_ENTITY.site} y la plataforma {LEGAL_ENTITY.brand} son operados por {LEGAL_ENTITY.legalName}, {LEGAL_ENTITY.jurisdiction}.
			</Typography>
			<Stack spacing={0.75}>
				<Row label="Razón social">{LEGAL_ENTITY.legalName}</Row>
				<Row label="Domicilio">{LEGAL_ENTITY.address}</Row>
				<Row label="Teléfono">
					<Link href={`tel:${LEGAL_ENTITY.phone.replace(/\s/g, "")}`} underline="hover">
						{LEGAL_ENTITY.phone}
					</Link>
				</Row>
				<Row label="Correo electrónico">
					<Link href={`mailto:${LEGAL_ENTITY.email}`} underline="hover">
						{LEGAL_ENTITY.email}
					</Link>
				</Row>
			</Stack>
		</Box>
	);
};

export default LegalEntityBlock;
