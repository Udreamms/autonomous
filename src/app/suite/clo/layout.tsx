'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CLO_MENU } from '@/lib/department-nav';

export default function CloLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CLO_MENU} title="CLO Office" colorClass="bg-slate-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
