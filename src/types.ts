
export type Keys = string | number | symbol;
export type Any = Record<Keys, unknown>;

export type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

export type ParsedPackage = {
	readonly name: string;
	version: string;
};

export type ParsedLockfile = {
	version: number;
	dependencies?: Record<string, ParsedPackage>;
	devDependencies?: Record<string, ParsedPackage>;
};

export type RawPackageV1 = {
	version: string;
	resolved: string;
	integrity: string;
	dev?: boolean;
};

export type RawLockfileV1 = {
	lockfileVersion: number;
	dependencies?: Record<string, RawPackageV1>;
};
