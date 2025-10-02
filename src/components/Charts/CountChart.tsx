"use client";

import { Chart } from 'primereact/chart';
import { FaMale, FaFemale } from 'react-icons/fa';

interface CountChartProps {
    boys: number;
    girls: number;
}

const CountChart: React.FC<CountChartProps> = ({ boys, girls }) => {
    const total = boys + girls;

    const data = {
        labels: ['Girls', 'Boys'],
        datasets: [
            {
                data: [girls, boys],
                backgroundColor: ['#FAE27C', '#C3EBFA'],
                hoverBackgroundColor: ['#f7df7a', '#a9dcf2'],
                borderWidth: 0,
            },
        ],
    };

    const options = {
        cutout: '70%',
        plugins: {
            tooltip: { enabled: false },
            legend: {
                position: 'bottom' as const,
                labels: { boxWidth: 12, padding: 16 },
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="relative w-full h-64 bg-white rounded-xl p-4 dark:bg-white">
            <Chart type="doughnut" data={data} options={options} className="w-full h-full" />

            <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
                <div className="flex space-x-4 mb-1">
                    <FaFemale className="text-yellow-400 w-12 h-12" />
                    <FaMale className="text-sky-400   w-12 h-12" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                    {total}
                </span>
            </div>
        </div>
    );
};

export default CountChart;
