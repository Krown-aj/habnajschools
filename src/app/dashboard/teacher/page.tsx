"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Users, GraduationCap, BookOpen, FileText, ClipboardList, CheckSquare, TrendingUp } from "lucide-react";

import UserCard from "@/components/Card/UserCard";
import CountChartContainer from "@/components/Charts/CountChartContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";

interface TeacherDashboardData {
    stats: {
        mySubjects?: number;
        myLessons?: number;
        myStudents?: number;
        myClasses?: number;
        myAssignments?: number;
        myTests?: number;
        pendingTests?: number;
        completedTests?: number;
        mySubmissions?: number;
        students?: number;
        teachers?: number;
        parents?: number;
        recentStudents?: number;
        recentTeachers?: number;
        studentsByGender?: Array<{ gender: string; _count: { _all: number } }>;
    };
    charts: {
        attendance?: Array<{ name: string; present: number; absent: number }>;
        studentsByGender?: Array<{ gender: string; _count: { _all: number } }>;
    };
    recentActivity: {
        announcements: Array<{ id: string; title: string; description: string; date: string }>;
        events: Array<{ id: string; title: string; description: string; startTime: string; endTime: string }>;
    };
    currentTerm: {
        id: string;
        session: string;
        term: string;
        start: string;
        end: string;
        nextterm: string;
        daysOpen: number;
        status: string;
    } | null;
    timestamp: string;
}

const Teacher = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useMemo(() => {
        if (typeof window !== "undefined") {
            return new URLSearchParams(window.location.search);
        }
        return new URLSearchParams();
    }, []);

    const fetchedRef = useRef(false);

    const fetchDashboardData = useCallback(async () => {
        fetchedRef.current = true;
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/stats?role=teacher', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'default',
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setDashboardData(data as TeacherDashboardData);
            } else {
                throw new Error(data.details || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            console.error('Error fetching teacher dashboard data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data');

            // fallback minimal data
            setDashboardData({
                stats: {
                    mySubjects: 0,
                    myLessons: 0,
                    myStudents: 0,
                    myClasses: 0,
                    myAssignments: 0,
                    myTests: 0,
                    pendingTests: 0,
                    completedTests: 0,
                    mySubmissions: 0,
                    studentsByGender: [],
                },
                charts: { attendance: [], studentsByGender: [] },
                recentActivity: { announcements: [], events: [] },
                currentTerm: null,
                timestamp: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        if (session.user?.role !== 'teacher') {
            router.push(`/dashboard/${session.user?.role}`);
            return;
        }
        if (!fetchedRef.current) fetchDashboardData();
    }, [status, session?.user?.role, router, fetchDashboardData]);

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user?.role !== 'teacher') return null;

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => { fetchedRef.current = false; fetchDashboardData(); }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="p-4 lg:p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <GraduationCap className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome {session.user?.name ? ` ${session.user.name}` : ' Teacher'}!</h1>
                            <p className="text-gray-600">Here's your overview for {dashboardData?.currentTerm?.term} Term {dashboardData?.currentTerm?.session || 'Current'}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
                            <div>Updated: {new Date(dashboardData?.timestamp || '').toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* TEACHER CARDS */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
                    <UserCard
                        type="subject"
                        icon={BookOpen}
                        bgColor="bg-indigo-100"
                        color="text-indigo-600"
                        delta={`${dashboardData?.stats.mySubjects || 0} total`}
                        deltaLabel="subjects you teach"
                        data={{ count: dashboardData?.stats.mySubjects || 0 }}
                    />

                    <UserCard
                        type="lesson"
                        icon={ClipboardList}
                        bgColor="bg-emerald-100"
                        color="text-emerald-600"
                        delta={`${dashboardData?.stats.myLessons || 0} scheduled`}
                        deltaLabel="lessons"
                        data={{ count: dashboardData?.stats.myLessons || 0 }}
                    />

                    {/* <UserCard
                        type="student"
                        icon={Users}
                        bgColor="bg-purple-100"
                        color="text-purple-600"
                        delta={`${dashboardData?.stats.myStudents || 0} total`}
                        deltaLabel="students in your classes"
                        data={{ count: dashboardData?.stats.myStudents || 0 }}
                    /> */}

                    {/* <UserCard
                        type="assignment"
                        icon={FileText}
                        bgColor="bg-yellow-100"
                        color="text-yellow-600"
                        delta={`${dashboardData?.stats.myAssignments || 0} active`}
                        deltaLabel="assignments"
                        data={{ count: dashboardData?.stats.myAssignments || 0 }}
                    /> */}
                </div>

                <div className="flex gap-6 flex-col xl:flex-row">
                    <div className="w-full sm:w-2/3 flex flex-col gap-8">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="h-[450px] lg:col-span-2">
                                <CountChartContainer data={dashboardData?.charts.studentsByGender || []} />
                            </div>
                        </div>

                        {/* Announcments */}
                        <Announcements />


                    </div>

                    <div className="w-full sm:w-1/3 flex flex-col gap-8">
                        <EventCalendarContainer searchParams={Object.fromEntries(searchParams)} />
                        {/* Simple list of recent activity (announcements) */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-medium mb-3">Recent Announcements</h3>
                            <ul className="space-y-3">
                                {dashboardData?.recentActivity?.announcements?.length ? (
                                    dashboardData.recentActivity.announcements.map((a) => (
                                        <li key={a.id} className="border rounded p-3">
                                            <div className="font-medium">{a.title}</div>
                                            <div className="text-sm text-gray-500">{new Date(a.date).toLocaleString()}</div>
                                            <div className="text-sm mt-2 text-gray-700">{a.description}</div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">No recent announcements.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Teacher;
