
export type Package = {
	version: string;
	resolved: string;
	integrity: string;
	dev?: boolean;
	optional?: boolean;
	peer?: boolean;
};

export type Packages = Record<string, Package | undefined>;
