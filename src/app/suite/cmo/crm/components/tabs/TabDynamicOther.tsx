import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Info } from 'lucide-react';

interface TabDynamicOtherProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabDynamicOther: React.FC<TabDynamicOtherProps> = ({ contact, updateField, isEditing = false }) => {
    const extraData = contact.extraData || {};
    const keys = Object.keys(extraData);

    if (keys.length === 0) return null;

    const handleExtraFieldChange = (key: string, value: string) => {
        const updatedExtra = { ...extraData, [key]: value };
        updateField('extraData', updatedExtra);
    };

    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="flex flex-row items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">
                        Información Adicional (Importada)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {keys.map((key) => (
                            <div key={key} className="space-y-2 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 hover:border-blue-500/30 transition-colors">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 block mb-1">
                                    {key}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={extraData[key] || ''}
                                        onChange={(e) => handleExtraFieldChange(key, e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 h-9 rounded-lg text-sm focus:ring-blue-500/50"
                                    />
                                ) : (
                                    <p className="text-sm text-neutral-200 font-medium break-words">
                                        {extraData[key] || '---'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
};
