import { files, mercury, parsed } from '../types';

import { unsupportedProperties } from '../common/symbols';
import { splitObject } from '../common/functions';

type DependencyChain = Array<parsed.PackageContainer>;

export const parse = (packageJson: files.PackageJson, lockfile: files.LockfileV1): parsed.Lockfile => {
	if (lockfile.lockfileVersion !== 1) {
		throw new Error(`The mercury parser only supports lockfile version 1, but the lockfile provided was version ${lockfile.lockfileVersion}`);
	}

	const result: parsed.Lockfile = {
		version: lockfile.lockfileVersion,
		dependencies: {},
	};

	if (lockfile.dependencies != null) {
		parsePackages([result], lockfile.dependencies);
	}

	return result;
};

const parsePackages = (chain: DependencyChain, packages: mercury.Packages) => {
	for (const [packageName, packageObject] of Object.entries(packages)) {
		if (packageObject == null) {
			throw new Error(`Unexpected null or undefined for package ${packageName}`);
		}

		// Create parsed package
		const parsedPackage: Partial<parsed.Package> = {
			name: packageName,
		};

		const unsupported: Record<string, unknown> = {};

		splitObject(packageObject, parsedPackage, unsupported,
			'version',
			'resolved',
			'integrity',

			'dev',
			'optional',
			'peer'
		);

		parsedPackage[unsupportedProperties] = unsupported;

		// Place parsed package into parsed lockfile
		for (const location of chain) {
			if (location.dependencies != null && packageName in location.dependencies === false) {
				location.dependencies[packageName] = <parsed.Package> parsedPackage;
			}
		} 
	}
};
