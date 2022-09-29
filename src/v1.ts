import { PackageJson, ParsedLockfile, ParsedPackage, RawLockfileV1, RawPackageV1 } from './types';
import { pick } from './util';

const INTERNAL = Symbol('package-lock-parser/internal');

type InternalParsedPackage = ParsedPackage & {
	[INTERNAL]: {
		unsupported: Record<string, unknown>
	};
};

type RawDependencies = Record<string, RawPackageV1>;
type ParsedDependencies = Record<string, ParsedPackage>;

const parsePackages = (packageNames: string[], rawPackages: RawDependencies, parsedPackages: ParsedDependencies) => {
	for (const packageName of packageNames) {
		
		const rawPackage = rawPackages[packageName];
		if (rawPackage == null) {
			throw new Error('Given package.json and package-lock.json files are out of sync!');
		}

		const [supported, unsupported] = pick(rawPackage, 'version');
		const parsedPackage: ParsedPackage = {
			version: supported.version
		};

		(<InternalParsedPackage> parsedPackage)[INTERNAL] = {
			unsupported
		};

		parsedPackages[packageName] = parsedPackage;
	}
};

export const parse = (raw: RawLockfileV1, packagefile: PackageJson): ParsedLockfile => {
	const parsed: ParsedLockfile = {
		version: raw.lockfileVersion
	};

	if (raw.dependencies != null && packagefile.dependencies != null) {
		parsed.dependencies = {};
		parsePackages(Object.keys(packagefile.dependencies), raw.dependencies, parsed.dependencies);
	}

	if (raw.dependencies != null && packagefile.devDependencies != null) {
		parsed.devDependencies = {};
		parsePackages(Object.keys(packagefile.devDependencies), raw.dependencies, parsed.devDependencies);
	}

	return parsed;
};

export const synth = (parsed: ParsedLockfile): RawLockfileV1 => {
	const synthesized: RawLockfileV1 = {
		lockfileVersion: parsed.version
	};

	const synthPackages = (input: ParsedDependencies, output: RawDependencies) => {
		for (const [name, parsed] of Object.entries(input)) {
			output[name] = <RawPackageV1> {
				version: parsed.version,
				...(<InternalParsedPackage> parsed)[INTERNAL].unsupported
			};
		}
	};

	if (parsed.dependencies != null) {
		synthesized.dependencies = {};
		synthPackages(parsed.dependencies, synthesized.dependencies);
	}

	return synthesized;
};
