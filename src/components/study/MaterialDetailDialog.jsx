import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { Upload, Loader2, ImageOff, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MaterialDetailDialog({ material, onClose, onUpdated }) {
  const [currentPage, setCurrentPage] = useState(material.current_page || 1);
  const [notes, setNotes] = useState(material.notes || '');
  const [imagePreview, setImagePreview] = useState(material.image_url || '');
  const [image_url, setImageUrl] = useState(material.image_url || '');
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const firstRun = useRef(true);
  const saveTimer = useRef(null);

  const save = async (data) => {
    setStatus('saving');
    await api.entities.StudyMaterial.update(material.id, {
      ...data,
      last_updated: moment().toISOString(),
    });
    setStatus('saved');
    onUpdated(true);
    setTimeout(() => setStatus('idle'), 1500);
  };

  // Debounced auto-save for text fields
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save({ current_page: Number(currentPage) || 1, notes, image_url });
    }, 800);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, notes]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('saving');
    setImagePreview(URL.createObjectURL(file));
    const res = await api.integrations.Core.UploadFile({ file });
    const newUrl = res.file_url;
    setImageUrl(newUrl);
    setImagePreview(newUrl);
    await save({ current_page: Number(currentPage) || 1, notes, image_url: newUrl });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-foreground max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-display">{material.name}</DialogTitle>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              {status === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>}
              {status === 'saved' && <><Check className="w-3.5 h-3.5 text-emerald-400" /> Salvo</>}
            </span>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/20 flex items-center justify-center min-h-[200px]">
            {imagePreview ? (
              <img src={imagePreview} alt={material.name} className="w-full max-h-[50vh] object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <ImageOff className="w-8 h-8" />
                <span className="text-xs">Nenhuma imagem</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {material.subject_name && <span>Matéria: <strong className="text-foreground">{material.subject_name}</strong></span>}
            <span>Atualizado em: <strong className="text-foreground">{moment(material.last_updated).format('DD/MM/YYYY [às] HH:mm')}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Página atual</Label>
              <Input type="number" min={1} value={currentPage} onChange={e => setCurrentPage(e.target.value)} className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <Label>Substituir imagem</Label>
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-border/50 bg-muted/30 cursor-pointer hover:border-blue-500/40 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Enviar nova imagem</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-muted/50 border-border/50" />
          </div>

          <p className="text-xs text-muted-foreground text-center">As alterações são salvas automaticamente.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
