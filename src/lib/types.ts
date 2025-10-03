export type ItemMapping = {
    id: number;
    name: string;
    icon?: string;
    members: boolean;
    limit?: number | null;
    examine?: string;
};

export type LatestEntry = {
    high: number | null;
    highTime: number | null;
    low: number | null;
    lowTime: number | null;
};

export type LatestResponse = Record<string, LatestEntry>;

export type PriceRow = {
    id: number;
    name: string;
    icon?: string;
    members: boolean;
    buyLimit: number | null;
    buyPrice: number | null;
    buyTime: number | null;
    sellPrice: number | null;
    sellTime: number | null;
    margin: number | null;
    dailyVolume?: number | null;
    examine?: string;
    wikiUrl?: string;
};

export type Volume24hEntry = {
    avgHighPrice: number | null;
    highPriceVolume: number | null;
    avgLowPrice: number | null;
    lowPriceVolume: number | null;
};

export type Volume24hResponse = Record<string, Volume24hEntry>;

// Filters and sorting
export type NumericFilter = { min: number | null; max: number | null };

export type Filters = {
    buyLimit: NumericFilter;
    buyPrice: NumericFilter;
    buyTime: NumericFilter; // durations in seconds
    sellPrice: NumericFilter;
    sellTime: NumericFilter; // durations in seconds
    breakEvenPrice: NumericFilter;
    margin: NumericFilter;
    postTaxProfit: NumericFilter;
    dailyVolume: NumericFilter;
};

export type SortKey =
    | 'name'
    | 'buyLimit'
    | 'buyPrice'
    | 'sellPrice'
    | 'margin'
    | 'breakEvenPrice'
    | 'postTaxProfit'
    | 'dailyVolume'
    | 'buyTime'
    | 'sellTime';

export type NumericFilterKey = Exclude<keyof Filters, 'buyTime' | 'sellTime'>;

export type FilterStats = {
    buyLimit: NumericFilter;
    buyPrice: NumericFilter;
    sellPrice: NumericFilter;
    margin: NumericFilter;
    dailyVolume: NumericFilter;
    breakEvenPrice: NumericFilter;
    postTaxProfit: NumericFilter;
};

// Error handling types
export type ErrorState = {
    message: string;
    count: number;
    lastFailedAt: number | null;
};

// Time-series types for price charts
export type TimeseriesDataPoint = {
    timestamp: number;
    avgHighPrice: number | null;
    avgLowPrice: number | null;
    highPriceVolume: number | null;
    lowPriceVolume: number | null;
};

export type TimeseriesResponse = {
    data: TimeseriesDataPoint[];
};
