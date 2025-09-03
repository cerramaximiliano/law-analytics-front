// Polyfills para compatibilidad con navegadores y Redux Toolkit/Immer

// Asegurar que globalThis esté disponible
if (typeof globalThis === "undefined") {
	(function () {
		if (typeof self !== "undefined") {
			// eslint-disable-next-line
			// @ts-ignore
			self.globalThis = self;
		} else if (typeof window !== "undefined") {
			// eslint-disable-next-line
			// @ts-ignore
			window.globalThis = window;
		} else if (typeof global !== "undefined") {
			// eslint-disable-next-line
			// @ts-ignore
			global.globalThis = global;
		} else {
			throw new Error("Unable to locate global object");
		}
	})();
}

// Polyfills mínimos necesarios

// Polyfill para Object.fromEntries si no está disponible
if (!Object.fromEntries) {
	Object.fromEntries = function <T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T } {
		const obj: { [k: string]: T } = {};
		for (const [key, value] of entries) {
			obj[String(key)] = value;
		}
		return obj;
	};
}

// Polyfills para Object que Immer necesita
if (!Object.getOwnPropertyDescriptors) {
	Object.getOwnPropertyDescriptors = function (obj: any) {
		const descriptors: any = {};
		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
		}
		return descriptors;
	};
}

// Polyfill para Array.prototype.flat si no está disponible
if (!Array.prototype.flat) {
	// @ts-ignore
	Array.prototype.flat = function (depth: number = 1): any[] {
		// @ts-ignore
		const arr = this as any[];
		return depth > 0
			? arr.reduce((acc: any[], val: any) => {
					if (Array.isArray(val)) {
						return acc.concat((val as any).flat(depth - 1));
					}
					return acc.concat(val);
			  }, [])
			: arr.slice();
	};
}

// Polyfill para Array.prototype.flatMap si no está disponible
if (!Array.prototype.flatMap) {
	// @ts-ignore
	Array.prototype.flatMap = function (callback: any, thisArg?: any): any[] {
		// @ts-ignore
		return this.map(callback, thisArg).flat();
	};
}

export {};
