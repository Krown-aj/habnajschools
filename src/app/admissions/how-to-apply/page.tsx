"use client";

import React, { memo, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
    FaFileAlt,
    FaTags,
    FaEnvelope,
    FaPhone,
} from "react-icons/fa";
import { CONTACT } from "@/constants";

/**
 * Types
 */
type Step = {
    id: number;
    title: string;
    desc: string;
    icon: React.ElementType;
    details: string[];
};

/**
 * Motion variants typed for clarity and reusability
 */
const containerStagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

const itemFadeUp: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

/**
 * Small memoized card for each step to avoid re-renders when parent updates unnecessarily.
 * This component is intentionally small and focused on presentation.
 */
const StepCard: React.FC<{ step: Step }> = memo(({ step }) => {
    const Icon = step.icon;

    return (
        <motion.article
            variants={itemFadeUp}
            className="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
            whileHover={{ y: -6, scale: 1.01 }}
            aria-labelledby={`step-${step.id}-title`}
        >
            <div className="flex items-start gap-4">
                <motion.div
                    whileHover={{ rotate: 8 }}
                    className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md"
                    aria-hidden
                >
                    <Icon className="w-5 h-5" />
                </motion.div>

                <div>
                    <h3 id={`step-${step.id}-title`} className="font-bold text-lg sm:text-2xl text-gray-900">
                        {step.title}
                    </h3>

                    <p className="mt-1 text-sm sm:text-lg text-gray-600 max-w-3xl text-justify">{step.desc}</p>

                    {/* Details listing (if any) - always render the list container for consistent layout */}
                    {step.details.length > 0 && (
                        <ul className="mt-3 space-y-3 text-sm sm:text-lg">
                            {step.details.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-700">
                                    <span className="mt-1 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                                    <span>{d}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </motion.article>
    );
});
StepCard.displayName = "StepCard";

const ApplyPage: React.FC = () => {
    const steps: Step[] = useMemo(
        () => [
            {
                id: 1,
                title: "Purchase Application Form",
                desc:
                    "The admission form into Habnaj International Schools can only be obtained at the Admission Office on the school premises. Visit the school to obtain the  application form.",
                icon: FaFileAlt,
                details: [],
            },
            {
                id: 2,
                title: "Cost of Application Forms",
                desc: "Below are the forms you can obtain and their respective costs.",
                icon: FaTags,
                details: [
                    "Nursery Section — ₦2,500",
                    "Primary Section — ₦3,000",
                    "Secondary Section (JSS/SSS) — ₦5,000",
                    "Islamiyya School — ₦1,000",
                ],
            },
        ],
        []
    );

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner - simple decorative banner */}
            <header className="relative w-full h-[15vh] overflow-hidden" aria-hidden>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
            </header>

            {/* Content */}
            <section className="container mx-auto px-6 sm:px-8 py-8 lg:py-12" aria-labelledby="admission-heading">
                <div className="flex flex-col gap-4">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-40px" }}
                        variants={containerStagger}
                    >
                        <motion.h2 id="admission-heading" variants={itemFadeUp} className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Application & Admission Procedure
                        </motion.h2>

                        <motion.p variants={itemFadeUp} className="mt-3 text-gray-600 text-sm sm:text-lg max-w-3xl text-justify">
                            The admission process into Habnaj International Schools is straightforward and transparent. You can find the details of the
                            application process and the documents required for your child/ward to be considered for admission into our prestigious
                            school here.
                        </motion.p>

                        <div id="how-it-works" className="mt-8 flex flex-col gap-4">
                            {steps.map((s) => (
                                // StepCard is memoized to reduce re-renders
                                <StepCard key={s.id} step={s} />
                            ))}
                        </div>

                        {/* Requirements list */}
                        <motion.div variants={itemFadeUp} className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-sm sm:text-xl text-gray-900">Required Documents</h4>
                            <p className="mt-3 text-gray-600 text-sm sm:text-lg text-justify">
                                The documents listed below should be submitted together with the <span className="font-semibold text-red-500 italic">Application
                                    Form (properly filled)</span>:
                            </p>

                            <motion.ul
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                                className="mt-4 space-y-4 text-sm sm:text-lg text-gray-600"
                                aria-label="required-documents"
                            >
                                {[
                                    "Two (2) passport-size photographs",
                                    "Certified copy of birth certificate",
                                    "Copy of Immunization Card (for Creche, Play Class and Nursery applicants only)",
                                    "Last school report (for transfer applicants)",
                                ].map((r, i) => (
                                    <motion.li
                                        key={i}
                                        variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                                        className="flex items-start gap-3"
                                    >
                                        <span className="mt-1 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                                        <span>{r}</span>
                                    </motion.li>
                                ))}
                            </motion.ul>

                            {/**
               * If you later want a downloadable PDF or a link to external resources,
               * add a <Link> component (Next.js) or an <a> tag here.
               */}
                        </motion.div>

                        <motion.div variants={itemFadeUp} className="my-5">
                            <div className="text-xm sm:text-sm text-gray-500 mb-5">
                                <span className="font-bold text-red-500">Note:</span> A qualifying test may be given to transfer applicants to determine
                                proper placement. Assessment covers literacy, numeracy and age-appropriate skills.
                            </div>

                            <div className="text-xs text-gray-500">
                                <div>
                                    Need help? Contact our desk:
                                    <a
                                        href={`mailto:${CONTACT.email}`}
                                        className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline mx-5"
                                        aria-label={`Email ${CONTACT.email}`}
                                    >
                                        <FaEnvelope /> {CONTACT.email}
                                    </a>

                                    <a
                                        href={`tel:${CONTACT.phone}`}
                                        className="inline-flex items-center gap-2 text-sm font-bold hover:underline text-blue-500"
                                        aria-label={`Call ${CONTACT.phone}`}
                                    >
                                        <FaPhone /> {CONTACT.phone}
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* FAQ short */}
                        <motion.div variants={itemFadeUp} className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
                            <h4 className="font-semibold text-gray-900">Quick FAQ</h4>
                            <div className="mt-3 space-y-3 text-sm text-gray-700">
                                <details className="bg-gray-50 p-3 rounded">
                                    <summary className="font-medium">Can I apply after the deadline?</summary>
                                    <div className="mt-2 text-gray-600">
                                        Late applications are considered only in special circumstances with prior approval. You can contact our desk for more
                                        information:
                                        <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline mx-5">
                                            <FaEnvelope /> {CONTACT.email}
                                        </a>
                                        <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 text-sm font-bold hover:underline text-blue-500">
                                            <FaPhone /> {CONTACT.phone}
                                        </a>
                                    </div>
                                </details>

                                <details className="bg-gray-50 p-3 rounded">
                                    <summary className="font-medium">What payment methods are accepted?</summary>
                                    <p className="mt-2 text-gray-600">
                                        While obtaining the application form at the Admission Office, you can make payment by: cash, bank payment or bank
                                        transfer. Payment instructions/guides are provided during the application process.
                                    </p>
                                </details>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default ApplyPage;
