"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FaBook,
    FaPhone,
    FaEnvelope,
    FaBell,
} from "react-icons/fa";
import { CONTACT } from "@/constants";

const container = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const PAGE_TITLE = " Subscribe to Our Newsletter"
const HERO_SUBTITLE = "Stay updated with the latest news, events, and announcements from Habnaj International Schools. Join our community and never miss an update!"

const Subscribe: React.FC = () => {
    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* HERO */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{PAGE_TITLE}</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">{HERO_SUBTITLE}</p>
                    </motion.div>
                </div>
            </header>

            {/* SUBSCRIBE CONTENT */}
            <section className="container mx-auto px-6 sm:px-8 py-12 lg:py-20">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Subscription Benefits */}
                    <motion.div variants={fadeUp} className="space-y-8">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Why Subscribe?</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                                    <FaBell />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Stay Informed</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Receive updates on school events, such as inter-house competittions, school trips and festivity.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Exclusive Announcements</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Get the latest news on admissions, school events, and extracurricular activities.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white flex items-center justify-center">
                                    <FaBook />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">School Engagement</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Learn about school activities, like our Sanitation Club, Quiz Competition, and how you can participate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Subscription Form */}
                    <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Join Our Newsletter</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <button
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full px-4 py-3 font-semibold hover:bg-blue-700 transition"
                            >
                                Subscribe Now
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-4">
                                By subscribing, you agree to receive periodic updates from Habnaj International Schools. You can unsubscribe at any time.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> {CONTACT.phone}
                        </a>
                        <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 px-4 py-2 text-blue-500">
                            <FaEnvelope /> {CONTACT.email}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default Subscribe;