'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import Card from './Card';
import { Plus, Trash2, MoreVertical, Palette, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { SelectContactModal } from './SelectContactModal';
import { CreateClientModal } from './CreateClientModal';

// --- Types ---
interface CardData {
    id: string;
    groupId: string;
    contactName: string;
    lastMessage: string;
    channel: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messages: any[];
}

const colors = [
    { name: 'Predeterminado', value: 'bg-[#121212]/50', cardColor: 'bg-[#181818]/50', textColor: 'text-neutral-400', pill: 'bg-neutral-800' },
    { name: 'Gris', value: 'bg-[#1a1a1a]', cardColor: 'bg-[#222222]', textColor: 'text-neutral-400', pill: 'bg-[#2a2a2a]' },
    { name: 'Naranja', value: 'bg-[#1c1811]', cardColor: 'bg-[#241f16]', textColor: 'text-orange-400', pill: 'bg-[#3a2a1a]' },
    { name: 'Amarillo', value: 'bg-[#1c1b11]', cardColor: 'bg-[#242316]', textColor: 'text-yellow-400', pill: 'bg-[#3a351a]' },
    { name: 'Verde', value: 'bg-[#111814]', cardColor: 'bg-[#16211b]', textColor: 'text-emerald-400', pill: 'bg-[#1a3a2a]' },
    { name: 'Azul', value: 'bg-[#111418]', cardColor: 'bg-[#161b21]', textColor: 'text-blue-400', pill: 'bg-[#1a2a3a]' },
    { name: 'Púrpura', value: 'bg-[#18111c]', cardColor: 'bg-[#211624]', textColor: 'text-purple-400', pill: 'bg-[#2a1a3a]' },
    { name: 'Rosa', value: 'bg-[#1c1114]', cardColor: 'bg-[#24161b]', textColor: 'text-pink-400', pill: 'bg-[#3a1a25]' },
    { name: 'Rojo', value: 'bg-[#1c1111]', cardColor: 'bg-[#241616]', textColor: 'text-rose-400', pill: 'bg-[#3a1a1a]' },
];

interface KanbanColumnProps {
    group: any;
    cards: any[];
    allGroups?: any[];
    onCardClick: (card: any) => void;
    onUpdateColor?: (groupId: string, color: string) => void;
    contacts?: any[];
    isCompact?: boolean;
}

export const KanbanColumn = ({
    group,
    cards,
    allGroups = [],
    onCardClick,
    onUpdateColor,
    contacts = [],
    isCompact
}: KanbanColumnProps) => {
    const [isSelectContactOpen, setIsSelectContactOpen] = useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Droppable for receiving cards
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: { type: 'group', group }
    });

    // --- ADD CARD ---
    const handleAddCard = async (contact?: any) => {
        try {
            const cardData: any = {
                contactName: contact?.name || 'Nuevo Contacto',
                contactNumber: contact?.phone || '',
                email: contact?.email || '',
                clientId: contact?.clientId || '',
                lastMessage: 'Conversación iniciada...',
                channel: contact ? 'CRM Link' : 'Manual',
                source: 'manual',
                groupId: group.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: [],
            };
            await addDoc(collection(db, `kanban-groups/${group.id}/cards`), cardData);
            toast.success(contact ? `Contacto "${contact.name}" añadido.` : 'Nueva conversación creada.');
            setIsSelectContactOpen(false);
        } catch (error) {
            console.error('Error adding card:', error);
            toast.error('Error al añadir contacto.');
        }
    };

    // --- IMPORT CSV ---
    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                alert('El archivo CSV está vacío o no tiene datos.');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const batch = writeBatch(db);
            let importCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const contact: any = {};
                headers.forEach((header, index) => { if (values[index]) contact[header] = values[index]; });

                if (!contact.contactname && !contact.contactName) continue;

                const cardData = {
                    contactName: contact.contactname || contact.contactName || 'Sin Nombre',
                    contactNumber: contact.contactnumber || contact.contactNumber || contact.phone || '',
                    email: contact.email || '',
                    company: contact.company || contact.organization || '',
                    lastMessage: 'Importado desde CSV',
                    channel: 'CSV Import',
                    source: 'csv',
                    groupId: group.id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    messages: [],
                };

                const newCardRef = doc(collection(db, `kanban-groups/${group.id}/cards`));
                batch.set(newCardRef, cardData);
                importCount++;
            }

            try {
                await batch.commit();
                toast.success(`✅ ${importCount} contactos importados exitosamente`);
            } catch (error) {
                console.error('Error importing contacts:', error);
                toast.error('❌ Error al importar contactos');
            }
        };

        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- DELETE GROUP ---
    const handleDeleteGroup = async () => {
        if (group.name === 'Bandeja de Entrada') return;

        if (!window.confirm(`¿Estás seguro de que quieres eliminar la bandeja "${group.name}"? Todas las conversaciones se moverán a la Bandeja de Entrada.`)) return;

        const inbox = allGroups.find(g => g.name === 'Bandeja de Entrada');
        if (!inbox) {
            alert("No se pudo encontrar la 'Bandeja de Entrada' para mover las conversaciones.");
            return;
        }

        const batch = writeBatch(db);

        cards.forEach((card) => {
            const newCardRef = doc(collection(db, `kanban-groups/${inbox.id}/cards`));
            const { id, groupId, ...cardData } = card;
            batch.set(newCardRef, { ...cardData, groupId: inbox.id, updatedAt: serverTimestamp() });
            batch.delete(doc(db, `kanban-groups/${group.id}/cards`, card.id));
        });

        batch.delete(doc(db, 'kanban-groups', group.id));

        try {
            await batch.commit();
            toast.success(`Bandeja eliminada. Las conversaciones se movieron a la Bandeja de Entrada.`);
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Error al eliminar la bandeja.');
        }
    };

    const selectedColor = colors.find(c => c.value === group.color) || colors[0];

    return (
        <div
            ref={setNodeRef}
            data-group-id={group.id}
            className={cn(
                "flex flex-col flex-shrink-0 h-full rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/10 shadow-lg overflow-hidden",
                isCompact ? (group.name === 'Bandeja de Entrada' ? 'w-60' : 'w-52') : (group.name === 'Bandeja de Entrada' ? 'w-64' : 'w-56'),
                selectedColor.value
            )}
        >
            {/* Header */}
            <div className="p-3 pb-1 flex flex-col">
                <div className="flex justify-between items-center group/header">
                    <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight truncate text-white", selectedColor.pill)}>
                            {group.name}
                        </div>
                        <span className="text-white/80 font-mono text-[10px]">
                            {cards.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSelectContactOpen(true)}
                            className={cn("h-7 w-7 rounded-full transition-colors hover:bg-white/10", selectedColor.textColor)}
                        >
                            <Plus size={14} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-300 hover:bg-white/10 rounded-full transition-colors">
                                    <MoreVertical size={14} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 w-56">
                                {/* Edit Name */}
                                <DropdownMenuItem
                                    onClick={() => {
                                        const newName = window.prompt('Editar nombre de la bandeja:', group.name);
                                        if (newName && newName !== group.name) {
                                            updateDoc(doc(db, 'kanban-groups', group.id), { name: newName });
                                        }
                                    }}
                                    className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2"
                                >
                                    <Palette className="mr-3 text-neutral-400" size={16} />
                                    <span>Editar Nombre</span>
                                </DropdownMenuItem>

                                {/* Color Picker */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="hover:bg-blue-600 focus:bg-blue-600 data-[state=open]:bg-blue-600 rounded-lg transition-colors py-2">
                                        <Palette className="mr-3 text-neutral-400 group-hover:text-white" size={16} />
                                        <span className="font-medium">Colores de Bandeja</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 ml-1 w-48">
                                            {colors.map(color => (
                                                <DropdownMenuItem
                                                    key={color.name}
                                                    onClick={() => onUpdateColor?.(group.id, color.value)}
                                                    className="hover:bg-neutral-800 focus:bg-neutral-800 rounded-lg flex items-center gap-3 py-2 cursor-pointer transition-colors"
                                                >
                                                    <div className={cn("w-3.5 h-3.5 rounded-full border border-white/10", color.cardColor.replace('/40', ''))}></div>
                                                    <span className="text-xs font-medium">{color.name}</span>
                                                    {group.color === color.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>

                                {/* Import CSV */}
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2"
                                >
                                    <Upload className="mr-3 text-neutral-400" size={16} />
                                    <span>Importar CSV</span>
                                </DropdownMenuItem>

                                {/* Delete Group (only if not Bandeja de Entrada) */}
                                {group.name !== 'Bandeja de Entrada' && (
                                    <>
                                        <div className="h-px bg-neutral-800 my-1 mx-1" />
                                        <DropdownMenuItem
                                            onClick={handleDeleteGroup}
                                            className="cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg py-2"
                                        >
                                            <Trash2 className="mr-3 text-red-400" size={16} />
                                            <span>Eliminar Grupo</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Hidden CSV input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'none' }}
            />

            {/* Cards */}
            <div className="flex-grow overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            groupId={group.id}
                            onClick={(e: any) => onCardClick(card)}
                            cardColor={selectedColor.cardColor}
                            contacts={contacts}
                            isCompact={isCompact}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 && (
                    <div className={cn("flex-grow flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed rounded-2xl m-2 transition-colors", selectedColor.pill, "border-white/5 opacity-40")}>
                        <div className="bg-white/5 p-3 rounded-full mb-3">
                            <Plus size={20} className={selectedColor.textColor} />
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", selectedColor.textColor)}>Sin Conversaciones</span>
                        <p className="text-[9px] text-neutral-500 max-w-[120px]">Añade un contacto para empezar</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <SelectContactModal
                isOpen={isSelectContactOpen}
                onClose={() => setIsSelectContactOpen(false)}
                onSelect={(contact) => handleAddCard(contact)}
                onAddNew={() => {
                    setIsSelectContactOpen(false);
                    setIsCreateClientOpen(true);
                }}
            />

            <CreateClientModal
                isOpen={isCreateClientOpen}
                onClose={() => setIsCreateClientOpen(false)}
                groups={allGroups}
                initialGroupId={group.id}
            />
        </div>
    );
};

export default KanbanColumn;
