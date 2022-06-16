import { RawLockfile, ParsedLockfile } from './types';

export const parse = (raw: RawLockfile): ParsedLockfile => {
	const parsed: ParsedLockfile = {
		version: raw.lockfileVersion
	};

	return parsed;
};

export const synth = (raw: ParsedLockfile): RawLockfile => {
	const synthesized: RawLockfile = {
		lockfileVersion: raw.version
	};

	return synthesized;
};
