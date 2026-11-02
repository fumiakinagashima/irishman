import { fail } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { count, eq, inArray } from 'drizzle-orm';
import { getDb } from '../lib/server/db';
import { customer, deal } from '../lib/server/db/schema';
import { readForm } from '../lib/server/form';
import { parseListQuery } from '../lib/server/customer-query';
import { MINOR_UNIT, PAGE_SIZE } from '../lib/customer';
import { m } from '../lib/paraglide/messages.js';
import { forms } from '../lib/schemas';
import type { Actions, PageServerLoad } from './$types';

const database = () => getDb(env.DB);

const actor = (locals: App.Locals) => locals.user?.sub ?? null;

export const load: PageServerLoad = async ({ url }) => {
	const db = database();
	const { filter, sort, page: requestedPage, where, orderBy } = parseListQuery(url);

	const total = (await db.select({ total: count() }).from(customer).where(where).get())?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const page = Math.min(requestedPage, pageCount);

	const customers = await db
		.select({
			id: customer.id,
			name: customer.name,
			postalCode: customer.postalCode,
			address: customer.address,
			phone: customer.phone,
			email: customer.email,
			detail: customer.detail,
			note: customer.note
		})
		.from(customer)
		.where(where)
		.orderBy(...orderBy)
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE);

	// Only the deals of the customers on this page.
	const deals = customers.length
		? await db
				.select({
					id: deal.id,
					customerId: deal.customerId,
					dealDate: deal.dealDate,
					amount: deal.amount,
					remarks: deal.remarks
				})
				.from(deal)
				.where(
					inArray(
						deal.customerId,
						customers.map((c) => c.id)
					)
				)
		: [];

	return { filter, sort, page, pageCount, total, customers, deals };
};

export const actions: Actions = {
	createCustomer: async ({ locals }) => {
		const by = actor(locals);
		await database().insert(customer).values({ name: '', createdBy: by, updatedBy: by });
	},

	updateCustomer: async ({ request, locals }) => {
		const input = readForm(forms.updateCustomer, await request.formData());
		if (!input.ok) return input.failure;
		const { id, name, postalCode, address, phone, email, detail } = input.data;
		await database()
			.update(customer)
			.set({ name, postalCode, address, phone, email, detail, updatedBy: actor(locals) })
			.where(eq(customer.id, id));
	},

	updateNote: async ({ request, locals }) => {
		const input = readForm(forms.updateNote, await request.formData());
		if (!input.ok) return input.failure;
		const { id, note } = input.data;
		await database()
			.update(customer)
			.set({ note, updatedBy: actor(locals) })
			.where(eq(customer.id, id));
	},

	deleteCustomer: async ({ request }) => {
		const input = readForm(forms.byId, await request.formData());
		if (!input.ok) return input.failure;
		const { id } = input.data;
		const db = database();
		await db.batch([db.delete(deal).where(eq(deal.customerId, id)), db.delete(customer).where(eq(customer.id, id))]);
	},

	addDeal: async ({ request, locals }) => {
		const input = readForm(forms.addDeal, await request.formData());
		if (!input.ok) return input.failure;
		const { customerId, dealDate, amount, remarks } = input.data;
		const db = database();
		const exists = await db.select({ id: customer.id }).from(customer).where(eq(customer.id, customerId)).get();
		if (!exists) return fail(404, { message: m.customer_not_found() });
		const by = actor(locals);
		await db.insert(deal).values({
			customerId,
			dealDate,
			amount: Math.round(amount * MINOR_UNIT),
			remarks,
			createdBy: by,
			updatedBy: by
		});
	},

	deleteDeal: async ({ request }) => {
		const input = readForm(forms.byId, await request.formData());
		if (!input.ok) return input.failure;
		await database().delete(deal).where(eq(deal.id, input.data.id));
	}
};
