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
};
