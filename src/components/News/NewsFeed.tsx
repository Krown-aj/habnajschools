'use client';

import { useState, useMemo } from 'react';
import { useNews } from '@/hooks/useNews';
import { PLACEHOLDER_NEWS } from '@/lib/data/placeholderNews';
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

    const displayNews = news.length > 0 ? news : PLACEHOLDER_NEWS;
    const isPlaceholder = news.length === 0;

    const paginated = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return displayNews.slice(start, start + itemsPerPage);
    }, [displayNews, page, itemsPerPage]);

    const totalPages = Math.ceil(displayNews.length / itemsPerPage);

    return (
        <div className={`bg-white max-w-7xl mx-auto ${className}`}>
            {/* Filters */}
            {showFilters && (
                <div className="mb-8 p-4 bg-gray-100 text-gray-400 rounded-xl border flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filters
                    </div>

                    <select
                        value={filters.category || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, category: e.target.value || undefined })
                        }
                        className="px-3 py-1.5 text-sm border rounded-lg"
                    >
                        <option value="">All Categories</option>
                        <option value="EVENT">Event</option>
                        <option value="ANNOUNCEMENT">Announcement</option>
                        <option value="OTHER">Other</option>
                    </select>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={filters.featured || false}
                            onChange={(e) =>
                                setFilters({ ...filters, featured: e.target.checked || undefined })
                            }
                        />
                        Featured only
                    </label>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <NewsCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && displayNews.length === 0 && (
                <div className="text-center py-12 text-red-600">
                    No news found. Please try again later.
                </div>
            )}

            {/* News */}
            {!isLoading && (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginated.map((article) => (
                            <NewsCard
                                key={article.id}
                                article={article}
                                isPlaceholder={isPlaceholder}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border rounded disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-3 py-1.5 rounded ${p === page ? 'bg-blue-600 text-white' : 'border'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 border rounded disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
