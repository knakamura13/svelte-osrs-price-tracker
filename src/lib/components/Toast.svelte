<script lang="ts">
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

    $: iconPath = {
        success:
            'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        warning:
            'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        error:
            'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
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
    <div
        class="fixed bottom-4 right-4 z-50 animate-slide-in-up"
        role="alert"
        aria-live="polite"
    >
        <div class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg {bgColor} {textColor} max-w-md">
            <svg
                class="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
            </svg>
            <p class="text-sm font-medium">{message}</p>
            <button
                class="ml-auto flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                on:click={() => (visible = false)}
                aria-label="Close notification"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
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

