import Header from "@/components/ui/header/header";
import Footer from "@/components/ui/footer/footer";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main
            className={`w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 font-[family-name:var(--font-geist-sans)]`}
        >
            <Header />
            {children}
            <Footer />
        </main>
    );
}
