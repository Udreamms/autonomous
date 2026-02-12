'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CPO_MENU } from '@/lib/department-nav';

export default function CpoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CPO_MENU} title="CPO Office" colorClass="bg-indigo-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
