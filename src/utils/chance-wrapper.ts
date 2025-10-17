// Wrapper condicional para chance - solo se carga en desarrollo
// En producción, usa valores alternativos simples

// Interfaz para tipar los métodos de chance que usamos
interface ChanceWrapper {
	integer: (options?: { min?: number; max?: number }) => number;
	bool: () => boolean;
	phone: () => string;
	bb_pin: () => string;
	address: () => string;
	city: () => string;
	country: (options?: { full?: boolean }) => string;
	zip: () => string;
	name: () => string;
	sentence: (options?: { words?: number }) => string;
	paragraph: () => string;
	age: () => number;
	floating: (options?: { min?: number; max?: number; fixed?: number }) => number;
}

let chanceInstance: any = null;

// Solo cargar chance en desarrollo
if (process.env.NODE_ENV === "development") {
	// Dynamic import solo en desarrollo
	import("chance").then((module) => {
		const Chance = module.Chance;
		chanceInstance = new Chance();
	});
}

// Funciones de fallback para producción
const productionFallbacks: ChanceWrapper = {
	integer: (options?: { min?: number; max?: number }) => {
		const min = options?.min ?? 0;
		const max = options?.max ?? 100;
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	bool: () => Math.random() > 0.5,
	phone: () => "+1 (555) 000-0000",
	bb_pin: () => "DEMO",
	address: () => "123 Demo Street",
	city: () => "Demo City",
	country: (options?: { full?: boolean }) => (options?.full ? "Demo Country" : "DC"),
	zip: () => "00000",
	name: () => "Demo User",
	sentence: (options?: { words?: number }) => {
		const words = options?.words ?? 8;
		return Array(words).fill("demo").join(" ");
	},
	paragraph: () => "This is demo content for development purposes.",
	age: () => 25,
	floating: (options?: { min?: number; max?: number; fixed?: number }) => {
		const min = options?.min ?? 0;
		const max = options?.max ?? 1;
		const fixed = options?.fixed ?? 2;
		const value = Math.random() * (max - min) + min;
		return Number(value.toFixed(fixed));
	},
};

// Export del wrapper con tipo
export const chance: ChanceWrapper =
	process.env.NODE_ENV === "development"
		? (new Proxy(
				{},
				{
					get: (_target, prop: string) => {
						// Si chance aún no se cargó, usar fallbacks
						if (!chanceInstance) {
							return (productionFallbacks as any)[prop] || (() => "demo");
						}
						return chanceInstance[prop];
					},
				},
		  ) as ChanceWrapper)
		: productionFallbacks;

export default chance;
