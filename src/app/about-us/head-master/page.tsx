"use client";

import React, { memo, useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { FaBook, FaUsers, FaTrophy, FaPhone, FaEnvelope, FaGraduationCap, FaCog } from "react-icons/fa";
import { images } from "@/constants";
import { MANAGEMENT, CONTACT } from "@/constants";

const container: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
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

        if (input instanceof File || input instanceof Blob) {
            return null;
        }

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
                } catch (e) {
                    // ignore
                }
                setObjectUrl(null);
            };
        } else {
            if (objectUrl) {
                try {
                    URL.revokeObjectURL(objectUrl);
                } catch (e) {
                    // ignore
                }
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
    }, [src, objectUrl, placeholder]);

    return (
        <img
            src={currentSrc}
            alt={alt || name}
            className={`object-cover ${className}`}
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
            <header className="relative w-full h-[40vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/70 to-cyan-600/60" />
                <div className="relative z-10 container mx-auto px-6 sm:px-8 h-full flex items-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-white text-2xl sm:text-3xl font-extrabold">Meet the Head Master of Habnaj International Schools</h1>
                        <p className="mt-2 text-white/90 text-sm sm:text-lg max-w-3xl">Leadership focused on academic excellence, discipline and student development.</p>
                    </motion.div>
                </div>
            </header>

            <section className="container mx-auto px-6 sm:px-8 py-10 lg:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — quick facts */}
                    <motion.div variants={fadeUp} className="space-y-6">
                        <InfoCard icon={<FaGraduationCap />} title="Role" subtitle="Head Master since 2024">
                            {MANAGEMENT.headteacher.name} leads academic programs and ensures high standards across all levels.
                        </InfoCard>

                        <InfoCard icon={<FaCog />} title="Focus" subtitle="Student development & academic rigor">
                            Promoting effective teaching practices, strong assessment and a safe learning environment.
                        </InfoCard>

                        <InfoCard icon={<FaTrophy />} title="Achievements" subtitle="Improved outcomes & engagement">
                            Strengthened curriculum delivery and student performance through targeted programs and staff development.
                        </InfoCard>
                    </motion.div>

                    {/* Main content — biography, leadership philosophy, message */}
                    <motion.div variants={fadeUp} className="lg:col-span-2 space-y-8">
                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">About the Head Master</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.headteacher.name} has been serving as the Head Master of Habnaj International Schools since 2024 till date. With extensive experience in educational administration, he is committed to creating a disciplined but nurturing environment that promotes academic excellence, character development, and extracurricular participation across all school levels.
                            </p>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Leadership Philosophy</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.headteacher.name} advocates a balanced approach — rigorous academics complemented by character formation and extracurricular engagement.
                                He supports evidence-based teaching, inclusive policies and ongoing staff training to improve classroom outcomes.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Student-Centred Learning</h4>
                                    <p className="text-sm text-gray-600 mt-1">Differentiated instruction to meet varied learning needs.</p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900">Holistic Development</h4>
                                    <p className="text-sm text-gray-600 mt-1">Fostering academic, social and emotional growth.</p>
                                </div>
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                            {/* Head Master photo */}
                            <div className="w-full md:w-40 h-40 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <ImageWithFallback src={headTeacherImg} alt={`Head Master — ${MANAGEMENT.headteacher.name}`} className="w-full h-full" name={MANAGEMENT.headteacher.name} />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Message from the Head Master</h3>
                                <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                    Welcome to Habnaj International Schools. Our commitment is to create an environment where every child can excel academically, socially,
                                    and morally. We believe in nurturing curious minds, fostering leadership, and building a foundation for lifelong success. Together with our dedicated team of staff and supportive parents, we create an environment where every student is valued and empowered to reach their full potential.
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
                            </div>
                        </article>

                        <article className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">Commitment to Community</h2>
                            <p className="mt-3 text-sm text-gray-700" style={{ textAlign: "justify" }}>
                                {MANAGEMENT.headteacher.name} is dedicated to building a strong school environment by fostering collaboration between staff, students, and parents. He oversees extracurricular programs that enhance student engagement and ensures that health and safety protocols are strictly upheld to protect students.
                            </p>
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
                        <a href={`tel:${CONTACT.tel}`} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded">
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

export default HeadTeacherAboutOptimized;

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children?: React.ReactNode }> = memo(({ icon, title, subtitle, children }) => (
    <article className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center">
                <span className="inline-flex items-center justify-center h-6 w-6">
                    {icon}
                </span>
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
