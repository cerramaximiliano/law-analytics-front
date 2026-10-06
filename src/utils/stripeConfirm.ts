/**
 * Confirmación de pagos que piden autenticación (SCA / 3-D Secure) al agregar un add-on.
 *
 * El front NO tiene Stripe.js como dependencia ni clave publicable en su env: el alta
 * de planes va por Checkout de Stripe (redirect). Para el add-on, que se suma a una
 * suscripción existente, el hub puede devolver `requires_action` con:
 *   - `hostedInvoiceUrl` → se abre la factura de Stripe, que resuelve el 3DS sola. Preferido.
 *   - `clientSecret` + `publishableKey` → se carga Stripe.js v3 a demanda y se confirma acá.
 * Si no viene ninguna de las dos, la UI manda al usuario a la gestión de la suscripción.
 */

const STRIPE_JS_URL = "https://js.stripe.com/v3/";

interface StripeLike {
	confirmCardPayment: (clientSecret: string) => Promise<{ error?: { message?: string }; paymentIntent?: { status: string } }>;
}

declare global {
	interface Window {
		Stripe?: (key: string) => StripeLike;
	}
}

let stripeJsPromise: Promise<void> | null = null;

function loadStripeJs(): Promise<void> {
	if (typeof window === "undefined") return Promise.reject(new Error("Sin navegador"));
	if (window.Stripe) return Promise.resolve();
	if (stripeJsPromise) return stripeJsPromise;
	stripeJsPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = STRIPE_JS_URL;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			stripeJsPromise = null;
			reject(new Error("No se pudo cargar Stripe"));
		};
		document.head.appendChild(script);
	});
	return stripeJsPromise;
}

export type ConfirmOutcome = { ok: true } | { ok: false; message: string } | { ok: "redirected" };

/**
 * Resuelve el `requires_action`. Devuelve `redirected` si abrió la factura de Stripe en otra
 * pestaña (el resultado llega después por webhook; la UI debe ofrecer "Ya pagué, actualizar").
 */
export async function confirmAddonPayment(opts: {
	clientSecret?: string | null;
	publishableKey?: string | null;
	hostedInvoiceUrl?: string | null;
}): Promise<ConfirmOutcome> {
	if (opts.clientSecret && opts.publishableKey) {
		try {
			await loadStripeJs();
			const stripe = window.Stripe!(opts.publishableKey);
			const result = await stripe.confirmCardPayment(opts.clientSecret);
			if (result.error) return { ok: false, message: result.error.message || "Tu banco no autorizó el pago." };
			if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") return { ok: true };
			return { ok: false, message: "El pago no se completó." };
		} catch {
			// Si Stripe.js no carga (bloqueador, red), caemos a la factura alojada si la hay.
		}
	}
	if (opts.hostedInvoiceUrl) {
		window.open(opts.hostedInvoiceUrl, "_blank", "noopener,noreferrer");
		return { ok: "redirected" };
	}
	return { ok: false, message: "Tu banco pide confirmar el pago. Completalo desde la gestión de tu suscripción." };
}
