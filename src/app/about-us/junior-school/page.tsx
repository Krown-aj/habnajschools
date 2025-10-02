"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaClock, FaGraduationCap, FaClipboardList, FaUsers, FaTrophy, FaPhone, FaEnvelope, FaLaptopCode } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const SECTION_NAME = "Junior Secondary School (JSS)";
const AGE_RANGE = "12 – 16 years";
const HEAD_OF_JUNIOR_NAME = MANAGEMENT.principal.name;
const DAILY_SCHEDULE = "8:00 AM – 2:00 PM (Mon–Thu), 8:00 AM – 12:00 PM (Fri)";
const REGISTRATION_FEE = 5000;
const CONTACT_EMAIL = CONTACT.email;
const CONTACT_PHONE_PRIMARY = CONTACT.phone;

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

/**
 * Small presentational InfoCard component (memoized).
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

const JuniorAbout: React.FC = () => {
    // image fallback: use provided headJss image or a generic student image
    const headJssImg = (images as any).headJss ?? images.principal ?? images.principal;

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner: gradient only for consistency and performance */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{SECTION_NAME}</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Growing confident learners — strong foundations for Senior School.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaGraduationCap />} title="Age Group" subtitle={AGE_RANGE} />

                        <InfoCard icon={<FaClock />} title="School Hours" subtitle={DAILY_SCHEDULE} />

                        <InfoCard icon={<FaUsers />} title="Focus Areas">
                            Critical thinking, study skills, moral formation and subject exploration to prepare learners for Senior School.
                        </InfoCard>
                    </motion.div>

                    {/* Main content — curriculum, assessment, head message, enrollment */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Curriculum & Academic Pathways</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                The Junior School provides a broad curriculum covering core subjects and early electives. We build strong foundations in language, mathematics and science while
                                introducing ICT, creative arts and civic education to support balanced development.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Core Subjects</h4>
                                    <p className="text-sm text-gray-600 mt-1">English, Mathematics, Basic Science, Social Studies</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">ICT</h4>
                                    <p className="text-sm text-gray-600 mt-1">Computer basics, simple coding concepts and practical investigations.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Languages & Values</h4>
                                    <p className="text-sm text-gray-600 mt-1">Local language, religious studies, civic and moral education.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Life Skills & Activities</h4>
                                    <p className="text-sm text-gray-600 mt-1">Clubs, sports, debating, community projects and leadership training.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Assessment & Progression</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Regular formative and summative assessments guide teaching and help identify strengths and areas for support. At the end of JSS, pupils are prepared
                                for a smooth transition into Senior School with subject choices and remedial support where needed.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center"><FaClipboardList /></div>
                                    <div className="mt-2 text-sm font-medium">Continuous Assessments</div>
                                </div>

                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center"><FaLaptopCode /></div>
                                    <div className="mt-2 text-sm font-medium">ICT & Projects</div>
                                </div>

                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center"><FaTrophy /></div>
                                    <div className="mt-2 text-sm font-medium">Extracurricular Awards</div>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-40 h-40 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image src={headJssImg} alt={`Principal — ${HEAD_OF_JUNIOR_NAME}`} fill className="object-cover" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Message from the Principal</h3>
                                <p className="mt-3 text-sm text-gray-700 text-justify">
                                    Welcome to our Junior School. We are committed to nurturing resilient, curious and principled learners. Here pupils deepen their understanding,
                                    gain practical skills and prepare academically and socially for Senior School. We value partnership with parents — together we create a safe and
                                    stimulating environment where every child can thrive.
                                </p>

                                <div className="mt-4">
                                    <div className="text-sm text-gray-600 font-medium">— {HEAD_OF_JUNIOR_NAME}</div>
                                    <div className="text-xs text-gray-400">The Principal</div>
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
                                <li>Obtain and complete the application form from the Admission Office.</li>
                                <li>Two (2) recent passport-size photographs.</li>
                                <li>Birth certificate (photocopy).</li>
                                <li>Previous school report / transcripts (for transfers).</li>
                                <li>Medical certificate of fitness.</li>
                            </ul>

                            <div className="mt-4 text-sm text-gray-700">
                                <strong>Application Form Fee:</strong> {`₦${REGISTRATION_FEE.toLocaleString()}`} (JSS application form).
                            </div>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Questions about JSS admissions?</h4>
                        <p className="text-sm text-gray-600 mt-1">Call or email our desk for assistance.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={`tel:${CONTACT_PHONE_PRIMARY.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
                            <FaPhone /> {CONTACT_PHONE_PRIMARY}
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

export default JuniorAbout;
