<script lang="ts">
    import Dialog from './Dialog.svelte';
    import { m } from '../paraglide/messages.js';

    type Props = {
        closeDialog: () => void;
        title: string;
        // The sentence asking for confirmation; it receives the name to put in bold.
        message: (params: { name: string }) => string;
        warning: string;
        name: string;
        onconfirm?: () => void;
    };
    const { closeDialog, title, message, warning, name, onconfirm }: Props = $props();

    // The name is shown in bold, so the sentence is split around where a translation puts it.
    const NAME = '';
    // The dialog is created each time it opens, so the props are read once.
    // svelte-ignore state_referenced_locally
    const [before, after = ''] = message({ name: NAME }).split(NAME);

    const confirm = () => {
        onconfirm?.();
        closeDialog();
    };
</script>

<Dialog {closeDialog} width={440}>
    <header>
        <h2>{title}</h2>
    </header>
    <main>
        <p>{before}<strong>{name}</strong>{after}</p>
        <p class="warning">
            {warning}
        </p>
    </main>
    <footer>
        <button class="cancel" onclick={closeDialog}>{m.cancel()}</button>
        <button class="delete" onclick={confirm}>{m.delete()}</button>
    </footer>
</Dialog>

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
        padding: 12px 24px;
        & p {
            margin: 0;
            font-size: 15px;
            color: #313131;
            & + p {
                margin-top: 8px;
            }
            &.warning {
                font-size: 14px;
                color: #d33;
            }
        }
    }
    footer {
        padding: 0 24px 16px;
        display: flex;
        justify-content: flex-end;
        gap: 16px;
    }
    button {
        border: 0;
        border-radius: 4px;
        padding: 4px 12px;
        font-weight: 500;
        cursor: pointer;
        &.delete {
            background-color: #d33;
            color: #fff;
        }
        &.cancel {
            background-color: #ddd;
            color: #444;
        }
        &:hover {
            opacity: 0.85;
        }
    }
</style>
