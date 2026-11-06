"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
} from "react-icons/fa";
import { images, CONTACT } from "@/constants";

const container = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const PAGE_TITLE = " Contact Us — Get in Touch with Habnaj International Schools";
const HERO_SUBTITLE = "We’re here to answer your questions and provide information about our programs, admissions, and more. Reach out to us today!";

// Target address (used for map centering and link)
const ADDRESS_FULL = "Plot D12, Sam Njoma Street, GRA, Bauchi, Bauchi State, Nigeria";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_FULL)}&output=embed`;
const MAP_OPEN_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_FULL)}`;

const ContactUs: React.FC = () => {
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

            {/* CONTACT CONTENT */}
            <section className="container mx-auto px-6 sm:px-8 py-12 lg:py-20">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Contact Information */}
                    <motion.div variants={fadeUp} className="space-y-8">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Get in Touch</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                                    <FaPhone />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Phone</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <a href={`tel:${CONTACT.phone}`} className="hover:text-blue-600">{CONTACT.phone}</a>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Email</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <a href={`mailto:${CONTACT.email}`} className="hover:text-blue-600">{CONTACT.email}</a>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white flex items-center justify-center">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Address</h3>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Habnaj International Schools<br />
                                        <address className="not-italic">{ADDRESS_FULL}</address>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Complaints</h3>
                            <p className="text-sm text-gray-700 mt-2">
                                For any concerns, you can call or send a text to <a href={`tel:${CONTACT.phone}`} className="text-blue-600 hover:underline">{CONTACT.phone}</a>, or email us at <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">{CONTACT.email}</a>.
                            </p>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Send Us a Message</h2>
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
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter the subject"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your message"
                                ></textarea>
                            </div>
                            <button
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full px-4 py-3 font-semibold hover:bg-blue-700 transition"
                            >
                                Send Message
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* MAP SECTION */}
            <section className="container mx-auto px-6 sm:px-8 py-12">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container}>
                    <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-8">
                        Habnaj International Schools
                    </motion.h2>

                    {/* Responsive embed container */}
                    <motion.div variants={fadeUp} className="relative w-full h-[50vh] rounded-2xl overflow-hidden shadow-sm">
                        <iframe
                            src={MAP_EMBED_SRC}
                            title="Map — Habnaj International Schools"
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            aria-hidden={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-white text-lg font-semibold bg-black/30 px-4 py-2 rounded">Plot D12, Sam Njoma Street, GRA, Bauchi</p>
                        </div>
                    </motion.div>

                    <div className="mt-4 text-center">
                        <a
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            href={MAP_OPEN_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View larger map in Google Maps
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Want more information?</h4>
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

export default ContactUs;
