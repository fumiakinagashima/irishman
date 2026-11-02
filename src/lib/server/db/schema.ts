import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date());

export const customer = sqliteTable('customer', {
	id: id(),
	// The company name. Optional. When empty, the UI shows "Not set".
	name: text('name').notNull().default(''),
	postalCode: text('postal_code').notNull().default(''),
	address: text('address').notNull().default(''),
	phone: text('phone').notNull().default(''),
	email: text('email').notNull().default(''),
	// Other information, free text.
	detail: text('detail').notNull().default(''),
	// Shown in the list.
	note: text('note').notNull().default(''),
	createdAt: createdAt(),
	// `sub` claim of the Cloudflare Access JWT. Null when unauthenticated (e.g. local dev).
	createdBy: text('created_by'),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
	updatedBy: text('updated_by')
});

// A record of dealings with a customer (a call, a visit, an order, ...). Newest first on screen.
export const deal = sqliteTable(
	'deal',
	{
		id: id(),
		customerId: text('customer_id')
			.notNull()
			.references(() => customer.id, { onDelete: 'cascade' }),
		// 'YYYY-MM-DD', the day it happened. A calendar date picked by the user, so no time zone.
		dealDate: text('deal_date').notNull(),
		// In minor currency units (x100). 0 when no amount was entered.
		amount: integer('amount').notNull().default(0),
		remarks: text('remarks').notNull().default(''),
		createdAt: createdAt(),
		createdBy: text('created_by'),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
		updatedBy: text('updated_by')
	},
	(t) => [index('deal_customer_id_idx').on(t.customerId)]
);
