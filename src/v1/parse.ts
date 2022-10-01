import { INTERNAL } from '../util/common';
import { pick } from '../util/misc';
import { LockfilePackages, LockfileV1, PackageJson, ParsedLockfile, ParsedPackage } from '../util/types';
import { InternalParsedLockfile, InternalParsedPackage } from './types';

const EMPTY_OBJECT = {};

type ParseWorkbench = {
	cache: Record<string, ParsedPackage>;
};

type ParseInput = {
	name: string;
	dependencies: LockfilePackages;
	prioritizedDependencies?: LockfilePackages | undefined;
};

function parsePackage(workbench: ParseWorkbench, input: ParseInput): ParsedPackage {
	
	const { name, dependencies, prioritizedDependencies } = input;
	const lockfilePackage = prioritizedDependencies?.[name] ?? dependencies[name];

	if (lockfilePackage == null) {
		throw new Error(`Could not find '${name} in lockfile, package.json may be out of sync!'`);
	}

	const lookupKey = name + lockfilePackage.version;
	if (lookupKey in workbench.cache) {
		return workbench.cache[lookupKey];
	}

	const [supported, unsupported] = pick(lockfilePackage, 'version', 'dependencies', 'dev', 'peer'); 

	const parsedPackage: ParsedPackage = {
		name: name,
		version: supported.version,
		dependencies: {},
		devDependencies: {}
	};

	Object.defineProperty(parsedPackage, 'name', { value: parsedPackage.name, writable: false });
	Object.defineProperty(parsedPackage, 'version', { value: parsedPackage.version, writable: false });

	(<InternalParsedPackage> parsedPackage)[INTERNAL] = {
		unsupported
	};

	workbench.cache[lookupKey] = parsedPackage;

	for (const dependencyName of Object.keys(lockfilePackage.requires ?? EMPTY_OBJECT)) {
		parsedPackage.dependencies[dependencyName] = parsePackage(workbench, {
			name: dependencyName,
			dependencies: dependencies,
			prioritizedDependencies: lockfilePackage.dependencies
		});
	}

	return parsedPackage;
}

export function parse(lockfile: LockfileV1, packagefile: PackageJson) {

	const workbench: ParseWorkbench = {
		cache: {}
	};

	const [supported, unsupported] = pick(lockfile, 'lockfileVersion', 'dependencies');

	const parsedLockfile: ParsedLockfile = {
		version: supported.lockfileVersion,
		dependencies: {},
		devDependencies: {},
		peerDependencies: {}
	};

	(<InternalParsedLockfile> parsedLockfile)[INTERNAL] = {
		unsupported
	};

	for (const packageName of Object.keys(packagefile.dependencies ?? EMPTY_OBJECT)) {
		parsedLockfile.dependencies[packageName] = parsePackage(workbench, {
			name: packageName,
			dependencies: lockfile.dependencies
		});
	}

	for (const packageName of Object.keys(packagefile.devDependencies ?? EMPTY_OBJECT)) {
		parsedLockfile.devDependencies[packageName] = parsePackage(workbench, {
			name: packageName,
			dependencies: lockfile.dependencies
		});
	}

	return parsedLockfile;
}
