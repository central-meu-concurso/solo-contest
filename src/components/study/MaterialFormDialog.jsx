import React, { useState } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MaterialFormDialog({ subjects, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    let image_url = '';
    if (imageFile) {
      const res = await api.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    const subject = subjects.find(s => s.id === subjectId);
    await api.entities.StudyMaterial.create({
      name: name.trim(),
      subject_id: subjectId,
      subject_name: subject?.name || '',
      current_page: Number(currentPage) || 1,
      image_url,
      notes,
      last_updated: moment().toISOString(),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do material *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Livro de Direito Constitucional" className="bg-muted/50 border-border/50" />
          </div>
          <div>
            <Label>Matéria</Label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecione a matéria</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Página atual</Label>
            <Input type="number" min={1} value={currentPage} onChange={e => setCurrentPage(e.target.value)} className="bg-muted/50 border-border/50" />
          </div>
          <div>
            <Label>Imagem (foto/print de onde parou)</Label>
            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border/50 bg-muted/30 cursor-pointer hover:border-blue-500/40 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Clique para enviar uma imagem</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre onde parou..." className="bg-muted/50 border-border/50" />
          </div>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Material'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
