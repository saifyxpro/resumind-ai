"use client";

import { useState, useEffect, useRef } from "react";

interface LogoObj {
    name: string;
    shortname: string;
    url: string;
    files?: string[];
}

interface CompanyInputProps {
    value?: string;
    onChange?: (value: string) => void; // Optional for controlled usage
    name?: string; // For form submission
    className?: string;
    required?: boolean;
}

export default function CompanyInput({ value: propValue, onChange, name = "company-name", className = "", required = false }: CompanyInputProps) {
    const [query, setQuery] = useState(propValue || "");
    const [suggestions, setSuggestions] = useState<LogoObj[]>([]);
    const [filtered, setFiltered] = useState<LogoObj[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Fetch Gilbarbara Logos on mount
    useEffect(() => {
        const fetchIcons = async () => {
            try {
                const res = await fetch("https://raw.githubusercontent.com/gilbarbara/logos/master/logos.json");
                if (!res.ok) throw new Error("Failed to load icons");
                const data: LogoObj[] = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error("Could not load company list", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIcons();
    }, []);

    // Filter logic
    useEffect(() => {
        if (!query) {
            setFiltered([]);
            return;
        }
        const lower = query.toLowerCase();
        const matches = suggestions
            .filter(item =>
                item.name.toLowerCase().includes(lower)
            )
            .slice(0, 5); // Limit to top 5
        setFiltered(matches);
    }, [query, suggestions]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [selectedItem, setSelectedItem] = useState<LogoObj | null>(null);

    // Sync query with suggestions to find selected item
    useEffect(() => {
        if (!query) {
            setSelectedItem(null);
            return;
        }
        const lower = query.toLowerCase();
        // Exact match or close enough to be confident? 
        // For now, let's do exact match on name to show the icon, 
        // effectively confirming "we know this company"
        const found = suggestions.find(s => s.name.toLowerCase() === lower);
        setSelectedItem(found || null);
    }, [query, suggestions]);

    const handleSelect = (item: LogoObj) => {
        setQuery(item.name);
        if (onChange) onChange(item.name);
        setIsOpen(false);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setIsOpen(true);
        if (onChange) onChange(val);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                {/* Visual Icon in Input */}
                {selectedItem && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center pointer-events-none z-10 animate-fade-in">
                        <img
                            src={`https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/${(selectedItem.files && selectedItem.files[0]) ? selectedItem.files[0] : (selectedItem.shortname + '.svg')}`}
                            alt={selectedItem.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                <input
                    type="text"
                    name={name}
                    id={name}
                    value={query}
                    onChange={handleInput}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Ex: Google, Netlify, Oracle..."
                    className={`w-full bg-white border border-slate-200 rounded-xl py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10 ${selectedItem ? '' : 'px-4'}`}
                    style={{ paddingLeft: selectedItem ? '4rem' : undefined }}
                    required={required}
                    autoComplete="off"
                />

                {/* Icon Loading / Search Indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    {isLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-[50] animate-fade-up">
                    <div className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-50 border-b border-slate-100">
                        Suggested Companies
                    </div>
                    {filtered.map(item => (
                        <button
                            key={item.shortname}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
                        >
                            <div
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 group-hover:border-primary/30 group-hover:shadow-sm transition-all"
                            >
                                <img
                                    src={`https://cdn.jsdelivr.net/gh/gilbarbara/logos@master/logos/${(item.files && item.files[0]) ? item.files[0] : (item.shortname + '.svg')}`}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.opacity = '0.3';
                                    }}
                                />

                            </div>
                            <div>
                                <div className="font-semibold text-slate-700 group-hover:text-primary">
                                    {item.name}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
