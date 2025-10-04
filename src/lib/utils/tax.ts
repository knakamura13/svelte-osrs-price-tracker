/**
 * Grand Exchange tax utilities
 *
 * OSRS GE tax rules (as of May 29, 2025):
 * - Tax rate is 2% on the sale price
 * - Tax rounds DOWN to the nearest whole number (floor)
 * - Minimum tax is 1 gp (items below ceil(1/TAX_RATE) gp have no tax)
 * - Maximum tax is capped at 5,000,000 gp per item
 * - Certain items are exempt from tax (see TAX_EXEMPT_ITEMS)
 *
 * Note: The tax is deducted from what the seller receives, not added to what the buyer pays.
 */

const TAX_RATE = 0.02;
const TAX_CAP = 5_000_000;

/**
 * Minimum price at which tax applies (where floor(price * TAX_RATE) >= 1)
 * Calculated as: ceil(1 / TAX_RATE)
 */
const MIN_PRICE_FOR_TAX = Math.ceil(1 / TAX_RATE);

/**
 * Items exempt from GE tax
 * Includes: Old school bonds, low level combat consumables, low level food, teleport items, and basic tools
 */
export const TAX_EXEMPT_ITEMS = new Set<number>([
    // Old school bond
    13190,

    // Energy potions (all doses)
    3008,
    3010,
    3012,
    3014,

    // Low level combat consumables
    882, // Bronze arrow
    806, // Bronze dart
    884, // Iron arrow
    807, // Iron dart
    558, // Mind rune
    886, // Steel arrow
    808, // Steel dart

    // Low level food
    365, // Bass
    2309, // Bread
    1891, // Cake
    2140, // Cooked chicken
    2142, // Cooked meat
    347, // Herring
    379, // Lobster
    355, // Mackerel
    2327, // Meat pie
    351, // Pike
    329, // Salmon
    315, // Shrimps
    361, // Tuna

    // Teleport items
    8011, // Ardougne teleport (tablet)
    8010, // Camelot teleport (tablet)
    28824, // Civitas illa fortis teleport
    8009, // Falador teleport (tablet)
    3853, // Games necklace(8)
    28790, // Kourend castle teleport (tablet)
    8008, // Lumbridge teleport (tablet)
    2552, // Ring of dueling(8)
    8013, // Teleport to house (tablet)
    8007, // Varrock teleport (tablet)

    // Tools
    1755, // Chisel
    5325, // Gardening trowel
    1785, // Glassblowing pipe
    2347, // Hammer
    1733, // Needle
    233, // Pestle and mortar
    5341, // Rake
    8794, // Saw
    5329, // Secateurs
    5343, // Seed dibber
    1735, // Shears
    952, // Spade
    5331 // Watering can
]);

/**
 * Calculate the actual GE tax for a given sale price
 * Tax is 2% rounded down (floor), capped at 5M gp
 * @param salePrice The price at which the item is sold
 * @param itemId Optional item ID to check for tax exemption
 * @returns The tax amount in gp
 */
export function calculateGeTax(salePrice: number, itemId?: number): number {
    // Check if item is exempt from tax
    if (itemId !== undefined && TAX_EXEMPT_ITEMS.has(itemId)) {
        return 0;
    }

    const calculatedTax = Math.floor(salePrice * TAX_RATE);
    return Math.min(calculatedTax, TAX_CAP);
}

/**
 * Calculate the break-even sell price after GE tax
 * This is the minimum price you need to sell at to recover your cost
 *
 * We need to find minimum P such that: P - floor(P * 0.02) >= cost
 *
 * @param cost The amount you paid to acquire the item
 * @param itemId Optional item ID to check for tax exemption
 * @returns The minimum sell price needed to break even (null if cost is null)
 */
export function calculateBreakEvenPrice(cost: number | null, itemId?: number): number | null {
    if (cost === null) return null;

    // Check if item is exempt from tax
    if (itemId !== undefined && TAX_EXEMPT_ITEMS.has(itemId)) {
        return cost; // No tax, so break-even = cost
    }

    // For very cheap items (cost < MIN_PRICE_FOR_TAX), no tax applies, so break-even = cost
    if (cost < MIN_PRICE_FOR_TAX) {
        return cost;
    }

    // For items that would hit the tax cap (250M+)
    // At 250M: tax = 5M, so you receive 245M
    // If cost >= 245M, you need to account for the cap
    const priceWhereCapApplies = TAX_CAP / TAX_RATE; // 250,000,000
    if (cost >= priceWhereCapApplies - TAX_CAP) {
        return cost + TAX_CAP;
    }

    // Normal case: find minimum P where P - floor(P * 0.02) >= cost
    // Start with P = ceil(cost / 0.98) and verify
    const estimatedPrice = Math.ceil(cost / (1 - TAX_RATE));
    const taxAtEstimate = Math.floor(estimatedPrice * TAX_RATE);
    const actualReceived = estimatedPrice - taxAtEstimate;

    // If the estimated price doesn't cover the cost due to floor rounding, increment
    if (actualReceived < cost) {
        return estimatedPrice + 1;
    }

    return estimatedPrice;
}

/**
 * Calculate post-tax profit from flipping
 * Buy at sellPrice, sell at buyPrice, accounting for GE tax on the sale
 * @param buyPrice The price you can sell at (usually the higher "buy" price)
 * @param sellPrice The price you can buy at (usually the lower "sell" price)
 * @param itemId Optional item ID to check for tax exemption
 * @returns The profit after tax (null if either price is null)
 */
export function calculatePostTaxProfit(
    buyPrice: number | null,
    sellPrice: number | null,
    itemId?: number
): number | null {
    if (buyPrice === null || sellPrice === null) return null;

    const tax = calculateGeTax(buyPrice, itemId);
    return Math.floor(buyPrice - tax - sellPrice);
}

/**
 * Get a human-readable description of the tax for a given sale price
 * Useful for tooltips and help text
 * @param salePrice The price at which the item is sold
 * @param itemId Optional item ID to check for tax exemption
 * @returns A description of the tax calculation
 */
export function getTaxDescription(salePrice: number, itemId?: number): string {
    // Check if item is exempt
    if (itemId !== undefined && TAX_EXEMPT_ITEMS.has(itemId)) {
        return 'No tax (exempt item)';
    }

    const calculatedTax = Math.floor(salePrice * TAX_RATE);

    if (calculatedTax === 0) {
        return `No tax (price below ${MIN_PRICE_FOR_TAX} gp)`;
    }

    if (calculatedTax > TAX_CAP) {
        return `${TAX_CAP.toLocaleString()} gp (capped at 5M)`;
    }

    return `${calculatedTax.toLocaleString()} gp (2% tax)`;
}
