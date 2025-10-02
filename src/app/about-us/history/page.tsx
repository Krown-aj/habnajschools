"use client";

import React, { useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaPhone, FaEnvelope, FaBasketballBall, FaFutbol, FaDesktop, FaUsers } from "react-icons/fa";
import { images } from "@/constants";
import { CONTACT } from "@/constants";

const PAGE_TITLE = "Our History";
const HERO_SUBTITLE = "The Legacy of Habnaj International Schools";
const FOUNDED_YEAR = 2011;

const CONTACT_EMAIL = CONTACT.email;
const CONTACT_PHONE = CONTACT.phone;

const HISTORY_TEXT = `Habnaj International School (originally Habnaj Model Academy) began in 2011 with a clear purpose: to deliver sound, affordable education in a calm, respectful learning environment. 
Initially operating from No. 19A Sa’ad Zungur Road, Off Old Jos Road (G.R.A., Bauchi), the school served daycare, nursery and primary pupils. In 2015 we relocated to our permanent site at Plot D12 Sam Njoma Street, G.R.A., Bauchi — a move that allowed steady growth in facilities and student numbers. 
Over time Habnaj has developed a reputation for producing academically able, well-mannered pupils. The secondary section was added in 2021 as a natural extension of that growth.`;

// Facilities now use images from your constants file
const FACILITIES = [
    { title: "Nursery Classroom", desc: "Caring environment for youngest pupils with play-based learning.", image: (images as any).nursery, alt: "Nursery Classroom", icon: <FaBook /> },
    { title: "Primary Classroom", desc: "Bright classrooms designed for early learners.", image: (images as any).primary, alt: "Primary Classroom", icon: <FaBook /> },
    { title: "Junior Secondary Classroom", desc: "Dedicated spaces for JSS teaching and labs.", image: (images as any).jss, alt: "Junior Secondary Classroom", icon: <FaUsers /> },
    /*  { title: "Senior Secondary Classroom", desc: "Senior classrooms and prep areas for exam-ready pupils.", image: (images as any).jss2, alt: "Senior Secondary Classroom", icon: <FaUsers /> }, */
    { title: "Computer Room", desc: "Equipped for ICT lessons and digital literacy.", image: (images as any).computerroom, alt: "Computer Room", icon: <FaDesktop /> },
    { title: "Basketball Court", desc: "Used for PE, games, tournaments and team building.", image: (images as any).basketball, alt: "Basketball Court", icon: <FaBasketballBall /> },
];

const container: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
};
const fadeUp: Variants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = ({ icon, title, subtitle, children }) => (
    <article className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-lg">
                {icon}
            </div>

            <div>
                <h3 className="text-base font-semibold">{title}</h3>
                {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
                {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
            </div>
        </div>
    </article>
);

type SelectedImage = { src: StaticImageData | string; alt?: string } | null;

const History: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<SelectedImage>(null);

    // prevent body scroll when modal is open
    useEffect(() => {
        if (selectedImage) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [selectedImage]);

    // close on ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedImage(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero */}
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">{PAGE_TITLE}</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">{HERO_SUBTITLE}</p>
                    </motion.div>
                </div>
            </header>

            {/* Main content */}
            <section className="container mx-auto px-6 sm:px-8 py-8 lg:py-14">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaBook />} title="Founded" subtitle={`Established in ${FOUNDED_YEAR}`}>
                            Habnaj began with a grounded mission to provide accessible, quality education.
                        </InfoCard>

                        <InfoCard icon={<FaPhone />} title="Contact">
                            <div className="text-sm">
                                <div>{CONTACT_PHONE}</div>
                                <div className="mt-1">
                                    <a className="text-blue-600 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                                </div>
                            </div>
                        </InfoCard>
                    </motion.div>

                    {/* Main column — about + history */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">About Habnaj International Schools</h2>
                            <p className="mt-3 text-sm text-gray-700 text-justify">
                                Habnaj International Schools delivers a broad curriculum from creche through senior secondary, balancing strong academics with character development, communication skills, and extracurricular opportunities that prepare learners for future success.
                            </p>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">A Brief History</h2>
                            <p className="mt-3 text-sm text-gray-700 whitespace-pre-line text-justify">{HISTORY_TEXT}</p>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Habnaj at a Glance — full-width bottom section */}
            <section className="w-full bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Habnaj International Schools at a Glance</h2>
                        <div className="text-sm text-gray-500 hidden sm:block">Facilities & highlights</div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">A quick look at the facilities that support learning, play and personal growth at Habnaj.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {FACILITIES.map((f) => (
                            <motion.button
                                key={f.title}
                                type="button"
                                onClick={() => setSelectedImage({ src: f.image, alt: f.alt })}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setSelectedImage({ src: f.image, alt: f.alt });
                                }}
                                variants={fadeUp}
                                className="group bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col p-0 text-left focus:outline-none"
                                aria-label={`Preview ${f.title}`}
                            >
                                <div className="relative w-full h-40 md:h-36 lg:h-40 flex-shrink-0">
                                    {f.image ? <Image src={f.image} alt={f.alt} fill className="object-cover" /> : <div className="w-full h-full bg-gray-100" />}
                                    <div className="absolute left-3 top-3 bg-white/85 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="text-base">{f.icon}</span>
                                        <span className="hidden sm:inline">{f.title}</span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                                    <p className="mt-2 text-sm text-gray-600 flex-1 text-justify">{f.desc}</p>

                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-600">Tap to preview</span>
                                        <span className="text-xs text-gray-400">Available to students</span>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modal preview */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={selectedImage.alt ?? "Image preview"}
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="relative z-50 w-full max-w-4xl mx-auto rounded-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-[60vh] sm:h-[70vh] bg-black flex items-center justify-center">
                            <Image src={selectedImage.src} alt={selectedImage.alt ?? "Preview"} fill className="object-contain" />
                        </div>

                        <div className="bg-white p-4 flex items-center justify-between">
                            <div className="text-sm text-gray-700">{selectedImage.alt}</div>
                            <div className="flex items-center gap-2">
                                {/* <Link href="#" onClick={(e) => e.preventDefault()} className="text-sm text-blue-600 hover:underline">More info</Link> */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedImage(null)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Want to learn more about our school?</h4>
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

export default History;
