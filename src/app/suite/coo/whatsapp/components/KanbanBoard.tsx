import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { KanbanHeader } from './KanbanHeader';
import { KanbanColumn } from './KanbanColumn';
import Card from './Card';
import ConversationModal from './ConversationModal';
import { useSidebar } from '@/components/SidebarContext';

export default function KanbanBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isCollapsed, toggleSidebar } = useSidebar();
  const { groups, cards, loading, handleDragEnd } = useKanbanBoard(searchTerm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const activeCard = useMemo(() => cards.find(c => c.id === activeId), [cards, activeId]);

  const channelStats = useMemo(() => {
    const stats = {
      whatsapp: 0, instagram: 0, messenger: 0, web: 0, facebook: 0,
      snapchat: 0, x: 0, tiktok: 0, telegram: 0, others: 0
    };
    cards.forEach(card => {
      const channel = (card.channel || card.source || card.primary_channel || '').toLowerCase();
      const hasNumber = !!card.contactNumber;

      if (channel.includes('whatsapp') || channel === 'manual' || (hasNumber && !channel.includes('instagram') && !channel.includes('telegram'))) {
        stats.whatsapp++;
      } else if (channel.includes('instagram')) stats.instagram++;
      else if (channel.includes('messenger')) stats.messenger++;
      else if (channel.includes('web')) stats.web++;
      else if (channel.includes('facebook')) stats.facebook++;
      else if (channel.includes('snapchat')) stats.snapchat++;
      else if (channel.includes('x') || channel.includes('twitter')) stats.x++;
      else if (channel.includes('tiktok')) stats.tiktok++;
      else if (channel.includes('telegram')) stats.telegram++;
      else stats.others++;
    });
    return stats;
  }, [cards]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] overflow-hidden">
      <KanbanHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        channelStats={channelStats}
        isSidebarCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full min-w-max">
            {groups.map(group => (
              <KanbanColumn
                key={group.id}
                group={group}
                cards={cards.filter(c => c.groupId === group.id)}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard ? <Card card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={selectedCard}
        groupName={groups.find(g => g.id === selectedCard?.groupId)?.name}
        groups={groups}
        allConversations={cards} // Pass all cards for the internal inbox list
        onSelectConversation={(card) => setSelectedCard(card)}
        stats={{ totalConversations: cards.length, totalGroups: groups.length }}
      />
    </div>
  );
}
