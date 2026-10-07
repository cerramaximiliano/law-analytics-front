// ----------------------------------------------------------------------
// Carga diferida del cliente de Google Sign-In (accounts.google.com/gsi/client, ~100 KB).
//
// `GoogleOAuthProvider` inserta el <script> apenas se monta. Mientras estemos en /login
// o /register lo retenemos (sin tocar el árbol de React: el proveedor sigue montado, así
// no se remonta AuthProvider al navegar de /login al dashboard) y lo soltamos cuando:
//   - el usuario enfoca/acerca el puntero al botón de Google,
//   - hay una primera interacción con la página (foco, clic, tecla, toque),
//   - el usuario hace clic en el botón antes de que cargue, o
//   - se navega fuera de /login y /register (para el modal de sesión vencida, etc.).
// Si el patch no pudo instalarse, el comportamiento es el de siempre (script inmediato).
// ----------------------------------------------------------------------

const GSI_PREFIX = "https://accounts.google.com/gsi/client";
const DEFER_ROUTES = /^\/(login|register)(\/|$)/;

let installed = false;
let released = false;
const held = new Set<Node>();
let origAppend: (<T extends Node>(node: T) => T) | null = null;

const isGsiScript = (node: Node): node is HTMLScriptElement =>
	node instanceof HTMLScriptElement && typeof node.src === "string" && node.src.startsWith(GSI_PREFIX);

export const installGsiDeferral = (): void => {
	if (installed || typeof document === "undefined" || !document.body) return;
	installed = true;
	const body = document.body;
	origAppend = body.appendChild.bind(body);
	const origRemove = body.removeChild.bind(body);

	body.appendChild = function <T extends Node>(node: T): T {
		if (!released && isGsiScript(node) && DEFER_ROUTES.test(window.location.pathname)) {
			held.add(node);
			return node;
		}
		return origAppend!(node);
	};
	body.removeChild = function <T extends Node>(node: T): T {
		// El proveedor limpia su <script> al desmontarse; si lo teníamos retenido no está en el DOM.
		if (held.has(node)) {
			held.delete(node);
			return node;
		}
		return origRemove(node);
	};
};

/** Suelta el script retenido (si lo hay) y deja de retener los próximos. Idempotente. */
export const releaseGsi = (): void => {
	released = true;
	if (!origAppend) return;
	held.forEach((node) => {
		try {
			origAppend!(node);
		} catch {
			/* ignorar */
		}
	});
	held.clear();
};

/** Vuelve a diferir (al entrar a /login o /register por navegación interna). */
export const rearmGsiDeferral = (): void => {
	released = false;
};

export const gsiDeferralRoutes = DEFER_ROUTES;
