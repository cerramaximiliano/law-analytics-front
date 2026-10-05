/**
 * /settings/connected-apps — alias histórico. La gestión de asistentes de IA
 * conectados vive en Integraciones (`sections/apps/profiles/account/ConnectedAiApps.tsx`).
 * Se mantiene la ruta porque la usan el mail "conectaste una app" y textos legales.
 */

import { Navigate } from "react-router-dom";

export const CONNECTED_AI_APPS_PATH = "/apps/profiles/account/pjn?view=ia";

const ConnectedAppsPage = () => <Navigate to={CONNECTED_AI_APPS_PATH} replace />;

export default ConnectedAppsPage;
