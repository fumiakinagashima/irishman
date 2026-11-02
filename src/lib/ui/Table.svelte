<script lang="ts">
    import CustomerDialog from './CustomerDialog.svelte';
    import DealDialog, { type DealItem } from './DealDialog.svelte';
    import DeleteConfirmDialog from './DeleteConfirmDialog.svelte';
    import { ChevronDown, ChevronUp, ChevronsUpDown, Trash2 } from '@lucide/svelte';
    import { m } from '../paraglide/messages.js';
    import { customerLabel, type CustomerRow as Row, type Sort, type SortKey } from '../customer';

    type Props = {
        data: Row[];
        deals?: DealItem[];
        sort?: Sort;
        onsort?: (key: SortKey) => void;
        onnote?: (row: Row, note: string) => void;
        oncustomer?: (row: Row, value: Omit<Row, 'id' | 'note'>) => void;
        ondelete?: (row: Row) => void;
        ondealadd?: (customerId: string, input: { dealDate: string; amount: string; remarks: string }) => void;
        ondealdelete?: (deal: DealItem) => void;
    };
    const {
        data, deals = [], sort = null, onsort, onnote, oncustomer, ondelete, ondealadd, ondealdelete
    }: Props = $props();

    type DialogKind = 'customer' | 'deal' | 'delete';
    let dialog = $state.raw<{ kind: DialogKind; row: Row } | null>(null);
    const closeDialog = () => dialog = null;
    const dealsOf = (row: Row) => deals.filter((d) => d.customerId === row.id);
    const lastDeal = (row: Row) =>
        dealsOf(row).reduce<string | null>((latest, d) => (!latest || d.dealDate > latest ? d.dealDate : latest), null);
    const ariaSort = (key: SortKey) =>
        sort?.key !== key ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending';
</script>

<!-- A name that is not set is shown dimmed, still clickable so it can be filled in. -->
{#snippet shown(value: string)}
    {#if value}
        {value}
    {:else}
        <span class="not-set">{m.not_set()}</span>
    {/if}
{/snippet}

{#snippet sortButton(key: SortKey, label: string)}
    <button onclick={() => onsort?.(key)}>
        {label}
        {#if sort?.key !== key}
            <ChevronsUpDown size={16} />
        {:else if sort.dir === 'asc'}
            <ChevronUp size={16} />
        {:else}
            <ChevronDown size={16} />
        {/if}
    </button>
{/snippet}

<table>
    <thead>
        <tr>
            <th class="customer" aria-sort={ariaSort('customer')}>{@render sortButton('customer', m.customer())}</th>
            <th class="fit">{m.email()}</th>
            <th class="deals"><span class="plain">{m.deals()}</span></th>
            <th class="fit" aria-sort={ariaSort('latest')}>{@render sortButton('latest', m.last_deal())}</th>
            <th class="fit">{m.note()}</th>
            <th class="fit"></th>
        </tr>
    </thead>
    <tbody>
        {#each data as d (d.id)}
            <tr>
                <td><button class="text-link" onclick={() => dialog = { kind: 'customer', row: d }}>{@render shown(d.name)}</button></td>
                <td class="fit email">
                    {#if d.email}
                        <a href={`mailto:${d.email}`}>{d.email}</a>
                    {/if}
                </td>
                <td class="number deals">
                    <button class="text-link" onclick={() => dialog = { kind: 'deal', row: d }}>{dealsOf(d).length}</button>
                </td>
                <td class="fit date">{lastDeal(d) ?? '-'}</td>
                <td class="fit">
                    <input type="text" class="note" value={d.note}
                        onchange={(e) => onnote?.(d, e.currentTarget.value)} />
                </td>
                <td class="fit">
                    <button class="icon-button" title={m.delete()} aria-label={m.delete()}
                        onclick={() => dialog = { kind: 'delete', row: d }}>
                        <Trash2 size={16} />
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>

{#if dialog?.kind === 'customer'}
    <CustomerDialog {closeDialog} name={dialog.row.name} postalCode={dialog.row.postalCode}
        address={dialog.row.address} phone={dialog.row.phone} email={dialog.row.email} detail={dialog.row.detail}
        onsubmit={(value) => oncustomer?.(dialog!.row, value)} />
{:else if dialog?.kind === 'deal'}
    <DealDialog {closeDialog} title={m.deals_title({ name: customerLabel(dialog.row) })}
        deals={dealsOf(dialog.row)}
        ondelete={ondealdelete}
        onadd={(input) => ondealadd?.(dialog!.row.id, input)} />
{:else if dialog?.kind === 'delete'}
    <DeleteConfirmDialog {closeDialog} title={m.delete_customer_title()} message={m.delete_customer_confirm}
        warning={m.delete_customer_warning()} name={customerLabel(dialog.row)}
        onconfirm={() => ondelete?.(dialog!.row)} />
{/if}

<style lang="scss">
    table {
        width: 100%;
        border-collapse: collapse;
        & th {
            background-color: #f2f3f3;
            border-bottom: 2px solid #e2e2e2;
            text-align: left;
            padding: 8px 12px;
            font-size: 14px;
            color: #080808;
            &:first-of-type {
                border-radius: 6px 0 0 0;
            }
            &:last-of-type {
                border-radius: 0 6px 0 0;
            }
            &.customer {
                min-width: 250px;
                width: 100%;
            }
            /* Fits the content, so the customer column takes the rest. */
            &.fit {
                width: 1%;
                white-space: nowrap;
            }
            &.deals {
                width: 84px;
                min-width: 84px;
                text-align: right;
            }
            & button {
                display: flex;
                gap: 4px;
                align-items: center;
                background: transparent;
                padding: 4px;
                font-size: 14px;
                font-weight: 500;
                border: 0;
                cursor: pointer;
            }
            & .plain {
                display: block;
                padding: 4px;
                font-weight: 500;
            }
        }
        & td {
            border-bottom: 1px solid #e2e2e2;
            padding: 12px 12px;
            font-size: 14px;
            font-weight: 600;
            color: #313131;
            background-color: #fff;
            &.number {
                text-align: right;
            }
            &.deals {
                width: 84px;
                min-width: 84px;
            }
            &.email {
                font-weight: 500;
                white-space: nowrap;
            }
            &.date {
                font-weight: 500;
                color: #666;
                white-space: nowrap;
            }
        }
    }
    button.text-link {
        display: inline-block;
        background-color: transparent;
        font-size: 14px;
        font-weight: 600;
        border: 0;
        border-bottom: 2px solid #999;
        padding: 0 2px 2px 2px;
        cursor: pointer;
        &:has(span.not-set) {
            border-color: #ccc;
        }
    }
    button.icon-button {
        background: transparent;
        border: 0;
        border-radius: 8px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #888;
        cursor: pointer;
        &:hover {
            background-color: #f0f0f0;
            color: #d33;
        }
    }
    td a {
        color: #1a5fb4;
    }
    span.not-set {
        font-weight: 500;
        color: #aaa;
    }
    input {
        width: 100%;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #bbb;
    }
    input.note {
        width: 280px;
    }
</style>
