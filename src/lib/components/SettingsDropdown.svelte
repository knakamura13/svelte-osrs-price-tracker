<script lang="ts">
    import { settingsStore, getSystemDarkMode } from '$lib/utils/settings';
    import { ChevronUp, ChevronDown } from 'lucide-svelte';

    let isOpen = false;
    let dropdownRef: HTMLElement;

    function toggleDropdown() {
        isOpen = !isOpen;
    }

    function closeDropdown() {
        isOpen = false;
    }

    // Handle clicks outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            closeDropdown();
        }
    }

    // Close dropdown when clicking outside
    $: if (isOpen) {
        document.addEventListener('click', handleClickOutside);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }

    // Settings reactivity
    $: settings = $settingsStore;

    function handleAutoRefreshToggle() {
        settingsStore.toggleAutoRefresh();
        settingsStore.save();
    }

    function handleDecimalViewToggle() {
        settingsStore.toggleDecimalView();
        settingsStore.save();
    }

    function handleDecimalPlacesChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value) || 0;

        // Only update if we have a valid number between 0-6
        if (!isNaN(value) && value >= 0 && value <= 6) {
            settingsStore.setDecimalPlaces(value);
            settingsStore.save();
        } else if (target.value === '') {
            // Allow empty value, but don't update the store
        } else {
            // Invalid value, reset to current value
            target.value = settings.decimalPlaces.toString();
        }
    }

    function handleDarkModeChange(mode: 'light' | 'dark' | 'auto') {
        settingsStore.setDarkMode(mode);
        settingsStore.save();
    }
</script>

<div class="relative" bind:this={dropdownRef}>
    <!-- Settings Button -->
    <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        on:click={toggleDropdown}
        aria-label="Settings"
    >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
        <span class="text-sm">Settings</span>
    </button>

    <!-- Dropdown Menu -->
    {#if isOpen}
        <div
            class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
        >
            <div class="p-4 space-y-4">
                <!-- Auto-refresh Toggle -->
                <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-900 dark:text-gray-100" for="auto-refresh-toggle">
                        Auto-refresh
                    </label>
                    <button
                        id="auto-refresh-toggle"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        class:bg-gray-200={!settings.autoRefresh}
                        class:bg-blue-600={settings.autoRefresh}
                        on:click={handleAutoRefreshToggle}
                        aria-pressed={settings.autoRefresh}
                        aria-label="Toggle auto-refresh {settings.autoRefresh ? 'off' : 'on'}"
                    >
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            class:translate-x-6={settings.autoRefresh}
                            class:translate-x-1={!settings.autoRefresh}
                        ></span>
                    </button>
                </div>

                <!-- Decimal View Toggle -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-gray-900 dark:text-gray-100" for="decimal-view-toggle">
                            Decimal view
                        </label>
                        <span
                            class="text-xs opacity-70 cursor-help inline-block align-top relative"
                            style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                            title="When enabled, displays prices with abbreviated suffixes (e.g., '558.88m' for millions, '1.67b' for billions) instead of full numbers"
                            aria-label="Decimal view explanation">?</span
                        >
                    </div>
                    <button
                        id="decimal-view-toggle"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        class:bg-gray-200={!settings.decimalView}
                        class:bg-blue-600={settings.decimalView}
                        on:click={handleDecimalViewToggle}
                        aria-pressed={settings.decimalView}
                        aria-label="Toggle decimal view {settings.decimalView ? 'off' : 'on'}"
                    >
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            class:translate-x-6={settings.decimalView}
                            class:translate-x-1={!settings.decimalView}
                        ></span>
                    </button>
                </div>

                <!-- Decimal Places Field -->
                <div class="space-y-2">
                    <div class="flex items-center gap-1">
                        <label class="text-sm font-medium text-gray-900 dark:text-gray-100" for="decimal-places-input">
                            Decimal places
                        </label>
                        <span
                            class="text-xs opacity-70 cursor-help inline-block align-top relative"
                            style="font-size: 0.75em; vertical-align: super; top: -0.2em;"
                            title={settings.decimalView
                                ? 'Number of decimal places to show in abbreviated price format (0-6)'
                                : 'Decimal view needs to be enabled first'}
                            aria-label="Decimal places explanation">?</span
                        >
                    </div>
                    <div class="relative">
                        <input
                            id="decimal-places-input"
                            type="text"
                            inputmode="numeric"
                            pattern="[0-6]"
                            maxlength="1"
                            class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-8"
                            class:opacity-50={!settings.decimalView}
                            disabled={!settings.decimalView}
                            bind:value={settings.decimalPlaces}
                            on:input={handleDecimalPlacesChange}
                        />
                        <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                            <div class="flex flex-col">
                                <button
                                    type="button"
                                    class="w-4 h-3 flex items-center justify-center text-xs text-gray-500 hover:text-gray-300 hover:disabled:!text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    disabled={!settings.decimalView || settings.decimalPlaces >= 6}
                                    on:click={() => {
                                        const newValue = Math.min(6, settings.decimalPlaces + 1);
                                        settingsStore.setDecimalPlaces(newValue);
                                        settingsStore.save();
                                    }}
                                    aria-label="Increase decimal places"
                                >
                                    <ChevronUp class="w-4 h-3" />
                                </button>
                                <button
                                    type="button"
                                    class="w-4 h-3 flex items-center justify-center text-xs text-gray-500 hover:text-gray-300 hover:disabled:!text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    disabled={!settings.decimalView || settings.decimalPlaces <= 0}
                                    on:click={() => {
                                        const newValue = Math.max(0, settings.decimalPlaces - 1);
                                        settingsStore.setDecimalPlaces(newValue);
                                        settingsStore.save();
                                    }}
                                    aria-label="Decrease decimal places"
                                >
                                    <ChevronDown class="w-4 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dark Mode Toggle -->
                <div class="space-y-2">
                    <div id="theme-label" class="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</div>
                    <div class="grid grid-cols-3 gap-2" role="group" aria-labelledby="theme-label">
                        <button
                            class="px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            class:bg-blue-600={!settings.darkMode || settings.darkMode === 'auto'
                                ? 'text-white'
                                : 'text-gray-700 dark:text-gray-300'}
                            class:text-gray-700={settings.darkMode === 'light'}
                            class:text-gray-400={settings.darkMode === 'dark'}
                            on:click={() => handleDarkModeChange('auto')}
                            aria-pressed={settings.darkMode === 'auto'}
                            aria-label="Use system theme preference"
                        >
                            Auto
                        </button>
                        <button
                            class="px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            class:bg-blue-600={settings.darkMode === 'light'
                                ? 'text-white'
                                : 'text-gray-700 dark:text-gray-300'}
                            class:text-gray-400={settings.darkMode === 'auto'}
                            class:text-gray-700={settings.darkMode === 'dark'}
                            on:click={() => handleDarkModeChange('light')}
                            aria-pressed={settings.darkMode === 'light'}
                            aria-label="Use light theme"
                        >
                            Light
                        </button>
                        <button
                            class="px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            class:bg-blue-600={settings.darkMode === 'dark'
                                ? 'text-white'
                                : 'text-gray-700 dark:text-gray-300'}
                            class:text-gray-400={settings.darkMode === 'auto'}
                            class:text-gray-700={settings.darkMode === 'light'}
                            on:click={() => handleDarkModeChange('dark')}
                            aria-pressed={settings.darkMode === 'dark'}
                            aria-label="Use dark theme"
                        >
                            Dark
                        </button>
                    </div>
                    {#if settings.darkMode === 'auto'}
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Currently: {getSystemDarkMode() ? 'Dark' : 'Light'} (system preference)
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
</style>
