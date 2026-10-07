import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { trackScreenView } from "utils/productAnalytics";

// Un `screen_view` por cambio de ruta. Se envía el patrón de la ruta
// (`/apps/folders/details/:id`), nunca la URL: sin ids, query ni hash.
const usePageView = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		trackScreenView(pathname);
	}, [pathname]);
};

export default usePageView;
