import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import type { News } from '@/types';

interface NewsCardProps {
    article: News;
    isPlaceholder?: boolean;
}

export function NewsCard({ article, isPlaceholder }: NewsCardProps) {
    return (
        <Link
            href={isPlaceholder ? '#' : `/news/${article.id}`}
            className={`group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 ${isPlaceholder ? 'cursor-default' : 'cursor-pointer'
                }`}
        >
            <div className="relative aspect-video bg-gray-100">
                {article.image ? (
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                        <span className="text-4xl font-bold text-blue-600 opacity-20">
                            {article.title[0]}
                        </span>
                    </div>
                )}
                {article.featured && (
                    <span className="absolute top-3 right-3 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full">
                        Featured
                    </span>
                )}
            </div>

            <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="font-medium text-blue-600">{article.category}</span>
                    <span>•</span>
                    <span>{article.readTime ? `${article.readTime} min read` : 'Quick read'}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                    {article.title}
                </h3>

                {article.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {article.excerpt}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {article.author}</span>
                    {article.publishedAt && (
                        <time dateTime={article.publishedAt}>
                            {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </time>
                    )}
                </div>
            </div>
        </Link>
    );
}