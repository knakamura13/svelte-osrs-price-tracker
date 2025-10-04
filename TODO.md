- Add a settings dropdown menu to the AppHeader with the following options:
    1. 'Auto-refresh' toggle (moved from the page header to this new menu; enabled by default)
    2. 'Decimal view' toggle (when enabled, all prices will be rendered using a simplified, rounded value. Examples: '558,888,888' is shown as '558.88m', '1,674,999,989' is shown as '1.67b', '8,299' is shown as '8.30k', and '279' is shown as '279'; disabled by default)
    3. 'Decimal places' field (greyed out/disabled by default; when 'Decimal View' is enabled, the number the user specifies in the 'Decimal places' field sets the number of decimal places we'll render for all prices. Default value, when enabled, is 2 decimal places)
    4. Light/Dark mode toggle (try to default the value to the browser/OS preference, otherwise default to dark mode)
    - ensure settings are always preserved after page reload/navigation using local storage or cookies (comprehensive settings system)
- Investigate potential issue with page load times; navigating to either route (root or slug route) sometimes takes many seconds with no indication as to what is causing the delay. Consider implementing pre-fetching/pre-loading when user hovers over a link that would cause navigation to occur (performance optimization and debugging)
