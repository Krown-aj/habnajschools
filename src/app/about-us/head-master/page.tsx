"use client";

import React, { memo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaPhone, FaEnvelope, FaGraduationCap } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const container: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};
const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const ImageWithFallback: React.FC<{
    src?: string | null | { src?: string; url?: string } | File | Blob;
    alt?: string;
    className?: string;
    name?: string;
}> = ({ src, alt, className = "", name = "Profile" }) => {
    const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=512`;

    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [currentSrc, setCurrentSrc] = useState<string>(placeholder);
    const [erroredOnce, setErroredOnce] = useState(false);

    const resolveStringSrc = (input: any): string | null => {
        if (input == null) return null;
        if (typeof input === "string") {
            const t = input.trim();
            return t === "" ? null : t;
        }
        if (input instanceof File || input instanceof Blob) return null;
        if (typeof input === "object") {
            if (typeof input.src === "string" && input.src.trim() !== "") return input.src.trim();
            if (typeof input.url === "string" && input.url.trim() !== "") return input.url.trim();
        }
        return null;
    };

    useEffect(() => {
        if (src instanceof File || src instanceof Blob) {
            const url = URL.createObjectURL(src);
            setObjectUrl(url);
            return () => {
                try {
                    URL.revokeObjectURL(url);
                } catch { }
                setObjectUrl(null);
            };
        } else {
            if (objectUrl) {
                try {
                    URL.revokeObjectURL(objectUrl);
                } catch { }
                setObjectUrl(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    useEffect(() => {
        const resolved = resolveStringSrc(src);
        if (resolved) {
            setCurrentSrc(resolved);
            setErroredOnce(false);
            return;
        }
        if (objectUrl) {
            setCurrentSrc(objectUrl);
            setErroredOnce(false);
            return;
        }
        setCurrentSrc(placeholder);
        setErroredOnce(false);
    }, [src, objectUrl, placeholder, name]);

    return (
        <img
            src={currentSrc}
            alt={alt || name}
            className={`object-cover w-full h-full ${className}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
                if (!erroredOnce) {
                    setCurrentSrc(placeholder);
                    setErroredOnce(true);
                } else {
                    const t = e.currentTarget as HTMLImageElement;
                    t.removeAttribute("src");
                }
            }}
        />
    );
};

const HeadTeacherAboutOptimized: React.FC = () => {
    const headTeacherRaw = (images as any).headteacher ?? (images as any).headmaster;
    const headTeacherImg =
        typeof headTeacherRaw === "string" || headTeacherRaw instanceof File || headTeacherRaw instanceof Blob
            ? headTeacherRaw
            : headTeacherRaw?.src ?? "/assets/musa.jpg";

    return (
        <main className="w-full min-h-screen bg-gray-50 text-gray-900">
            {/* Hero / Banner */}
            <header className="relative w-full h-[36vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meet the Head Master of Habnaj International Schools</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Leadership focused on academic excellence, discipline and student development.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: image (moderate) then compact about below it */}
                    <motion.div variants={fadeUp} className="lg:col-span-1 space-y-4">
                        <article className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <div className="w-full bg-gray-100 h-56 sm:h-64 md:h-90 overflow-hidden">
                                <ImageWithFallback src={headTeacherImg} alt={`Head Master — ${MANAGEMENT.headteacher.name}`} className="" name={MANAGEMENT.headteacher.name} />
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-4 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">About the Head Master</h2>
                            <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.headteacher.name} has been serving as the Head Master of Habnaj International Schools since 2024. He brings experience in educational
                                administration and focuses on building a disciplined, nurturing environment that supports academic excellence and character formation.
                            </p>
                        </article>
                    </motion.div>

                    {/* Right column: Leadership Philosophy with Role & Commitment boxes */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Leadership Philosophy</h2>
                            <p className="mt-2 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.headteacher.name} advocates a balanced approach — rigorous academics complemented by character formation and extracurricular engagement.
                                He supports evidence-based teaching, inclusive policies and ongoing staff training to improve classroom outcomes.
                            </p>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Role</h4>
                                    <p className="text-sm text-gray-600 mt-1">Head Master since 2024 — leads academic programmes and ensures high standards across all levels.</p>
                                </div>

                                <div className="p-3 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Commitment</h4>
                                    <p className="text-sm text-gray-600 mt-1">Fostering student development, staff support and a safe learning environment for all pupils.</p>
                                </div>
                            </div>
                        </article>

                        {/* Message card */}
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Message from the Head Master</h3>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                Welcome to Habnaj International Schools. Our commitment is to create an environment where every child can excel academically, socially, and morally.
                                We nurture curious minds, foster leadership, and build a foundation for lifelong success through collaboration with staff and parents.
                            </p>

                            <div className="mt-4">
                                <div className="text-sm text-gray-600 font-medium">— {MANAGEMENT.headteacher.name}</div>
                                <div className="text-xs text-gray-400">Head Master, Habnaj International Schools</div>
                            </div>

                            <div className="mt-5">
                                <Link href="/about-us/mission-vision" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2">
                                    <FaBook /> Our Mission & Vision
                                </Link>
                            </div>
                        </article>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-semibold">Have questions about our school?</h4>
                        <p className="text-sm text-gray-600 mt-1">Contact our desk for more information.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded">
                            <FaPhone /> {CONTACT.phone}
                        </a>
                        <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 px-3 py-2 text-blue-500">
                            <FaEnvelope /> {CONTACT.email}
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default HeadTeacherAboutOptimized;

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = memo(({ icon, title, subtitle, children }) => (
    <article className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                <span className="inline-flex items-center justify-center h-5 w-5">{icon}</span>
            </div>

            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
                {children && <p className="mt-2 text-sm text-gray-600" style={{ textAlign: "justify" }}>{children}</p>}
            </div>
        </div>
    </article>
));
InfoCard.displayName = "InfoCard";
