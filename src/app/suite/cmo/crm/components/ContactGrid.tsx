import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContactGridProps {
    contacts: any[];
    containerVariants: any;
    itemVariants: any;
    handleContactClick: (contact: any) => void;
    setSelectedContact: (contact: any) => void;
    setIsDetailModalOpen: (open: boolean) => void;
    setIsEditingProfile: (editing: boolean) => void;
    handleDeleteContact: (id: string) => void;
    selectedContactIds: string[];
    setSelectedContactIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

export const ContactGrid: React.FC<ContactGridProps> = ({
    contacts,
    containerVariants,
    itemVariants,
    handleContactClick,
    setSelectedContact,
    setIsDetailModalOpen,
    setIsEditingProfile,
    handleDeleteContact,
    selectedContactIds,
    setSelectedContactIds
}) => {
    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20"
        >
            {contacts.map((contact) => (
                <motion.div
                    key={contact.id}
                    variants={itemVariants}
                    className={cn(
                        "bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-4 hover:border-blue-500/30 hover:bg-neutral-900/60 transition-all group flex flex-col relative overflow-hidden shadow-xl",
                        selectedContactIds.includes(contact.id) && "border-blue-500/50 bg-blue-500/5"
                    )}
                >
                    <div className="absolute top-4 left-4 z-20">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "w-4 h-4 border border-neutral-800 rounded-md flex items-center justify-center transition-colors",
                                    selectedContactIds.includes(contact.id) ? "bg-blue-600 border-blue-600" : "bg-black/50"
                                )}
                                onClick={(e) => toggleSelection(e, contact.id)}
                            >
                                {selectedContactIds.includes(contact.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
                                {contact.clientId || (contact.id ? `RY${contact.id.substring(0, 5).toUpperCase()}` : '—')}
                            </span>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl">
                                <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsDetailModalOpen(true); setIsEditingProfile(false); }}>Open Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-red-400">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mb-2 mt-1">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-medium text-white shadow-lg mb-2 group-hover:scale-110 transition-transform">
                            {contact.name?.charAt(0)}
                        </div>
                        <Badge variant="outline" className={`${contact.stage === 'Closed' ? 'border-emerald-500/50 text-emerald-500' :
                            contact.stage === 'In Progress' ? 'border-blue-500/50 text-blue-500' : 'border-orange-500/50 text-orange-500'} px-2 py-0 text-[7px] uppercase tracking-widest font-medium`}>
                            {contact.stage}
                        </Badge>
                    </div>

                    <h3
                        onClick={() => handleContactClick(contact)}
                        className="text-sm font-semibold text-neutral-100 mb-0.5 cursor-pointer hover:text-blue-400 hover:underline truncate pr-10 transition-colors"
                    >
                        {contact.name || 'Sin Nombre'}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mb-2 truncate">{contact.email}</p>

                    <div className="space-y-1 mb-2">
                        <div className="flex items-center text-[10px] text-neutral-500">
                            <Phone className="w-2.5 h-2.5 mr-2" /> {contact.phone}
                        </div>
                        <div className="flex items-center text-[10px] text-neutral-500">
                            <ExternalLink className="w-2.5 h-2.5 mr-2" /> {contact.source}
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};
