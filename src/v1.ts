import { RawLockfile, ParsedLockfile } from './types';

export const parse = (raw: RawLockfile): ParsedLockfile => {
	const parsed: ParsedLockfile = {
		version: raw.lockfileVersion
	};

	return parsed;
};
