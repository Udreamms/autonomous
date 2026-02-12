import React, { useState, useEffect, useRef } from 'react';
import {
    Activity, AlertCircle, AlertTriangle, Briefcase, Building, Calendar, Check, ChevronRight, ChevronsUpDown, Clock, Copy, CreditCard, DollarSign, Edit2, ExternalLink, FileSpreadsheet, FileText, Flag, FolderOpen, Globe, GraduationCap, Handshake, Heart, HelpCircle, Home, IdCard, ImageIcon, Languages, Link, Mail, MapPin, Phone, Plus, RefreshCw, Search, Shield, Target, User, Users, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { LaneChecklist } from '../ConversationChecklistSystem';
import { toast } from 'sonner';
import { CardData, Message as MessageType } from '../types';
import { ALL_COUNTRY_CODES, CountryCode } from '@/lib/countryCodes';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

interface ProfileTabProps {
    liveCardData: CardData | null;
    contactInfo: Partial<CardData>;
    isEditing: boolean;
    handleInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleInfoSave: () => Promise<void>;
    setIsEditing: (val: boolean) => void;
    setContactInfo: React.Dispatch<React.SetStateAction<Partial<CardData>>>;
    currentGroupName: string;
    toggleChecklistItem: (item: string) => Promise<void>;
    handleToggleCheckIn: (checkIn: any) => Promise<void>;
    checklistProgress: number;
    crmId: string | null | undefined;
}

// Configuration for fields
const FIXED_FIELDS = [
    { key: 'firstName', label: 'NOMBRES', icon: <User size={18} className="text-blue-400" />, placeholder: 'Nombres' },
    { key: 'lastName', label: 'APELLIDOS', icon: <User size={18} className="text-blue-400" />, placeholder: 'Apellidos' },
    { key: 'contactName', label: 'NOMBRE COMPLETO (LEGACY)', icon: <User size={18} className="text-neutral-400" />, placeholder: 'Nombre' },
    { key: 'contactNumber', label: 'DIRECT LINE', icon: <Phone size={18} className="text-blue-400" />, placeholder: 'Unmapped' },
    { key: 'email', label: 'DIGITAL MAIL', icon: <Mail size={18} className="text-purple-400" />, placeholder: 'Not linked' },
    { key: 'website', label: 'GLOBAL WEB', icon: <Globe size={18} className="text-sky-400" />, placeholder: 'No URL' },
    { key: 'company', label: 'ORGANIZATION', icon: <Building size={18} className="text-amber-400" />, placeholder: 'No disponible' },
    { key: 'address', label: 'GEOGRAPHIC LOCATION', icon: <MapPin size={18} className="text-rose-400" />, placeholder: 'No disponible' },
    { key: 'postalCode', label: 'POSTAL CODE', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Código Postal' },
];

const OPTIONAL_FIELDS = [
    // 1. Estudiante
    { key: 'birthDate', label: 'FECHA DE NACIMIENTO', icon: <Calendar size={18} className="text-pink-400" />, placeholder: 'Fecha nac.', section: 'Estudiante' },
    { key: 'birthPlace', label: 'LUGAR DE NACIMIENTO', icon: <MapPin size={18} className="text-emerald-500" />, placeholder: 'Lugar', section: 'Estudiante' },
    { key: 'nationality', label: 'NACIONALIDAD', icon: <Globe size={18} className="text-emerald-400" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'birthCity', label: 'CIUDAD (NACIMIENTO)', icon: <Building size={18} className="text-emerald-600" />, placeholder: 'Ciudad', section: 'Estudiante' },
    { key: 'birthCountry', label: 'PAÍS NAC.', icon: <Globe size={18} className="text-emerald-700" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'birthState', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-emerald-500" />, placeholder: 'Provincia', section: 'Estudiante' },
    { key: 'hasOtherNationality', label: '¿OTRA NACIONALIDAD?', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Estudiante' },
    { key: 'otherNationalityCountry', label: '¿CUÁL?', icon: <Flag size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'isPermanentResidentOther', label: '¿RESIDENTE PERMANENTE DE OTRO PAÍS?', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Estudiante' },
    { key: 'permanentResidentCountry', label: '¿CUÁL?', icon: <Flag size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'nationalId', label: 'NÚMERO DE IDENTIFICACIÓN NACIONAL (DNI/CURP)', icon: <IdCard size={18} className="text-neutral-400" />, placeholder: 'DNI/Cedula', section: 'Estudiante' },
    { key: 'maritalStatus', label: 'ESTADO CIVIL', icon: <Heart size={18} className="text-red-400" />, placeholder: 'Soltero/Casado', section: 'Estudiante' },
    { key: 'gender', label: 'GÉNERO', icon: <Target size={18} className="text-purple-400" />, placeholder: 'H/M/O', section: 'Estudiante' },

    // 2. Pasaporte (Travel)
    { key: 'passportNumber', label: 'NÚMERO DE PASAPORTE', icon: <CreditCard size={18} className="text-amber-500" />, placeholder: 'Pasaporte', section: 'Pasaporte' },
    { key: 'passportCountry', label: 'PAÍS DE EMISIÓN', icon: <Globe size={18} className="text-amber-600" />, placeholder: 'País', section: 'Pasaporte' },
    { key: 'passportCity', label: 'CIUDAD DE EMISIÓN', icon: <Building size={18} className="text-amber-700" />, placeholder: 'Ciudad', section: 'Pasaporte' },
    { key: 'passportState', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-rose-400" />, placeholder: 'Estado', section: 'Pasaporte' },
    { key: 'passportIssuedDate', label: 'FECHA DE EMISIÓN', icon: <Calendar size={18} className="text-amber-400" />, placeholder: 'Fecha', section: 'Pasaporte' },
    { key: 'passportExpiryDate', label: 'FECHA DE EXPIRACIÓN', icon: <Calendar size={18} className="text-red-400" />, placeholder: 'Expiración', section: 'Pasaporte' },
    { key: 'passportLost', label: '¿HAS PERDIDO TU PASAPORTE ALGUNA VEZ?', icon: <AlertCircle size={18} className="text-red-500" />, placeholder: 'Sí/No', section: 'Pasaporte' },
    { key: 'hasTouristVisa', label: '¿TIENES VISA DE TURISTA ACTUAL?', icon: <CreditCard size={18} className="text-emerald-500" />, placeholder: '¿Tiene visa?', section: 'Pasaporte' },
    { key: 'visaIssuedDate', label: 'EMISIÓN VISA', icon: <Calendar size={18} className="text-emerald-500" />, placeholder: 'Fecha', section: 'Pasaporte' },
    { key: 'visaExpiryDate', label: 'EXPIRACIÓN VISA', icon: <Calendar size={18} className="text-emerald-600" />, placeholder: 'Expiración visa', section: 'Pasaporte' },

    // 3. Dirección (Location)
    { key: 'city', label: 'CIUDAD', icon: <Building size={18} className="text-rose-600" />, placeholder: 'Ciudad', section: 'Dirección' },
    { key: 'state', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-rose-400" />, placeholder: 'Estado', section: 'Dirección' },
    { key: 'country', label: 'PAÍS', icon: <Globe size={18} className="text-rose-700" />, placeholder: 'País', section: 'Dirección' },
    { key: 'postalCode', label: 'CÓDIGO POSTAL', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Zip Code', section: 'Dirección' },
    { key: 'phone', label: 'TELÉFONO PERSONAL', icon: <Phone size={18} className="text-blue-400" />, placeholder: 'Teléfono', section: 'Dirección' },
    { key: 'usAddress', label: 'DIRECCIÓN EN USA', icon: <Building size={18} className="text-blue-500" />, placeholder: 'Hospedaje USA', section: 'Dirección' },

    // 4. Familia (Family)
    { key: 'hasSponsor', label: 'PATROCINADOR', icon: <Handshake size={18} className="text-indigo-500" />, placeholder: 'Sí/No', section: 'Familia' },
    { key: 'sponsorFirstName', label: 'NOMBRE SPONSOR', icon: <User size={18} className="text-indigo-400" />, placeholder: 'Nombre', section: 'Familia' },
    { key: 'sponsorLastName', label: 'APELLIDO SPONSOR', icon: <User size={18} className="text-indigo-400" />, placeholder: 'Apellido', section: 'Familia' },
    { key: 'sponsorPhone', label: 'TELÉFONO SPONSOR', icon: <Phone size={18} className="text-indigo-400" />, placeholder: 'Teléfono', section: 'Familia' },
    { key: 'sponsorRelation', label: 'RELACIÓN SPONSOR', icon: <Users size={18} className="text-indigo-300" />, placeholder: 'Parentesco', section: 'Familia' },
    { key: 'motherName', label: 'NOMBRE MADRE', icon: <User size={18} className="text-pink-400" />, placeholder: 'Nombre madre', section: 'Familia' },
    { key: 'motherBirthDate', label: 'NAC. MADRE', icon: <Calendar size={18} className="text-pink-300" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'fatherName', label: 'NOMBRE PADRE', icon: <User size={18} className="text-blue-400" />, placeholder: 'Nombre padre', section: 'Familia' },
    { key: 'fatherBirthDate', label: 'NAC. PADRE', icon: <Calendar size={18} className="text-blue-300" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'spouseName', label: 'NOMBRE CÓNYUGE', icon: <User size={18} className="text-rose-400" />, placeholder: 'Nombre', section: 'Familia' },
    { key: 'marriageDate', label: 'FECHA MATRIMONIO', icon: <Calendar size={18} className="text-rose-300" />, placeholder: 'Fecha', section: 'Familia' },
    { key: 'spouseBirthDate', label: 'NAC. CÓNYUGE', icon: <Calendar size={18} className="text-rose-200" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'spouseCity', label: 'CIUDAD CÓNYUGE', icon: <MapPin size={18} className="text-rose-500" />, placeholder: 'Ciudad', section: 'Familia' },
    { key: 'spouseCountry', label: 'PAÍS CÓNYUGE', icon: <Globe size={18} className="text-rose-600" />, placeholder: 'País', section: 'Familia' },

    // 5. Empleo (Professional)
    { key: 'occupationData', label: 'ESTADO LABORAL', icon: <Briefcase size={18} className="text-cyan-400" />, placeholder: 'Tipo empleo', section: 'Empleo' },
    { key: 'currentEmployer', label: 'EMPRESA ACTUAL', icon: <Building size={18} className="text-cyan-500" />, placeholder: 'Empresa', section: 'Empleo' },
    { key: 'employerAddress', label: 'DIRECCIÓN EMPRESA', icon: <MapPin size={18} className="text-cyan-400" />, placeholder: 'Dirección boss', section: 'Empleo' },
    { key: 'employerCity', label: 'CIUDAD EMPRESA', icon: <Building size={18} className="text-cyan-300" />, placeholder: 'Ciudad boss', section: 'Empleo' },
    { key: 'employerPhone', label: 'TELÉFONO EMPRESA', icon: <Phone size={18} className="text-cyan-500" />, placeholder: 'Tel. boss', section: 'Empleo' },
    { key: 'monthlySalary', label: 'SALARIO MENSUAL', icon: <CreditCard size={18} className="text-emerald-500" />, placeholder: 'Monto', section: 'Empleo' },
    { key: 'jobStartDate', label: 'INICIO EMPLEO', icon: <Calendar size={18} className="text-cyan-600" />, placeholder: 'Fecha inicio', section: 'Empleo' },
    { key: 'jobDescription', label: 'DESCRIPCIÓN ROL', icon: <FileText size={18} className="text-neutral-400" />, placeholder: 'Descripción', section: 'Empleo' },
    { key: 'otherIncomeSource', label: 'OTROS INGRESOS', icon: <DollarSign size={18} className="text-emerald-400" />, placeholder: 'Fuentes extra', section: 'Empleo' },
    { key: 'hasPreviousJob', label: '¿EMPLEO ANTERIOR?', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Empleo' },
    { key: 'prevEmployer', label: 'EMPRESA ANTERIOR', icon: <Building size={18} className="text-neutral-600" />, placeholder: 'Ex-empresa', section: 'Empleo' },
    { key: 'prevJobTitle', label: 'CARGO ANTERIOR', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Ex-cargo', section: 'Empleo' },
    { key: 'profession', label: 'PROFESIÓN', icon: <Briefcase size={18} className="text-indigo-400" />, placeholder: 'Profesión base', section: 'Empleo' },

    // 6. Estudios (Education)
    { key: 'schoolName', label: 'SECUNDARIA', icon: <GraduationCap size={18} className="text-orange-400" />, placeholder: 'Colegio', section: 'Estudios' },
    { key: 'schoolProgram', label: 'PROGRAMA SEC.', icon: <FileText size={18} className="text-orange-500" />, placeholder: 'Programa', section: 'Estudios' },
    { key: 'universityName', label: 'UNIVERSIDAD', icon: <GraduationCap size={18} className="text-blue-400" />, placeholder: 'Universidad', section: 'Estudios' },
    { key: 'universityProgram', label: 'CARRERA UNI.', icon: <FileText size={18} className="text-blue-500" />, placeholder: 'Programa', section: 'Estudios' },

    // 7. Antecedentes (Background)
    { key: 'studyReason', label: 'RAZÓN ESTUDIO', icon: <FileText size={18} className="text-neutral-300" />, placeholder: '¿Por qué estudiar?', section: 'Antecedentes' },
    { key: 'studyDuration', label: 'TIEMPO ESTUDIO', icon: <Clock size={18} className="text-neutral-400" />, placeholder: 'Duración', section: 'Antecedentes' },
    { key: 'startSemester', label: 'SEMESTRE INICIO', icon: <Calendar size={18} className="text-neutral-300" />, placeholder: 'Enero/Mayo/Sept', section: 'Antecedentes' },
    { key: 'preferredSchedule', label: 'HORARIO PREF.', icon: <Clock size={18} className="text-neutral-500" />, placeholder: 'Mañana/Tarde/Noche', section: 'Antecedentes' },
    { key: 'targetSchool', label: 'ESCUELA DESTINO', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Escuela', section: 'Antecedentes' },
    { key: 'visaRefusal', label: 'RECHAZO VISA', icon: <AlertCircle size={18} className="text-red-500" />, placeholder: '¿Tiene rechazos?', section: 'Antecedentes' },
    { key: 'militaryService', label: 'SERVICIO MILITAR', icon: <Shield size={18} className="text-neutral-600" />, placeholder: 'Sí/No', section: 'Antecedentes' },
    { key: 'languages', label: 'IDIOMAS', icon: <Languages size={18} className="text-amber-600" />, placeholder: 'Español, Inglés...', section: 'Antecedentes' },
    { key: 'allergies', label: 'ALERGIAS', icon: <Activity size={18} className="text-red-400" />, placeholder: 'Alergias', section: 'Antecedentes' },
    { key: 'medicalConditions', label: 'CONDICIONES MÉDICAS', icon: <Activity size={18} className="text-red-600" />, placeholder: 'Condiciones', section: 'Antecedentes' },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({
    liveCardData,
    contactInfo,
    isEditing,
    handleInfoChange,
    handleInfoSave,
    setIsEditing,
    setContactInfo,
    currentGroupName,
    toggleChecklistItem,
    handleToggleCheckIn,
    checklistProgress,
    crmId
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addedFields, setAddedFields] = useState<string[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Helper to check if a field has data
    const hasData = (key: string) => {
        const val = (contactInfo as any)[key];
        if (key === 'birthDate' || key.includes('Date')) return !!val;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object' && val !== null && !(val instanceof Timestamp)) return Object.keys(val).length > 0; // For objects like extraData
        return val !== undefined && val !== null && val !== '';
    };

    // Helper to add field
    const addField = (key: string) => {
        if (!addedFields.includes(key)) {
            setAddedFields(prev => [...prev, key]);
        }
        setShowSuggestions(false);
        setEditingField(key);
    };

    // Helper to delete/hide field
    const deleteField = (key: string) => {
        setContactInfo(prev => ({ ...prev, [key]: '' }));
        setAddedFields(prev => prev.filter(f => f !== key));
        // We trigger save to persist the "deletion" (empty string)
        setTimeout(() => handleInfoSave(), 100);
    };

    // Helper to finish edit
    const finishEdit = () => {
        setEditingField(null);
        handleInfoSave();
    };

    // Render logic for optional fields
    const shouldRender = (key: string) => hasData(key) || addedFields.includes(key);


    const [editPhoneData, setEditPhoneData] = useState({ code: '+593', number: '' });
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [phoneSearchTerm, setPhoneSearchTerm] = useState('');
    const phoneDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
                setIsPhoneOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to extract phone parts
    const parsePhone = (fullPhone: string) => {
        if (!fullPhone) return { code: '+593', number: '' };

        const clean = fullPhone.replace(/\D/g, '');
        if (!clean) return { code: '+593', number: '' };

        // Try to find matching country code (longest match first to avoid false positives)
        const sortedCodes = [...ALL_COUNTRY_CODES].sort((a, b) => {
            const aLen = a.code.replace('+', '').length;
            const bLen = b.code.replace('+', '').length;
            return bLen - aLen;
        });

        for (const country of sortedCodes) {
            const codeDigits = country.code.replace('+', '');
            if (clean.startsWith(codeDigits)) {
                // Found a match!
                const number = clean.substring(codeDigits.length);
                return { code: country.code, number };
            }
        }

        // No match found - check if it looks like an Ecuadorian number (9-10 digits without country code)
        if (clean.length >= 9 && clean.length <= 10 && !clean.startsWith('593')) {
            return { code: '+593', number: clean };
        }

        // Unknown format - return empty code so user must select manually
        console.warn('[ProfileTab] Could not parse phone number:', fullPhone);
        return { code: '+593', number: clean };
    };

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden p-3 space-y-5 pb-24 dark:bg-neutral-950 dark:text-neutral-200 custom-scrollbar">
            {/* Profile Info Row (Simplified) */}
            <div className="flex items-center gap-4 px-1">
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-medium text-neutral-300 border border-neutral-700">
                        {contactInfo.contactName?.substring(0, 1).toUpperCase() || 'C'}
                    </div>
                    <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-neutral-950 rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                name="contactName"
                                value={contactInfo.contactName || ''}
                                onChange={handleInfoChange}
                                className="h-8 text-sm font-medium bg-neutral-900 border-neutral-700 rounded-md focus:ring-1 focus:ring-blue-500"
                                placeholder="Nombre"
                            />
                        </div>
                    ) : (
                        <div className="group cursor-pointer" onClick={() => setIsEditing(true)}>
                            <h2 className="text-xl font-bold text-white leading-tight hover:text-blue-400 transition-colors truncate">
                                {contactInfo.contactName || 'Nuevo Cliente'}
                            </h2>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{currentGroupName || 'DEFAULT'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 1.5 Share Application Link Section (Moved before Contact Info) */}
            <div className="mx-1 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                            <Link size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Link de Aplicación</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-600/20"
                        onClick={async () => {
                            // 🚀 HYBRID LINK SYSTEM: Use CRM ID as primary for uniqueness, Phone as rescue
                            let finalId = crmId;

                            // If we don't have a persistent CRM ID, we generate one now
                            if (!finalId || (typeof finalId === 'string' && finalId.startsWith('temp-'))) {
                                try {
                                    const savedId = await handleInfoSave() as unknown as string;
                                    if (savedId) finalId = savedId;
                                } catch (e) {
                                    console.error("Link generation error:", e);
                                    // Rescue: Use phone number if ID creation fails
                                    finalId = (contactInfo.contactNumber || liveCardData?.contactNumber || '').replace(/[^\d]/g, '');
                                }
                            }

                            if (finalId) {
                                const link = `${window.location.origin}/application/${finalId}`;
                                navigator.clipboard.writeText(link);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            } else {
                                toast.error("No se pudo generar el link. Asegúrate de que el contacto tenga un número.");
                            }
                        }}
                    >
                        {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                        {copied ? 'Copiado' : ''}
                    </Button>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                    Envía este link al cliente para que complete su información. Los datos se sincronizarán automáticamente aquí.
                </p>
            </div>

            {/* 2. Datos de Contacto (Fixed Section) */}
            <div className="space-y-4 pt-2">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-800/50 pb-1.5 px-1">INFORMACIÓN DE CONTACTO</h3>
                <div className="flex flex-col">
                    {FIXED_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center gap-4 px-2 py-3 hover:bg-white/[0.02] transition-colors group rounded-md">
                            <div className="text-neutral-500 group-hover:text-neutral-300 shrink-0">
                                {React.cloneElement(field.icon as React.ReactElement, { size: 16 })}
                            </div>
                            <div className="flex-1 min-w-0">
                                {editingField === field.key ? (
                                    <div className="flex items-center gap-2">
                                        {field.key === 'contactNumber' ? (
                                            <div className="flex gap-2 w-full relative" ref={phoneDropdownRef}>
                                                <div className="relative w-[100px] shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsPhoneOpen(!isPhoneOpen)}
                                                        className="w-full h-8 bg-neutral-900 border-neutral-800 text-[10px] rounded-lg justify-between px-2"
                                                    >
                                                        {editPhoneData.code ? (
                                                            <span className="flex items-center gap-1.5 overflow-hidden">
                                                                <span className="text-sm shrink-0">{ALL_COUNTRY_CODES.find(c => c.code === editPhoneData.code)?.flag || '🌍'}</span>
                                                                <span className="font-mono truncate">{editPhoneData.code}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-500">País...</span>
                                                        )}
                                                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                                    </Button>
                                                    {isPhoneOpen && (
                                                        <div className="absolute left-0 bottom-full mb-1 w-[260px] bg-neutral-900 border border-neutral-800 rounded-md shadow-2xl z-[9999] overflow-hidden">
                                                            <div className="flex items-center border-b border-neutral-800 px-3 py-2">
                                                                <Search className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                                                                <input
                                                                    autoFocus
                                                                    className="w-full bg-transparent text-xs outline-none text-white"
                                                                    placeholder="Buscar país..."
                                                                    value={phoneSearchTerm}
                                                                    onChange={(e) => setPhoneSearchTerm(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                                                                {ALL_COUNTRY_CODES.filter(c =>
                                                                    c.country.toLowerCase().includes(phoneSearchTerm.toLowerCase()) ||
                                                                    c.code.includes(phoneSearchTerm)
                                                                ).map((country) => (
                                                                    <button
                                                                        key={`${country.iso}-${country.code}`}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditPhoneData(prev => ({ ...prev, code: country.code }));
                                                                            setIsPhoneOpen(false);
                                                                            setPhoneSearchTerm('');
                                                                        }}
                                                                        className="w-full flex items-center px-3 py-2 text-[11px] text-neutral-300 hover:bg-neutral-800 transition-colors text-left group"
                                                                    >
                                                                        <div className="flex items-center flex-1">
                                                                            <Check className={cn("mr-2 h-3 w-3", editPhoneData.code === country.code ? "opacity-100" : "opacity-0")} />
                                                                            <span className="text-base mr-2 shrink-0">{country.flag}</span>
                                                                            <span className="flex-1 truncate">{country.country}</span>
                                                                        </div>
                                                                        <span className="font-mono text-neutral-500 ml-2">{country.code}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <Input
                                                    value={editPhoneData.number}
                                                    onChange={(e) => setEditPhoneData(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
                                                    className="h-8 flex-1 text-xs bg-neutral-900 border-neutral-800 rounded-lg text-neutral-200"
                                                    autoFocus
                                                    placeholder="Número"
                                                    onBlur={() => {
                                                        setTimeout(() => {
                                                            if (!isPhoneOpen) {
                                                                const finalPhone = `${editPhoneData.code}${editPhoneData.number}`;
                                                                setContactInfo(prev => ({ ...prev, contactNumber: finalPhone }));
                                                                setEditingField(null);
                                                                handleInfoSave();
                                                            }
                                                        }, 200);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <Input
                                                value={(contactInfo as any)[field.key] || ''}
                                                onChange={handleInfoChange}
                                                name={field.key}
                                                className="h-8 text-xs bg-neutral-900 border-neutral-800 rounded-lg text-neutral-200"
                                                autoFocus
                                                onBlur={() => {
                                                    setEditingField(null);
                                                    handleInfoSave();
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                                        setEditingField(field.key);
                                        if (field.key === 'contactNumber') {
                                            const parts = parsePhone(contactInfo.contactNumber || '');
                                            setEditPhoneData(parts);
                                        }
                                    }}>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider mb-0.5">{field.label}</span>
                                            <span className="text-[13px] text-neutral-200 font-medium truncate">
                                                {(contactInfo as any)[field.key] || <span className="text-neutral-600 italic font-normal">{field.placeholder}</span>}
                                            </span>
                                        </div>
                                        <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-neutral-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. CRM Sections Stacked Vertically */}
            {
                ['Estudiante', 'Pasaporte', 'Dirección', 'Familia', 'Empleo', 'Estudios', 'Antecedentes'].map((section) => {
                    const fieldsInSection = OPTIONAL_FIELDS.filter(f => f.section === section);
                    return (
                        <div key={section} className="space-y-3 animate-in fade-in slide-in-from-left-2 transition-all">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] px-1">{section}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                                {fieldsInSection.map(field => {
                                    return (
                                        <div key={field.key} className="group/field relative">
                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900/30 border border-transparent hover:border-neutral-800 hover:bg-neutral-900/50 transition-all">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-neutral-800/50 flex items-center justify-center">
                                                    {field.icon}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingField === field.key ? (
                                                        <div className="animate-in fade-in duration-200">
                                                            {field.key === 'gender' ? (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => { setContactInfo(prev => ({ ...prev, gender: 'man' })); finishEdit(); }} className={cn("text-xs px-2 py-1 rounded border", contactInfo.gender === 'man' ? "bg-blue-600 border-blue-600 text-white" : "border-neutral-700 text-neutral-400")}>Hombre</button>
                                                                    <button onClick={() => { setContactInfo(prev => ({ ...prev, gender: 'woman' })); finishEdit(); }} className={cn("text-xs px-2 py-1 rounded border", contactInfo.gender === 'woman' ? "bg-pink-600 border-pink-600 text-white" : "border-neutral-700 text-neutral-400")}>Mujer</button>
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={finishEdit}><Check size={12} /></Button>
                                                                </div>
                                                            ) : field.key.includes('Date') ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="date"
                                                                        value={(contactInfo as any)[field.key] ? (typeof (contactInfo as any)[field.key] === 'string' ? (contactInfo as any)[field.key] : new Date((contactInfo as any)[field.key].seconds * 1000).toISOString().split('T')[0]) : ''}
                                                                        onChange={(e) => {
                                                                            const d = e.target.value;
                                                                            setContactInfo(prev => ({ ...prev, [field.key]: d }))
                                                                        }}
                                                                        className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                                                                    />
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={finishEdit}><Check size={12} /></Button>
                                                                </div>
                                                            ) : (
                                                                <Input
                                                                    value={(contactInfo as any)[field.key] || ''}
                                                                    onChange={(e) => setContactInfo(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                                    name={field.key}
                                                                    className="h-8 text-xs bg-neutral-900 border-neutral-800 rounded-lg text-neutral-200"
                                                                    autoFocus
                                                                    onBlur={finishEdit}
                                                                    onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between cursor-pointer group/val" onClick={() => setEditingField(field.key)}>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider mb-0.5">{field.label}</span>
                                                                <span className="text-[13px] text-neutral-200 font-medium truncate">
                                                                    {field.key === 'gender' ? ((contactInfo as any).gender === 'man' ? 'Hombre' : (contactInfo as any).gender === 'woman' ? 'Mujer' : (contactInfo as any).gender || <span className="text-neutral-600 italic font-normal">{field.placeholder}</span>) :
                                                                        field.key.includes('Date') ? ((contactInfo as any)[field.key] ? (typeof (contactInfo as any)[field.key] === 'string' ? (contactInfo as any)[field.key] : new Date((contactInfo as any)[field.key].seconds * 1000).toLocaleDateString()) : <span className="text-neutral-600 italic font-normal">{field.placeholder}</span>) :
                                                                            ((contactInfo as any)[field.key] || <span className="text-neutral-600 italic font-normal">{field.placeholder}</span>)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/val:opacity-100 transition-opacity">
                                                                <Edit2 size={10} className="text-neutral-600" />
                                                                <button onClick={(e) => { e.stopPropagation(); deleteField(field.key); }} className="p-1 hover:text-red-400 text-neutral-600"><X size={10} /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            }

            {/* Extra Data Section (Dynamic) */}
            {
                (contactInfo as any).extraData && Object.keys((contactInfo as any).extraData).length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                            <h3 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.15em] px-1">Otros Datos</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                            {Object.entries((contactInfo as any).extraData).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900/30 border border-transparent hover:border-neutral-800 hover:bg-neutral-900/50 transition-all">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-neutral-800/50 flex items-center justify-center">
                                        <HelpCircle size={18} className="text-amber-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider mb-0.5">{key}</span>
                                        <span className="text-[13px] text-neutral-200 font-medium">{String(value)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
};
