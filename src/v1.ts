import { PackageJson, ParsedLockfile, ParsedPackage, RawLockfileV1, RawPackageV1 } from './types';
import { pick } from './util';

const INTERNAL = Symbol('package-lock-parser/internal');

type InternalParsedPackage = ParsedPackage & {
	[INTERNAL]: {
		unsupported: Record<string, unknown>;
	};
};

type RawDependencies = Record<string, RawPackageV1>;
type ParsedDependencies = Record<string, ParsedPackage>;
type ContinuationTask = () => void;

type ParsingWorkbench = {
	continuation: ContinuationTask[];
	packageLookup: Record<string, ParsedPackage>;
};
type ParseResult = {
	dependencies?: ParsedDependencies;
	devDependencies?: ParsedDependencies;
};
type ParseInput = {
	isRoot: boolean;
	packageNames: string[];
	packageData: RawDependencies;
	packageDataPrioritized?: RawDependencies | undefined;
};

const parsePackages = (workbench: ParsingWorkbench, input: ParseInput): ParseResult => {
	const { isRoot, packageNames, packageData, packageDataPrioritized } = input;

	let dependencies: ParsedDependencies;
	let devDependencies: ParsedDependencies;

	for (const packageName of packageNames) {
		
		let rawPackage: RawPackageV1;
		if (packageDataPrioritized?.[packageName] != null) {
			rawPackage = packageDataPrioritized[packageName];
		}
		else {
			if (packageData[packageName] == null) {
				throw new Error('Given package.json and package-lock.json files are out of sync!');
			}

			rawPackage = packageData[packageName];
		}

		const [supported, unsupported] = pick(rawPackage,
			'version',
			'dev',
			'dependencies'
		);

		const parsedPackage: ParsedPackage = {
			name: packageName,
			version: supported.version
		};

		Object.defineProperty(parsedPackage, 'name', { value: parsedPackage.name, writable: false });
		Object.defineProperty(parsedPackage, 'version', { value: parsedPackage.version, writable: false });

		(<InternalParsedPackage> parsedPackage)[INTERNAL] = {
			unsupported
		};

		const packageLookupKey = parsedPackage.name + parsedPackage.version;
		const saveRegularDependency = () => {
			if (dependencies == null) {
				dependencies = {};
			}

			if (workbench.packageLookup[packageLookupKey] != null) {
				dependencies[packageName] = workbench.packageLookup[packageLookupKey];
			}
			else {
				dependencies[packageName] = parsedPackage;
				workbench.packageLookup[packageLookupKey] = parsedPackage;
			}
		};
		const saveDevDependency = () => {
			if (devDependencies == null) {
				devDependencies = {};
			}

			if (workbench.packageLookup[packageLookupKey] != null) {
				devDependencies[packageName] = workbench.packageLookup[packageLookupKey];
			}
			else {
				devDependencies[packageName] = parsedPackage;
				workbench.packageLookup[packageLookupKey] = parsedPackage;
			}
		};

		switch (true) {

			case (rawPackage.dev === true): {
				if (isRoot) {
					saveDevDependency();
				}
				else {
					saveRegularDependency();
				}
			} break;

			default: {
				saveRegularDependency();
			} break;

		}

		if (rawPackage.requires != null) {
			workbench.continuation.push(() => {
				const requiredPackageNames = Object.keys(rawPackage.requires);
				const requiredDependencies = parsePackages(workbench, {
					isRoot: false,
					packageNames: requiredPackageNames,
					packageData: packageData,
					packageDataPrioritized: rawPackage.dependencies
				});
				Object.assign(parsedPackage, requiredDependencies);
			});
		}
	}

	const result: ParseResult = {};
	if (dependencies != null) {
		result.dependencies = dependencies;
	}
	if (devDependencies != null) {
		result.devDependencies = devDependencies;
	}

	return result;
};

export const parse = (lockfile: RawLockfileV1, packagefile: PackageJson): ParsedLockfile => {
	const packages = [
		...Object.keys(packagefile.dependencies ?? {}),
		...Object.keys(packagefile.devDependencies ?? {})
	];

	const workbench: ParsingWorkbench = {
		continuation: [],
		packageLookup: {}
	};

	const parsed: ParsedLockfile = {
		version: lockfile.lockfileVersion,
		...parsePackages(workbench, {
			isRoot: true,
			packageNames: packages,
			packageData: lockfile.dependencies
		})
	};

	for (let i = 0; i < workbench.continuation.length; i++) {
		const task = workbench.continuation[i];
		task();
	}

	return parsed;
};

type PackageType = 'regular' | 'dev' | 'peer';
type SynthWorkbench = {
	continuation: ContinuationTask[];
};
type SynthInput = {
	type: PackageType;
	packagesParsed: ParsedDependencies;
	packagesSynth: RawDependencies;
	parent?: RawPackageV1 | undefined;
};

const synthPackages = (workbench: SynthWorkbench, input: SynthInput) => {
	const { type, packagesParsed, packagesSynth, parent } = input;

	for (const [name, parsed] of Object.entries(packagesParsed)) {

		const synthPackage = <RawPackageV1> {
			version: parsed.version,
			...(<InternalParsedPackage> parsed)[INTERNAL].unsupported
		};

		if (packagesSynth[name] != null) {
			if (parent == null) {
				throw new Error('A parent was not provided when synthesizing, this is highly unexpected behavior!');
			}

			if (parent.dependencies == null) {
				parent.dependencies = {};
			}

			parent.dependencies[name] = synthPackage;
		}
		else {
			packagesSynth[name] = synthPackage;
		}

		switch (type) {

			case 'dev': {
				synthPackage.dev = true;
			} break;

		}

		const dependencies = parsed.dependencies ?? parsed.devDependencies;
		if (dependencies != null) {
			workbench.continuation.push(() => {
				synthPackages(workbench, {
					type: type,
					packagesParsed: dependencies,
					packagesSynth: packagesSynth,
					parent: synthPackage
				});
			});
		}
	}
};

export const synth = (parsed: ParsedLockfile): RawLockfileV1 => {
	const synthesized: RawLockfileV1 = {
		lockfileVersion: parsed.version
	};

	const workbench: SynthWorkbench = {
		continuation: []
	};

	if (parsed.dependencies != null) {
		if (synthesized.dependencies == null) {
			synthesized.dependencies = {};
		}
		synthPackages(workbench, {
			type: 'regular',
			packagesParsed: parsed.dependencies,
			packagesSynth: synthesized.dependencies
		});
	}

	if (parsed.devDependencies != null) {
		if (synthesized.dependencies == null) {
			synthesized.dependencies = {};
		}
		synthPackages(workbench, {
			type: 'dev',
			packagesParsed: parsed.devDependencies,
			packagesSynth: synthesized.dependencies
		});
	}

	for (let i = 0; i < workbench.continuation.length; i++) {
		const task = workbench.continuation[i];
		task();
	}

	return synthesized;
};
