"use client";

import React, { memo, useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
    FaCheckCircle,
    FaBaby,
    FaLeaf,
    FaSchool,
    FaUserGraduate,
    FaMosque,
} from "react-icons/fa";
import { CONTACT } from "@/constants";

type Section = {
    id: string;
    title: string;
    subtitle?: string;
    ageRange?: string;
    overview?: string;
    requirements: string[];
    icon: React.ReactNode;
};

const containerStagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemFadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } };

const SectionListItem: React.FC<{ title: string; active: boolean; onClick: () => void }> = memo(({ title, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${active ? "bg-blue-50 border border-blue-200 text-blue-700" : "hover:bg-gray-50"
            }`}
        aria-pressed={active}
    >
        {title}
    </button>
));
SectionListItem.displayName = "SectionListItem";

const RequirementsPage: React.FC = () => {
    const sections: Section[] = useMemo(
        () => [
            {
                id: "creche",
                title: "Creche / Play Class Section",
                subtitle: "Infant Care",
                ageRange: "10 months – 3 years",
                overview:
                    "One-to-one care and play-based learning for infants. Children are assigned a key worker and receive focused attention for feeding, nappy changes and early learning through play.",
                requirements: [
                    "Completed application form",
                    "Two (2) passport-size photographs",
                    "Emergency contact details",
                    "Immunization card (photocopy)",
                ],
                icon: <FaBaby className="text-2xl" aria-hidden />,
            },

            {
                id: "nursery",
                title: "Nursery Section",
                subtitle: "Early Years",
                ageRange: "3 – 6 years",
                overview:
                    "A NERDC-based curriculum that introduces letters, numbers, creative arts and early social skills. Priority admission given to existing Play Class pupils.",
                requirements: [
                    "Completed application form",
                    "Two (2) passport-size photographs",
                    "Birth certificate (photocopy)",
                    "Immunization card (photocopy)",
                ],
                icon: <FaLeaf className="text-2xl" aria-hidden />,
            },

            {
                id: "primary",
                title: "Primary Section",
                subtitle: "Structured Learning",
                ageRange: "6 – 12 years",
                overview:
                    "A NERDC-based curriculum focused on literacy, numeracy, science and social development with extra-curricular activities and regular assessments.",
                requirements: [
                    "Completed application form",
                    "Two (2) passport-size photographs",
                    "Birth certificate (certified copy)",
                    "Previous school report (if applicable)",
                ],
                icon: <FaSchool className="text-2xl" aria-hidden />,
            },

            {
                id: "senior",
                title: "Junior & Senior Secondary (JSS / SSS) Section",
                subtitle: "Secondary Education",
                ageRange: "12 – 18 years",
                overview:
                    "Focused academic pathways with elective choices and examinations to prepare students for higher education and careers.",
                requirements: [
                    "Completed application form",
                    "Two (2) passport-size photographs",
                    "Birth certificate",
                    "Comprehensive transcripts / last 2–3 years' reports",
                    "Recommendation / transfer letter (where applicable)",
                ],
                icon: <FaUserGraduate className="text-2xl" aria-hidden />,
            },

            {
                id: "madrasah",
                title: "Madrasah Classes",
                subtitle: "After-school Religious Classes",
                ageRange: "All ages",
                overview:
                    "Madrasah classes are open for five days in a week: Mondays to Wednesdays (2:30 PM to 5:00 PM), Saturdays and Sundays (8:00 AM to 12:00 PM). Open to both school pupils and external students.",
                requirements: [
                    "Completed application form",
                    "Two (2) passport-size photographs",
                ],
                icon: <FaMosque className="text-2xl" aria-hidden />,
            },
        ],
        []
    );

    // Client-side state to switch sections without navigating
    const [activeId, setActiveId] = useState<string>(sections[0].id);

    const activeSection = sections.find((s) => s.id === activeId) || sections[0];

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner - simple decorative banner */}
            <header className="relative w-full h-[15vh] overflow-hidden" aria-hidden>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
            </header>
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Mobile: dropdown selector */}
                <div className="lg:hidden mb-6">
                    <label htmlFor="section-select" className="sr-only">
                        Choose section
                    </label>
                    <select
                        id="section-select"
                        value={activeId}
                        onChange={(e) => setActiveId(e.target.value)}
                        className="w-full rounded-md border-gray-200 px-3 py-2 text-sm"
                    >
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar navigation - visible on lg and above */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start">
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sections</h3>
                            <div className="space-y-2">
                                {sections.map((s) => (
                                    <SectionListItem key={s.id} title={s.title} active={s.id === activeId} onClick={() => setActiveId(s.id)} />
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Content area */}
                    <main className="col-span-1 lg:col-span-9">
                        <motion.article initial="hidden" animate="visible" variants={containerStagger} className="bg-white rounded-2xl p-6 shadow-sm">
                            <motion.div variants={itemFadeUp} key={activeSection.id} className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow">
                                    {activeSection.icon}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{activeSection.title}</h2>
                                            {activeSection.subtitle && <div className="text-sm sm:text-xl text-gray-500 mt-1">{activeSection.subtitle}</div>}
                                            {activeSection.ageRange && <div className="text-sm sm:text-xl text-gray-500 mt-1">{activeSection.ageRange}</div>}
                                        </div>
                                    </div>

                                    {activeSection.overview && <p className="mt-3 text-sm sm:text-xl text-gray-700 text-justify">{activeSection.overview}</p>}

                                    <div className="mt-4">
                                        <h4 className="font-bold text-lg sm:text-2xl text-gray-900">Required documents</h4>
                                        <ul className="mt-3 space-y-4 text-sm sm:text-base text-gray-600">
                                            {activeSection.requirements.map((r, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm sm:text-lg">
                                                    <span className="mt-1 text-green-500"><FaCheckCircle /></span>
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.article>

                        {/* Contact & notes below content */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemFadeUp} className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-semibold text-gray-900">Contact & Notes</h4>
                            <p className="mt-4 text-sm text-gray-700">
                                Admissions enquiries: <a href={`mailto:${CONTACT.email}`} className="text-blue-600 underline">{CONTACT.email}</a> | Phone: <a href={`tel:${CONTACT.tel}`} className="text-blue-600 underline">{CONTACT.phone}</a>
                            </p>
                        </motion.div>
                    </main>
                </div>
            </section>
        </main>
    );
};

export default RequirementsPage;
