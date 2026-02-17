import { Coin, GlobalData, SearchResult } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache mechanism to avoid hitting rate limits too often during dev
let cachedCoins: Coin[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export const fetchMarketCoins = async (page = 1, perPage = 100, useCache = true): Promise<Coin[]> => {
  const now = Date.now();
  if (useCache && cachedCoins && (now - lastFetchTime < CACHE_DURATION) && page === 1) {
    return cachedCoins;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h`
    );
    
    if (!response.ok) {
        if (response.status === 429) {
            console.warn("Rate limit hit, using fallback/cached data if available.");
            if (cachedCoins) return cachedCoins;
        }
        throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    if (page === 1) {
        cachedCoins = data;
        lastFetchTime = now;
    }
    return data;
  } catch (error) {
    console.warn("API Warning (Market Data):", error);
    if (cachedCoins) return cachedCoins;
    return [];
  }
};

export const fetchCoinsByIds = async (ids: string[]): Promise<Coin[]> => {
    if (ids.length === 0) return [];
    try {
        const response = await fetch(
            `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
        );
        if (!response.ok) throw new Error('Failed to fetch specific coins');
        return await response.json();
    } catch (error) {
        console.warn("API Warning (Specific Coins):", error);
        return [];
    }
};

export const searchCoins = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`${BASE_URL}/search?query=${query}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        return data.coins || [];
    } catch (error) {
        console.warn("API Warning (Search):", error);
        return [];
    }
};

export const fetchGlobalData = async (): Promise<GlobalData | null> => {
    try {
        const response = await fetch(`${BASE_URL}/global`);
        if (!response.ok) throw new Error('Failed to fetch global data');
        const data = await response.json();
        return data.data;
    } catch (error) {
        // Silently fail for global data as it's secondary
        return null;
    }
}