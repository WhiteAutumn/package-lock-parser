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

type ParseResult = {
	dependencies?: ParsedDependencies;
	devDependencies?: ParsedDependencies;
};

const parsePackages = (continuationTasks: ContinuationTask[], packageNames: string[], rawPackages: RawDependencies): ParseResult => {
	let dependencies: ParsedDependencies;
	let devDependencies: ParsedDependencies;

	for (const packageName of packageNames) {
		
		const rawPackage = rawPackages[packageName];
		if (rawPackage == null) {
			throw new Error('Given package.json and package-lock.json files are out of sync!');
		}

		const [supported, unsupported] = pick(rawPackage,
			'version',
			'dev'
		);

		const parsedPackage: ParsedPackage = {
			name: packageName,
			version: supported.version
		};

		Object.defineProperty(parsedPackage, 'name', { value: parsedPackage.name, writable: false });

		(<InternalParsedPackage> parsedPackage)[INTERNAL] = {
			unsupported
		};

		switch (true) {

			case (rawPackage.dev === true): {
				if (devDependencies == null) {
					devDependencies = {};
				}
	
				devDependencies[packageName] = parsedPackage;
			} break;

			default: {
				if (dependencies == null) {
					dependencies = {};
				}
	
				dependencies[packageName] = parsedPackage;
			} break;

		}

		if (rawPackage.requires != null) {
			continuationTasks.push(() => {
				const requiredPackageNames = Object.keys(rawPackage.requires);
				const requiredDependencies = parsePackages(continuationTasks, requiredPackageNames, rawPackages);
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

export const parse = (raw: RawLockfileV1, packagefile: PackageJson): ParsedLockfile => {
	const packages = [
		...Object.keys(packagefile.dependencies ?? {}),
		...Object.keys(packagefile.devDependencies ?? {})
	];

	const tasks: ContinuationTask[] = [];

	const parsed: ParsedLockfile = {
		version: raw.lockfileVersion,
		...parsePackages(tasks, packages, raw.dependencies)
	};

	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i];
		task();
	}

	return parsed;
};

type PackageType = 'regular' | 'dev' | 'peer';

const synthPackages = (type: PackageType, continuationTasks: ContinuationTask[], input: ParsedDependencies, output: RawDependencies) => {
	for (const [name, parsed] of Object.entries(input)) {
		output[name] = <RawPackageV1> {
			version: parsed.version,
			...(<InternalParsedPackage> parsed)[INTERNAL].unsupported
		};

		switch (type) {

			case 'dev': {
				output[name].dev = true;
			} break;

		}

		if (parsed.dependencies != null) {
			continuationTasks.push(() => {
				synthPackages('regular', continuationTasks, parsed.dependencies, output);
			});
		}

		if (parsed.devDependencies != null) {
			continuationTasks.push(() => {
				synthPackages('dev', continuationTasks, parsed.dependencies, output);
			});
		}
	}
};

export const synth = (parsed: ParsedLockfile): RawLockfileV1 => {
	const synthesized: RawLockfileV1 = {
		lockfileVersion: parsed.version
	};

	const tasks: ContinuationTask[] = [];

	if (parsed.dependencies != null) {
		if (synthesized.dependencies == null) {
			synthesized.dependencies = {};
		}
		synthPackages('regular', tasks, parsed.dependencies, synthesized.dependencies);
	}

	if (parsed.devDependencies != null) {
		if (synthesized.dependencies == null) {
			synthesized.dependencies = {};
		}
		synthPackages('dev', tasks, parsed.devDependencies, synthesized.dependencies);
	}

	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i];
		task();
	}

	return synthesized;
};
