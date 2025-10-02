"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    FaUserPlus,
    FaFileAlt,
    FaCalendarCheck,
    FaGraduationCap,
    FaCheck,
} from "react-icons/fa";

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    details?: string[];
    color: string;
}

const steps: Step[] = [
    {
        icon: <FaFileAlt className="text-3xl" />,
        title: "Purchase Application Form",
        description:
            "Obtain the official application form from the admission office.",
        details: [
            "Nursery — ₦2,500",
            "Primary — ₦3,000",
            "Secondary — ₦5,000",
            "Islamiyya — ₦1,000",
            "Forms available at the admission office during working hours",
        ],
        color: "from-blue-500 to-blue-600",
    },
    {
        icon: <FaUserPlus className="text-3xl" />,
        title: "Submit Application",
        description:
            "Return the completed form to the admission office along with required documents.",
        details: [
            "2 passport-size photographs",
            "Birth certificate (photocopy)",
            "Medical certificate of fitness",
            "Last school report (for transfer applicants)",
            "Ensure all documents are legible as there will be verification of documents",
        ],
        color: "from-green-500 to-green-600",
    },
    {
        icon: <FaCalendarCheck className="text-3xl" />,
        title: "Assessment & Placement",
        description:
            "Some applicants (especially transfers) will be invited for testing to confirm placement.",
        details: [
            "Qualifying test to determine proper class placement",
            "Assessment covers literacy, numeracy and age-appropriate skills",
            "Parents will be informed of results and recommended class level",
        ],
        color: "from-purple-500 to-purple-600",
    },
    {
        icon: <FaGraduationCap className="text-3xl" />,
        title: "Admission & Enrollment",
        description:
            "Successful applicants complete enrollment and prepare for school attendance.",
        details: [
            "Complete payment of admission fees and any other required charges",
            "Graduates of Habnaj International Schools enjoy priority admission to the next level",
            "Receive timetable, uniform guidelines, and term start information",
        ],
        color: "from-orange-500 to-red-500",
    },
];

const GetStarted: React.FC = () => {
    return (
        <section className="w-full py-20 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                        How to Enroll into{" "}
                        <span className="text-yellow-400">Habnaj International Schools</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-blue-200 max-w-3xl mx-auto">
                        We admit children of all ages irrespective of tribe, religion, colour, or gender.
                        Follow these clear steps to apply and secure your child’s placement.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            className="relative"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.12 }}
                            viewport={{ once: true }}
                        >
                            {/* Step Number */}
                            <div className="absolute -top-4 -left-4 w-9 h-9 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center font-bold text-lg z-10 shadow">
                                {index + 1}
                            </div>

                            {/* Card */}
                            <motion.div
                                className="bg-white/6 backdrop-blur-sm rounded-2xl p-6 h-full border border-white/20 hover:bg-white/12 transition-all duration-300"
                                whileHover={{ y: -8, scale: 1.02 }}
                            >
                                {/* Icon */}
                                <motion.div
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center text-white mb-6 shadow-lg`}
                                    whileHover={{ rotate: 8 }}
                                >
                                    {step.icon}
                                </motion.div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-white leading-relaxed mb-4 text-sm text-justify">{step.description}</p>

                                {/* Nice listing for clarity */}
                                {step.details && (
                                    <ul className="space-y-2">
                                        {step.details.map((d, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="mt-1">
                                                    <FaCheck className="text-xs text-white/90" aria-hidden />
                                                </span>
                                                <span className="text-white text-sm leading-snug text-justify">{d}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>

                            {/* Connector Line (except for last item) */}
                            {index < steps.length - 1 && (
                                <motion.div
                                    className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-transparent"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "2rem" }}
                                    transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                                    viewport={{ once: true }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default GetStarted;
