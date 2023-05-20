#!/usr/bin/env node

import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import util from 'node:util';
import child_process from 'node:child_process'

import pLimit from 'p-limit';

const limit = pLimit(Math.max(os.cpus().length - 1, 1));

const exec = util.promisify(child_process.exec);

const exists = path => fs.access(path, fs.constants.F_OK).then(() => true).catch(() => false);

try {
	await exec('volta --version', { stdio: 'ignore' });
}
catch {
	console.error('Volta is required to run this script. Please install Volta and try again.');
	process.exit(1);
}

const samplesDir = path.join(
	process.cwd(),
	'resources',
	'samples'
);

const workingDir = path.join(
	os.tmpdir(),
	"package-lock-parser"
);

const workingDirCreated = exists(workingDir)
	.then(itExists => !itExists ? fs.mkdir(workingDir) : undefined);

const sampleDirs = await fs.readdir(samplesDir, { withFileTypes: true }).then(it => it
	.filter(it => it.isDirectory())
	.map(it => it.name)
);

await workingDirCreated;

const packageFiles = await Promise.all(sampleDirs.map(sampleDir =>
	fs.readFile(path.join(samplesDir, sampleDir, 'package.json'))
));

const inputData = sampleDirs.map((sampleDir, index) => ({
	originalPath: path.join(samplesDir, sampleDir),
	rawPackageFile: packageFiles[index]
}));

const generateLockfile = async ({ originalPath, rawPackageFile }, lockfileVersion) => {
	const dir = path.join(workingDir, crypto.randomUUID(), path.basename(originalPath));
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'package.json'), rawPackageFile);

	let npmVersion;
	switch (lockfileVersion) {
		case 1:
			npmVersion = '6';
			break;
		case 2:
			npmVersion = '8';
			break;
		case 3:
			npmVersion = '9';
			break;
	}

	await exec(`npx npm@${npmVersion} install`, {
		cwd: dir, stdio: 'inherit', env: {
			...process.env,
			npm_update_notifier: 'false',
		}
	});

	const lockfile = await fs.readFile(path.join(dir, 'package-lock.json'));
	await fs.writeFile(path.join(originalPath, `package-lock.v${lockfileVersion}.json`), lockfile);
};

const generateLockfiles = async (inputData) => {
	await Promise.all([
		limit(() => generateLockfile(inputData, 1)),
		limit(() => generateLockfile(inputData, 2)),
		limit(() => generateLockfile(inputData, 3))
	]);
};

await Promise.all(inputData.map(generateLockfiles));

const sampleDirIndex = Object.fromEntries(sampleDirs.map(dir => [dir, null]));
await fs.writeFile(path.join(samplesDir, 'index.json'), JSON.stringify(sampleDirIndex, null, 2));
