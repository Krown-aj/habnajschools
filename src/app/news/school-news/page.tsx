"use client";

import { motion } from "framer-motion";
import { FaPhone, FaEnvelope } from "react-icons/fa";
import NewsFeed from "@/components/News/NewsFeed";
import { CONTACT } from "@/constants";

const PAGE_TITLE = "School News & Updates";
const HERO_SUBTITLE =
    "Stay informed about events, announcements and school activities at Habnaj International Schools.";

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function NewsLetterPage() {
    return (
        <main className="w-full min-h-screen bg-white text-gray-900">
            {/* HERO BANNER */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="pt-4"
                    >
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">
                            {PAGE_TITLE}
                        </h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">
                            {HERO_SUBTITLE}
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* NEWS FEED */}
            <section className="container mx-auto px-6 sm:px-8 py-6">
                <NewsFeed
                    initialFilters={{ status: "PUBLISHED" }}
                    itemsPerPage={6}
                    showFilters={true}
                    className="mt-6"
                />
            </section>

            {/* CONTACT FOOTER */}
            <footer className="bg-white border-t border-gray-300 mt-12">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our school?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a
                            href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                        >
                            <FaPhone /> {CONTACT.phone}
                        </a>
                        <a
                            href={`mailto:${CONTACT.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition"
                        >
                            <FaEnvelope /> {CONTACT.email}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}