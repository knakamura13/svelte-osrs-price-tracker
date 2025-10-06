<script lang="ts">
    import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-svelte';

    export let message: string = '';
    export let type: 'success' | 'info' | 'warning' | 'error' = 'info';
    export let visible: boolean = false;
    export let duration: number = 3000; // Auto-hide after 3 seconds

    let timeout: ReturnType<typeof setTimeout>;

    $: if (visible && duration > 0) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            visible = false;
        }, duration);
    }

    $: iconComponent = {
        success: CheckCircle,
        info: Info,
        warning: AlertTriangle,
        error: XCircle
    }[type];

    $: bgColor = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
    }[type];

    $: textColor = {
        success: 'text-green-800 dark:text-green-200',
        info: 'text-blue-800 dark:text-blue-200',
        warning: 'text-yellow-800 dark:text-yellow-200',
        error: 'text-red-800 dark:text-red-200'
    }[type];
</script>

{#if visible}
    <div class="fixed bottom-4 right-4 z-50 animate-slide-in-up" role="alert" aria-live="polite">
        <div class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg {bgColor} {textColor} max-w-md">
            <svelte:component this={iconComponent} class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p class="text-sm font-medium">{message}</p>
            <button
                class="ml-auto flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                on:click={() => (visible = false)}
                aria-label="Close notification"
            >
                <X class="w-4 h-4" />
            </button>
        </div>
    </div>
{/if}

<style>
    @keyframes slide-in-up {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .animate-slide-in-up {
        animation: slide-in-up 0.3s ease-out;
    }
</style>
