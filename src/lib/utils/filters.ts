import type { Filters, NumericFilterKey, PriceRow, SortKey, FilterStats } from '$lib/types';

export function isFiniteNumber(n: number | null): n is number {
    return typeof n === 'number' && Number.isFinite(n);
}

export function isPositive(n: number | null): boolean {
    return isFiniteNumber(n) && n > 0;
}

export function normalizeFilters(f: Filters): Filters {
    return {
        buyLimit: {
            min: isFiniteNumber(f.buyLimit.min) ? f.buyLimit.min : null,
            max: isFiniteNumber(f.buyLimit.max) ? f.buyLimit.max : null
        },
        buyPrice: {
            min: isFiniteNumber(f.buyPrice.min) ? f.buyPrice.min : null,
            max: isFiniteNumber(f.buyPrice.max) ? f.buyPrice.max : null
        },
        buyTime: {
            min: isFiniteNumber(f.buyTime.min) ? f.buyTime.min : null,
            max: isFiniteNumber(f.buyTime.max) ? f.buyTime.max : null
        },
        sellPrice: {
            min: isFiniteNumber(f.sellPrice.min) ? f.sellPrice.min : null,
            max: isFiniteNumber(f.sellPrice.max) ? f.sellPrice.max : null
        },
        sellTime: {
            min: isFiniteNumber(f.sellTime.min) ? f.sellTime.min : null,
            max: isFiniteNumber(f.sellTime.max) ? f.sellTime.max : null
        },
        breakEvenPrice: {
            min: isFiniteNumber(f.breakEvenPrice.min) ? f.breakEvenPrice.min : null,
            max: isFiniteNumber(f.breakEvenPrice.max) ? f.breakEvenPrice.max : null
        },
        margin: {
            min: isFiniteNumber(f.margin.min) ? f.margin.min : null,
            max: isFiniteNumber(f.margin.max) ? f.margin.max : null
        },
        postTaxProfit: {
            min: isFiniteNumber(f.postTaxProfit.min) ? f.postTaxProfit.min : null,
            max: isFiniteNumber(f.postTaxProfit.max) ? f.postTaxProfit.max : null
        },
        dailyVolume: {
            min: isFiniteNumber(f.dailyVolume.min) ? f.dailyVolume.min : null,
            max: isFiniteNumber(f.dailyVolume.max) ? f.dailyVolume.max : null
        }
    };
}

export function handleNumericFilterChange<K extends NumericFilterKey>(
    filters: Filters,
    key: K,
    bound: 'min' | 'max',
    rawValue: string
): Filters {
    const value = rawValue === '' ? null : Number(rawValue);
    const next: Filters = structuredClone(filters);
    if (value === null || !Number.isFinite(value) || value === 0) {
        (next as any)[key][bound] = null;
        return next;
    }
    (next as any)[key][bound] = value;
    return next;
}

export function filteredSorted(
    source: PriceRow[],
    qStr: string,
    key: SortKey | null,
    dirStr: 'asc' | 'desc',
    filterSet: Filters,
    nowSeconds: number
): PriceRow[] {
    let rows = source;
    if (qStr.trim()) {
        const q = qStr.toLowerCase();
        rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }

    rows = rows.filter((row) => {
        // Buy limit filter - special case when min === max === 0 (exact match for 0)
        if (filterSet.buyLimit.min === 0 && filterSet.buyLimit.max === 0) {
            return row.buyLimit === 0;
        }
        if (filterSet.buyLimit.min !== null && row.buyLimit !== null && row.buyLimit < filterSet.buyLimit.min)
            return false;
        if (filterSet.buyLimit.max !== null && row.buyLimit !== null && row.buyLimit > filterSet.buyLimit.max)
            return false;

        if (filterSet.buyPrice.min !== null && row.buyPrice !== null && row.buyPrice < filterSet.buyPrice.min)
            return false;
        if (filterSet.buyPrice.max !== null && row.buyPrice !== null && row.buyPrice > filterSet.buyPrice.max)
            return false;

        if ((filterSet.buyTime.min !== null || filterSet.buyTime.max !== null) && row.buyTime !== null) {
            const age = Math.max(0, nowSeconds - row.buyTime);
            if (filterSet.buyTime.min !== null && age < filterSet.buyTime.min) return false;
            if (filterSet.buyTime.max !== null && age > filterSet.buyTime.max) return false;
        }

        if (filterSet.sellPrice.min !== null && row.sellPrice !== null && row.sellPrice < filterSet.sellPrice.min)
            return false;
        if (filterSet.sellPrice.max !== null && row.sellPrice !== null && row.sellPrice > filterSet.sellPrice.max)
            return false;

        if ((filterSet.sellTime.min !== null || filterSet.sellTime.max !== null) && row.sellTime !== null) {
            const age = Math.max(0, nowSeconds - row.sellTime);
            if (filterSet.sellTime.min !== null && age < filterSet.sellTime.min) return false;
            if (filterSet.sellTime.max !== null && age > filterSet.sellTime.max) return false;
        }

        const breakEvenPrice = row.sellPrice !== null ? Math.ceil(row.sellPrice / (1 - 0.02)) : null;
        if (
            filterSet.breakEvenPrice.min !== null &&
            breakEvenPrice !== null &&
            breakEvenPrice < filterSet.breakEvenPrice.min
        )
            return false;
        if (
            filterSet.breakEvenPrice.max !== null &&
            breakEvenPrice !== null &&
            breakEvenPrice > filterSet.breakEvenPrice.max
        )
            return false;

        if (filterSet.margin.min !== null && row.margin !== null && row.margin < filterSet.margin.min) return false;
        if (filterSet.margin.max !== null && row.margin !== null && row.margin > filterSet.margin.max) return false;

        if (
            filterSet.dailyVolume.min !== null &&
            row.dailyVolume != null &&
            row.dailyVolume < filterSet.dailyVolume.min
        )
            return false;
        if (
            filterSet.dailyVolume.max !== null &&
            row.dailyVolume != null &&
            row.dailyVolume > filterSet.dailyVolume.max
        )
            return false;

        const taxRate = 0.02;
        const postTaxProfit =
            row.buyPrice !== null && row.sellPrice !== null
                ? Math.floor(row.buyPrice * (1 - taxRate) - row.sellPrice)
                : null;
        if (
            filterSet.postTaxProfit.min !== null &&
            postTaxProfit !== null &&
            postTaxProfit < filterSet.postTaxProfit.min
        )
            return false;
        if (
            filterSet.postTaxProfit.max !== null &&
            postTaxProfit !== null &&
            postTaxProfit > filterSet.postTaxProfit.max
        )
            return false;

        return true;
    });

    if (!key) return rows;

    const dir = dirStr === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
        let va: any;
        let vb: any;

        if (key === 'breakEvenPrice') {
            const taxRate = 0.02;
            va = a.sellPrice !== null ? Math.ceil(a.sellPrice / (1 - taxRate)) : null;
            vb = b.sellPrice !== null ? Math.ceil(b.sellPrice / (1 - taxRate)) : null;
        } else if (key === 'postTaxProfit') {
            const taxRate = 0.02;
            va =
                a.buyPrice !== null && a.sellPrice !== null
                    ? Math.floor(a.buyPrice * (1 - taxRate) - a.sellPrice)
                    : null;
            vb =
                b.buyPrice !== null && b.sellPrice !== null
                    ? Math.floor(b.buyPrice * (1 - taxRate) - b.sellPrice)
                    : null;
        } else {
            va = (a as any)[key];
            vb = (b as any)[key];
        }

        if (key === 'buyLimit') {
            va = va ?? Number.MAX_SAFE_INTEGER;
            vb = vb ?? Number.MAX_SAFE_INTEGER;
        }

        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb);
        return dir * (va - vb);
    });
    return rows;
}

export function setSort(
    currentKey: SortKey | null,
    currentDir: 'asc' | 'desc',
    lastKey: SortKey | null,
    nextKey: SortKey
) {
    let sortKey: SortKey | null = currentKey;
    let sortDir: 'asc' | 'desc' = currentDir;
    let lastSortKey: SortKey | null = lastKey;

    if (sortKey === nextKey) {
        if (sortDir === 'asc') {
            sortDir = 'desc';
        } else if (sortDir === 'desc') {
            sortKey = null; // unsorted
            sortDir = 'asc';
            lastSortKey = nextKey;
        } else {
            sortKey = nextKey;
            sortDir = 'asc';
        }
    } else if (lastSortKey === nextKey && sortKey === null) {
        sortKey = nextKey;
        sortDir = 'asc';
    } else {
        sortKey = nextKey;
        sortDir = nextKey === 'name' ? 'asc' : 'desc';
        lastSortKey = nextKey;
    }

    return { sortKey, sortDir, lastSortKey };
}

export function computeFilterStats(allRows: PriceRow[]): FilterStats {
    const pickNumbers = (arr: Array<number | null | undefined>): number[] =>
        arr.filter((v): v is number => v !== null && v !== undefined);

    const stats: FilterStats = {
        buyLimit: { min: null, max: null },
        buyPrice: { min: null, max: null },
        sellPrice: { min: null, max: null },
        margin: { min: null, max: null },
        dailyVolume: { min: null, max: null },
        breakEvenPrice: { min: null, max: null },
        postTaxProfit: { min: null, max: null }
    };

    if (allRows.length === 0) return stats;

    const buyLimits = pickNumbers(allRows.map((r) => r.buyLimit));
    const buyPrices = pickNumbers(allRows.map((r) => r.buyPrice));
    const sellPrices = pickNumbers(allRows.map((r) => r.sellPrice));
    const margins = pickNumbers(allRows.map((r) => r.margin));
    const volumes = pickNumbers(allRows.map((r) => r.dailyVolume ?? null));

    if (buyLimits.length) {
        stats.buyLimit.min = Math.min(...buyLimits);
        stats.buyLimit.max = Math.max(...buyLimits);
    }
    if (buyPrices.length) {
        stats.buyPrice.min = Math.min(...buyPrices);
        stats.buyPrice.max = Math.max(...buyPrices);
    }
    if (sellPrices.length) {
        stats.sellPrice.min = Math.min(...sellPrices);
        stats.sellPrice.max = Math.max(...sellPrices);
    }
    if (margins.length) {
        stats.margin.min = Math.min(...margins);
        stats.margin.max = Math.max(...margins);
    }
    if (volumes.length) {
        stats.dailyVolume.min = Math.min(...volumes);
        stats.dailyVolume.max = Math.max(...volumes);
    }

    const taxRate = 0.02;
    const breakEvenPrices: number[] = [];
    const postTaxProfits: number[] = [];
    for (const row of allRows) {
        if (row.sellPrice !== null) breakEvenPrices.push(Math.ceil(row.sellPrice / (1 - taxRate)));
        if (row.buyPrice !== null && row.sellPrice !== null)
            postTaxProfits.push(Math.floor(row.buyPrice * (1 - taxRate) - row.sellPrice));
    }
    if (breakEvenPrices.length) {
        stats.breakEvenPrice.min = Math.min(...breakEvenPrices);
        stats.breakEvenPrice.max = Math.max(...breakEvenPrices);
    }
    if (postTaxProfits.length) {
        stats.postTaxProfit.min = Math.min(...postTaxProfits);
        stats.postTaxProfit.max = Math.max(...postTaxProfits);
    }

    return stats;
}

export function migrateTimeFiltersToDurations(filters: Filters, nowSeconds: number): Filters {
    const THRESHOLD_SECONDS = 100_000_000;
    const convert = (v: number | null): number | null => {
        if (v == null || !Number.isFinite(v)) return null;
        if (v > THRESHOLD_SECONDS) return Math.max(0, nowSeconds - v);
        return v;
    };
    const next: Filters = structuredClone(filters);
    next.buyTime.min = convert(filters.buyTime.min);
    next.buyTime.max = convert(filters.buyTime.max);
    next.sellTime.min = convert(filters.sellTime.min);
    next.sellTime.max = convert(filters.sellTime.max);
    return next;
}
