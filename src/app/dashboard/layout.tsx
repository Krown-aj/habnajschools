"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Divider } from "primereact/divider";
import Image from "next/image";
import Link from "next/link";
import { Menu as MenuIcon, X } from "lucide-react";

import Menu from "@/components/Navigation/Menu";
import Navbar from "@/components/Navigation/Navbar";

const DashboardLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/signin");
        }
    }, [session, status, router]);

    const toggleMenu = () => {
        setIsMenuCollapsed(prev => !prev);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    if (status === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <article className="h-screen flex bg-gray-100 text-gray-900 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* LEFT SIDEBAR - Desktop */}
            <aside className={`hidden md:flex bg-gradient-to-br from-gray-800 to-gray-900 text-white flex-col transition-all duration-300 ${isMenuCollapsed ? 'w-16' : 'w-64 xl:w-72'
                }`}>
                <div className={`flex gap-2 items-center ${isMenuCollapsed ? 'justify-center' : 'justify-between'} p-1 text-neutral-200 text-lg`}>
                    {/* Logo Section */}
                    {!isMenuCollapsed && (<Link
                        href="/"
                        className={`hidden lg:block flex items-center gap-3 px-4 lg:px-6 transition-all duration-300 ${isMenuCollapsed ? 'justify-center' : 'justify-center lg:justify-start'
                            }`}
                    >
                        <span className="font-bold text-xl text-white pt-6">Habnaj International</span>
                        <p className="text-xs text-gray-300 text-center mt-1">Schools - Information System.</p>
                    </Link>)}
                    <div onClick={toggleMenu} className='cursor-pointer w-6 h-6 text-white flex items-center justify-center'>
                        <MenuIcon className="w-6 h-6" />
                    </div>
                </div>

                <Divider className="border-gray-700" />

                {/* Menu Items */}
                <div className="w-full flex-1 overflow-y-auto">
                    <Menu isCollapsed={isMenuCollapsed} />
                </div>
            </aside>

            {/* LEFT SIDEBAR - Mobile Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-gray-800 to-gray-900 text-white flex flex-col transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
                        <Image
                            src="/assets/logo.png"
                            alt="Habnaj International Logo"
                            width={40}
                            height={40}
                        />
                        <div>
                            <span className="font-bold text-lg text-white pt-4">Habnaj International</span>
                            <p className="text-xs text-gray-300">Schools - Information System.</p>
                        </div>
                    </Link>
                    <button
                        onClick={closeMobileMenu}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>
                <Divider className="border-gray-700" />
                <div className="flex-1 overflow-y-auto">
                    <Menu isCollapsed={false} onMobileItemClick={closeMobileMenu} />
                </div>
            </aside>

            {/* RIGHT CONTENT */}
            <section className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
                <Navbar onMobileMenuToggle={toggleMobileMenu} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </section>
        </article>
    );
};

export default DashboardLayout;