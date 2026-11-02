import { m } from './paraglide/messages.js';

export type CustomerRow = {
	id: string;
	name: string;
	postalCode: string;
	address: string;
	phone: string;
	email: string;
	detail: string;
	note: string;
};

// The list can be sorted by these columns (`?sort=` and `?dir=`). No sort means newest first.
// `latest` is the date of the customer's most recent deal.
export const SORT_KEYS = ['customer', 'latest'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

// The amount of a deal is stored in minor currency units. Until the currency becomes a setting,
// assume two decimal places.
export const MINOR_UNIT = 100;

export const formatAmount = (minor: number) =>
	(minor / MINOR_UNIT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Customers per page of the list.
export const PAGE_SIZE = 50;

// The customer name is optional. A customer without one is shown as "Not set" (the table also
// dims it), so a title or a dialog never ends up blank.
export const customerLabel = (c: Pick<CustomerRow, 'name'>) => c.name || m.not_set();
