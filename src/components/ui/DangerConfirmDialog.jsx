import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DangerConfirmDialog({ open, onOpenChange, title, description, itemName, onConfirm, loading }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const requireType = !!itemName;
  const matches = !requireType || typed.trim() === (itemName || '').trim();

  return (
    <AlertDialog open={open} onOpenChange={() => !loading && onOpenChange(false)}>
      <AlertDialogContent className="bg-card border-border/50 text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireType && (
          <div className="space-y-2 my-2">
            <Label className="text-red-400">Para confirmar, digite: <span className="font-semibold text-foreground">{itemName}</span></Label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus className="bg-muted/50 border-border/50" placeholder={itemName} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); if (matches) onConfirm(); }}
            disabled={!matches || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Excluindo...</> : 'Excluir definitivamente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
