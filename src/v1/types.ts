import { INTERNAL } from '../util/common';
import { ParsedLockfile, ParsedPackage } from '../util/types';

export type InternalParsedPackage = ParsedPackage & {
	[INTERNAL]: {
		unsupported: Record<string, unknown>;
	};
};

export type InternalParsedLockfile = ParsedLockfile & {
	[INTERNAL]: {
		unsupported: Record<string, unknown>;
	};
};
