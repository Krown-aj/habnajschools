"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaClock, FaChild, FaRegSmile, FaSchool, FaPhone, FaEnvelope } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const SECTION_NAME = "Nursery Section";
const AGE_RANGE = "3 – 6 years";
const DAILY_SCHEDULE = "8:00 AM – 12:00 PM (Mon–Thu), 8:00 AM – 12:00 PM (Fri)";
const REGISTRATION_FEE = 2500;

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

/**
 * Small presentational InfoCard component (memoized)
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

const NurseryAbout: React.FC = () => {
    // Use a fallback headteacher image if none provided in constants
    const headTeacherImg = (images as any).headteacher ?? (images as any).headmaster ?? images.student7;

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner: lightweight gradient to match ApplyPage */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{SECTION_NAME} — Early Years</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">A warm, playful and secure environment where young children begin their learning journey.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick highlights */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaChild />} title="Age Group" subtitle={`${AGE_RANGE}`} />

                        <InfoCard icon={<FaClock />} title="Daily Schedule" subtitle={DAILY_SCHEDULE} />

                        <InfoCard icon={<FaRegSmile />} title="Our Approach">
                            Play-led learning, social-emotional development, early literacy & numeracy and gentle routines that build confidence and independence.
                        </InfoCard>
                    </motion.div>

                    {/* Main column — curriculum, facilities, message, enrollment */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Curriculum Highlights</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Our nursery curriculum introduces children to structured play, phonics, early numeracy, creative arts, physical play and communication activities.
                                Learning is scaffolded through short focused activities, storytelling, songs, group play and hands-on exploration.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Language & Literacy</h4>
                                    <p className="text-sm text-gray-600 mt-1">Phonics, storytelling, vocabulary and emergent writing activities.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Numeracy & Logic</h4>
                                    <p className="text-sm text-gray-600 mt-1">Counting games, sorting, simple problem solving and pattern play.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Creative Arts & Motor Skills</h4>
                                    <p className="text-sm text-gray-600 mt-1">Painting, collage, music, movement and fine motor activities.</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Personal, Social & Emotional</h4>
                                    <p className="text-sm text-gray-600 mt-1">Sharing, routines, independence, and positive behaviour modeling.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Facilities & Safety</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Secure learning spaces, age-appropriate play equipment, dedicated nap and feeding areas, first-aid trained staff and strict arrival/collection
                                procedures to keep children safe.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center"><FaSchool /></div>
                                    <div className="mt-2 text-sm font-medium">Bright Classrooms</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center"><FaChild /></div>
                                    <div className="mt-2 text-sm font-medium">Play Areas</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center"><FaClock /></div>
                                    <div className="mt-2 text-sm font-medium">Care & Routines</div>
                                </div>
                            </div>
                        </article>

                        {/* Head Teacher message */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-40 h-40 relative rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image src={headTeacherImg} alt={`Head Teacher — ${MANAGEMENT.headteacher.name}`} fill className="object-cover" />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Message from the Head Teacher</h3>
                                <p className="mt-3 text-sm text-gray-700 text-justify">
                                    Welcome to Habnaj International Schools — a place where curiosity is cherished and each child is known. Our team of staff is dedicated to creating a safe, joyful and stimulating environment where young learners develop confidence, kindness and a love for learning. We partner closely with parents to ensure continuity between home and school. I look forward to meeting you and your child.
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

                        {/* Admission & Requirements */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Application Process:</h2>
                            <ul className="mt-4 space-y-4 text-sm text-gray-700">
                                <li>Completed application form (available at the Admissions Office).</li>
                                <li>Two (2) recent passport-size photographs.</li>
                                <li>Birth certificate (photocopy).</li>
                                <li>Certified medical/immunization record.</li>
                            </ul>

                            <div className="mt-4 text-sm text-gray-700">
                                <strong>Application Form Fee:</strong> {`₦${REGISTRATION_FEE.toLocaleString()}`} (Nursery application form).
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
                        <p className="text-sm text-gray-600 mt-1">Call us or email us for quick help.</p>
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

export default NurseryAbout;
