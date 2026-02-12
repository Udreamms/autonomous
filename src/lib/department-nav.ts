import {
    BarChart,
    Users,
    DollarSign,
    Target,
    MessageSquare,
    Cog,
    Contact,
    Mic,
    Video,
    Send,
    Layout,
    Zap,
    Briefcase,
    FileText,
    Shield,
    CreditCard,
    Landmark,
    Gavel,
    Lightbulb,
    Search,
    Lock,
    Server,
    Database,
    PenTool,
    Globe,
    Truck,
    Building,
    FileCheck,
    TrendingUp,
    UserPlus,
    GraduationCap,
    Heart
} from 'lucide-react';

// --- GOVERNANCE ---
export const BOARD_MENU = [
    { href: "/suite/board/governance", icon: Gavel, label: "Protocol Governance" },
    { href: "/suite/board/treasury", icon: Landmark, label: "MultiSig Treasury" },
    { href: "/suite/board/voting", icon: FileCheck, label: "Shareholder Voting" },
    { href: "/suite/board/audits", icon: Search, label: "Audits & Risk" },
];

export const CEO_MENU = [
    { href: "/suite/ceo/kpis", icon: BarChart, label: "Global KPIs" },
    { href: "/suite/ceo/strategy", icon: Target, label: "Vision & Strategy" },
    { href: "/suite/ceo/investor-relations", icon: TrendingUp, label: "Investor Relations" },
];

// --- TECHNOLOGY & PRODUCT ---
export const CTO_MENU = [
    { href: "/suite/cto/automation", icon: Cog, label: "Automation" },
    { href: "/suite/cto/voice-center", icon: Mic, label: "Voice AI" },
    { href: "/suite/cto/meet-agents", icon: Video, label: "Meet Agents" },
    { href: "/suite/cto/web-builder", icon: Layout, label: "Web Builder" },
    { href: "/suite/cto/orchestrator", icon: Zap, label: "Orchestrator" },
    { href: "/suite/cto/integrations", icon: Zap, label: "Integrations" },
    { href: "/suite/cto/smart-contracts", icon: FileText, label: "Smart Contracts" },
    { href: "/suite/cto/security", icon: Lock, label: "Cybersecurity (CISO)" },
    { href: "/suite/cto/devops", icon: Server, label: "DevOps & Infra" },
    { href: "/suite/cto/data", icon: Database, label: "Data Warehouse" },
];

export const CPO_MENU = [
    { href: "/suite/cpo/roadmap", icon: Target, label: "Product Roadmap" },
    { href: "/suite/cpo/requests", icon: MessageSquare, label: "Feature Requests" },
    { href: "/suite/cpo/design", icon: PenTool, label: "UX/UI Design System" },
    { href: "/suite/cpo/research", icon: Search, label: "User Research" },
];

// --- GROWTH & REVENUE ---
export const CMO_MENU = [
    { href: "/suite/cmo/analytics", icon: BarChart, label: "Sales Analytics" },
    { href: "/suite/cmo/crm", icon: Contact, label: "Contacts (CRM)" },
    { href: "/suite/cmo/campaigns", icon: Send, label: "Campaigns" },
    { href: "/suite/cmo/goals", icon: Target, label: "Sales Goals" },
    { href: "/suite/cmo/content", icon: Lightbulb, label: "Content Studio" },
    { href: "/suite/cmo/social", icon: Globe, label: "Social Media Manager" },
    { href: "/suite/cmo/affiliates", icon: Users, label: "Affiliate Program" },
];

// --- OPERATIONS & PEOPLE ---
export const COO_MENU = [
    { href: "/suite/coo/whatsapp", icon: MessageSquare, label: "Unified Inbox" },
    { href: "/suite/coo/visas", icon: Briefcase, label: "Visas & Immigration" },
    { href: "/suite/coo/cx", icon: Users, label: "Customer Experience" },
    { href: "/suite/coo/projects", icon: Layout, label: "Project Management" },
    { href: "/suite/coo/supply", icon: Truck, label: "Supply Chain" },
    { href: "/suite/coo/facilities", icon: Building, label: "Facilities" },
];

export const CHRO_MENU = [
    { href: "/suite/chro/recruitment", icon: UserPlus, label: "Recruitment" },
    { href: "/suite/chro/onboarding", icon: GraduationCap, label: "Onboarding" },
    { href: "/suite/chro/payroll", icon: DollarSign, label: "Payroll & Benefits" },
    { href: "/suite/chro/culture", icon: Heart, label: "Culture & Wellness" },
];

// --- FINANCE & LEGAL ---
export const CFO_MENU = [
    { href: "/suite/cfo/revenue", icon: DollarSign, label: "Revenue & Treasury" },
    { href: "/suite/cfo/billing", icon: FileText, label: "Invoices & Billing" },
    { href: "/suite/cfo/tax", icon: Shield, label: "Tax Vault" },
    { href: "/suite/cfo/fundraising", icon: TrendingUp, label: "Fundraising" },
];

export const CLO_MENU = [
    { href: "/suite/clo/contracts", icon: FileText, label: "Legal Contracts" },
    { href: "/suite/clo/compliance", icon: Shield, label: "Compliance & Risk" },
    { href: "/suite/clo/ip", icon: Lock, label: "IP & Patents" },
    { href: "/suite/clo/disputes", icon: Gavel, label: "Dispute Resolution" },
];
