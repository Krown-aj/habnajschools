"use client";

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import type { News } from "@/types";

interface NewsCardProps {
    article: News;
    isPlaceholder?: boolean;
}

export function NewsCard({ article, isPlaceholder }: NewsCardProps) {
    const [isOpen, setIsOpen] = useState(false); // modal visible
    const [pinned, setPinned] = useState(false); // true when user clicked to pin open
    const containerRef = useRef<HTMLDivElement | null>(null);

    // prevent body scroll while modal is open (pinned or unpinned)
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isOpen]);

    // handle escape key to close
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setIsOpen(false);
                setPinned(false);
            }
        }
        if (isOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen]);

    // open on hover (temporary) unless pinned
    function handleMouseEnter() {
        if (!isPlaceholder && !pinned) setIsOpen(true);
    }
    function handleMouseLeave() {
        if (!pinned) setIsOpen(false);
    }

    // click toggles pinned modal (persistent)
    function handleClick(e: React.MouseEvent) {
        if (isPlaceholder) {
            e.preventDefault();
            return;
        }
        // if user clicked the card (not the link navigation), toggle pin
        // We still allow navigation via the Link anchor; clicking the card will normally navigate.
        // To support clicking the card to pin without navigating, we stop navigation when clicking on the card outer div.
        // However we keep Link so keyboard users can still navigate via Enter.
        setPinned((p) => {
            const next = !p;
            setIsOpen(next);
            return next;
        });
    }

    // close modal (unpin)
    function closeModal() {
        setIsOpen(false);
        setPinned(false);
    }

    return (
        <>
            {/* Wrap Link inside a div that listens for hover/click to open preview modal.
          We prevent pointer events when placeholder. */}
            <div
                ref={containerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                    // If user clicks an <a> inside (the Link), let it navigate.
                    // If they click the card background, toggle pin.
                    // To detect navigation click, we check if target is an anchor or inside an anchor.
                    const target = e.target as HTMLElement | null;
                    if (isPlaceholder) {
                        e.preventDefault();
                        return;
                    }
                    if (!target) return;
                    // find nearest anchor
                    const anchor = target.closest("a");
                    if (anchor) {
                        // allow navigation (do not toggle pin)
                        return;
                    }
                    // otherwise toggle pin
                    handleClick(e);
                }}
                className={`group block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 ${isPlaceholder ? "cursor-default" : "cursor-pointer"
                    }`}
            >
                <Link
                    href={isPlaceholder ? "#" : `/news/${article.id}`}
                    className="block"
                    // prevent Link navigation when pinned open (so clicking the card won't immediately navigate away)
                    onClick={(e) => {
                        if (pinned) e.preventDefault();
                    }}
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
                                    {article.title?.[0] ?? "N"}
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
                            <span>{article.readTime ? `${article.readTime} min read` : "Quick read"}</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                            {article.title}
                        </h3>

                        {article.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.excerpt}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>By {article.author}</span>
                            {article.publishedAt && (
                                <time dateTime={article.publishedAt}>
                                    {format(new Date(article.publishedAt), "MMM d, yyyy")}
                                </time>
                            )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Modal overlay */}
            {isOpen && (
                <div
                    aria-modal="true"
                    role="dialog"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Modal panel */}
                    <div
                        role="document"
                        className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start gap-4 p-4 border-b">
                            {article.image && (
                                <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    <Image src={article.image} alt={article.title} fill className="object-cover" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                    <span className="font-medium text-blue-600">{article.category}</span>
                                    <span>•</span>
                                    <span>{article.readTime ? `${article.readTime} min read` : "Quick read"}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
                                <div className="mt-1 text-xs text-gray-500">
                                    <span>By {article.author}</span>
                                    {article.publishedAt && (
                                        <>
                                            <span className="mx-2">•</span>
                                            <time dateTime={article.publishedAt}>
                                                {format(new Date(article.publishedAt), "MMM d, yyyy")}
                                            </time>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Close / Pin controls */}
                            <div className="flex items-center gap-2">
                                {/* Pin indicator */}
                                <button
                                    aria-pressed={pinned}
                                    title={pinned ? "Unpin modal" : "Pin modal"}
                                    onClick={() => setPinned((p) => !p)}
                                    className={`rounded px-2 py-1 text-xs border ${pinned ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                                >
                                    {pinned ? "Pinned" : "Pin"}
                                </button>

                                <button
                                    aria-label="Close article"
                                    onClick={closeModal}
                                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05A1 1 0 015.05 3.636L10 8.586z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-auto text-sm text-gray-700">
                            {/* If your article.content contains HTML and you want to render it, sanitize it first.
                  For plain text stored in content, render directly below. */}
                            <div className="prose mx-auto max-w-none">
                                {article.content ? (
                                    <div>{article.content}</div>
                                ) : (
                                    <div className="text-gray-500">No full content available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
