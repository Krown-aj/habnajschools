"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FaBook,
    FaUsers,
    FaTrophy,
    FaPhone,
    FaEnvelope,
    FaGraduationCap,
} from "react-icons/fa";
import { images } from "@/constants";

const container = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const NurseryHeadAbout: React.FC = () => {
    const nurseryHeadImg = (images as any).nurseryHead ?? images.student3;

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* HERO */}
            <header className="relative w-full h-[90vh] sm:h-[100vh] overflow-hidden">
                <Image src={images.student4} alt="Habnaj International Schools nursery section" fill className="object-cover object-center" priority />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/40 to-cyan-600/25" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="max-w-3xl">
                        <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl mt-24 text-white font-extrabold leading-tight">
                            Meet the Nursery Head — Nurturing Young Minds at Habnaj International Schools
                        </motion.h1>

                        <motion.p variants={fadeUp} className="bg-black/10 backdrop-blur-2xl border-white p-5 my-16 text-white/90 text-lg sm:text-xl text-justify max-w-2xl rounded-lg">
                            Mrs. Aisha M. Bello, the Nursery Head of Habnaj International Schools, is dedicated to fostering a nurturing and engaging environment for young learners, ensuring a strong foundation for their educational journey.
                        </motion.p>

                        <motion.div variants={fadeUp} className="my-16 flex gap-3">
                            <Link href="/about/our-mission" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2 shadow">
                                <FaBook /> Our Mission
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            {/* CONTENT */}
            <section className="container mx-auto px-6 sm:px-8 py-12 lg:py-20">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left column: Quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                                    <FaGraduationCap />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Role</h3>
                                    <p className="text-sm text-gray-600 mt-1">Nursery Head since 2015</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center">
                                    <FaUsers />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Focus</h3>
                                    <p className="text-sm text-gray-600 mt-1">Early childhood development and care</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white flex items-center justify-center">
                                    <FaTrophy />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Achievements</h3>
                                    <p className="text-sm text-gray-600 mt-1">Enhanced early learning programs</p>
                                </div>
                            </div>
                        </article>
                    </motion.div>

                    {/* Middle & Right: About, Leadership, Message */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        {/* About the Nursery Head */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">About Mrs. Aisha M. Bello</h2>
                            <p className="mt-3 text-sm text-gray-700">
                                Mrs. Aisha M. Bello has served as the Nursery Head of Habnaj International Schools since 2015, bringing extensive expertise in early childhood education. She oversees the creche, play class, and kindergarten sections, ensuring a caring and stimulating environment that fosters creativity, curiosity, and foundational skills for young learners aged 10 months to 5 years.
                            </p>
                        </div>

                        {/* Leadership Philosophy */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Leadership Philosophy</h2>
                            <p className="mt-3 text-sm text-gray-700">
                                Mrs. Bello believes in nurturing young minds through play-based learning and individualized care. Her leadership ensures that teachers are trained to engage children in activities like phonics, counting, and creative arts, while maintaining a safe and inclusive environment. She emphasizes building strong foundations in literacy, numeracy, and social skills to prepare children for primary education.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Play-Based Learning</h4>
                                    <p className="text-sm text-gray-600 mt-1">Encouraging creativity and exploration.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Child-Centered Care</h4>
                                    <p className="text-sm text-gray-600 mt-1">Tailoring education to individual needs.</p>
                                </div>
                            </div>
                        </div>

                        {/* Message from the Nursery Head */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-40 h-40 relative rounded-xl overflow-hidden flex-shrink-0">
                                <Image src={nurseryHeadImg} alt="Nursery Head of Habnaj International Schools" fill className="object-cover" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Message from the Nursery Head</h3>
                                <p className="mt-3 text-sm text-gray-700 text-justify">
                                    At Habnaj International Schools, our nursery section is a place where young learners thrive through fun, play, and structured learning. We are committed to providing a safe, nurturing environment that sparks curiosity and builds a strong educational foundation. Partnering with parents, we ensure every child feels valued and supported in their early years.
                                </p>

                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-medium">— Mrs. Aisha M. Bello</div>
                                    <div className="text-xs text-gray-400">Nursery Head, Habnaj International Schools</div>
                                </div>

                                <div className="mt-5 flex gap-3">
                                    <Link href="/about/our-mission" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                        Learn More About Our Mission
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Commitment to Community */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Commitment to Community</h2>
                            <p className="mt-3 text-sm text-gray-700">
                                Mrs. Bello fosters a warm and inclusive community for nursery students, parents, and staff. She oversees extracurricular activities like the kids’ club and arts and crafts, designed to enhance creativity and social skills. Her dedication to health and safety ensures regular equipment checks and strict pick-up protocols, prioritizing the well-being of every child.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our nursery section?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our Admissions Office for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href="tel:+2349054985027" className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> +234 905 498 5027
                        </a>
                        <a href="mailto:habnaj2021international@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 text-blue-500">
                            <FaEnvelope /> habnaj2021international@gmail.com
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default NurseryHeadAbout;