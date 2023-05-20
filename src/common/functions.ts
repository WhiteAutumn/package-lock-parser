
export const splitObject = <T extends Record<string, unknown>, K extends keyof T> (target: T, pickedDestination: Partial<Pick<T, K>>, remainingDestination: Partial<Omit<T, K>>, ...keys: K[]) => {
	for (const key of Object.keys(target)) {
		if (keys.includes(<K> key)) {
			(<any> pickedDestination)[key] = target[key];
		}
		else {
			(<any> remainingDestination)[key] = target[key];
		}
	}
};

/*
export const pick = <T, K extends keyof T> (target: T, ...keys: K[]): [Pick<T, K>, Omit<T, K>] => {
	const picked = {} as Pick<T, K>;
	const remaining = {...target};

	for (const key of keys) {
		const value = remaining[key];
		delete remaining[key];
		picked[key] = value;
	}

	return [picked, remaining as Omit<T, K>];
};
*/
