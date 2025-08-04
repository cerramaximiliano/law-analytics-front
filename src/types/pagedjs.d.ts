declare module "pagedjs" {
	export class Previewer {
		constructor(options?: any);
		preview(content: string | HTMLElement, stylesheets: string[], container: HTMLElement): Promise<any>;
	}
}
