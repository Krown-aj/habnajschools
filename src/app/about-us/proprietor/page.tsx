"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import type { IconType } from "react-icons";
import { FaBook, FaPhone, FaEnvelope, FaGraduationCap } from "react-icons/fa";
import { CONTACT, MANAGEMENT, SCHOOL } from "@/constants";

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

// Responsive Image component with reliable fallback
const ImageWithFallback: React.FC<{ src?: string; alt?: string; className?: string; name?: string }> = ({ src, alt, className = "", name = "Profile" }) => {
    const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=512`;
    const [currentSrc, setCurrentSrc] = useState<string>(src || placeholder);

    return (
        <img
            src={currentSrc}
            alt={alt || name}
            className={`object-cover w-full h-full ${className}`}
            loading="lazy"
            decoding="async"
            onError={() => {
                // update using React state so we don't accidentally create infinite loops by manipulating DOM directly
                if (currentSrc !== placeholder) setCurrentSrc(placeholder);
            }}
        />
    );
};

const ManagementAboutOptimized: React.FC = () => {
    // expected local images in public/assets/
    const proprietorLocal = "/assets/proprietor.jpg";
    const mdLocal = "/assets/director.jpg";

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meet the Management</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">
                            Leading Habnaj International Schools with experience, vision and commitment to excellence.
                        </p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — Vision/Mission/Values */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={FaGraduationCap} title="Vision">
                            {SCHOOL.vision}
                        </InfoCard>

                        <InfoCard icon={FaBook} title="Mission">
                            {SCHOOL.mission}
                        </InfoCard>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">Core Values — H.I.S</h3>
                            <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                <li><strong>Honesty</strong> — Transparency, Accountability and Responsibility</li>
                                <li><strong>Innovation</strong> — Creativity, Critical thinking and Skills development</li>
                                <li><strong>Standards</strong> — Teaching, Life-long Learning and Character development</li>
                            </ul>
                        </article>
                    </motion.div>

                    {/* Main content — profiles */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        {/* Profile card — Proprietor */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            {/* Responsive image wrapper: uses aspect-square so image stays square on small screens */}
                            <div className="w-full md:w-48 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 aspect-square">
                                <ImageWithFallback src={proprietorLocal} alt="Engr. Prof. Shuaibu M. Musa" className="" name="Engr. Prof. Shuaibu M. Musa" />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900">{`${MANAGEMENT.proprietor.name}, ${MANAGEMENT.proprietor.qualification}`}</h2>
                                <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                    The Proprietor of Habnaj International Schools, {MANAGEMENT.proprietor.name}, has dedicated over 45 years to teaching and research at the
                                    university level. An experienced administrator and former two-term Rector of Abubakar Tatari Ali Polytechnic and Federal Polytechnic,
                                    Bauchi, Prof. Musa has also served as Honourable Commissioner for Education and Youth Development in Bauchi State. He believes education
                                    is the bedrock of development and founded Habnaj International Schools to train future leaders and responsible citizens of the nation.
                                </p>

                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
                                    <a href={`mailto:${MANAGEMENT.proprietor.email}`} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-50 text-blue-700">
                                        <FaEnvelope /> {MANAGEMENT.proprietor.email}
                                    </a>
                                    <a href={`tel:${MANAGEMENT.proprietor.contact}`} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-50 text-gray-700">
                                        <FaPhone /> {MANAGEMENT.proprietor.contact}
                                    </a>
                                </div>
                            </div>
                        </article>

                        {/* Profile card — Director */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-48 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 aspect-square">
                                <ImageWithFallback src={mdLocal} alt="Hajiya Zainab S. Musa" className="" name="Hajiya Zainab S. Musa" />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900">{MANAGEMENT.director.name}</h2>
                                <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                    The Managing Director, of Habnaj International Schools, {MANAGEMENT.director.name}, is a holder of {MANAGEMENT.director.qualification} and served as an Education Officer with the
                                    Bauchi State Ministry of Education. She continued her career with the Ministry of Women Affairs and Child Development, retiring as Deputy
                                    Director Child Development Specialist in 2025. {MANAGEMENT.director.name} is passionate about nurturing morally, spiritually and socially upright children.
                                </p>

                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
                                    <a href={`mailto:${MANAGEMENT.director.email}`} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-50 text-blue-700">
                                        <FaEnvelope /> {MANAGEMENT.director.email}
                                    </a>
                                    <a href={`tel:${MANAGEMENT.director.contact}`} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-50 text-gray-700">
                                        <FaPhone /> {MANAGEMENT.director.contact}
                                    </a>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">Management Message</h3>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                At Habnaj International Schools we are committed to providing high-quality, holistic education that blends academic rigor with character
                                development. Our management team works hand-in-hand with teachers, parents and the community to ensure every child receives the support
                                and guidance needed to realise their potential.
                            </p>

                            <div className="mt-5">
                                <Link href="/about-us/mission-vision" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                    Learn More About Our Mission
                                </Link>
                            </div>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our school?</h4>
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

export default ManagementAboutOptimized;

const InfoCard: React.FC<{ icon: IconType; title: string; subtitle?: string; children?: React.ReactNode }> = memo(({ icon, title, subtitle, children }) => {
    const Icon = icon;
    return (
        <article className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                    <span className="inline-flex items-center justify-center h-6 w-6">
                        <Icon size={20} />
                    </span>
                </div>

                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
                    {children && (
                        <p className="mt-2 text-sm text-gray-600" style={{ textAlign: "justify" }}>
                            {children}
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
});
InfoCard.displayName = "InfoCard";
