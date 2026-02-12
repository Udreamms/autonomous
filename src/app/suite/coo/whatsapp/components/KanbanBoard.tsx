'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db, functions } from '@/lib/firebase'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable
import {
  collection, onSnapshot, addDoc, serverTimestamp, query,
  doc, deleteDoc, getDoc, setDoc, writeBatch, orderBy, updateDoc,
  collectionGroup, where, getDocs, Timestamp
} from 'firebase/firestore';
import Group from './Group';
import Card from './Card';
import ConversationModal from './ConversationModal';
import { CreateClientModal } from './CreateClientModal';
import { DuplicateManager } from '@/app/suite/cmo/crm/components/DuplicateManager';
import {
  Plus, Search, X, Users, MessageCircle, Filter, MoreHorizontal, ArrowLeft,
  PanelLeftClose, PanelLeftOpen, UserPlus, Download, RefreshCw, Settings, Instagram,
  Facebook, Globe, Ghost, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from 'next/navigation';

// --- Interfaces para Tipado ---
interface GroupData {
  id: string;
  name: string;
  order: number;
  color: string;
  createdAt: Timestamp;
}

interface CardData {
  id: string;
  groupId: string;
  contactName: string;
  contactNumber?: string;
  channel?: string;
  [key: string]: any;
}

const moveCard = httpsCallable(functions, 'moveCard');

const KanbanBoard = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CardData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false); // New State
  const [lastScrollPos, setLastScrollPos] = useState<number | null>(null);
  const [isDuplicateManagerOpen, setIsDuplicateManagerOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);

  useEffect(() => {
    const cardsQuery = query(collectionGroup(db, 'cards'));
    const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const allCardsFromDb = snapshot.docs.map(doc => {
        // Use Regex to safely extract groupId from path: kanban-groups/{groupId}/cards/{cardId}
        const match = doc.ref.path.match(/kanban-groups\/([^\/]+)\/cards/);
        const groupId = match ? match[1] : undefined;

        return {
          ...doc.data(),
          id: doc.id,
          groupId: groupId
        };
      }) as CardData[];
      setAllCards(allCardsFromDb);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const groupsQuery = query(collection(db, 'kanban-groups'), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as GroupData[];
      setGroups(groupsFromDb);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const contactsQuery = query(collection(db, 'contacts'));
    const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
      const contactsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setContacts(contactsFromDb);
    });
    return () => unsubscribe();
  }, []);

  // --- Real-time Data Sync (Kanban + CRM) ---
  const syncedCards = useMemo<CardData[]>(() => {
    return allCards.map(card => {
      // 1. Find the contact in CRM list
      const contactId = (card as any).contactId;
      let contact = null;

      if (contactId) {
        contact = contacts.find(c => c.id === contactId);
      }

      if (!contact && card.contactNumber) {
        const normalizedCardPhone = card.contactNumber.replace(/\D/g, '');
        if (normalizedCardPhone) {
          contact = contacts.find(c => (c.phone || '').replace(/\D/g, '') === normalizedCardPhone);
        }
      }

      // 2. If contact found, merge vital fields
      if (contact) {
        const c = contact as any;
        return {
          ...card,
          contactName: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || card.contactName,
          contactNumber: c.phone || card.contactNumber,
          email: c.email || card.email,
          company: c.company || card.company,
        };
      }
      return card;
    });
  }, [allCards, contacts]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const cardsQuery = query(
        collectionGroup(db, 'cards'),
        where('contactName', '>=', searchTerm),
        where('contactName', '<=', searchTerm + '\uf8ff')
      );
      const cardsSnapshot = await getDocs(cardsQuery);
      const results = cardsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, groupId: doc.ref.parent.parent?.id })) as CardData[];
      setSearchResults(results);
    };

    const debounceTimeout = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const handleAddGroup = async (e: any) => {
    e.preventDefault();
    if (newGroupName.trim() !== '') {
      await addDoc(collection(db, 'kanban-groups'), {
        name: newGroupName,
        order: groups.length,
        color: 'bg-neutral-900/50',
        createdAt: serverTimestamp()
      });
      setNewGroupName('');
    }
  };

  const [modalPosition, setModalPosition] = useState<DOMRect | null>(null);

  // Read chatId from URL (Redirected from Contacts Page)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialChatId = searchParams?.get('chatId');

  useEffect(() => {
    if (initialChatId && allCards.length > 0) {
      // 1. First, assume initialChatId is a Contact ID (CRM)
      const linkedContact = contacts.find(c => c.id === initialChatId);
      let cardToOpen = null;

      if (linkedContact) {
        // Find card by direct contactId field IF IT EXISTS, otherwise fallback to phone
        cardToOpen = (allCards.find(c => (c as any).contactId === linkedContact.id) as any) || null;

        if (!cardToOpen && linkedContact.phone) {
          const normalizedCRMPhone = linkedContact.phone.replace(/\D/g, '');
          cardToOpen = (allCards.find(c => {
            const cardPhone = (c.contactNumber || '').replace(/\D/g, '');
            return cardPhone === normalizedCRMPhone;
          }) as any) || null;
        }
      }

      // 2. If not found by CRM logic, check if it's a direct Card ID
      if (!cardToOpen) {
        cardToOpen = (allCards.find(c => c.id === initialChatId) as any) || null;
      }

      const foundCard = cardToOpen as CardData | null;

      if (foundCard) {
        // Find the group element to scroll and position
        const groupElement = scrollRef.current?.querySelector(`[data-group-id="${foundCard.groupId}"]`) as HTMLElement;
        if (groupElement) {
          scrollRef.current?.scrollTo({
            left: groupElement.offsetLeft - 16,
            behavior: 'auto'
          });
        }

        setSelectedCard(cardToOpen);
        // Clean URL without refresh
        window.history.replaceState({}, '', '/suite/coo/whatsapp');
      }
    }
  }, [initialChatId, allCards, contacts]);

  // ... (existing useEffects)

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleCardClick = (card: CardData, event?: React.MouseEvent) => {
    if (scrollRef.current) {
      // Save current scroll position before moving
      setLastScrollPos(scrollRef.current.scrollLeft);

      // Find the group element
      const groupElement = scrollRef.current.querySelector(`[data-group-id="${card.groupId}"]`) as HTMLElement;
      if (groupElement) {
        // Scroll to the group (left-aligned)
        scrollRef.current.scrollTo({
          left: groupElement.offsetLeft - 16, // Adjust for padding
          behavior: 'smooth'
        });

        if (event) {
          const rect = event.currentTarget.getBoundingClientRect();
          setModalPosition(rect);
        }

        setSelectedCard(card);
        setSearchTerm('');
        setSearchResults([]);
      }
    }
  };

  const handleCloseModal = () => {
    // Restore scroll position
    if (lastScrollPos !== null && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: lastScrollPos,
        behavior: 'smooth'
      });
      setLastScrollPos(null);
    }
    setSelectedCard(null);
    setModalPosition(null);
  };

  const handleUpdateGroupColor = async (groupId: string, color: string) => {
    const groupRef = doc(db, 'kanban-groups', groupId);
    await updateDoc(groupRef, { color });
  };

  function onDragStart(event: any) {
    if (event.active.data.current?.type === "GROUP") setActiveGroup(event.active.data.current.group);
    if (event.active.data.current?.type === "CARD") setActiveCard(event.active.data.current.card);
  }

  async function onDragEnd(event: any) {
    setActiveGroup(null);
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // --- Mover un Grupo ---
    if (active.data.current?.type === "GROUP") {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      if (oldIndex === newIndex) return;
      const newGroups = arrayMove(groups, oldIndex, newIndex);
      setGroups(newGroups);
      const batch = writeBatch(db);
      newGroups.forEach((group, index) => {
        const groupRef = doc(db, 'kanban-groups', group.id);
        batch.update(groupRef, { order: index });
      });
      await batch.commit();
    }

    // --- Mover una Tarjeta ---
    if (active.data.current?.type === "CARD") {
      const sourceGroupId = active.data.current?.card?.groupId;
      let destGroupId = over.id;

      // Si se suelta sobre otra tarjeta, usar el groupId de esa tarjeta
      if (over.data.current?.type === 'CARD') {
        destGroupId = over.data.current.card.groupId;
      }

      if (!sourceGroupId || !destGroupId || sourceGroupId === destGroupId) {
        return;
      }

      const cardId = active.id;

      // Llamada a la Cloud Function
      const promise = moveCard({ sourceGroupId, destGroupId, cardId });

      toast.promise(promise, {
        loading: 'Moviendo conversación...',
        success: 'Conversación movida con éxito.',
        error: (err) => `Error al mover: ${err.message}`,
      });
    }
  }

  // Calculate Channel Stats
  const channelStats = useMemo(() => {
    const stats = {
      whatsapp: 0,
      instagram: 0,
      messenger: 0,
      web: 0,
      facebook: 0,
      snapchat: 0,
      others: 0
    };
    syncedCards.forEach(card => {
      const channel = (card.channel || '').toLowerCase();
      const hasNumber = !!card.contactNumber;

      if (channel.includes('whatsapp') || channel === 'manual' || channel === 'csv import' || (hasNumber && !channel.includes('instagram'))) {
        stats.whatsapp++;
      } else if (channel.includes('instagram')) {
        stats.instagram++;
      } else if (channel.includes('messenger')) {
        stats.messenger++;
      } else if (channel.includes('web')) {
        stats.web++;
      } else if (channel.includes('facebook')) {
        stats.facebook++;
      } else if (channel.includes('snapchat')) {
        stats.snapchat++;
      } else {
        stats.others++;
      }
    });
    return stats;
  }, [syncedCards]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-hidden relative">
      <div className="px-6 py-3 border-b border-neutral-800/60 bg-neutral-950/50 backdrop-blur-md flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">Buzón</h1>

          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <MessageCircle size={11} className="text-blue-500" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-neutral-200">{allCards.length}</span>
                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Total</span>
              </div>
            </div>

            <div className="w-[1px] h-2.5 bg-neutral-800/50" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="text-emerald-500">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 2c-5.523 0-10 4.477-10 10 0 1.765.459 3.42 1.258 4.86l-1.289 4.704 4.819-1.264c1.404.757 3.012 1.196 4.722 1.196 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.411c-1.577 0-3.054-.429-4.327-1.178l-.31-.182-3.197.838.852-3.111-.2-.317c-.771-1.233-1.222-2.697-1.222-4.261 0-4.414 3.589-8.003 8.003-8.003 4.414 0 8.003 3.589 8.003 8.003 0 4.414-3.59 8.012-11.893 11.211z" /></svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.whatsapp}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">WhatsApp</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Instagram size={11} className="text-pink-500" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.instagram}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Instagram</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <MessageSquare size={11} className="text-blue-400" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.messenger}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Messenger</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Facebook size={11} className="text-blue-600" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.facebook}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Facebook</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Globe size={11} className="text-cyan-400" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.web}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Web</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Ghost size={11} className="text-yellow-400" />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-neutral-200">{channelStats.snapchat}</span>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Snapchat</span>
                </div>
              </div>
            </div>

            <div className="w-[1px] h-2.5 bg-neutral-800/50" />

            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-purple-500" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-neutral-200">{groups.length}</span>
                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Bandejas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isInputFocused ? 'text-blue-500' : 'text-neutral-500'}`} size={18} />
            <Input
              type="text"
              placeholder="Buscar en el buzón..."
              className="w-64 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 rounded-full pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-neutral-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-neutral-800 rounded-full" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </Button>
            )}
            {(isSearching || searchResults.length > 0) && searchTerm && (
              <div className="absolute top-full mt-2 w-[120%] -left-[10%] bg-neutral-900 rounded-xl border border-neutral-800 z-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {searchResults.map(card => (
                      <div key={card.id} className="p-3 hover:bg-neutral-800/80 cursor-pointer rounded-lg flex items-center gap-3 transition-colors" onClick={() => handleCardClick(card)}>
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-medium text-xs">
                          {card.contactName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-white">{card.contactName}</p>
                          <p className="text-xs text-neutral-500">{card.contactNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-500 font-medium">No se encontraron resultados</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-neutral-800 bg-blue-600/10 text-blue-400 hover:text-white hover:bg-blue-600 border-blue-600/20"
            onClick={() => setIsCreateClientOpen(true)}
            title="Crear Nuevo Cliente"
          >
            <UserPlus size={18} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800">
                <Filter size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800 text-neutral-200">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                Prioridad Alta
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                No Leídos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800 text-neutral-200">
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                className="focus:bg-neutral-800 focus:text-white cursor-pointer group"
                onClick={() => setIsDuplicateManagerOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4 opacity-50 group-hover:opacity-100" />
                <span>Gestionar Duplicados</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer group">
                <Download className="mr-2 h-4 w-4 opacity-50 group-hover:opacity-100" />
                <span>Exportar CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer group">
                <Settings className="mr-2 h-4 w-4 opacity-50 group-hover:opacity-100" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden relative">
        <motion.div
          key="kanban-board"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-grow flex overflow-hidden"
        >
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div
              ref={scrollRef}
              className="flex items-start flex-grow gap-4 pl-4 py-4 pr-0 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-800 relative"
            >
              <SortableContext items={groupIds}>
                {groups.map((group) => (
                  <Group
                    key={group.id}
                    group={group}
                    allGroups={groups}
                    onCardClick={handleCardClick}
                    onUpdateColor={handleUpdateGroupColor}
                    contacts={contacts}
                  />
                ))}
              </SortableContext>

              {/* Add Group Button */}
              <button
                onClick={async () => {
                  const name = window.prompt("Nombre de la nueva bandeja:");
                  if (name && name.trim()) {
                    await addDoc(collection(db, 'kanban-groups'), {
                      name: name.trim(),
                      order: groups.length,
                      color: 'bg-neutral-900/50',
                      createdAt: serverTimestamp()
                    });
                    toast.success(`Bandeja "${name}" creada.`);
                  }
                }}
                className="flex-shrink-0 w-56 h-[48px] rounded-xl border border-dashed border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40 transition-all flex items-center justify-center gap-2 group/add-lane mr-8 mt-2.5"
                title="Añadir otra bandeja"
              >
                <Plus className="w-4 h-4 text-neutral-600 group-hover/add-lane:text-blue-500 transition-colors" />
                <span className="text-xs font-medium text-neutral-600 group-hover/add-lane:text-neutral-400 transition-colors">Añadir otro grupo</span>
              </button>

              {/* Dynamic Spacer to allow scrolling when modal is open */}
              <AnimatePresence>
                {selectedCard && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 600, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex-shrink-0 h-full pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </div>

            {typeof document !== 'undefined' && createPortal(
              <DragOverlay>
                {activeGroup && <Group group={activeGroup} onCardClick={() => { }} onUpdateColor={() => { }} contacts={contacts} />}
                {activeCard && <Card card={activeCard} groupId={activeCard.groupId} onClick={() => { }} contacts={contacts} />}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </motion.div>

        <AnimatePresence>
          {selectedCard && (
            <ConversationModal
              isOpen={!!selectedCard}
              onClose={handleCloseModal}
              card={selectedCard ? (syncedCards.find(c => c.id === selectedCard.id) || selectedCard) : null}
              groups={groups}
              currentGroupName={selectedCard ? groups.find(g => g.id === selectedCard.groupId)?.name : undefined}
              allConversations={syncedCards.filter(c => {
                if (!c.groupId || !selectedCard?.groupId) return false;
                return c.groupId === selectedCard.groupId;
              })}
              onSelectConversation={(card) => {
                setSelectedCard(card);
              }}
              stats={{
                totalConversations: syncedCards.length,
                totalGroups: groups.length
              }}
              position={modalPosition}
              hideInternalTray={false}
              hideSidebar={true}
            />
          )}
        </AnimatePresence>
      </div>

      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        groups={groups}
      />

      <DuplicateManager
        isOpen={isDuplicateManagerOpen}
        onClose={() => setIsDuplicateManagerOpen(false)}
        contacts={contacts}
        onContactsUpdated={setContacts}
      />
    </div>
  );
};

export default KanbanBoard;
