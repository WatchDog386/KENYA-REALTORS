import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const TechnicianEarnings = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">My Earnings</h1>
                    <p className="text-slate-500 font-medium">Track your income and payment history.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Earnings Dashboard Coming Soon</h3>
                <p className="text-slate-500 text-center max-w-md">
                    We are building a comprehensive dashboard for you to track your completed jobs and earnings.
                </p>
            </Card>
        </div>
    );
};

export default TechnicianEarnings;
