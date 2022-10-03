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
	dependencyChain: LockfilePackages[];
};

function searchDependencyChain(name: string, chain: LockfilePackages[]) {
	chain = chain
		.filter(it => it != null);

	for (const packages of chain) {
		if (name in packages) {
			return packages[name];
		}
	}

	return null;
}

function parsePackage(workbench: ParseWorkbench, input: ParseInput): ParsedPackage {
	
	const { name, dependencyChain } = input;
	const lockfilePackage = searchDependencyChain(name, dependencyChain); 

	if (lockfilePackage == null) {
		throw new Error(`Could not find '${name}' in lockfile, package-lock.json & package.json may be out of sync!'`);
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
			dependencyChain: [ lockfilePackage.dependencies, ...dependencyChain ]
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
			dependencyChain: [lockfile.dependencies]
		});
	}

	for (const packageName of Object.keys(packagefile.devDependencies ?? EMPTY_OBJECT)) {
		parsedLockfile.devDependencies[packageName] = parsePackage(workbench, {
			name: packageName,
			dependencyChain: [lockfile.dependencies]
		});
	}

	return parsedLockfile;
}
