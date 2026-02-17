import React from 'react';
import { Coin } from '../types';
import { Sparkline } from './Sparkline';

interface TopGainersProps {
    coins: Coin[];
}

export const TopGainers: React.FC<TopGainersProps> = ({ coins }) => {
    // Filter out coins with null data first, then sort
    const validCoins = coins.filter(c => 
        c.price_change_percentage_24h !== null && 
        c.current_price !== null
    );

    // Sort by price change percentage desc and take top 3
    const topGainers = [...validCoins]
        .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
        .slice(0, 3);

    // If API fails or is empty, provide skeletons or hide
    if (topGainers.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card rounded-xl p-5 h-40 bg-white/5"></div>
                ))}
            </div>
        );
    }

    return (
        <section>
            <div className="flex items-center gap-2 mb-4 px-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                <h2 className="text-xl font-bold text-white">Top Gainers (24h)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topGainers.map((coin) => {
                    const priceChange = coin.price_change_percentage_24h || 0;
                    const price = coin.current_price || 0;
                    
                    return (
                        <div key={coin.id} className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl">
                                    {priceChange > 20 ? 'rocket_launch' : 'trending_up'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                    <img src={coin.image} alt={`${coin.symbol} logo`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight text-white">{coin.symbol.toUpperCase()}</h3>
                                    <span className="text-xs text-gray-400 truncate max-w-[100px] block">{coin.name}</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between relative z-10">
                                <div>
                                    <p className="text-2xl font-bold text-white tracking-tight">
                                        ${price < 0.01 ? price.toFixed(8) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-primary font-medium text-sm flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                        {priceChange.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="w-24 h-12">
                                    <Sparkline 
                                        data={coin.sparkline_in_7d?.price || []} 
                                        isPositive={true}
                                        color="#13ec5b" 
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};