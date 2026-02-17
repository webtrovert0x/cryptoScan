import React, { useEffect, useState } from 'react';
import { fetchMarketCoins, fetchGlobalData, fetchCoinsByIds } from './services/cryptoService';
import { Coin, GlobalData } from './types';
import { TopGainers } from './components/TopGainers';
import { Sparkline } from './components/Sparkline';
import { SearchBar } from './components/SearchBar';

// Formatter utilities
const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: value < 0.01 ? 6 : 2,
        maximumFractionDigits: value < 0.01 ? 8 : 2,
    }).format(value);
};

const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const App: React.FC = () => {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'watchlist'>('all');
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    
    // Load watchlist from local storage
    useEffect(() => {
        const saved = localStorage.getItem('crypto_watchlist');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWatchlist(new Set(parsed));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    // Save watchlist
    useEffect(() => {
        localStorage.setItem('crypto_watchlist', JSON.stringify(Array.from(watchlist)));
    }, [watchlist]);

    // Fetch data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [marketData, global] = await Promise.all([
                fetchMarketCoins(page),
                fetchGlobalData()
            ]);
            setCoins(marketData);
            setGlobalData(global);
            setLoading(false);
        };
        loadData();
        
        const interval = setInterval(loadData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [page]);

    const toggleWatchlist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setWatchlist(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSearchSelect = async (coinId: string) => {
        const found = coins.find(c => c.id === coinId);
        
        if (found) {
            // Coin exists in current list, just scroll to it
            document.getElementById(`row-${coinId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const row = document.getElementById(`row-${coinId}`);
            if (row) {
                row.classList.add('bg-primary/20');
                setTimeout(() => row.classList.remove('bg-primary/20'), 2000);
            }
        } else {
            // Fetch the specific coin data
            setLoading(true);
            const newCoins = await fetchCoinsByIds([coinId]);
            if (newCoins.length > 0) {
                const coinToAdd = newCoins[0];
                setCoins(prev => {
                    // Prevent duplicates
                    if (prev.find(c => c.id === coinToAdd.id)) return prev;
                    return [coinToAdd, ...prev];
                });
                
                // Reset filter to 'all' so we can see it
                setFilter('all');
                
                // Wait for render then scroll
                setTimeout(() => {
                    document.getElementById(`row-${coinId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const row = document.getElementById(`row-${coinId}`);
                    if (row) {
                        row.classList.add('bg-primary/20');
                        setTimeout(() => row.classList.remove('bg-primary/20'), 2000);
                    }
                }, 100);
            }
            setLoading(false);
        }
    };

    // Filter displayed coins
    const displayedCoins = coins.filter(c => {
        if (filter === 'watchlist') {
            return watchlist.has(c.id);
        }
        return true;
    });

    return (
        <>
            <header className="sticky top-0 z-40 glass-panel border-b-0 border-b-glass-border">
                <div className="px-6 py-4 flex items-center justify-between max-w-[1400px] mx-auto w-full">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">currency_bitcoin</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">CryptoScan</h1>
                    </div>
                    
                    {/* Global Stats - Hidden on mobile */}
                    <div className="hidden md:flex flex-1 justify-center px-8">
                        {globalData && globalData.total_market_cap && (
                            <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span>Market Cap:</span>
                                    <span className="text-white">
                                        {globalData.total_market_cap.usd 
                                            ? `${(globalData.total_market_cap.usd / 1e12).toFixed(2)}T` 
                                            : 'N/A'}
                                    </span>
                                    {globalData.market_cap_change_percentage_24h_usd !== null && (
                                        <span className={`text-xs flex items-center ${globalData.market_cap_change_percentage_24h_usd >= 0 ? 'text-primary' : 'text-red-400'}`}>
                                            <span className="material-symbols-outlined text-[14px]">
                                                {globalData.market_cap_change_percentage_24h_usd >= 0 ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                            {Math.abs(globalData.market_cap_change_percentage_24h_usd).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                <div className="h-4 w-px bg-white/10"></div>
                                <div className="flex items-center gap-2">
                                    <span>BTC Dom:</span>
                                    <span className="text-white">
                                        {globalData.market_cap_percentage?.btc 
                                            ? `${globalData.market_cap_percentage.btc.toFixed(1)}%` 
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 bg-cover bg-center cursor-pointer hover:border-primary/50 transition-colors" 
                             style={{backgroundImage: "url('https://picsum.photos/seed/crypto/200/200')"}}></div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-8">
                {/* Hero / Top Gainers */}
                <TopGainers coins={coins} />

                {/* Controls */}
                <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-30">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${filter === 'all' ? 'bg-primary text-black shadow-lg shadow-primary/20 hover:bg-primary/90' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
                        >
                            All Assets
                        </button>
                        <button 
                            onClick={() => setFilter('watchlist')}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-transparent ${filter === 'watchlist' ? 'bg-primary text-black font-bold' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                            Watchlist ({watchlist.size})
                        </button>
                    </div>

                    <SearchBar onSelect={handleSearchSelect} />
                </section>

                {/* Main Table */}
                <section className="glass-card rounded-xl overflow-hidden border border-white/10 relative z-10 min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-black/40 text-xs uppercase text-gray-500 font-semibold tracking-wider backdrop-blur-sm border-b border-white/5 sticky top-0 z-20">
                                <tr>
                                    <th scope="col" className="px-6 py-5 w-16 text-center"></th>
                                    <th scope="col" className="px-6 py-5 w-16 text-center">#</th>
                                    <th scope="col" className="px-6 py-5">Name</th>
                                    <th scope="col" className="px-6 py-5 text-right">Price</th>
                                    <th scope="col" className="px-6 py-5 text-right">24h Change</th>
                                    <th scope="col" className="px-6 py-5 text-right hidden md:table-cell">Market Cap</th>
                                    <th scope="col" className="px-6 py-5 text-right hidden lg:table-cell">Volume (24h)</th>
                                    <th scope="col" className="px-6 py-5 w-40 text-right hidden sm:table-cell">Last 7 Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && coins.length === 0 ? (
                                    // Loading Skeletons - only show if no coins are present
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-4 bg-white/10 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-6 bg-white/10 rounded mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="flex gap-3"><div className="h-9 w-9 rounded-full bg-white/10"></div><div className="space-y-2"><div className="h-4 w-20 bg-white/10 rounded"></div><div className="h-3 w-10 bg-white/10 rounded"></div></div></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-white/10 rounded ml-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 w-16 bg-white/10 rounded-full ml-auto"></div></td>
                                            <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-24 bg-white/10 rounded ml-auto"></div></td>
                                            <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-24 bg-white/10 rounded ml-auto"></div></td>
                                            <td className="px-6 py-4 hidden sm:table-cell"><div className="h-10 w-32 bg-white/10 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : displayedCoins.length > 0 ? (
                                    displayedCoins.map((coin) => {
                                        const priceChange = coin.price_change_percentage_24h;
                                        const isPositive = priceChange !== null ? priceChange >= 0 : true;
                                        const isWatchlisted = watchlist.has(coin.id);

                                        return (
                                            <tr 
                                                id={`row-${coin.id}`}
                                                key={coin.id} 
                                                className="hover:bg-white/5 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={(e) => toggleWatchlist(coin.id, e)}
                                                        className={`hover:scale-110 transition-transform ${isWatchlisted ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                                                    >
                                                        <span className={`material-symbols-outlined text-[20px] ${isWatchlisted ? 'fill-current' : ''}`}>star</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-gray-500">{coin.market_cap_rank ?? '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                                            <img src={coin.image} alt={coin.name} className="w-full h-full object-cover" loading="lazy" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white text-base group-hover:text-primary transition-colors">{coin.name}</span>
                                                            <span className="text-xs text-gray-500 font-medium bg-white/5 px-1.5 py-0.5 rounded w-fit mt-0.5">{coin.symbol.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-white tracking-wide text-[15px]">
                                                    {formatPrice(coin.current_price)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isPositive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {formatPercentage(coin.price_change_percentage_24h)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-white font-bold text-[15px] tracking-wide tabular-nums text-shadow-sm shadow-white/10 hidden md:table-cell">
                                                    {formatCurrency(coin.market_cap)}
                                                </td>
                                                <td className="px-6 py-4 text-right hidden lg:table-cell text-gray-300 font-medium tabular-nums">
                                                    {formatCurrency(coin.total_volume)}
                                                </td>
                                                <td className="px-6 py-4 text-right hidden sm:table-cell">
                                                    <div className="h-10 w-32 ml-auto">
                                                        <Sparkline 
                                                            data={coin.sparkline_in_7d?.price || []} 
                                                            isPositive={isPositive}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            {filter === 'watchlist' ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl opacity-50">stars</span>
                                                    <p>Your watchlist is empty.</p>
                                                    <button onClick={() => setFilter('all')} className="text-primary hover:underline text-sm">Browse all assets</button>
                                                </div>
                                            ) : 'No coins found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            <footer className="mt-8 border-t border-white/5 bg-black/40">
                <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-gray-500 text-sm">
                        © 2024 CryptoScan. Data provided by CoinGecko.
                    </div>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">API</a>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default App;