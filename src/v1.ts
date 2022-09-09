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

export const parse = (raw: RawLockfileV1, pkg: PackageJson): ParsedLockfile => {
	const parsed: ParsedLockfile = {
		version: raw.lockfileVersion
	};

	const parsePackages = (packages: string[], input: RawDependencies, output: ParsedDependencies) => {
		for (const name of packages) {
			if (input[name] == null) {
				// TODO: Consider if this scenario should throw?
				continue;
			}

			const [supported, unsupported] = pick(input[name], 'version');

			const parsedPackage: InternalParsedPackage = {
				version: supported.version,

				[INTERNAL]: {
					unsupported
				}
			};

			output[name] = <ParsedPackage> parsedPackage;
		}
	};

	if (raw.dependencies != null && pkg.dependencies != null) {
		parsed.dependencies = {};
		parsePackages(Object.keys(pkg.dependencies), raw.dependencies, parsed.dependencies);
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
