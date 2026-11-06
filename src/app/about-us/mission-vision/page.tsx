"use client";

import React, { memo } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaUsers, FaLightbulb, FaPhone, FaEnvelope } from "react-icons/fa";
import { CONTACT } from "@/constants";

const PAGE_TITLE = "Our Mission & Vision";
const HERO_SUBTITLE = "Shaping the Future at Habnaj International Schools";

const MISSION_TEXT =
    "To provide holistic education that fosters academic excellence, critical thinking, and lifelong learning to meet the diverse needs of our dynamic society through the promotion of strong moral and ethical values as well as honesty and transparency, to prepare the students for future leadership.";

const VISION_TEXT =
    "To be a leading private educational institution that nurtures morally upright, intellectually sound, and socially responsible individuals, equipped with the skills, knowledge, and values to excel in a changing world.";

const CORE_VALUES = [
    { title: "Honesty", desc: "Transparency, Accountability and Responsibility" },
    { title: "Innovation", desc: "Creativity, Critical thinking and Skills development" },
    { title: "Standards", desc: "Teaching, Life-long Learning and Character development" },
];

const CONTACT_EMAIL = CONTACT.email;
const CONTACT_PHONE = CONTACT.phone;

// ----------------------
// Motion variants
// ----------------------
const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

// ----------------------
// Small presentational InfoCard component (memoized)
// ----------------------
const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = memo(
    ({ icon, title, subtitle, children }) => (
        <article className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                    {/* stable square wrapper to avoid icon distortion */}
                    <span className="inline-flex items-center justify-center h-6 w-6">
                        {icon}
                    </span>
                </div>

                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
                    {children && <div className="mt-2 text-sm text-gray-600 space-y-2">{children}</div>}
                </div>
            </div>
        </article>
    )
);
InfoCard.displayName = "InfoCard";

const MissionVision: React.FC = () => {
    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* HERO / Banner */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{PAGE_TITLE}</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">{HERO_SUBTITLE}</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column: quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaLightbulb />} title="Mission" subtitle="Empowering students through quality education">
                            <div style={{ textAlign: "justify" }}>{MISSION_TEXT}</div>
                        </InfoCard>

                        <InfoCard icon={<FaUsers />} title="Vision" subtitle="Building confident, disciplined leaders">
                            <div style={{ textAlign: "justify" }}>{VISION_TEXT}</div>
                        </InfoCard>

                        <InfoCard icon={<FaBook />} title="Core Values">
                            <div style={{ textAlign: "justify" }}>
                                {CORE_VALUES.map((cv) => (
                                    <div key={cv.title} className="text-sm text-gray-700">
                                        <strong>{cv.title}:</strong> {cv.desc}
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    </motion.div>

                    {/* Main column */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Our Mission</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MISSION_TEXT}
                            </p>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Our Vision</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {VISION_TEXT}
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Holistic Development</h4>
                                    <p className="text-sm text-gray-600 mt-1">Fostering academic, social and personal growth.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Inclusivity</h4>
                                    <p className="text-sm text-gray-600 mt-1">Embracing diversity in all forms.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Our Core Values</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                At Habnaj International Schools, our core values guide everything we do:
                            </p>

                            <ul className="mt-3 space-y-3 text-sm text-gray-700 list-disc list-inside" style={{ textAlign: "justify" }}>
                                {CORE_VALUES.map((v) => (
                                    <li key={v.title}>
                                        <strong>{v.title}:</strong> {v.desc}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-5">
                                <Link href="/about-us/history" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                    Learn More About Us
                                </Link>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Commitment to Excellence</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                Our commitment to excellence is reflected in our comprehensive curriculum, dedicated staff and extracurricular programs. We prioritise health and safety through regular equipment checks and strict pick-up protocols, ensuring a secure and supportive environment for all students.
                            </p>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Want to learn more about our programs?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> {CONTACT_PHONE}
                        </a>
                        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 px-4 py-2 text-blue-500">
                            <FaEnvelope /> {CONTACT_EMAIL}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default MissionVision;
