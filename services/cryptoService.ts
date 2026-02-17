import { Coin, GlobalData, SearchResult } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache mechanism to avoid hitting rate limits too often during dev
let cachedCoins: Coin[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

// Fallback data prevents "blank screen" when API limit is hit
const FALLBACK_COINS: Coin[] = [
    {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        current_price: 64231,
        market_cap: 1264300000000,
        market_cap_rank: 1,
        fully_diluted_valuation: 1350000000000,
        total_volume: 35000000000,
        high_24h: 65000,
        low_24h: 63000,
        price_change_24h: 1200,
        price_change_percentage_24h: 1.8,
        market_cap_change_24h: 20000000000,
        market_cap_change_percentage_24h: 1.6,
        circulating_supply: 19600000,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: 73750,
        ath_change_percentage: -12.5,
        ath_date: "2024-03-14T07:10:36.635Z",
        atl: 67.81,
        atl_change_percentage: 95000,
        atl_date: "2013-07-06T00:00:00.000Z",
        roi: null,
        last_updated: new Date().toISOString(),
        sparkline_in_7d: { price: [60000, 61000, 59000, 62000, 63000, 64000, 64231] }
    },
    {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        current_price: 3450,
        market_cap: 415000000000,
        market_cap_rank: 2,
        fully_diluted_valuation: 415000000000,
        total_volume: 15000000000,
        high_24h: 3500,
        low_24h: 3350,
        price_change_24h: 85,
        price_change_percentage_24h: 2.5,
        market_cap_change_24h: 10000000000,
        market_cap_change_percentage_24h: 2.4,
        circulating_supply: 120000000,
        total_supply: 120000000,
        max_supply: null,
        ath: 4891,
        ath_change_percentage: -29.5,
        ath_date: "2021-11-16T00:00:00.000Z",
        atl: 0.42,
        atl_change_percentage: 820000,
        atl_date: "2015-10-21T00:00:00.000Z",
        roi: { times: 85, currency: "usd", percentage: 8500 },
        last_updated: new Date().toISOString(),
        sparkline_in_7d: { price: [3200, 3300, 3250, 3400, 3380, 3420, 3450] }
    },
    {
        id: "solana",
        symbol: "sol",
        name: "Solana",
        image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
        current_price: 145,
        market_cap: 65000000000,
        market_cap_rank: 5,
        fully_diluted_valuation: null,
        total_volume: 4000000000,
        high_24h: 150,
        low_24h: 140,
        price_change_24h: 5,
        price_change_percentage_24h: 3.5,
        market_cap_change_24h: 2000000000,
        market_cap_change_percentage_24h: 3.2,
        circulating_supply: 443000000,
        total_supply: 570000000,
        max_supply: null,
        ath: 260,
        ath_change_percentage: -44,
        ath_date: "2021-11-06T00:00:00.000Z",
        atl: 0.5,
        atl_change_percentage: 29000,
        atl_date: "2020-05-11T00:00:00.000Z",
        roi: null,
        last_updated: new Date().toISOString(),
        sparkline_in_7d: { price: [130, 135, 132, 140, 142, 144, 145] }
    },
    {
        id: "binancecoin",
        symbol: "bnb",
        name: "BNB",
        image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
        current_price: 590,
        market_cap: 87000000000,
        market_cap_rank: 4,
        fully_diluted_valuation: 87000000000,
        total_volume: 1200000000,
        high_24h: 600,
        low_24h: 580,
        price_change_24h: -5,
        price_change_percentage_24h: -0.8,
        market_cap_change_24h: -500000000,
        market_cap_change_percentage_24h: -0.6,
        circulating_supply: 147000000,
        total_supply: 147000000,
        max_supply: 200000000,
        ath: 690,
        ath_change_percentage: -14,
        ath_date: "2021-05-10T00:00:00.000Z",
        atl: 0.09,
        atl_change_percentage: 650000,
        atl_date: "2017-10-19T00:00:00.000Z",
        roi: null,
        last_updated: new Date().toISOString(),
        sparkline_in_7d: { price: [580, 585, 590, 595, 600, 595, 590] }
    },
    {
        id: "ripple",
        symbol: "xrp",
        name: "XRP",
        image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
        current_price: 0.62,
        market_cap: 34000000000,
        market_cap_rank: 6,
        fully_diluted_valuation: 62000000000,
        total_volume: 1500000000,
        high_24h: 0.64,
        low_24h: 0.61,
        price_change_24h: 0.01,
        price_change_percentage_24h: 1.6,
        market_cap_change_24h: 500000000,
        market_cap_change_percentage_24h: 1.5,
        circulating_supply: 54000000000,
        total_supply: 99987000000,
        max_supply: 100000000000,
        ath: 3.84,
        ath_change_percentage: -83,
        ath_date: "2018-01-04T00:00:00.000Z",
        atl: 0.002,
        atl_change_percentage: 30000,
        atl_date: "2014-05-22T00:00:00.000Z",
        roi: null,
        last_updated: new Date().toISOString(),
        sparkline_in_7d: { price: [0.60, 0.61, 0.60, 0.62, 0.63, 0.62, 0.62] }
    }
];

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
            console.warn("Rate limit hit, using fallback data.");
            // If we have no cache, return fallback data immediately so UI isn't empty
            if (!cachedCoins) {
                cachedCoins = FALLBACK_COINS;
                lastFetchTime = now;
                return FALLBACK_COINS;
            }
            return cachedCoins;
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
    console.warn("API Error (Market Data):", error);
    // Always return fallback data if everything fails so user sees something
    if (cachedCoins) return cachedCoins;
    return FALLBACK_COINS;
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