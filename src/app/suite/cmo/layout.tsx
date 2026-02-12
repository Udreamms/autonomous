'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CMO_MENU } from '@/lib/department-nav';

export default function CmoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={CMO_MENU} title="CMO Office" colorClass="bg-pink-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
