import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/components/SidebarContext';
import { useConversationLogic } from './ConversationModal/hooks/useConversationLogic';
import { ChatSection } from './ConversationModal/components/ChatSection';
import { Sidebar } from './ConversationModal/components/Sidebar';
import { ConversationModalProps } from './ConversationModal/types';
import { socialPlatforms } from './ConversationModal/constants';
import { User, CreditCard, FileText, Clock, Phone, ChevronDown, X, CheckCheck, Search, MoreVertical, Filter, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilePreviewModal from './ConversationModal/FilePreviewModal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import { WhatsappIcon } from './ConversationModal/components/SharedComponents';

export default function ConversationModal(props: ConversationModalProps) {
  const logic = useConversationLogic(props);
  const [isInboxCollapsed, setIsInboxCollapsed] = React.useState(false);
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState(''); // Inbox search

  // Header Feature States
  const [chatSearchTerm, setChatSearchTerm] = React.useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = React.useState(false);
  const [muteDuration, setMuteDuration] = React.useState<string | null>(null);

  // Keep it open by default
  React.useEffect(() => {
    if (props.isOpen) {
      setIsInboxCollapsed(false);
    }
  }, [props.isOpen]);

  if (!props.isOpen) return null;

  const filteredConversations = props.allConversations?.filter(conv => {
    const matchesSearch = conv.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contactNumber?.includes(searchTerm) ||
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by Active Platform (normalize to lowercase, default to whatsapp)
    const convSource = (conv.source || 'whatsapp').toLowerCase();
    const activeSource = (logic.activePlatform || 'whatsapp').toLowerCase();
    const matchesPlatform = convSource === activeSource;

    return matchesSearch && matchesPlatform;
  }) || [];

  const activePlatformData = socialPlatforms.find(p => p.name === logic.activePlatform) || socialPlatforms[0];

  const floatingStyle: React.CSSProperties = {
    position: 'fixed',
    left: isCollapsed ? '96px' : '280px',
    right: '0px',
    top: '84px',
    bottom: '0px',
    zIndex: 100,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn("bg-black/40 backdrop-blur-sm text-white flex font-sans overflow-hidden fixed inset-0")}
      style={floatingStyle}
    >


      <div className="flex-1 flex min-w-0 p-2 gap-2">
        <div className="flex-1 flex overflow-hidden relative">

          {/* Left Pane: Bandeja */}
          <aside className={cn(
            "flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out relative z-10",
            "bg-neutral-900/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl overflow-hidden",
            isInboxCollapsed || props.hideInternalTray ? "w-0 border-none" : "w-[220px]"
          )}>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-medium text-white uppercase tracking-widest">
                  {props.currentGroupName || 'Bandeja'}
                </h2>
                <span className="text-neutral-500 text-[9px] font-mono">
                  ({filteredConversations.length})
                </span>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                  <Search className="h-3 w-3 text-neutral-600 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-b border-white/5 hover:border-white/10 text-neutral-300 text-[10px] pl-5 pr-8 py-1.5 outline-none focus:border-blue-500/50 transition-all placeholder:text-neutral-700 font-mono tracking-tight"
                />
                {!searchTerm && (
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-neutral-600 hover:text-white">
                      <Filter size={8} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-6">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => props.onSelectConversation?.(conv)}
                  className={cn(
                    "w-full px-4 py-3 flex flex-col gap-1 text-left group transition-all duration-200 relative",
                    "border-b border-transparent hover:border-white/5",
                    props.card?.id === conv.id ? "bg-auto" : "bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between min-w-0 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Minimal indicator instead of avatar */}
                      <div className={cn(
                        "w-1 h-1 rounded-full flex-shrink-0",
                        props.card?.id === conv.id ? "bg-blue-500" : "bg-neutral-600 group-hover:bg-neutral-400"
                      )} />

                      <h3 className={cn(
                        "text-[11px] font-medium truncate tracking-tight transition-colors",
                        props.card?.id === conv.id ? "text-blue-400" : "text-neutral-300 group-hover:text-neutral-200"
                      )}>
                        {conv.contactName || conv.name}
                      </h3>
                    </div>

                    <span className="text-[9px] font-mono text-neutral-600 whitespace-nowrap">
                      {conv.timestamp?.toDate ? conv.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>

                  <div className="pl-3 min-w-0 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                    <p className={cn(
                      "text-[10px] truncate leading-tight font-medium font-mono",
                      props.card?.id === conv.id ? "text-blue-500/70" : "text-neutral-500"
                    )}>
                      {conv.contactNumber || conv.lastMessage || '...'}
                    </p>
                  </div>

                  {props.card?.id === conv.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Right Column: Chat Window */}
          <div className="flex-1 flex bg-black rounded-[32px] shadow-2xl overflow-hidden relative mr-4 my-4 border border-white/5">
            <div className="flex-1 flex flex-col min-w-0 h-full">
              {/* Header */}
              <header className="h-[42px] border-b border-white/5 flex items-center justify-between px-4 bg-transparent flex-shrink-0 drag-handle cursor-move relative z-50">
                <div className="flex items-center gap-2.5">
                  <div className="relative group">
                    <div className="w-7 h-7 rounded-[10px] flex items-center justify-center text-white font-medium text-[10px] shadow-lg transition-transform duration-300 bg-neutral-700">
                      {props.card?.contactName?.charAt(0) || props.card?.name?.charAt(0) || '?'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-neutral-900 border border-black flex items-center justify-center">
                      <div className={cn("w-1.5 h-1.5 rounded-full", activePlatformData.name === 'Instagram' ? 'bg-pink-500' : 'bg-green-500')} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {/* Name */}
                      <h3 className="font-medium text-white text-xs leading-none uppercase tracking-wide">{props.card?.contactName || props.card?.name || 'Skyler'}</h3>
                    </div>
                    <p className="text-neutral-500 text-[8px] font-medium mt-0.5 uppercase tracking-widest">{props.card?.contactNumber || 'NO ID'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Action Pill Container */}
                  <div className="flex items-center bg-neutral-900/50 border border-white/5 rounded-full p-0.5 gap-0.5 shadow-inner">
                    <div className={cn("flex items-center overflow-hidden transition-all duration-300", isChatSearchOpen ? "w-[100px]" : "w-7")}>
                      {isChatSearchOpen ? (
                        <div className="flex items-center px-1.5">
                          <Search size={12} className="text-neutral-500 mr-1" />
                          <input
                            autoFocus
                            className="bg-transparent border-none text-[9px] text-white w-full outline-none placeholder:text-neutral-600"
                            placeholder="Buscar..."
                            value={chatSearchTerm}
                            onChange={(e) => setChatSearchTerm(e.target.value)}
                            onBlur={() => !chatSearchTerm && setIsChatSearchOpen(false)}
                          />
                          <button onMouseDown={() => { setChatSearchTerm(''); setIsChatSearchOpen(false) }}><X size={10} className="text-neutral-500 hover:text-white" /></button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setIsChatSearchOpen(true)} className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full">
                          <Search size={14} />
                        </Button>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 hover:text-white hover:bg-white/5 rounded-full transition-colors", muteDuration ? "text-red-400" : "text-neutral-400")}>
                          {muteDuration ? <BellOff size={14} /> : <Clock size={14} />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                        <DropdownMenuLabel className="text-[10px] uppercase font-medium tracking-widest text-neutral-500">Silenciar</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-800" />
                        {[
                          { label: '8 Horas', val: '8h' },
                          { label: '1 Semana', val: '1w' },
                          { label: 'Siempre', val: 'always' }
                        ].map((opt) => (
                          <DropdownMenuItem key={opt.val} onClick={() => { setMuteDuration(opt.val); logic.handleSaveMute(opt.val); }} className="flex justify-between cursor-pointer focus:bg-neutral-800 text-[10px] font-medium">
                            <span>{opt.label}</span>
                            {muteDuration === opt.val && <CheckCheck size={12} className="text-blue-500" />}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-neutral-800" />
                        <DropdownMenuItem onClick={() => { setMuteDuration(null); logic.handleSaveMute(null); }} className="cursor-pointer text-red-400 focus:bg-neutral-800 focus:text-red-300 text-[10px] font-medium">
                          Desactivar silencio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>


                    <div className="flex items-center bg-neutral-800/50 rounded-full ml-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/5 rounded-l-full">
                        <Phone size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-r-full">
                        <ChevronDown size={10} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0.5 gap-1 hover:bg-white/10 rounded-full pl-1 pr-2 border border-white/5 bg-neutral-900/50 shadow-inner">
                          <div className={cn("w-6 h-6 rounded-[8px] flex items-center justify-center transition-all", activePlatformData.bgColor)}>
                            <activePlatformData.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <ChevronDown size={12} className="text-neutral-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-neutral-900 border-neutral-800 p-1 z-[200] rounded-xl">
                        {socialPlatforms.map((platform) => (
                          <DropdownMenuItem
                            key={platform.name}
                            onClick={() => logic.setActivePlatform(platform.name)}
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded-lg cursor-pointer",
                              logic.activePlatform === platform.name ? "bg-blue-600/10 text-blue-400" : "text-neutral-400 hover:bg-neutral-800"
                            )}
                          >
                            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", platform.bgColor, platform.color)}>
                              <platform.icon className={platform.name === 'TikTok' ? 'w-3 h-3 fill-current' : 'w-3.5 h-3.5'} />
                            </div>
                            <span className="font-medium text-[10px] uppercase tracking-wide">{platform.name}</span>
                            {logic.activePlatform === platform.name && <CheckCheck size={12} className="ml-auto" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-4 w-px bg-white/10 mx-0.5" />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={props.onClose}
                      className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </header>

              <ChatSection
                liveCardData={logic.liveCardData}
                activePlatform={logic.activePlatform}
                setActivePlatform={logic.setActivePlatform}
                socialPlatforms={socialPlatforms}
                currentPlatform={logic.currentPlatform}
                uploading={logic.uploading}
                progress={logic.progress}
                selectedFile={logic.selectedFile}
                filePreviewUrl={logic.filePreviewUrl}
                handleCancelPreview={logic.handleCancelPreview}
                handleDisplayFileSend={logic.handleDisplayFileSend}
                isDragActive={logic.isDragActive}
                getRootProps={logic.getRootProps}
                getInputProps={logic.getInputProps}
                groupedMessages={logic.groupedMessages}
                isMessageRead={logic.isMessageRead}
                setPreviewFile={logic.setPreviewFile}
                messagesEndRef={logic.messagesEndRef}
                newMessage={logic.newMessage}
                setNewMessage={logic.setNewMessage}
                handleSendMessage={logic.handleSendMessage}
                isSending={logic.isSending}
                open={logic.open}
                onEmojiClick={logic.onEmojiClick}
                onClose={props.onClose}
                chatSearchTerm={chatSearchTerm}
                isWithin24Hours={logic.isWithin24Hours}
                sendTemplateMessage={logic.sendTemplateMessage}
              />
            </div>

            <AnimatePresence>
              {logic.activeTab && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="border-l border-white/5 bg-neutral-900/50 flex flex-col overflow-hidden h-full"
                >
                  <div className="flex-1 min-h-0 flex flex-col">
                    <Sidebar
                      activeTab={logic.activeTab}
                      setActiveTab={logic.setActiveTab}
                      isEditing={logic.isEditing}
                      setIsEditing={logic.setIsEditing}
                      liveCardData={logic.liveCardData}
                      contactInfo={logic.contactInfo}
                      handleInfoChange={logic.handleInfoChange}
                      handleInfoSave={async () => { await logic.handleInfoSave(); }}
                      setContactInfo={logic.setContactInfo}
                      currentGroupName={logic.currentGroupName}
                      toggleChecklistItem={logic.toggleChecklistItem}
                      handleToggleCheckIn={logic.handleToggleCheckIn}
                      checklistProgress={logic.checklistProgress}
                      isAddingPayment={logic.isAddingPayment}
                      setIsAddingPayment={logic.setIsAddingPayment}
                      newPayment={logic.newPayment}
                      setNewPayment={logic.setNewPayment}
                      handleSavePaymentMethod={logic.handleSavePaymentMethod}
                      isAddingCheckIn={logic.isAddingCheckIn}
                      setIsAddingCheckIn={logic.setIsAddingCheckIn}
                      newCheckIn={logic.newCheckIn}
                      setNewCheckIn={logic.setNewCheckIn}
                      handleSaveCheckIn={logic.handleSaveCheckIn}
                      editingCheckInId={logic.editingCheckInId}
                      setEditingCheckInId={logic.setEditingCheckInId}
                      editText={logic.editText}
                      setEditText={logic.setEditText}
                      handleSaveEditedCheckIn={logic.handleSaveEditedCheckIn}
                      handleEditCheckIn={logic.handleEditCheckIn}
                      handleDeleteCheckIn={logic.handleDeleteCheckIn}
                      isAddingNote={logic.isAddingNote}
                      setIsAddingNote={logic.setIsAddingNote}
                      newNote={logic.newNote}
                      setNewNote={logic.setNewNote}
                      handleSaveNote={logic.handleSaveNote}
                      editingNoteId={logic.editingNoteId}
                      setEditingNoteId={logic.setEditingNoteId}
                      handleEditNote={logic.handleEditNote}
                      handleDeleteNote={logic.handleDeleteNote}
                      handleSaveEditedNote={logic.handleSaveEditedNote}
                      newHistoryComment={logic.newHistoryComment}
                      setNewHistoryComment={logic.setNewHistoryComment}
                      handleSaveHistoryComment={logic.handleSaveHistoryComment}
                      crmId={logic.crmId}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Icon Bar */}
            <div className="w-[60px] flex-shrink-0 border-l border-white/5 bg-black/80 backdrop-blur-md flex flex-col items-center py-6 gap-6 z-10">
              {[
                { id: 'perfil', icon: User, label: 'Perfil' },
                { id: 'notas', icon: FileText, label: 'Notas' },
                { id: 'pagos', icon: CreditCard, label: 'Pagos' },
                { id: 'historial', icon: Clock, label: 'Historial' },
              ].map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (logic.activeTab === item.id) {
                      logic.setActiveTab(null);
                    } else {
                      logic.setActiveTab(item.id as any);
                      logic.setIsEditing(false);
                    }
                  }}
                  className={cn(
                    "relative group flex flex-col items-center transition-all duration-200 w-full",
                    logic.activeTab === item.id
                      ? "text-white"
                      : "text-neutral-600 hover:text-neutral-400"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-lg transition-all duration-200 mb-0.5",
                    logic.activeTab === item.id ? "text-white" : ""
                  )}>
                    <item.icon size={18} strokeWidth={logic.activeTab === item.id ? 2.5 : 1.5} />
                  </div>

                  <span className={cn(
                    "text-[7px] font-medium uppercase mt-0.5 transition-all duration-200 tracking-tighter",
                    logic.activeTab === item.id ? "text-white" : "text-neutral-600 text-[6px]"
                  )}>
                    {item.label}
                  </span>

                  {logic.activeTab === item.id && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-blue-500 rounded-l-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {logic.previewFile && (
          <FilePreviewModal
            isOpen={!!logic.previewFile}
            onClose={() => logic.setPreviewFile(null)}
            fileUrl={logic.previewFile.url}
            fileName={logic.previewFile.name}
            fileType={logic.previewFile.type}
          />
        )}
      </AnimatePresence>
    </motion.div >
  );
}
