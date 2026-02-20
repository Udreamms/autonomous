
'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Globe2,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import WhatsappIcon from '@/components/icons/WhatsappIcon';
import { countryData } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Card = ({ card, groupId, onClick, cardColor = 'bg-neutral-800', contacts = [] }: any) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'CARD', card: { ...card, groupId } },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleOpenDeleteDialog = (e) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation('');
  };

  const handleDeleteCard = async () => {
    if (deleteConfirmation === 'delete') {
      try {
        await deleteDoc(doc(db, `kanban-groups/${groupId}/cards`, card.id));
        handleCloseDeleteDialog();
      } catch (error) {
        console.error("Error deleting card: ", error);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${day} ${month} ${time}`;
  };

  const getCountryInfo = (phoneNumber) => {
    if (!phoneNumber) return { flag: '🏳️', code: 'N/A' };
    const number = phoneNumber.replace('+', '');
    const codes = Object.keys(countryData).sort((a, b) => b.length - a.length);
    for (const code of codes) {
      if (number.startsWith(code)) {
        const data = countryData[code];
        return typeof data === 'string' ? { flag: data, code: 'N/A' } : data;
      }
    }
    return { flag: '🏳️', code: 'N/A' };
  };

  const { flag, code } = getCountryInfo(card.contactNumber);

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        data-card-id={card.id}
        className={`group relative ${cardColor} p-0 rounded-xl border border-neutral-700/20 shadow-sm hover:border-neutral-700 transition-all duration-200 touch-none flex items-stretch select-none overflow-hidden max-h-[90px]`}
      >
        {/* Full-height Drag Handle Side */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-4 flex flex-col items-center justify-center gap-1 cursor-grab text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30 transition-all active:cursor-grabbing border-r border-neutral-800/10"
        >
          <GripVertical size={12} />
        </div>

        {/* Card Content Area */}
        <div className="flex-grow p-2 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              {(() => {
                const channel = (card.channel || card.source || '').toLowerCase(); // Fallback to source

                if (channel.includes('instagram')) {
                  return <Instagram className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />;
                }
                if (channel.includes('messenger') || channel.includes('facebook')) {
                  return <Facebook className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
                }
                if (channel.includes('web')) {
                  return <Globe2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
                }
                if (channel.includes('telegram')) {
                  return <MessageCircle className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />;
                }
                if (channel.includes('x') || channel.includes('twitter')) {
                  return <Twitter className="w-3.5 h-3.5 text-neutral-200 flex-shrink-0" />;
                }
                if (channel.includes('tiktok')) {
                  return <span className="text-[10px] flex-shrink-0">🎵</span>; // Fallback for TikTok if no icon
                }

                // Default to WhatsApp
                return <WhatsappIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
              })()}
              <h3 className="font-medium text-[11px] text-white truncate leading-none tracking-tight">
                {(() => {
                  const contactId = (card as any).contactId;
                  let linkedContact: any = null;

                  if (contactId) {
                    linkedContact = (contacts as any[]).find(c => c.id === contactId);
                  }

                  if (!linkedContact && card.contactNumber) {
                    const normalizedCardPhone = card.contactNumber.replace(/\D/g, '');
                    if (normalizedCardPhone) {
                      linkedContact = (contacts as any[]).find(c => (c.phone || '').replace(/\D/g, '') === normalizedCardPhone);
                    }
                  }

                  return linkedContact?.name || `${linkedContact?.firstName || ''} ${linkedContact?.lastName || ''}`.trim() || card.contactName || 'Desconocido';
                })()}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[8px] font-medium text-neutral-500 uppercase tracking-tight tabular-nums leading-none">
                {formatTimestamp(card.updatedAt || card.createdAt)}
              </span>
              {card.unreadCount > 0 && (
                <Badge className="bg-blue-600 text-white border-transparent h-3.5 min-w-[14px] flex items-center justify-center p-0 text-[9px] font-medium rounded-sm">
                  {card.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          <div onClick={onClick} className="flex-grow cursor-pointer relative z-10 space-y-0.5 min-h-0">
            <p className="text-[9px] text-neutral-400 font-medium break-words line-clamp-1 leading-tight mb-1">
              {card.lastMessage || '...'}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-neutral-500 font-medium tracking-wide">
                  {flag} {card.contactNumber || ''}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenDeleteDialog}
                  className="h-5 w-5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  aria-label="Eliminar tarjeta"
                >
                  <Trash2 size={10} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Para eliminar esta tarjeta, por favor escribe 'delete' en el campo de abajo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delete-confirm" className="text-right">
                Confirmar
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="col-span-3 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCard}
              disabled={deleteConfirmation !== 'delete'}
            >
              Eliminar Tarjeta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider >
  );
};

export default Card;
