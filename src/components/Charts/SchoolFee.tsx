"use client";

import Image from "next/image";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

// Example fee payments by a parent for his children in the current session (three terms)
const feeData = [
    { term: "First Term", paid: 50000, due: 20000 },
    { term: "Second Term", paid: 40000, due: 30000 },
    { term: "Third Term", paid: 60000, due: 15000 },
];

const SchoolFee = () => (
    <div className="bg-white rounded-xl w-full h-full p-4">
        <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">School Fee Payments (Current Session)</h1>
            <Image
                src="/assets/moreDark.png"
                alt="More options"
                width={20}
                height={20}
            />
        </div>

        <ResponsiveContainer width="100%" height="90%">
            <LineChart
                data={feeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis
                    dataKey="term"
                    axisLine={false}
                    tick={{ fill: "#d1d5db" }}
                    tickLine={false}
                    tickMargin={10}
                />
                <YAxis
                    axisLine={false}
                    tick={{ fill: "#d1d5db" }}
                    tickLine={false}
                    tickMargin={20}
                />
                <Tooltip />
                <Legend
                    align="center"
                    verticalAlign="top"
                    wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
                />
                <Line
                    type="monotone"
                    dataKey="paid"
                    name="Fees Paid"
                    stroke="#4ADE80"
                    strokeWidth={4}
                />
                <Line
                    type="monotone"
                    dataKey="due"
                    name="Fees Due"
                    stroke="#F87171"
                    strokeWidth={4}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export default SchoolFee;
