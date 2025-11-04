"use client";

import { motion } from "framer-motion";
import NewsFeed from "@/components/News/NewsFeed";

const PAGE_TITLE = "School News & Updates";
const HERO_SUBTITLE =
    "Stay informed about events, announcements, and sanitations at Habnaj International Schools.";

// -------------------------------------------------------------------
// Motion variants for the hero section only
// -------------------------------------------------------------------
const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export default function NewsPage() {
    return (
        <main className="w-full min-h-screen bg-gradient-to-b from-white to-gray-100 relative overflow-hidden">
            {/* --------------------------------------------------------------
          Background decorative blobs – kept exactly as in the original
      -------------------------------------------------------------- */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 right-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-20 left-10 w-48 h-48 bg-cyan-200/30 rounded-full blur-3xl"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* --------------------------------------------------------------
          Hero header – same look & feel
      -------------------------------------------------------------- */}
            <header className="relative z-10 container mx-auto px-6 sm:px-8 py-12 text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={heroVariants}
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

            {/* --------------------------------------------------------------
          NewsFeed – everything else is delegated here
      -------------------------------------------------------------- */}
            <section className="relative bg-white py-5 z-10 w-full px-6 sm:px-8 pb-16">
                <NewsFeed
                    initialFilters={{ status: "PUBLISHED" }}
                    itemsPerPage={6}
                    showFilters={true}
                    className="mt-8"
                />
            </section>
        </main>
    );
}