'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CFO_MENU } from '@/lib/department-nav';

export default function CfoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CFO_MENU} title="CFO Office" colorClass="bg-yellow-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
