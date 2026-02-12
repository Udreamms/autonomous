'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CEO_MENU } from '@/lib/department-nav';

export default function CeoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CEO_MENU} title="CEO Office" colorClass="bg-blue-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
