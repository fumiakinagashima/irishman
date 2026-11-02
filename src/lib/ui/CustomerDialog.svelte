<script lang="ts">
    import Dialog from './Dialog.svelte';
    import { m } from '../paraglide/messages.js';

    type Value = {
        name: string;
        postalCode: string;
        address: string;
        phone: string;
        email: string;
        detail: string;
    };

    type Props = {
        closeDialog: () => void;
        name: string;
        postalCode: string;
        address: string;
        phone: string;
        email: string;
        detail: string;
        onsubmit?: (value: Value) => void;
    };
    const { closeDialog, name, postalCode, address, phone, email, detail, onsubmit }: Props = $props();

    // The dialog is created each time it opens, so the initial values are all that is needed.
    // svelte-ignore state_referenced_locally
    let inputName = $state<string>(name);
    // svelte-ignore state_referenced_locally
    let inputPostalCode = $state<string>(postalCode);
    // svelte-ignore state_referenced_locally
    let inputAddress = $state<string>(address);
    // svelte-ignore state_referenced_locally
    let inputPhone = $state<string>(phone);
    // svelte-ignore state_referenced_locally
    let inputEmail = $state<string>(email);
    // svelte-ignore state_referenced_locally
    let inputDetail = $state<string>(detail);

    const submit = () => {
        onsubmit?.({
            name: inputName.trim(),
            postalCode: inputPostalCode.trim(),
            address: inputAddress.trim(),
            phone: inputPhone.trim(),
            email: inputEmail.trim(),
            detail: inputDetail
        });
        closeDialog();
    };
</script>

<Dialog {closeDialog}>
    <header>
        <h2>{m.customer_info()}</h2>
    </header>
    <main>
        <label>
            {m.customer()}
            <input class="field" type="text" name="customer-name" placeholder={m.input_customer_name()}
                bind:value={inputName} />
        </label>
        <label>
            {m.postal_code()}
            <input class="field" type="text" bind:value={inputPostalCode} />
        </label>
        <label>
            {m.address()}
            <input class="field" type="text" bind:value={inputAddress} />
        </label>
        <label>
            {m.phone()}
            <input class="field" type="tel" bind:value={inputPhone} />
        </label>
        <label>
            {m.email()}
            <input class="field" type="email" bind:value={inputEmail} />
        </label>
        <p>{m.detail()}</p>
        <textarea bind:value={inputDetail}></textarea>
    </main>
    <footer>
        <button class="cancel" onclick={closeDialog}>{m.cancel()}</button>
        <button class="ok" onclick={submit} disabled={!inputName.trim()}>{m.ok()}</button>
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
        & label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #555;
        }
        & .field {
            display: block;
            margin-top: 4px;
            padding: 6px 8px;
            font-size: 15px;
            font-weight: 400;
            border: 1px solid #ccc;
            width: 100%;
            border-radius: 0;
            background-color: #fff;
        }
        & > p {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #555;
        }
        & textarea {
            width: 100%;
            min-height: 120px;
            margin-top: 4px;
            padding: 8px;
            font-size: 15px;
            border: 1px solid #ccc;
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
        &.ok {
            background-color: #4090ea;
            color: #fff;
            &:disabled {
                opacity: 0.5;
                cursor: default;
            }
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
