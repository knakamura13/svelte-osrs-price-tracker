import type { Filters, NumericFilterKey, PriceRow, SortKey, FilterStats } from '$lib/types';
import { calculateBreakEvenPrice, calculatePostTaxProfit } from './tax';

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
        },
        dailyLow: {
            min: isFiniteNumber(f.dailyLow.min) ? f.dailyLow.min : null,
            max: isFiniteNumber(f.dailyLow.max) ? f.dailyLow.max : null
        },
        dailyHigh: {
            min: isFiniteNumber(f.dailyHigh.min) ? f.dailyHigh.min : null,
            max: isFiniteNumber(f.dailyHigh.max) ? f.dailyHigh.max : null
        },
        averageBuy: {
            min: isFiniteNumber(f.averageBuy.min) ? f.averageBuy.min : null,
            max: isFiniteNumber(f.averageBuy.max) ? f.averageBuy.max : null
        },
        averageSell: {
            min: isFiniteNumber(f.averageSell.min) ? f.averageSell.min : null,
            max: isFiniteNumber(f.averageSell.max) ? f.averageSell.max : null
        },
        potentialProfit: {
            min: isFiniteNumber(f.potentialProfit.min) ? f.potentialProfit.min : null,
            max: isFiniteNumber(f.potentialProfit.max) ? f.potentialProfit.max : null
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

        const breakEvenPrice = calculateBreakEvenPrice(row.sellPrice, row.id);
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

        const postTaxProfit = calculatePostTaxProfit(row.buyPrice, row.sellPrice, row.id);
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
            va = calculateBreakEvenPrice(a.sellPrice, a.id);
            vb = calculateBreakEvenPrice(b.sellPrice, b.id);
        } else if (key === 'postTaxProfit') {
            va = calculatePostTaxProfit(a.buyPrice, a.sellPrice, a.id);
            vb = calculatePostTaxProfit(b.buyPrice, b.sellPrice, b.id);
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
        dailyLow: { min: null, max: null },
        dailyHigh: { min: null, max: null },
        averageBuy: { min: null, max: null },
        averageSell: { min: null, max: null },
        potentialProfit: { min: null, max: null },
        breakEvenPrice: { min: null, max: null },
        postTaxProfit: { min: null, max: null }
    };

    if (allRows.length === 0) return stats;

    const buyLimits = pickNumbers(allRows.map((r) => r.buyLimit));
    const buyPrices = pickNumbers(allRows.map((r) => r.buyPrice));
    const sellPrices = pickNumbers(allRows.map((r) => r.sellPrice));
    const margins = pickNumbers(allRows.map((r) => r.margin));
    const volumes = pickNumbers(allRows.map((r) => r.dailyVolume ?? null));
    const dailyLows = pickNumbers(allRows.map((r) => r.dailyLow ?? null));
    const dailyHighs = pickNumbers(allRows.map((r) => r.dailyHigh ?? null));
    const averageBuys = pickNumbers(allRows.map((r) => r.averageBuy ?? null));
    const averageSells = pickNumbers(allRows.map((r) => r.averageSell ?? null));

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
    if (dailyLows.length) {
        stats.dailyLow.min = Math.min(...dailyLows);
        stats.dailyLow.max = Math.max(...dailyLows);
    }
    if (dailyHighs.length) {
        stats.dailyHigh.min = Math.min(...dailyHighs);
        stats.dailyHigh.max = Math.max(...dailyHighs);
    }
    if (averageBuys.length) {
        stats.averageBuy.min = Math.min(...averageBuys);
        stats.averageBuy.max = Math.max(...averageBuys);
    }
    if (averageSells.length) {
        stats.averageSell.min = Math.min(...averageSells);
        stats.averageSell.max = Math.max(...averageSells);
    }

    // Calculate potential profit (buyLimit × postTaxProfit)
    const potentialProfits: number[] = [];
    for (const row of allRows) {
        if (row.buyLimit !== null && row.buyLimit !== undefined && row.buyLimit > 0) {
            const postTax = calculatePostTaxProfit(row.buyPrice, row.sellPrice, row.id);
            if (postTax !== null) {
                potentialProfits.push(row.buyLimit * postTax);
            }
        }
    }
    if (potentialProfits.length) {
        stats.potentialProfit.min = Math.min(...potentialProfits);
        stats.potentialProfit.max = Math.max(...potentialProfits);
    }

    const breakEvenPrices: number[] = [];
    const postTaxProfits: number[] = [];
    for (const row of allRows) {
        const breakEven = calculateBreakEvenPrice(row.sellPrice, row.id);
        if (breakEven !== null) breakEvenPrices.push(breakEven);

        const postTax = calculatePostTaxProfit(row.buyPrice, row.sellPrice, row.id);
        if (postTax !== null) postTaxProfits.push(postTax);
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
