import { expect, test, type Page } from '@playwright/test';

// Names are unique per test, so a test finds its own rows among those the others left behind.
let counter = 0;
const unique = (label: string) => `${label}-${Date.now()}-${counter++}`;

// Opens the page and waits until it has loaded its scripts. A click before the page is
// interactive does nothing, which would look like a bug in the app.
const open = async (page: Page) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
};

const rowOf = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text });

// Creates a customer from the Create button, then names it in the dialog.
const createCustomer = async (page: Page, name: string) => {
	await open(page);
	await page.getByRole('button', { name: 'Create' }).click();

	// A new customer has no name yet, and the newest customer is the first row.
	const created = page.getByRole('row').nth(1);
	await created.getByRole('button', { name: 'Not set' }).click();
	await page.getByPlaceholder('Input company name').fill(name);
	await page.getByRole('button', { name: 'OK' }).click();
	await expect(rowOf(page, name)).toHaveCount(1);
};

test('a customer can be created, named and deleted', async ({ page }) => {
	const name = unique('Acme');
	await createCustomer(page, name);

	await rowOf(page, name).getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await expect(rowOf(page, name)).toHaveCount(0);
});

test('the contact fields are saved', async ({ page }) => {
	const name = unique('Delta');
	await createCustomer(page, name);

	await rowOf(page, name).getByRole('button', { name }).click();
	await page.getByLabel('Postal code').fill('100-0001');
	await page.getByLabel('Address').fill('1-1 Chiyoda');
	await page.getByLabel('Phone').fill('03-0000-0000');
	await page.getByLabel('Email').fill('info@example.com');
	const saved = page.waitForResponse((res) => res.url().includes('?/updateCustomer'));
	await page.getByRole('button', { name: 'OK' }).click();
	await saved;

	// Reload, so the values come from the database.
	await open(page);
	await rowOf(page, name).getByRole('button', { name }).click();
	await expect(page.getByLabel('Postal code')).toHaveValue('100-0001');
	await expect(page.getByLabel('Address')).toHaveValue('1-1 Chiyoda');
	await expect(page.getByLabel('Phone')).toHaveValue('03-0000-0000');
	await expect(page.getByLabel('Email')).toHaveValue('info@example.com');
	await page.getByRole('button', { name: 'Cancel' }).click();

	// The email is shown on the list as a mailto link.
	await expect(rowOf(page, name).getByRole('link', { name: 'info@example.com' })).toHaveAttribute(
		'href',
		'mailto:info@example.com'
	);
});

test('deals are added to a customer and shown on the list', async ({ page }) => {
	const name = unique('Beta');
	const remarks = unique('Visited');
	await createCustomer(page, name);

	const row = rowOf(page, name);
	await row.getByRole('button', { name: '0', exact: true }).click();
	await page.getByLabel('Date').fill('2026-10-20');
	await page.getByLabel('Amount').fill('1200.5');
	await page.getByLabel('Remarks').fill(remarks);
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByText(remarks)).toBeVisible();
	await expect(dialog.getByText('1,200.50')).toBeVisible();

	// Deleting asks first. Cancelling keeps the deal.
	await dialog.getByRole('button', { name: 'Delete deal' }).click();
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(dialog.getByText(remarks)).toBeVisible();
	await page.getByRole('button', { name: 'Close' }).click();

	await expect(row.getByRole('button', { name: '1', exact: true })).toBeVisible();
	await expect(row.getByRole('cell', { name: '2026-10-20' })).toBeVisible();

	// The filter also looks into the remarks of the deals.
	await page.getByLabel('Filter text').fill(remarks);
	await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(remarks)}`));
	await expect(rowOf(page, name)).toHaveCount(1);
	await expect(page.getByRole('row')).toHaveCount(2);

	// Confirming deletes it.
	await row.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: 'Delete deal' }).click();
	await page.getByRole('dialog').last().getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByText('No deals yet.')).toBeVisible();
});

test('the note is saved when it is changed', async ({ page }) => {
	const name = unique('Gamma');
	const note = unique('Prefers email');
	await createCustomer(page, name);

	const saved = page.waitForResponse((res) => res.url().includes('?/updateNote'));
	await rowOf(page, name).getByRole('textbox').fill(note);
	await rowOf(page, name).getByRole('textbox').blur();
	await saved;

	await open(page);
	await expect(rowOf(page, name).getByRole('textbox')).toHaveValue(note);
});
