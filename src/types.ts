
export type Keys = string | number | symbol;
export type Any = Record<Keys, unknown>;

export type RawLockfile = {
	lockfileVersion: number;
};

export type ParsedLockfile = {
	version: number;
};
