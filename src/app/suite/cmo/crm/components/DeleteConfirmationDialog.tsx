import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemCount?: number;
}

export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemCount = 1
}: DeleteConfirmationDialogProps) {
    const [confirmText, setConfirmText] = useState('');
    const isValid = confirmText.toUpperCase() === 'DELETE';

    const handleConfirm = () => {
        if (isValid) {
            onConfirm();
            setConfirmText('');
            onClose();
        }
    };

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-red-900/50 text-white rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <DialogTitle className="text-xl font-medium text-red-400">
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-neutral-400 pt-2">
                        {description}
                        {itemCount > 1 && (
                            <span className="block mt-2 text-red-400 font-medium">
                                Se eliminarán {itemCount} contacto{itemCount !== 1 ? 's' : ''}.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm" className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                            Escribe <span className="text-red-400 font-mono">DELETE</span> para confirmar
                        </Label>
                        <Input
                            id="confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="bg-neutral-800 border-neutral-700 text-white h-11 rounded-xl font-mono"
                            autoComplete="off"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isValid) {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-neutral-400 hover:text-white rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={`rounded-xl ${isValid
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                            }`}
                    >
                        Eliminar Permanentemente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
