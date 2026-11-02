<script lang="ts">
    import Table from "#lib/ui/Table.svelte";
    import Filter from "#lib/ui/Filter.svelte";
    import Pager from "#lib/ui/Pager.svelte";
    import { Plus } from '@lucide/svelte';
    import { deserialize } from '$app/forms';
    import { goto, refreshAll } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { SvelteURLSearchParams } from 'svelte/reactivity';
    import { m } from '#lib/paraglide/messages.js';
    import type { Sort, SortKey } from '#lib/customer.ts';
    import type { PageProps } from './$types';

    const { data }: PageProps = $props();
    let message = $state<string>('');

    // The filter and the sort live in the URL (`?q=&sort=&dir=`), so they survive
    // reloads and can be shared.
    // `page` is left out when it is the first one. Changing the filter or the sort starts over from it.
    type View = { text: string; sort: Sort; page?: number };

    const viewQuery = (view: View) => {
        const params = new SvelteURLSearchParams();
        if (view.text) params.set('q', view.text);
        if (view.sort) {
            params.set('sort', view.sort.key);
            params.set('dir', view.sort.dir);
        }
        if (view.page && view.page > 1) params.set('page', String(view.page));
        const query = params.toString();
        return query ? `?${query}` : '';
    };

    const showView = (view: View) => {
        // resolve() takes a route, not a query string, so it is applied to the path only.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        goto(resolve('/') + viewQuery(view), { replace: true, reset: false });
    };

    // Clicking a column cycles ascending, descending, then back to the default order.
    const sortBy = (key: SortKey) => {
        const current = data.sort;
        const sort: Sort =
            current?.key !== key ? { key, dir: 'asc' } : current.dir === 'asc' ? { key, dir: 'desc' } : null;
        showView({ ...data.filter, sort });
    };

    const showPage = (page: number) => showView({ ...data.filter, sort: data.sort, page });

    // Calls a form action in +page.server.ts, then reloads the data.
    const act = async (name: string, values: Record<string, string> = {}) => {
        const body = new FormData();
        for (const [key, value] of Object.entries(values)) body.set(key, value);
        try {
            const res = await fetch(`?/${name}`, {
                method: 'POST',
                body,
                headers: { 'x-sveltekit-action': 'true' }
            });
            const result = deserialize(await res.text());
            message =
                result.type === 'failure' ? String(result.data?.message ?? m.request_failed())
                : result.type === 'error' ? result.error.message
                : '';
        } catch {
            message = m.network_error();
        }
        await refreshAll();
    };
</script>

<div class="wrap">
    <div class="actions">
        <div class="filter-wrap">
            <Filter
                text={data.filter.text}
                onchange={(filter) => showView({ ...filter, sort: data.sort })}
                onclear={() => showView({ text: '', sort: data.sort })} />
        </div>
        <div class="operation-wrap">
            <button class="primary" onclick={() => act('createCustomer')}>
                <Plus size={16} />{m.create()}
            </button>
        </div>
    </div>
    {#if message}
        <p class="message">{message}</p>
    {/if}
    <div class="table-wrap">
        <Table
            data={data.customers}
            deals={data.deals}
            sort={data.sort}
            onsort={sortBy}
            onnote={(row, note) => act('updateNote', { id: row.id, note })}
            oncustomer={(row, v) => act('updateCustomer', { id: row.id, ...v })}
            ondelete={(row) => act('deleteCustomer', { id: row.id })}
            ondealadd={(customerId, input) => act('addDeal', { customerId, ...input })}
            ondealdelete={(deal) => act('deleteDeal', { id: deal.id })} />
    </div>
    <Pager page={data.page} pageCount={data.pageCount} total={data.total} onpage={showPage} />
</div>

<style lang="scss">
    .wrap {
        padding: 32px 24px;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
    }
    .actions {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 16px;
    }
    
    .message {
        margin: 0 0 12px;
        font-size: 14px;
        color: #d33;
    }
    .operation-wrap {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 16px;
    }
    button {
        display: flex;
        align-items: center;
        gap: 4px;
        border: 0;
        border-radius: 4px;
        padding: 6px 8px;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
    }
    button.primary {
        background-color: #4090ea;
        color: #fff;
    }
</style>
