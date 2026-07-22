import React from "react";
import { PjnAccess } from "types/movements";
import MovementsUpgradeBanner from "components/shared/MovementsUpgradeBanner";

// Wrapper de compatibilidad: mapea el objeto de acceso del server (pjnAccess/
// mevAccess/scbaAccess/ejeAccess — todos comparten shape) al banner unificado
// de upgrade. Rediseño 2026-07: mismo diseño y copy en todas las vistas.
interface PjnAccessAlertProps {
	pjnAccess?: PjnAccess;
	onUpgrade?: () => void;
}

const PjnAccessAlert: React.FC<PjnAccessAlertProps> = ({ pjnAccess }) => {
	if (!pjnAccess || pjnAccess.hasAccess) {
		return null;
	}

	return (
		<MovementsUpgradeBanner
			previewCount={pjnAccess.previewCount ?? null}
			totalMovements={pjnAccess.totalMovements ?? null}
			requiredPlans={pjnAccess.requiredPlans}
		/>
	);
};

export default PjnAccessAlert;
