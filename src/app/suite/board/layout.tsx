'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { BOARD_MENU } from '@/lib/department-nav';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen">
            <DepartmentSidebar items={BOARD_MENU} title="Board of Directors" colorClass="bg-slate-500" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
