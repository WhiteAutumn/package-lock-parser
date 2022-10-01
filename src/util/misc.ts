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
