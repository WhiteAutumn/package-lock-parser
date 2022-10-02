import { INTERNAL } from '../util/common';
import { LockfilePackageV1, LockfileV1, ParsedLockfile, ParsedPackage, ParsedPackages } from '../util/types';
import { InternalParsedLockfile, InternalParsedPackage } from './types';

type PackageType = 'regular' | 'dev' | 'peer';

type SynthWorkbench = {
	cache: Map<ParsedPackage, LockfilePackageV1>;
};

type SynthInput = {
	type: PackageType;
	lockfile: LockfileV1;
	parsedPackage: ParsedPackage;
};

const canonicalOrder = {
	lockfile: [
		'name',
		'version',
		'lockfileVersion',
		'requires',
		'dependencies'
	],
	package: [
		'version',
		'resolved',
		'integrity',
		'dev',
		'requires'
	]
};

function reorderObject(object: Record<string, unknown>, knownOrder: string[]) {
	const keysWithoutKnownOrder = Object.keys(object)
		.filter(it => !knownOrder.includes(it));

	for (const key of [ ...knownOrder, ...keysWithoutKnownOrder ]) {
		if (!(key in object)) {
			continue;
		}

		const value = object[key];
		delete object[key];
		object[key] = value;
	}
}

function alphabeticalEntries<T>(dependencies: Record<string, T>) {
	const entries = Object.entries(dependencies);
	entries.sort(([a], [b]) => a === b ? 0 : a < b ? -1 : 1);
	return entries;
}

function ensureProperType(type: PackageType, synthedPackage: LockfilePackageV1) {
	if (type === 'regular') {
		delete synthedPackage.dev;
		delete synthedPackage.peer;
	}
}

function makePackage(workbench: SynthWorkbench, type: PackageType, parsedPackage: ParsedPackage): LockfilePackageV1 {
	const synthedPackage = <LockfilePackageV1> {
		version: parsedPackage.version,
		...(<InternalParsedPackage> parsedPackage)[INTERNAL].unsupported
	};

	switch (type) {

		case 'dev': {
			synthedPackage.dev = true;
		} break;

		case 'peer': {
			synthedPackage.peer = true;
		}
	}

	reorderObject(synthedPackage, canonicalOrder.package);

	workbench.cache.set(parsedPackage, synthedPackage);

	return synthedPackage;
}

function savePackage(name: string, synthedPackage: LockfilePackageV1, parentPackage: LockfilePackageV1, lockfile: LockfileV1) {
	if (name in lockfile.dependencies) {
		if (parentPackage.dependencies == null) {
			parentPackage.dependencies = {};
		}

		parentPackage.dependencies[name] = synthedPackage;
	}
	else {
		lockfile.dependencies[name] = synthedPackage;
	}
}

function synthPackage(workbench: SynthWorkbench, input: SynthInput): LockfilePackageV1 {

	const { type, lockfile, parsedPackage } = input;

	const synthedPackage = makePackage(workbench, type, parsedPackage);

	for (const [dependencyName, parsedDependency] of Object.entries(parsedPackage.dependencies)) {
		if (workbench.cache.has(parsedDependency)) {
			const cacheHit = workbench.cache.get(parsedDependency);
			ensureProperType(type, cacheHit);

			if (!(dependencyName in lockfile.dependencies)) {
				savePackage(dependencyName, cacheHit, synthedPackage, lockfile);
			}
		}
		else {
			const synthedDependency = synthPackage(workbench, {
				type: type,
				lockfile: lockfile,
				parsedPackage: parsedDependency
			});
	
			savePackage(dependencyName, synthedDependency, synthedPackage, lockfile);
		}
	}

	return synthedPackage;
}

export function synth(parsedLockfile: ParsedLockfile): LockfileV1 {

	const synthedLockfile: LockfileV1 = {
		lockfileVersion: parsedLockfile.version,
		dependencies: {},
		...(<InternalParsedLockfile> parsedLockfile)[INTERNAL].unsupported
	};

	const workbench: SynthWorkbench = {
		cache: new Map<ParsedPackage, LockfilePackageV1>()
	};

	// First pass, shallow
	const firstPass = (type: PackageType, dependencies: ParsedPackages) => {
		for (const [packageName, parsedPackage] of alphabeticalEntries(dependencies)) {
			const synthedPackage = makePackage(workbench, type, parsedPackage);
			
			synthedLockfile.dependencies[packageName] = synthedPackage;
		}
	};

	firstPass('regular', parsedLockfile.dependencies);
	firstPass('dev', parsedLockfile.devDependencies);
	firstPass('peer', parsedLockfile.peerDependencies);
	
	// Second pass, start recursion
	const secondPass = (type: PackageType, dependencies: ParsedPackages) => {
		for (const [packageName, parsedPackage] of alphabeticalEntries(dependencies)) {
			for (const [dependencyName, parsedDependency] of Object.entries(parsedPackage.dependencies)) {
				const parentPackage = synthedLockfile.dependencies[packageName];

				if (workbench.cache.has(parsedDependency)) {
					const cacheHit = workbench.cache.get(parsedDependency);
					ensureProperType(type, cacheHit);

					if (!(dependencyName in synthedLockfile.dependencies)) {
						savePackage(dependencyName, cacheHit, parentPackage, synthedLockfile);
					}
				}
				else {
					const synthedDependency = synthPackage(workbench, {
						type: type,
						lockfile: synthedLockfile,
						parsedPackage: parsedDependency
					});
		
					savePackage(dependencyName, synthedDependency, parentPackage, synthedLockfile);
				}
			}
		}
	};

	secondPass('regular', parsedLockfile.dependencies);
	secondPass('dev', parsedLockfile.devDependencies);
	secondPass('peer', parsedLockfile.peerDependencies);

	synthedLockfile.dependencies = Object.fromEntries(alphabeticalEntries(synthedLockfile.dependencies));
	reorderObject(synthedLockfile, canonicalOrder.lockfile);

	return synthedLockfile;
}
