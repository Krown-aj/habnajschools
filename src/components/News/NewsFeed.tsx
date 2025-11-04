'use client';

import { useState, useMemo } from 'react';
import { useNews } from '@/hooks/useNews';
import { PLACEHOLDER_NEWS } from '@/lib/data/placeholderNews';
import type { News } from '@/types';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { NewsCardSkeleton } from './NewsCardSkeleton';

interface NewsFeedProps {
    initialFilters?: {
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        category?: string;
        featured?: boolean;
    };
    itemsPerPage?: number;
    showFilters?: boolean;
    className?: string;
}

export default function NewsFeed({
    initialFilters = { status: 'PUBLISHED' },
    itemsPerPage = 6,
    showFilters = true,
    className = '',
}: NewsFeedProps) {
    const [filters, setFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);

    const { data: news = [], isLoading, error } = useNews(filters);

    // Use placeholder if no real data
    const displayNews = news.length > 0 ? news : PLACEHOLDER_NEWS;

    // Pagination
    const paginated = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return displayNews.slice(start, start + itemsPerPage);
    }, [displayNews, page, itemsPerPage]);

    const totalPages = Math.ceil(displayNews.length / itemsPerPage);

    const isPlaceholder = news.length === 0;

    return (
        <div className={`bg-white max-w-7xl mx-auto ${className}`}>
            {/* Filters */}
            {showFilters && (
                <div className="mb-8 p-4 bg-gray-100 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center text-gray-600">
                    <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                        <Filter className="w-4 h-4" />
                        Filters:
                    </div>

                    <select
                        value={filters.category || ''}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ACHIEVEMENT">Achievement</option>
                        <option value="">All Categories</option>
                        <option value="COMMUNITY">Community</option>
                        <option value="EDUCATION">Education</option>
                        <option value="FACILITIES">Facilities</option>
                        <option value="GENERAL">General</option>
                        <option value="SPORTS">Sports</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={filters.featured || false}
                            onChange={(e) => setFilters({ ...filters, featured: e.target.checked || undefined })}
                            className="rounded"
                        />
                        Featured only
                    </label>

                    {Object.keys(filters).length > 1 && (
                        <button
                            onClick={() => {
                                setFilters({ status: 'PUBLISHED' });
                                setPage(1);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <NewsCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="bg-white text-gray-800 text-center py-12 text-red-600 border border-gray-200 rounded-md shadow-md">
                    No news found! Please try again later.
                </div>
            )}

            {/* News Grid */}
            {!isLoading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginated.map((article) => (
                            <NewsCard key={article.id} article={article} isPlaceholder={isPlaceholder} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${p === page
                                            ? 'bg-blue-600 text-white'
                                            : 'border hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* No results */}
            {!isLoading && displayNews.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">No news found matching your filters.</p>
                </div>
            )}
        </div>
    );
}