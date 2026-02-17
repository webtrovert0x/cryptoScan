import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../types';
import { searchCoins } from '../services/cryptoService';

interface SearchBarProps {
    onSelect: (coinId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                const data = await searchCoins(query);
                setResults(data.slice(0, 5)); // Limit to 5
                setLoading(false);
                setIsOpen(true);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        setQuery('');
        setIsOpen(false);
        onSelect(id);
    };

    return (
        <div ref={wrapperRef} className="relative w-full lg:w-96 group z-50">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className={`material-symbols-outlined transition-colors ${loading ? 'text-primary animate-spin' : 'text-gray-400 group-focus-within:text-primary'}`}>
                    {loading ? 'progress_activity' : 'search'}
                </span>
            </div>
            <input 
                type="text" 
                className="peer block w-full rounded-xl border border-white/10 bg-glass-input py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Search coins (e.g. BTC, Pepe)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if(results.length > 0) setIsOpen(true); }}
            />
            
            {/* Dropdown */}
            <div className={`absolute top-full mt-2 left-0 right-0 bg-[#0f1920] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                {results.length > 0 ? (
                    <div className="p-2">
                        <div className="text-[10px] uppercase font-bold text-gray-500 px-3 py-2">Best Matches</div>
                        {results.map((coin) => (
                            <button 
                                key={coin.id}
                                onClick={() => handleSelect(coin.id)}
                                className="flex w-full items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group/item text-left"
                            >
                                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                                    <img src={coin.thumb} alt={coin.symbol} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white group-hover/item:text-primary transition-colors text-sm">{coin.name}</span>
                                        <span className="text-xs font-mono text-gray-400">#{coin.market_cap_rank}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">{coin.symbol}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    query.length >= 2 && !loading && (
                        <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                    )
                )}
            </div>
        </div>
    );
};