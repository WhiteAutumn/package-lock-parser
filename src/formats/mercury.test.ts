import type { files } from '../types';

import { expect } from 'chai';

import { getPackageJson, getLockfile } from '../../resources/samples';
import { parse } from './mercury';
import { unsupportedProperties } from '../common/symbols';

describe('The mercury format', () => {

	describe('parse() function', () => {

		it('should return result with correct version', async () => {
			const packageJson = <files.PackageJson> await getPackageJson('minimal');
			const lockfile = <files.LockfileV1> await getLockfile('minimal', 'v1');

			const actual = parse(packageJson, lockfile);
			expect(actual.version).to.equal(1);
		});
		it('should throw an error if the lockfile version is not 1', async () => {
			const packageJson = <files.PackageJson> await getPackageJson('minimal');
			const lockfile = <files.LockfileV1> await getLockfile('minimal', 'v2');

			expect(() => parse(packageJson, lockfile)).to.throw('The mercury parser only supports lockfile version 1, but the lockfile provided was version 2');
		});

		describe('for for the minimal example', () => {
      
			it('should return result with correct dependencies', async () => {
				const packageJson = <files.PackageJson> await getPackageJson('minimal');
				const lockfile = <files.LockfileV1> await getLockfile('minimal', 'v1');

				const raw = lockfile.dependencies!['@package-lock-parser/simple-example-package-1']!;

				const actual = parse(packageJson, lockfile);
				expect(actual).to.have.property('dependencies');
				expect(actual.dependencies).to.deep.equal({
					'@package-lock-parser/simple-example-package-1': {
						name: '@package-lock-parser/simple-example-package-1',
						version: raw.version,
						resolved: raw.resolved,
						integrity: raw.integrity,

						[unsupportedProperties]: {}
					}
				});
			});
			it('should return result with correct dependencies for dev dependencies', async () => {
				const packageJson = <files.PackageJson> await getPackageJson('minimal-dev');
				const lockfile = <files.LockfileV1> await getLockfile('minimal-dev', 'v1');
      
				const raw = lockfile.dependencies!['@package-lock-parser/simple-example-package-1']!;
      
				const actual = parse(packageJson, lockfile);
				expect(actual).to.have.property('dependencies');
				expect(actual.dependencies).to.deep.equal({
					'@package-lock-parser/simple-example-package-1': {
						name: '@package-lock-parser/simple-example-package-1',
						version: raw.version,
						resolved: raw.resolved,
						integrity: raw.integrity,

						dev: true,
      
						[unsupportedProperties]: {}
					}
				});
			});
			it('should return result with correct dependencies for optional dependencies', async () => {
				const packageJson = <files.PackageJson> await getPackageJson('minimal-optional');
				const lockfile = <files.LockfileV1> await getLockfile('minimal-optional', 'v1');
      
				const raw = lockfile.dependencies!['@package-lock-parser/simple-example-package-1']!;
      
				const actual = parse(packageJson, lockfile);
				expect(actual).to.have.property('dependencies');
				expect(actual.dependencies).to.deep.equal({
					'@package-lock-parser/simple-example-package-1': {
						name: '@package-lock-parser/simple-example-package-1',
						version: raw.version,
						resolved: raw.resolved,
						integrity: raw.integrity,

						optional: true,
      
						[unsupportedProperties]: {}
					}
				});
			});
      
		});

	});

});
