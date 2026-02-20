import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    group: any;
    cards: any[];
    onCardClick: (card: any) => void;
}

export const KanbanColumn = ({ group, cards, onCardClick }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: { type: 'group', group }
    });

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-[320px] flex flex-col h-full bg-neutral-900/30 border-r border-white/5 backdrop-blur-sm">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-white/5 bg-neutral-900/40">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", group.color ? `bg-${group.color}-500` : "bg-blue-500")} />
                    <h3 className="font-semibold text-neutral-200 text-xs uppercase tracking-wider">{group.name}</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] font-mono text-neutral-500">
                        {cards.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white hover:bg-white/5">
                        <Plus size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white hover:bg-white/5">
                        <MoreHorizontal size={12} />
                    </Button>
                </div>
            </div>

            {/* Content using SortableContext */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <SortableContext
                    items={cards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            onClick={() => onCardClick(card)}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 && (
                    <div className="h-24 rounded-lg border border-dashed border-white/5 flex items-center justify-center opacity-30">
                        <span className="text-neutral-500 text-[10px font-mono uppercase">Vacío</span>
                    </div>
                )}
            </div>
        </div>
    );
};
