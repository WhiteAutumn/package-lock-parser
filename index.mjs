import Exception from "exceptions-with-cause";

const PACKAGE = Symbol.for("PACKAGE");
const MODULE = Symbol.for("MODULE");
const LINK = Symbol.for("LINK");

const parseInput = (packageLock) => {
  try {
    switch (true) {
      case typeof packageLock === "string":
        return JSON.parse(packageLock);

      case Buffer.isBuffer(packageLock):
        return JSON.parse(packageLock)

      case typeof packageLock === "object":
        return packageLock;

      default:
        throw new Exception(`Unsupported type! ${typeof packageLock}`);
    }
  }
  catch (error) {
    throw new Exception("Could not parse provided package lock!", error);
  }
};


const getLockObjects = ([key], { packages, dependencies }) => {
  const output = {
    lockModule: dependencies[key],
    lockPackage: packages[`node_modules/${key}`]
  };

  if (output.lockPackage.link) {
    output.lockPackage = {
      ...output.lockPackage,
      [LINK]: packages[output.lockPackage.resolved]
    };
  }

  return output;
};


const linkDependency = ([key, value], packageLock) => {

  const { lockModule, lockPackage } = getLockObjects([key, value], packageLock);
  const dependencies = searchAndLink(lockPackage, packageLock);

  return {
    [MODULE]: lockModule,
    [PACKAGE]: lockPackage,

    name: key,
    version: lockModule.version,
    ...dependencies
  };
};


const linkDependencies = (dependencies, packageLock) => {
  const output = {};
  for (const [key, value] of Object.entries(dependencies)) {
    output[key] = linkDependency([key, value], packageLock);
  }

  return output;
};


const searchAndLink = (lockPackage, packageLock) => {
  const output = {};

  if (lockPackage.dependencies != null) {
    output.dependencies = linkDependencies(lockPackage.dependencies, packageLock);
  }

  if (lockPackage.devDependencies != null) {
    output.devDependencies = linkDependencies(lockPackage.devDependencies, packageLock);
  }

  if (lockPackage.peerDependencies != null) {
    output.peerDependencies = linkDependencies(lockPackage.peerDependencies, packageLock);
  }

  return output;
};


const excavateLockObjects = (dependency) => {
  return {
    lockPackage: dependency[PACKAGE],
    lockModule: dependency[MODULE]
  };
};


const reconstructDependency = (dependency, lockPackages, lockDependencies) => {
  const { lockPackage, lockModule } = excavateLockObjects(dependency);

  if (lockPackages[`node_modules/${dependency.name}`] == null) {
    lockPackages[`node_modules/${dependency.name}`] = lockPackage;

    if (lockPackage.link) {
      const shallowClone = { ...lockPackage };
      delete shallowClone[LINK];
      lockPackages[`node_modules/${dependency.name}`] = shallowClone;

      if (lockPackages[lockPackage.resolved] == null) {
        lockPackages[lockPackage.resolved] = lockPackage[LINK];
      }
    }
  }

  if (lockDependencies[dependency.name] == null) {
    lockDependencies[dependency.name] = lockModule;
  }

  searchAndReconstruct(dependency, lockPackages, lockDependencies);
};


const reconstructDependencies = (dependencies, lockPackages, lockDependencies) => {
  for (const dependency of Object.values(dependencies)) {
    reconstructDependency(dependency, lockPackages, lockDependencies);
  }
};


const searchAndReconstruct = (dependencyTree, lockPackages, lockDependencies) => {
  if (dependencyTree.dependencies != null) {
    reconstructDependencies(dependencyTree.dependencies, lockPackages, lockDependencies);
  }

  if (dependencyTree.devDependencies != null) {
    reconstructDependencies(dependencyTree.devDependencies, lockPackages, lockDependencies);
  }

  if (dependencyTree.peerDependencies != null) {
    reconstructDependencies(dependencyTree.peerDependencies, lockPackages, lockDependencies);
  }
};


export function parse(packageLock) {
  const parsedPackageLock = parseInput(packageLock);

  try {
    if ( !("packages" in parsedPackageLock ) ) {
      throw new Exception(`Missing property "packages"!`);
    }

    if ( !("dependencies" in parsedPackageLock) ) {
      throw new Exception(`Missing property "dependencies"!`);
    }
  
    if ( !("" in parsedPackageLock.packages) ) {
      throw new Exception(`Missing property "" in "packages"!`);
    }
  }
  catch (error) {
    throw new Exception("Given object does not have required properties!", error);
  }

  const thisPackage = parsedPackageLock.packages[""];
  const dependencies = searchAndLink(thisPackage, parsedPackageLock);

  const prunedLockCopy = { ...parsedPackageLock };
  delete prunedLockCopy.packages;
  delete prunedLockCopy.dependencies;

  return {
    [MODULE]: parsedPackageLock.packages[""],
    ...prunedLockCopy,
    ...dependencies
  };
}

export function fabricate(dependencyTree) {
  const packages = {};
  const dependencies = {};
  searchAndReconstruct(dependencyTree, packages, dependencies);

  packages[""] = dependencyTree[MODULE];

  const prunedTreeCopy = { ...dependencyTree };
  delete prunedTreeCopy.dependencies;
  delete prunedTreeCopy.devDependencies;
  delete prunedTreeCopy.peerDependencies;

  return {
    ...prunedTreeCopy,
    packages,
    dependencies
  };
}
