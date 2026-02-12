import {
    Briefcase,
    Cpu,
    Globe,
    LineChart,
    Scale,
    Users,
    Landmark,
    Lightbulb,
    Heart,
    Zap,
    ShieldCheck,
    Database
} from 'lucide-react';

export const SUITE_NODES = [
    { href: "/suite/board", icon: Landmark, title: "Board", subtitle: "Directors", color: "slate" },
    { href: "/suite/ceo", icon: Briefcase, title: "CEO", subtitle: "Executive", color: "blue" },
    { href: "/suite/coo", icon: Globe, title: "COO", subtitle: "Operations", color: "emerald" },
    { href: "/suite/cfo", icon: LineChart, title: "CFO", subtitle: "Finance", color: "amber" },
    { href: "/suite/clo", icon: Scale, title: "CLO", subtitle: "Legal", color: "slate" },
    { href: "/suite/cto", icon: Cpu, title: "CTO", subtitle: "Technology", color: "purple" },
    { href: "/suite/cpo", icon: Lightbulb, title: "CPO", subtitle: "Product", color: "indigo" },
    { href: "/suite/cmo", icon: Users, title: "CMO", subtitle: "Marketing", color: "pink" },
    { href: "/suite/chro", icon: Heart, title: "CHRO", subtitle: "Resources", color: "rose" },
    { href: "/suite/cso", icon: Zap, title: "CSO", subtitle: "Strategy", color: "yellow" },
    { href: "/suite/ciso", icon: ShieldCheck, title: "CISO", subtitle: "Security", color: "cyan" },
    { href: "/suite/cdo", icon: Database, title: "CDO", subtitle: "Data", color: "orange" },
];
