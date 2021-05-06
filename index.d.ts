export interface HashMap<T> {
  [key: string]: T
}

/**
 * NOTE: The types for package-lock objects are only an estimation, they are likely to be inaccurate.
 */
export interface LockModule {
  version?: string,
  resolved?: string,
  integrity?: string,
  dev?: boolean,
  requires?: HashMap<string>
}

/**
 * NOTE: The types for package-lock objects are only an estimation, they are likely to be inaccurate.
 */
export interface LockPackage {
  version?: string,
  resolved?: string,
  integrity?: string,
  dev?: boolean,
  engines:? object,
  dependencies?: HashMap<string>,
  devDependencies?: HashMap<string>,
  peerDependencies?: HashMap<string>,
}

/**
 * NOTE: The types for package-lock objects are only an estimation, they are likely to be inaccurate.
 */
export interface PackageLock {
  name: string,
  lockFileVersion: number,
  packages: HashMap<LockPackage>,
  dependencies: HashMap<LockModule>,
  version?: string,
  requires?: boolean,
}

export interface Dependency {
  name: string,
  version: string,
  dependencies?: HashMap<any>,
  devDependencies?: HashMap<any>,
  peerDependencies?: HashMap<any>,
}

export interface DependencyTree {
  name: string,
  lockFileVersion: number,
  version?: string,
  requires?: boolean,
  dependencies?: HashMap<Dependency>,
  devDependencies?: HashMap<Dependency>,
  peerDependencies?: HashMap<Dependency>,
}

export function parse(packageLock: string | Buffer | PackageLock): DependencyTree

export function fabricate(dependencyTree: DependencyTree): PackageLock
