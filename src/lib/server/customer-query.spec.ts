import { describe, expect, it } from 'vitest';
import { parseListQuery } from './customer-query';

const parse = (query = '') => parseListQuery(new URL(`http://localhost/?${query}`));

describe('parseListQuery: the filter', () => {
	it('has no text by default', () => {
		expect(parse().filter).toEqual({ text: '' });
	});

	it('trims the text and keeps at most 100 characters', () => {
		expect(parse('q=%20%20acme%20%20').filter.text).toBe('acme');
		expect(parse(`q=${'x'.repeat(150)}`).filter.text).toHaveLength(100);
	});
});

describe('parseListQuery: the page', () => {
	it('is the first page by default', () => {
		expect(parse().page).toBe(1);
	});

	it('reads a valid page and ignores the rest', () => {
		expect(parse('page=3').page).toBe(3);
		expect(parse('page=0').page).toBe(1);
		expect(parse('page=-2').page).toBe(1);
		expect(parse('page=abc').page).toBe(1);
		expect(parse('page=1.5').page).toBe(1);
	});
});

describe('parseListQuery: the sort', () => {
	it('is unsorted by default', () => {
		expect(parse().sort).toBeNull();
	});

	it('reads a known key and a direction', () => {
		expect(parse('sort=customer').sort).toEqual({ key: 'customer', dir: 'asc' });
		expect(parse('sort=latest&dir=desc').sort).toEqual({ key: 'latest', dir: 'desc' });
		expect(parse('sort=latest&dir=bogus').sort).toEqual({ key: 'latest', dir: 'asc' });
	});

	it('ignores an unknown key', () => {
		expect(parse('sort=bogus&dir=desc').sort).toBeNull();
	});
});
