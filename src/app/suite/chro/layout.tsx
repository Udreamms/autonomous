'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CHRO_MENU } from '@/lib/department-nav';

export default function ChroLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CHRO_MENU} title="CHRO Office" colorClass="bg-rose-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
