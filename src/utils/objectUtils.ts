const deleteObjectEmptyStrings = (object: Record<string, any>): void => {
	Object.keys(object).forEach((key: string) => {
		if (object[key] === "") {
			delete object[key];
		}
	});
};

export { deleteObjectEmptyStrings };
