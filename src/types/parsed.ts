import { unsupportedProperties } from '../common/symbols';

export type Lockfile = {
	version: number;
	dependencies: Packages;
};


export type Package = {
	name: string;
	version: string;
	resolved: string;
	integrity: string;

	dev?: boolean;
	optional?: boolean;
	peer?: boolean;

	dependencies?: Packages;

	[unsupportedProperties]?: Record<string, unknown>;
};

export type Packages = Record<string, Package | undefined>;

export interface PackageContainer {
	dependencies?: Packages;
}
