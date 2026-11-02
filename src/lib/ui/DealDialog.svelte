<script lang="ts" module>
    export type DealItem = {
        id: string;
        customerId: string;
        // 'YYYY-MM-DD'.
        dealDate: string;
        // In minor currency units.
        amount: number;
        remarks: string;
    };
</script>

<script lang="ts">
    import Dialog from './Dialog.svelte';
    import DeleteConfirmDialog from './DeleteConfirmDialog.svelte';
    import { Trash } from '@lucide/svelte';
    import { m } from '../paraglide/messages.js';
    import { formatAmount } from '../customer';

    type Props = {
        closeDialog: () => void;
        title: string;
        deals: DealItem[];
        onadd?: (input: { dealDate: string; amount: string; remarks: string }) => void;
        ondelete?: (deal: DealItem) => void;
    };
    const { closeDialog, title, deals, onadd, ondelete }: Props = $props();

    // Local date as 'YYYY-MM-DD'.
    const today = () => new Date().toLocaleDateString('sv-SE');

    let newDate = $state<string>(today());
    let newAmount = $state<string>('');
    let newRemarks = $state<string>('');
    const canAdd = $derived(!!newDate);
    // The deal waiting for the answer of the confirmation dialog.
    let deleting = $state.raw<DealItem | null>(null);

    const add = (e: SubmitEvent) => {
        e.preventDefault();
        if (!canAdd) return;
        onadd?.({ dealDate: newDate, amount: newAmount, remarks: newRemarks.trim() });
        newDate = today();
        newAmount = '';
        newRemarks = '';
    };

    // Newest first.
    const sorted = $derived([...deals].sort((a, b) => b.dealDate.localeCompare(a.dealDate)));
</script>

<!-- Escape closes the confirmation first, not this dialog under it. -->
<Dialog closeDialog={() => { if (!deleting) closeDialog(); }} width={720}>
    <header>
        <h2>{title}</h2>
    </header>
    <main>
        {#if onadd}
            <form onsubmit={add}>
                <input type="date" required aria-label={m.deal_date()} bind:value={newDate} />
                <input type="number" class="new-amount" min="0" step="0.01" placeholder={m.amount()}
                    aria-label={m.amount()} bind:value={newAmount} />
                <input type="text" class="new-remarks" placeholder={m.add_deal_remarks_placeholder()}
                    aria-label={m.remarks()} bind:value={newRemarks} />
                <button type="submit" class="add" disabled={!canAdd}>{m.add()}</button>
            </form>
        {/if}
        {#if sorted.length === 0}
            <p class="empty">{m.no_deals()}</p>
        {:else}
            <ul>
                {#each sorted as d (d.id)}
                    <li>
                        <span class="date">{d.dealDate}</span>
                        <span class="amount">{formatAmount(d.amount)}</span>
                        <span class="remarks">{d.remarks}</span>
                        {#if ondelete}
                            <button class="trash" title={m.delete_deal()} onclick={() => deleting = d}>
                                <Trash size={16} />
                            </button>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </main>
    <footer>
        <button class="close" onclick={closeDialog}>{m.close()}</button>
    </footer>
</Dialog>

{#if deleting}
    <DeleteConfirmDialog closeDialog={() => deleting = null}
        title={m.delete_deal_title()} message={m.delete_deal_confirm} warning={m.delete_deal_warning()}
        name={deleting.dealDate}
        onconfirm={() => ondelete?.(deleting!)} />
{/if}

<style lang="scss">
    header {
        padding: 12px 24px;
        border-bottom: 1px solid #ddd;
        & h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
        }
    }
    main {
        padding: 20px 24px;
    }
    form {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        & input {
            padding: 4px 8px;
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        & .new-amount {
            width: 120px;
        }
        & .new-remarks {
            flex: 1;
            min-width: 0;
        }
    }
    p.empty {
        margin: 0;
        font-size: 14px;
        color: #888;
    }
    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        background-color: #fff;
        border: 1px solid #e2e2e2;
        border-radius: 6px;
    }
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        font-size: 14px;
        color: #313131;
        & + li {
            border-top: 1px solid #e2e2e2;
        }
        & .date {
            min-width: 84px;
            color: #666;
        }
        & .amount {
            min-width: 100px;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        & .remarks {
            flex: 1;
            color: #313131;
        }
    }
    footer {
        padding: 8px 24px 16px;
        display: flex;
        justify-content: flex-end;
    }
    button {
        border: 0;
        border-radius: 4px;
        padding: 4px 12px;
        font-weight: 500;
        cursor: pointer;
        &.close {
            background-color: #ddd;
            color: #444;
        }
        &.add {
            background-color: #4090ea;
            color: #fff;
            &:disabled {
                opacity: 0.5;
                cursor: default;
            }
        }
        &:hover {
            opacity: 0.85;
        }
    }
    button.trash {
        width: 24px;
        height: 24px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: #888;
        &:hover {
            color: #d33;
        }
    }
</style>
