'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import type { News } from '@/types';

interface NewsCardProps {
    article: News;
    isPlaceholder?: boolean;
}

export function NewsCard({ article, isPlaceholder }: NewsCardProps) {
    const [expanded, setExpanded] = useState(false);

    const hasFullContent =
        article.content && article.content.trim() !== article.excerpt?.trim();

    return (
        <article className="rounded-xl border bg-white shadow-sm hover:shadow-md transition">
            <Link href={isPlaceholder ? '#' : `/news/${article.id}`}>
                <div className="relative aspect-video bg-gray-100">
                    {article.image && (
                        <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover rounded-t-xl"
                        />
                    )}
                </div>
            </Link>

            <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="text-blue-600 font-medium">
                        {article.category}
                    </span>
                    <span>•</span>
                    <span>{article.readTime ?? 2} min read</span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-gray-600 hover:text-blue-600">{article.title}</h3>

                <p className="text-sm text-gray-700 text-justify whitespace-pre-line">
                    {expanded ? article.content : article.excerpt}
                </p>

                {hasFullContent && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                        {expanded ? 'Show less' : 'Read more'}
                    </button>
                )}

                <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                    <span>By {article.author}</span>
                    {article.publishedAt && (
                        <time dateTime={article.publishedAt}>
                            {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </time>
                    )}
                </div>
            </div>
        </article>
    );
}
