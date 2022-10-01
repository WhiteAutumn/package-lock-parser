
export type Keys = string | number | symbol;
export type Any = Record<Keys, unknown>;

export type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

export type LockfilePackages = Record<string, LockfilePackageV1>;

export type LockfileV1 = {
	requires?: boolean;
	lockfileVersion: number;
	dependencies?: LockfilePackages;
};

export type LockfilePackageV1 = {
	version?: string;
	resolved?: string;
	integrity?: string;
	dev?: boolean;
	peer?: boolean;

	requires?: Record<string, string>;
	dependencies?: LockfilePackages;
};

export type ParsedPackages = Record<string, ParsedPackage>;

export type ParsedPackage = {
	readonly name: string;
	readonly version: string;
	dependencies: ParsedPackages;
	devDependencies: ParsedPackages;
};

export type ParsedLockfile = {
	version: number;
	dependencies: ParsedPackages;
	devDependencies: ParsedPackages;
	peerDependencies: ParsedPackages;
};
