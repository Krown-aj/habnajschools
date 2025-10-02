"use client";

import React, { useMemo, useState, memo, useEffect } from "react";
import Image from "next/image";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { FaCalendarAlt } from "react-icons/fa";
import { images } from "@/constants";

const PAGE_TITLE = "School News & Updates";
const HERO_SUBTITLE =
    "Stay informed about events, announcements, and sanitations at Habnaj International Schools.";

const NEWS_ITEMS = [
    {
        id: 1,
        type: "Event",
        title: "Annual Mathematics Day 2025",
        date: "March 15, 2025",
        description:
            "Join us for our Annual Mathematics Day, where students from the Mathematics Club will compete in exciting quiz competitions. Awards will be presented to top performers, celebrating excellence in mathematics.",
        image: (images as any).jss2,
        link: "/events/math-day-2025",
    },
    {
        id: 2,
        type: "Announcement",
        title: "New Computer Room Opening",
        date: "September 10, 2025",
        description:
            "We are thrilled to announce the opening of our state-of-the-art computer room, equipped with modern computers to enhance ICT learning for all students.",
        image: (images as any).computerroom2,
        link: "/announcements/new-computer-room",
    },
    {
        id: 3,
        type: "Sanitation",
        title: "Sanitation Club",
        date: "October 5, 2025",
        description:
            "The Sanitation Club is organizing a school-wide clean-up to promote environmental awareness. All students are encouraged to participate in this community-building initiative.",
        image: (images as any).student8,
        link: "/drives/clean-up-2025",
    },
    {
        id: 4,
        type: "Event",
        title: "Science Day Exhibition",
        date: "November 12, 2025",
        description:
            "Our Science and Technology Club will host the annual Science Day, featuring student-led experiments and projects. Join us to celebrate innovation and discovery!",
        image: (images as any).jss,
        link: "/events/science-day-2025",
    },
];

// ----------------------
// Motion variants
// ----------------------
const container: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

// ----------------------
// Helper: parse a date string to timestamp (fallback safe)
// ----------------------
const parseDate = (d?: string) => {
    if (!d) return 0;
    const parsed = Date.parse(d);
    if (!isNaN(parsed)) return parsed;
    try {
        return new Date(d).getTime();
    } catch {
        return 0;
    }
};

// ----------------------
// NewsCard: memoized presentational card
// ----------------------
const NewsCard: React.FC<{ item: typeof NEWS_ITEMS[number] }> = memo(({ item }) => {
    const fallback = (images as any).student4;
    return (
        <motion.article
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
        >
            <div className="relative w-full h-44 sm:h-48">
                <Image src={item.image ?? fallback} alt={item.title} fill className="object-cover" />
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">{item.type}</div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>

                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" /> <span>{item.date}</span>
                </div>

                <p className="mt-3 text-sm text-gray-700 flex-1">{item.description}</p>
                <a className="sr-only" href={item.link} aria-hidden>
                    {item.link}
                </a>
            </div>
        </motion.article>
    );
});
NewsCard.displayName = "NewsCard";

// ----------------------
// Main component — filtering + pagination
// ----------------------
const News: React.FC = () => {
    // filter state
    const [typeFilter, setTypeFilter] = useState<string>("All");
    const [search, setSearch] = useState<string>("");

    // pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(6);

    // derived filter list of types
    const types = useMemo(() => {
        const s = new Set<string>(NEWS_ITEMS.map((n) => n.type));
        return ["All", ...Array.from(s)];
    }, []);

    // filtered items
    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return NEWS_ITEMS.filter((n) => {
            if (typeFilter !== "All" && n.type !== typeFilter) return false;
            if (!s) return true;
            return (n.title + " " + n.description).toLowerCase().includes(s);
        }).sort((a, b) => parseDate(b.date) - parseDate(a.date));
    }, [typeFilter, search]);

    // pagination math
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Sync currentPage when filters / itemsPerPage change
    useEffect(() => {
        // Clamp currentPage to valid range
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [totalPages, currentPage]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    // Reset search when switching to "All" filter
    useEffect(() => {
        if (typeFilter === "All") {
            setSearch(""); // Clear search to avoid filtering issues
        }
    }, [typeFilter]);

    // small UI helpers
    const gotoPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

    return (
        <main className="w-full min-h-screen bg-gradient-to-b from-white to-gray-100 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 right-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute bottom-20 left-10 w-48 h-48 bg-cyan-200/30 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-10 container mx-auto px-6 sm:px-8 py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                            {PAGE_TITLE}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        {HERO_SUBTITLE}
                    </p>
                </motion.div>
            </header>

            {/* Controls */}
            <section className="container mx-auto px-6 sm:px-8 py-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-sm text-gray-700">Filter:</label>
                        <div className="inline-flex rounded-md bg-white p-1 shadow-sm">
                            {types.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTypeFilter(t);
                                        setCurrentPage(1); // reset to page 1 when filter changes
                                    }}
                                    className={`px-3 py-1 text-sm rounded-md ${t === typeFilter ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1); // reset to page 1 on search
                            }}
                            placeholder="Search title or description..."
                            className="px-3 py-2 rounded-md border border-gray-200 text-sm w-56"
                        />

                        <label className="text-sm text-gray-700">Per page:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // reset page to 1 when page size changes
                            }}
                            className="rounded-md border border-gray-400 px-2 py-1 text-sm text-gray-800"
                        >
                            {[3, 6, 9, 12].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* GRID */}
            <section className="container mx-auto px-6 sm:px-8 pb-10 relative z-10">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginated.length ? (
                            <AnimatePresence initial={false}>
                                {paginated.map((item) => <NewsCard key={item.id} item={item} />)}
                            </AnimatePresence>
                        ) : (
                            <div className="col-span-full bg-white rounded-2xl p-6 text-center text-gray-600">No news found for the selected filters.</div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {filtered.length ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => gotoPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="px-3 py-1 rounded-md border border-gray-400 text-gray-800 bg-white disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => {
                                    if (totalPages <= 7) return true;
                                    if (p === 1 || p === totalPages) return true;
                                    if (Math.abs(p - currentPage) <= 1) return true;
                                    return false;
                                })
                                .map((p, idx, arr) => {
                                    const isCurrent = p === currentPage;
                                    const prev = arr[idx - 1];
                                    const needEllipsis = prev && p - prev > 1;
                                    return (
                                        <React.Fragment key={p}>
                                            {needEllipsis && <div className="px-2">…</div>}
                                            <button
                                                onClick={() => gotoPage(p)}
                                                className={`px-3 py-1 rounded-md border ${isCurrent ? "bg-blue-600 text-white" : "bg-white"}`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}

                            <button
                                onClick={() => gotoPage(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 rounded-md border border-gray-400 text-gray-800 bg-white disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            </section>
        </main>
    );
};

export default News;