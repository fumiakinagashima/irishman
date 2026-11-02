import { describe, expect, it } from 'vitest';
import { forms } from './schemas';

// The message of the first problem, or null when the input is fine.
const problem = (
	schema: { safeParse: (input: unknown) => { success: boolean; error?: { issues: { message: string }[] } } },
	input: unknown
) => {
	const result = schema.safeParse(input);
	return result.success ? null : (result.error?.issues[0].message ?? null);
};

describe('every action that takes an id', () => {
	it('needs one', () => {
		expect(problem(forms.byId, {})).toBe('Invalid request.');
		expect(problem(forms.byId, { id: '' })).toBe('Invalid request.');
		expect(problem(forms.byId, { id: 'seed-c1' })).toBeNull();
	});
});

describe('updateCustomer', () => {
	it('needs a name that is not only spaces', () => {
		expect(problem(forms.updateCustomer, { id: 'x', name: '   ' })).toBe('Company name is required.');
		expect(problem(forms.updateCustomer, { id: 'x' })).not.toBeNull();
		expect(forms.updateCustomer.parse({ id: 'x', name: ' Acme ' })).toEqual({
			id: 'x',
			name: 'Acme',
			postalCode: '',
			address: '',
			phone: '',
			email: '',
			detail: ''
		});
	});

	it('limits the length of the name and of the detail', () => {
		expect(problem(forms.updateCustomer, { id: 'x', name: 'x'.repeat(201) })).toBe('Company name is too long.');
		expect(problem(forms.updateCustomer, { id: 'x', name: 'a', detail: 'x'.repeat(10_001) })).toBe('Detail is too long.');
		expect(problem(forms.updateCustomer, { id: 'x', name: 'x'.repeat(200), detail: 'x'.repeat(10_000) })).toBeNull();
	});
});

describe('updateCustomer: contact fields', () => {
	it('trims them and limits the length', () => {
		const input = { id: 'x', name: 'a', postalCode: ' 100-0001 ', address: ' Tokyo ', phone: ' 03 ', email: ' a@b.c ' };
		expect(forms.updateCustomer.parse(input)).toMatchObject({
			postalCode: '100-0001',
			address: 'Tokyo',
			phone: '03',
			email: 'a@b.c'
		});
		for (const field of ['postalCode', 'address', 'phone', 'email']) {
			expect(problem(forms.updateCustomer, { ...input, [field]: 'x'.repeat(201) })).toBe('Input is too long.');
		}
	});
});

describe('updateNote', () => {
	it('accepts an empty note and limits the length', () => {
		expect(forms.updateNote.parse({ id: 'x' })).toEqual({ id: 'x', note: '' });
		expect(problem(forms.updateNote, { id: 'x', note: 'x'.repeat(10_001) })).toBe('Note is too long.');
	});
});

describe('addDeal', () => {
	const valid = { customerId: 'x', dealDate: '2026-11-02', amount: '1200.5', remarks: 'Visit' };

	it('accepts a date, an amount and remarks', () => {
		expect(forms.addDeal.parse(valid)).toEqual({ customerId: 'x', dealDate: '2026-11-02', amount: 1200.5, remarks: 'Visit' });
	});

	it('needs only the date', () => {
		expect(forms.addDeal.parse({ customerId: 'x', dealDate: '2026-11-02', amount: '' })).toEqual({
			customerId: 'x',
			dealDate: '2026-11-02',
			amount: 0,
			remarks: ''
		});
	});

	it('limits the amount and the remarks', () => {
		expect(problem(forms.addDeal, { ...valid, amount: '-1' })).toBe('Invalid amount.');
		expect(problem(forms.addDeal, { ...valid, amount: 'abc' })).toBe('Invalid amount.');
		expect(problem(forms.addDeal, { ...valid, amount: '1e13' })).toBe('Invalid amount.');
		expect(problem(forms.addDeal, { ...valid, remarks: 'x'.repeat(10_001) })).toBe('Remarks are too long.');
	});

	it('needs a date that exists on the calendar', () => {
		expect(problem(forms.addDeal, { ...valid, dealDate: '' })).toBe('Invalid date.');
		expect(problem(forms.addDeal, { ...valid, dealDate: '2026-02-30' })).toBe('Invalid date.');
		expect(problem(forms.addDeal, { ...valid, dealDate: '11/02/2026' })).toBe('Invalid date.');
	});

	it('needs a customer', () => {
		expect(problem(forms.addDeal, { ...valid, customerId: '' })).toBe('Invalid request.');
	});
});
