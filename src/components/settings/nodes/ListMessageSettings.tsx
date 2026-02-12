// src/components/settings/nodes/ListMessageSettings.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, GripVertical, List, AlertCircle } from 'lucide-react';
import { produce } from 'immer';
import { SettingsSection, Field } from '../SharedComponents';

interface NodeSettingsProps {
    node: Node;
    updateNodeConfig: (nodeId: string, data: object) => void;
}

// Función auxiliar para migrar datos antiguos a la nueva estructura Enterprise
const normalizeNodeData = (data: any) => {
    const safeData = { ...data };

    // 1. Asegurar textos base
    safeData.buttonText = safeData.buttonText || 'Abrir Menú';
    safeData.header = safeData.header || '';
    safeData.body = safeData.body || safeData.text || '';
    safeData.footer = safeData.footer || '';

    // 2. Migrar Secciones
    // Si no hay secciones, pero hay 'options' antiguas (estructura legacy), conviértelas.
    if (!Array.isArray(safeData.sections)) {
        if (Array.isArray(safeData.options) && safeData.options.length > 0) {
            // Migración Legacy: Array plano -> Sección única
            safeData.sections = [{
                title: 'Opciones',
                rows: safeData.options.map((opt: string, i: number) => ({
                    id: `migrated_${i}`,
                    title: typeof opt === 'string' ? opt : 'Opción',
                    description: ''
                }))
            }];
        } else {
            // Estructura vacía por defecto
            safeData.sections = [{
                title: 'Sección Principal',
                rows: [{ id: 'row_1', title: '', description: '' }]
            }];
        }
    } else {
        // Si YA es un array, asegurarnos que cada sección tenga 'rows'
        safeData.sections = safeData.sections.map((sec: any) => ({
            ...sec,
            title: sec.title || 'Sin Título',
            rows: Array.isArray(sec.rows) ? sec.rows : [] // Asegurar que rows exista
        }));
    }

    return safeData;
};

export const ListMessageSettings = ({ node, updateNodeConfig }: NodeSettingsProps) => {
    // Inicializamos con datos normalizados para evitar crashes
    const [config, setConfig] = useState(() => normalizeNodeData(node.data));

    // Sincronización segura: Solo actualizamos si el nodo externo cambia drásticamente
    // y volvemos a normalizar por si acaso viene basura de la DB.
    useEffect(() => {
        const normalized = normalizeNodeData(node.data);
        // Comparación simple para evitar bucles infinitos de renderizado
        if (JSON.stringify(normalized) !== JSON.stringify(config)) {
            setConfig(normalized);
        }
    }, [node.data]);

    const handleUpdate = useCallback((newConfig: any) => {
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    }, [node.id, updateNodeConfig]);

    const addSection = () => {
        const newData = produce(config, (draft: any) => {
            if (!draft.sections) draft.sections = [];
            draft.sections.push({ title: 'Nueva Sección', rows: [{ id: `row_${Date.now()}`, title: '', description: '' }] });
        });
        handleUpdate(newData);
    };

    const addRow = (sectionIndex: number) => {
        const newData = produce(config, (draft: any) => {
            if (!draft.sections[sectionIndex].rows) draft.sections[sectionIndex].rows = [];

            if (draft.sections[sectionIndex].rows.length < 10) {
                draft.sections[sectionIndex].rows.push({ id: `row_${Date.now()}`, title: '', description: '' });
            }
        });
        handleUpdate(newData);
    };

    const updateRow = (sectionIndex: number, rowIndex: number, field: string, value: string) => {
        const newData = produce(config, (draft: any) => {
            if (draft.sections[sectionIndex]?.rows?.[rowIndex]) {
                draft.sections[sectionIndex].rows[rowIndex][field] = value;
            }
        });
        handleUpdate(newData);
    };

    const removeRow = (sectionIndex: number, rowIndex: number) => {
        const newData = produce(config, (draft: any) => {
            if (draft.sections[sectionIndex]?.rows) {
                draft.sections[sectionIndex].rows.splice(rowIndex, 1);
            }
        });
        handleUpdate(newData);
    };

    const removeSection = (sectionIndex: number) => {
        const newData = produce(config, (draft: any) => {
            draft.sections.splice(sectionIndex, 1);
        });
        handleUpdate(newData);
    };

    // Validación de seguridad para renderizado
    const sections = Array.isArray(config.sections) ? config.sections : [];

    return (
        <div className="space-y-6">
            <SettingsSection title="📋 Estructura de la Lista">
                <Field label="Texto del Botón" htmlFor="list-btn" description="El usuario verá este botón para abrir la lista.">
                    <Input
                        value={config.buttonText || ''}
                        onChange={(e) => handleUpdate({ ...config, buttonText: e.target.value })}
                        className="font-bold text-green-400 bg-neutral-950 border-neutral-800"
                    />
                </Field>
                <Field label="Cuerpo del Mensaje (Body)" htmlFor="list-body">
                    <Textarea
                        value={config.body || ''}
                        onChange={(e) => handleUpdate({ ...config, body: e.target.value })}
                        placeholder="Selecciona una opción de la lista..."
                        className="min-h-[80px] bg-neutral-950 border-neutral-800"
                    />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Encabezado (Opcional)" htmlFor="list-header">
                        <Input
                            value={config.header || ''}
                            onChange={(e) => handleUpdate({ ...config, header: e.target.value })}
                            className="text-xs bg-neutral-950 border-neutral-800"
                        />
                    </Field>
                    <Field label="Pie de página (Opcional)" htmlFor="list-footer">
                        <Input
                            value={config.footer || ''}
                            onChange={(e) => handleUpdate({ ...config, footer: e.target.value })}
                            className="text-xs bg-neutral-950 border-neutral-800"
                        />
                    </Field>
                </div>
            </SettingsSection>

            <SettingsSection title="Opciones del Menú">
                <div className="space-y-4">
                    {sections.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-neutral-900 p-2 flex items-center gap-2 border-b border-neutral-800">
                                <List size={14} className="text-neutral-500" />
                                <Input
                                    value={section.title || ''}
                                    onChange={(e) => {
                                        const newData = produce(config, (draft: any) => {
                                            if (draft.sections[sIdx]) draft.sections[sIdx].title = e.target.value
                                        });
                                        handleUpdate(newData);
                                    }}
                                    className="font-bold border-none bg-transparent focus:bg-neutral-800 p-1 h-7 text-sm flex-1 focus-visible:ring-0"
                                    placeholder="Título de Sección"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeSection(sIdx)} className="h-6 w-6 text-neutral-500 hover:text-red-500"><Trash2 size={12} /></Button>
                            </div>

                            {/* Rows */}
                            <div className="p-2 space-y-2">
                                {Array.isArray(section.rows) && section.rows.map((row: any, rIdx: number) => (
                                    <div key={row.id || `row-${rIdx}`} className="group flex items-start gap-2 pl-2">
                                        <div className="mt-2 text-neutral-600"><GripVertical size={12} /></div>
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                placeholder="Título de la opción"
                                                value={row.title || ''}
                                                onChange={(e) => updateRow(sIdx, rIdx, 'title', e.target.value)}
                                                className="h-8 text-sm bg-neutral-900 border-neutral-700"
                                            />
                                            <Input
                                                placeholder="Descripción corta"
                                                value={row.description || ''}
                                                onChange={(e) => updateRow(sIdx, rIdx, 'description', e.target.value)}
                                                className="h-7 text-[10px] text-neutral-400 bg-neutral-900/50 border-transparent focus:border-neutral-700"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeRow(sIdx, rIdx)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-500"><Trash2 size={14} /></Button>
                                    </div>
                                ))}
                                {(!section.rows || section.rows.length === 0) && (
                                    <div className="text-center py-2">
                                        <p className="text-[10px] text-neutral-600 flex items-center justify-center gap-1">
                                            <AlertCircle size={10} /> Sección vacía
                                        </p>
                                    </div>
                                )}
                                <Button variant="outline" size="sm" onClick={() => addRow(sIdx)} className="w-full text-xs border-dashed border-neutral-700 hover:bg-neutral-900 mt-2 h-8 text-neutral-400 hover:text-white"><Plus size={12} className="mr-1" /> Añadir Opción</Button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button onClick={addSection} variant="secondary" className="w-full mt-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300">
                    <Plus size={14} className="mr-2" /> Nueva Sección
                </Button>
            </SettingsSection>
        </div>
    );
};
