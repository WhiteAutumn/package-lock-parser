
export type Keys = string | number | symbol;
export type Any = Record<Keys, unknown>;

export type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

export type LockfileV1 = {
	lockfileVersion: number;
	dependencies?: Record<string, LockfilePackageV1>;
	requires?: boolean;
};

export type LockfilePackageV1 = {
	version: string;
	resolved: string;
	integrity: string;
	dev?: boolean;
	requires?: Record<string, string>;
	dependencies?: Record<string, LockfilePackageV1>;
};

export type ParsedPackage = {
	readonly name: string;
	readonly version: string;
	dependencies?: Record<string, ParsedPackage>;
	devDependencies?: Record<string, ParsedPackage>;
};

export type ParsedLockfile = {
	version: number;
	dependencies?: Record<string, ParsedPackage>;
	devDependencies?: Record<string, ParsedPackage>;
};
