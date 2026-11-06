"use client";

import React, { memo, useEffect, useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { FaUniversity, FaSchool, FaUserGraduate } from "react-icons/fa";
import { CONTACT, ACCOUNT } from "@/constants";

type TermKey = "first" | "second" | "third";

type FeeSchedule = {
    schoolFees: number;
    textbooks: number;
    writingMaterials?: number;
    exerciseBooks?: number;
    peDress: number;
    uniform: number;
    himar: number;
    cardigan: number;
    developmentFee: number;
    examsFee: number;
    ictCharges: number;
};

type ClassItem = {
    id: string;
    name: string;
    schedule: Record<TermKey, FeeSchedule>;
};

type Section = {
    id: string;
    title: string;
    subtitle?: string;
    paymentMethods?: string[];
    icon: React.ReactNode;
    classes: ClassItem[];
};

const containerStagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemFadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } };

const currency = (n: number | string) => (typeof n === "string" ? n : `₦${n.toLocaleString()}`);

const NavItem: React.FC<{ title: string; active: boolean; onClick: () => void }> = memo(({ title, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${active ? "bg-blue-50 border border-blue-200 text-blue-700" : "hover:bg-gray-50"
            }`}
        aria-pressed={active}
    >
        {title}
    </button>
));
NavItem.displayName = "NavItem";

const FeesPage: React.FC = () => {
    const sections = useMemo<Section[]>(
        () => [
            {
                id: "nursery",
                title: "Nursery Section",
                subtitle: "Pre-Nursery → Nursery 3",
                paymentMethods: ["Bank deposit / transfer", "Cash payment"],
                icon: <FaUniversity className="text-2xl" aria-hidden />,
                classes: [
                    {
                        id: "pre-nursery",
                        name: "Pre-Nursery",
                        schedule: {
                            first: {
                                schoolFees: 25000,
                                textbooks: 16000,
                                peDress: 4500,
                                uniform: 6000,
                                himar: 1500,
                                cardigan: 5000,
                                developmentFee: 1000,
                                examsFee: 5000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "nursery-1",
                        name: "Nursery 1",
                        schedule: {
                            first: {
                                schoolFees: 25000,
                                textbooks: 22100,
                                peDress: 4500,
                                uniform: 7000,
                                himar: 1500,
                                cardigan: 5000,
                                developmentFee: 1000,
                                examsFee: 5000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 55000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "nursery-2",
                        name: "Nursery 2",
                        schedule: {
                            first: {
                                schoolFees: 25000,
                                textbooks: 23100,
                                peDress: 4500,
                                uniform: 8000,
                                himar: 1500,
                                cardigan: 5000,
                                developmentFee: 1000,
                                examsFee: 5000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "nursery-3",
                        name: "Nursery 3",
                        schedule: {
                            first: {
                                schoolFees: 57000,
                                textbooks: 24100,
                                peDress: 4500,
                                uniform: 9000,
                                himar: 1500,
                                cardigan: 5000,
                                developmentFee: 1000,
                                examsFee: 5000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 25000,
                                textbooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                ],
            },

            {
                id: "primary",
                title: "Primary Section",
                subtitle: "Primary 1 → Primary 5",
                paymentMethods: ["Bank deposit / transfer", "Cash payment"],
                icon: <FaSchool className="text-2xl" aria-hidden />,
                classes: [
                    {
                        id: "primary-1",
                        name: "Primary 1",
                        schedule: {
                            first: {
                                schoolFees: 30000,
                                textbooks: 22650,
                                exerciseBooks: 4800,
                                peDress: 6000,
                                uniform: 12000,
                                himar: 1500,
                                cardigan: 7000,
                                developmentFee: 1000,
                                examsFee: 6000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "primary-2",
                        name: "Primary 2",
                        schedule: {
                            first: {
                                schoolFees: 30000,
                                textbooks: 27350,
                                exerciseBooks: 4800,
                                peDress: 6000,
                                uniform: 12000,
                                himar: 1500,
                                cardigan: 7000,
                                developmentFee: 1000,
                                examsFee: 6000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "primary-3",
                        name: "Primary 3",
                        schedule: {
                            first: {
                                schoolFees: 30000,
                                textbooks: 29750,
                                exerciseBooks: 5300,
                                peDress: 6000,
                                uniform: 12000,
                                himar: 1500,
                                cardigan: 8000,
                                developmentFee: 1000,
                                examsFee: 6000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "primary-4",
                        name: "Primary 4",
                        schedule: {
                            first: {
                                schoolFees: 30000,
                                textbooks: 30750,
                                exerciseBooks: 5300,
                                peDress: 6000,
                                uniform: 18000,
                                himar: 1500,
                                cardigan: 8000,
                                developmentFee: 1000,
                                examsFee: 6000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "primary-5",
                        name: "Primary 5",
                        schedule: {
                            first: {
                                schoolFees: 30000,
                                textbooks: 30750,
                                exerciseBooks: 5300,
                                peDress: 6000,
                                uniform: 18000,
                                himar: 1500,
                                cardigan: 8000,
                                developmentFee: 1000,
                                examsFee: 6000,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 30000,
                                textbooks: 0,
                                exerciseBooks: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                ],
            },

            {
                id: "junior",
                title: "Junior Secondary School",
                subtitle: "JSS 1 → JSS 3",
                paymentMethods: ["Bank deposit / transfer", "Cash payment"],
                icon: <FaUserGraduate className="text-2xl" aria-hidden />,
                classes: [
                    {
                        id: "jss-1",
                        name: "JSS 1",
                        schedule: {
                            first: {
                                schoolFees: 40000,
                                textbooks: 37650,
                                writingMaterials: 6500,
                                peDress: 11000,
                                uniform: 12000,
                                himar: 2000,
                                cardigan: 12000,
                                developmentFee: 1000,
                                examsFee: 7500,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "jss-2",
                        name: "JSS 2",
                        schedule: {
                            first: {
                                schoolFees: 40000,
                                textbooks: 37650,
                                writingMaterials: 6500,
                                peDress: 11000,
                                uniform: 12000,
                                himar: 2000,
                                cardigan: 12000,
                                developmentFee: 1000,
                                examsFee: 7500,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                    {
                        id: "jss-3",
                        name: "JSS 3",
                        schedule: {
                            first: {
                                schoolFees: 40000,
                                textbooks: 37650,
                                writingMaterials: 6500,
                                peDress: 11000,
                                uniform: 12000,
                                himar: 2000,
                                cardigan: 12000,
                                developmentFee: 1000,
                                examsFee: 7500,
                                ictCharges: 5000,
                            },
                            second: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                            third: {
                                schoolFees: 40000,
                                textbooks: 0,
                                writingMaterials: 0,
                                peDress: 0,
                                uniform: 0,
                                himar: 0,
                                cardigan: 0,
                                developmentFee: 0,
                                examsFee: 0,
                                ictCharges: 0,
                            },
                        },
                    },
                ],
            },
        ],
        []
    );

    const [activeId, setActiveId] = useState<string>(sections[0].id);
    const [selectedClassId, setSelectedClassId] = useState<string>(sections[0].classes[0].id);
    const [selectedTerm, setSelectedTerm] = useState<TermKey>("first");

    useEffect(() => {
        const sec = sections.find((s) => s.id === activeId);
        if (sec && sec.classes.length > 0) {
            setSelectedClassId(sec.classes[0].id);
        }
    }, [activeId, sections]);

    const active = sections.find((s) => s.id === activeId) || sections[0];
    const selectedClass = active.classes.find((c) => c.id === selectedClassId) || active.classes[0];

    const termLabel = (t: TermKey) => (t === "first" ? "First Term" : t === "second" ? "Second Term" : "Third Term");

    // Build rows per requested order / labels per section
    const buildRowsFor = (section: Section, classItem: ClassItem, term: TermKey) => {
        const schedule = classItem.schedule[term];

        // decide PE label: nursery => "PE dress", primary/junior => "Sport wear"
        const peLabel = section.id === "nursery" ? "PE dress" : "Sport wear";

        const rows: { label: string; amount: number | string }[] = [];

        if (section.id === "nursery") {
            rows.push({ label: "School Fees", amount: schedule.schoolFees });
            rows.push({ label: "Text Books & Writing Materials", amount: schedule.textbooks });
            rows.push({ label: "PE dress", amount: schedule.peDress });
            rows.push({ label: "Uniform", amount: schedule.uniform });
            rows.push({ label: "Himar", amount: schedule.himar });
            rows.push({ label: "Cardigan", amount: schedule.cardigan });
            rows.push({ label: "Development Fee", amount: schedule.developmentFee });
            rows.push({ label: "Exam Fee", amount: schedule.examsFee });
            rows.push({ label: "ICT charges", amount: schedule.ictCharges });
        } else if (section.id === "primary") {
            rows.push({ label: "School Fees", amount: schedule.schoolFees });
            rows.push({ label: "Text Books", amount: schedule.textbooks });
            rows.push({ label: "Exercise Books", amount: schedule.exerciseBooks ?? 0 });
            rows.push({ label: "Cardigan", amount: schedule.cardigan });
            rows.push({ label: "Uniforms", amount: schedule.uniform });
            rows.push({ label: "Himar", amount: schedule.himar });
            rows.push({ label: "Development Fee", amount: schedule.developmentFee });
            rows.push({ label: "ICT charges", amount: schedule.ictCharges });
            rows.push({ label: "Examination Fee", amount: schedule.examsFee });
            rows.push({ label: "Sport wear", amount: schedule.peDress });
        } else {
            rows.push({ label: "School Fees", amount: schedule.schoolFees });
            rows.push({ label: "Text Books", amount: schedule.textbooks });
            rows.push({ label: "Writing Materials", amount: schedule.writingMaterials ?? 0 });
            rows.push({ label: "Cardigan", amount: schedule.cardigan });
            rows.push({ label: "Uniforms", amount: schedule.uniform });
            rows.push({ label: "Himar", amount: schedule.himar });
            rows.push({ label: "Development Fee", amount: schedule.developmentFee });
            rows.push({ label: "ICT charges", amount: schedule.ictCharges });
            rows.push({ label: "Exams Fee", amount: schedule.examsFee });
            rows.push({ label: "Sport wear", amount: schedule.peDress });
        }

        const total = rows.reduce((acc, r) => acc + (typeof r.amount === "number" ? r.amount : 0), 0);
        rows.push({ label: "Total", amount: total });

        return rows;
    };

    const rows = buildRowsFor(active, selectedClass, selectedTerm);

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Banner */}
            <header className="relative w-full h-[15vh] overflow-hidden" aria-hidden>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
            </header>

            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Mobile section selector */}
                <div className="lg:hidden mb-4">
                    <label htmlFor="fees-section-select" className="sr-only">
                        Choose section
                    </label>
                    <select id="fees-section-select" className="w-full rounded-md border-gray-200 px-3 py-2 text-sm" value={activeId} onChange={(e) => setActiveId(e.target.value)}>
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar (lg+) */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start">
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sections</h3>
                            <div className="space-y-2">{sections.map((s) => <NavItem key={s.id} title={s.title} active={s.id === activeId} onClick={() => setActiveId(s.id)} />)}</div>
                        </div>

                        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900">Payment Methods</h4>
                            <p className="mt-2 text-sm text-gray-600">1. Bank deposit/transfer (preferred)</p>
                            <p className="mt-2 text-sm text-gray-600">2. Cash payment</p>
                            <p className="mt-2 text-sm text-gray-600">3. POS at the school office.</p>

                            <h5 className="mt-4 font-bold text-gray-900">School Accounts (Bank Transfer)</h5>
                            <ul className="mt-2 text-sm text-gray-700 space-y-2">
                                {ACCOUNT.map((a, i) => (
                                    <li key={i} className="flex flex-col items-start gap-3">
                                        <div className="font-medium"><span className="font-bold">Bank:</span> {a.bank}</div>
                                        <div className="text-gray-600"><span className="font-bold">Account Name:</span> {a.name}</div>
                                        <div className="text-gray-600"><span className="font-bold">Account Number:</span> {a.number}</div>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 text-xs text-gray-500">
                                <em className="font-bold capitalize">NOTE:</em> When making bank transfers, include the student name and class in the narration and bring/share the teller/transfer evidence to the cashier.
                            </div>
                        </div>

                        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-900">Quick Notes</h4>
                            <ul className="mt-3 text-sm text-gray-600 space-y-2">
                                <li>Fees shown are per term unless stated otherwise.</li>
                                <li>Keep official receipts for all payments.</li>
                            </ul>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="col-span-1 lg:col-span-9">
                        <motion.article initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerStagger} className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow">
                                    {active.icon}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{active.title}</h2>
                                            {active.subtitle && <div className="text-xs text-gray-500 mt-1">{active.subtitle}</div>}
                                        </div>

                                        <div className="text-sm text-gray-600 hidden sm:block">
                                            <div className="font-medium">Preferred payment</div>
                                            <div className="mt-1 text-xs text-gray-500">{active.paymentMethods?.join(" • ")}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <h4 className="font-semibold text-gray-900">Fees Breakdown</h4>

                                            {/* class selector + term selector */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <label htmlFor="class-select" className="sr-only">Select class</label>
                                                    <select id="class-select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full sm:w-auto rounded-md border-gray-200 px-2 py-1 text-sm">
                                                        {active.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>

                                                    <label htmlFor="term-select" className="sr-only">Select term</label>
                                                    <select id="term-select" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value as TermKey)} className="w-full sm:w-auto rounded-md border-gray-200 px-2 py-1 text-sm">
                                                        <option value="first">First Term</option>
                                                        <option value="second">Second Term</option>
                                                        <option value="third">Third Term</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop/table view (sm+) */}
                                        <div className="mt-3 overflow-auto rounded-lg border border-gray-100 hidden sm:block">
                                            <table className="min-w-full w-full text-sm text-left table-fixed">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 w-12 sm:w-16">S/N</th>
                                                        <th className="px-4 py-3 w-2/3">Item</th>
                                                        <th className="px-4 py-3 text-right">Amount</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {rows.map((r, idx) => {
                                                        const isTotal = idx === rows.length - 1;
                                                        const serial = isTotal ? "" : `${idx + 1}.`;
                                                        return (
                                                            <tr key={r.label} className={`border-t border-gray-100 ${isTotal ? "bg-gray-50" : ""}`}>
                                                                <td className="px-4 py-3 align-top text-right text-gray-700" style={{ minWidth: 56 }}>
                                                                    {serial}
                                                                </td>
                                                                <td className={`px-4 py-3 align-top ${isTotal ? "font-semibold" : "font-medium"} text-gray-700`}>{r.label}</td>
                                                                <td className={`px-4 py-3 align-top text-right ${isTotal ? "font-semibold text-gray-900" : "text-gray-700"}`}>{typeof r.amount === "number" ? currency(r.amount) : r.amount}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile stacked view */}
                                        <div className="mt-3 space-y-2 sm:hidden">
                                            {rows.map((r, idx) => {
                                                const isTotal = idx === rows.length - 1;
                                                return (
                                                    <div key={r.label} className={`bg-white rounded-lg p-3 flex items-center justify-between ${isTotal ? "border border-gray-200" : "border-b border-gray-100"}`}>
                                                        <div>
                                                            <div className={`text-sm ${isTotal ? "font-semibold" : "font-medium"} text-gray-700`}>{r.label}</div>
                                                            {!isTotal && <div className="text-xs text-gray-500 mt-0.5">{idx + 1}.</div>}
                                                        </div>
                                                        <div className={`text-sm ${isTotal ? "font-semibold text-gray-900" : "text-gray-700"}`}>{typeof r.amount === "number" ? currency(r.amount) : r.amount}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-4 text-sm text-gray-600">
                                            <p>
                                                <strong>Note:</strong> Totals reflect the sum of the fee line-items shown above. For installment plans or special cases please contact the School's Cashier to request the official fee schedule.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.article>

                        {/* Mobile-only payment + notes */}
                        <div className="lg:hidden mt-6 space-y-4">
                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-900">Payment Methods</h4>
                                <p className="mt-2 text-sm text-gray-600">Accepted: Bank deposit/transfer (preferred), Cash payment, POS at the school office.</p>

                                <h5 className="mt-4 font-medium text-gray-900">School Accounts (Bank Transfer)</h5>
                                <ul className="mt-2 text-sm text-gray-700 space-y-2">
                                    {ACCOUNT.map((a, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="font-medium">{a.bank}</div>
                                            <div className="text-gray-600">{a.name} — <span className="font-mono">{a.number}</span></div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-3 text-xs text-gray-500">
                                    <em>Note:</em> Include student name & class in transfer narration and keep proof of payment.
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 shadow-sm">
                                <h4 className="font-semibold text-gray-900">Quick Notes</h4>
                                <ul className="mt-3 text-sm text-gray-600 space-y-2">
                                    <li>Fees shown are per term unless stated otherwise.</li>
                                    <li>Keep official receipts for all payments.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Contact block */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemFadeUp} className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900">Contact</h4>
                                    <p className="mt-2 text-sm text-gray-700">For more information on fee structure and payment, you can make your enquiries through:</p>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-700">
                                <p>
                                    <a href={`mailto:${CONTACT.email}`} className="text-blue-600 underline">{CONTACT.email}</a> | Phone: <a href={`tel:${CONTACT.tel}`} className="text-blue-600 underline">{CONTACT.phone}</a>
                                </p>
                            </div>
                        </motion.div>
                    </main>
                </div>
            </section>
        </main>
    );
};

export default FeesPage;
