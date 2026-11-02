import { and, asc, desc, or, sql } from 'drizzle-orm';
import { SORT_KEYS, type Sort } from '../customer';
import { customer, deal } from './db/schema';

// What each sort key orders by. Customers without a name come first. `latest` is the date of the
// most recent deal; customers without a deal come first when ascending.
const sortColumns = {
	customer: sql`lower(${customer.name})`,
	latest: sql`(select max(${deal.dealDate}) from ${deal} where ${deal.customerId} = ${customer.id})`
};

// What the list shows, read from `?q=`, `?sort=`, `?dir=` and `?page=`.
export const parseListQuery = (url: URL) => {
	// `?q=` keeps the customers that contain every whitespace-separated term, ignoring case, in
	// any of the customer's text columns or the remarks of any deal. instr() avoids LIKE escaping and
	// D1's LIKE pattern length limit.
	const text = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const terms = text.split(/\s+/).filter(Boolean);
	const searchable = [
		customer.name,
		customer.postalCode,
		customer.address,
		customer.phone,
		customer.email,
		customer.detail,
		customer.note
	];

	// Rows that tie on the sort key (and the default order) stay newest first.
	const key = SORT_KEYS.find((k) => k === url.searchParams.get('sort'));
	const sort: Sort = key ? { key, dir: url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc' } : null;
	const direction = sort?.dir === 'desc' ? desc : asc;

	// The page asked for; the list clamps it to the last page once it knows how many there are.
	const requestedPage = Number(url.searchParams.get('page'));
	const page = Number.isSafeInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1;

	return {
		page,
		filter: { text },
		sort,
		where: and(
			...terms.map((term) => {
				const needle = term.toLowerCase();
				return or(
					...searchable.map((column) => sql`instr(lower(${column}), ${needle}) > 0`),
					sql`exists (select 1 from ${deal} where ${deal.customerId} = ${customer.id} and instr(lower(${deal.remarks}), ${needle}) > 0)`
				);
			})
		),
		orderBy: [...(sort ? [direction(sortColumns[sort.key])] : []), desc(customer.createdAt)]
	};
};
