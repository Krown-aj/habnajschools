"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaClock, FaSchool, FaChalkboardTeacher, FaPhone, FaEnvelope, FaTrophy } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const SECTION_NAME = "Primary Section";
const AGE_RANGE = "6 – 12 years";
const DAILY_SCHEDULE = "8:00 AM – 1:00 PM (Mon–Thu), 8:00 AM – 12:00 PM (Fri)";
const REGISTRATION_FEE = 3000;

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

/**
 * Small presentational InfoCard component (memoized) to keep left column consistent and performant.
 */
const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = memo(({ icon, title, subtitle, children }) => (
    <article className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                {icon}
            </div>

            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
                {children && <p className="mt-2 text-sm text-gray-600">{children}</p>}
            </div>
        </div>
    </article>
));
InfoCard.displayName = "InfoCard";

const PrimaryAbout: React.FC = () => {
    // image fallbacks – keeps the page safe if an image isn't provided in constants
    const headPrimaryImg = (images as any).headPrimary ?? images.headteacher ?? images.headteacher;

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner: lightweight gradient (matches other pages) */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{SECTION_NAME} — Building Strong Foundations</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">A balanced curriculum that strengthens literacy, numeracy and character development.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaSchool />} title="Age Group" subtitle={`${AGE_RANGE}`} />

                        <InfoCard icon={<FaClock />} title="Daily Schedule" subtitle={DAILY_SCHEDULE} />

                        {/*  <InfoCard icon={<FaUsers />} title="Class Size & Ratio">
                            Typically 15–25 pupils per class to ensure close teacher support and attention to individual growth.
                        </InfoCard> */}
                    </motion.div>

                    {/* Main content — curriculum, facilities, head of primary, enrollment */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Curriculum & Subjects</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Our Primary curriculum balances strong core academics with creative and practical subjects. We prepare pupils for higher education while
                                nurturing curiosity, resilience and communication skills.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Core Subjects</h4>
                                    <p className="text-sm text-gray-600 mt-1">English, Mathematics, Science, Social Studies</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">ICT & Practical Skills</h4>
                                    <p className="text-sm text-gray-600 mt-1">Basic computer lessons and hands-on activities.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Creative Arts & PE</h4>
                                    <p className="text-sm text-gray-600 mt-1">Arts, music, drama, and physical education to support whole-child development.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Moral & Religious Education</h4>
                                    <p className="text-sm text-gray-600 mt-1">Character development and values integrated across the curriculum.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Facilities & Safeguards</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Well-equipped classrooms, safe play areas, a small library, computer room and hygienic toilet facilities. Staff are trained in first aid
                                and child safety.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center"><FaChalkboardTeacher /></div>
                                    <div className="mt-2 text-sm font-medium">Qualified Teachers</div>
                                </div>

                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center"><FaTrophy /></div>
                                    <div className="mt-2 text-sm font-medium">Achievement Focus</div>
                                </div>

                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center"><FaBook /></div>
                                    <div className="mt-2 text-sm font-medium">Reading Corner</div>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-40 h-40 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image src={headPrimaryImg} alt={`Head of Primary — ${MANAGEMENT.headteacher.name}`} fill className="object-cover" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Message from the Head Teacher</h3>
                                <p className="mt-3 text-sm text-gray-700 text-justify">
                                    Welcome to Habnaj International Schools. Our mission is to provide a nurturing, stimulating and disciplined environment where every child is encouraged to
                                    discover their potential. We focus on building strong literacy and numeracy foundations while fostering creativity, responsibility and good character.
                                    We work closely with parents to support each child’s progress and well-being.
                                </p>

                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-medium">— {MANAGEMENT.headteacher.name}</div>
                                    <div className="text-xs text-gray-400">Head Teacher, {SECTION_NAME}</div>
                                </div>

                                <div className="mt-5 flex gap-3">
                                    <Link href="/admissions/requirements" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                        Read Requirements
                                    </Link>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Application Process:</h2>
                            <ul className="mt-4 space-y-4 text-sm text-gray-700">
                                <li>Completed application form (available at the Admissions Office).</li>
                                <li>Two (2) recent passport-size photographs.</li>
                                <li>Birth certificate (photocopy).</li>
                                <li>Previous school report / transcript (for transfers).</li>
                            </ul>

                            <div className="mt-4 text-sm text-gray-700">
                                <strong>Application Form Fee:</strong> {`₦${REGISTRATION_FEE.toLocaleString()}`} (Primary application form).
                            </div>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Questions about {SECTION_NAME} admissions?</h4>
                        <p className="text-sm text-gray-600 mt-1">Call or email desk for assistance.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={`tel:${CONTACT.tel.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
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

export default PrimaryAbout;
