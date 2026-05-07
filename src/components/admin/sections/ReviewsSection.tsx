import { useState, useEffect } from 'react';
import { Review, reviewsService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<Review['status'], { label: string; class: string }> = {
  published: { label: 'Опубликован', class: 'bg-green-100 text-green-700' },
  hidden:    { label: 'Скрыт',       class: 'bg-red-100 text-red-600' },
  pending:   { label: 'Ожидает',     class: 'bg-amber-100 text-amber-700' },
};

const emptyReview: Omit<Review, 'id'> = {
  clientId: '', clientName: '', orderId: '', rating: 5,
  text: '', date: new Date().toISOString().split('T')[0],
  status: 'pending', reply: null,
};

export default function ReviewsSection() {
  const [items, setItems] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [form, setForm] = useState<Omit<Review, 'id'>>(emptyReview);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await reviewsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(r =>
    r.clientName.toLowerCase().includes(search.toLowerCase()) ||
    r.text.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyReview); setModalOpen(true); };
  const openEdit = (r: Review) => { setEditTarget(r); setForm({ ...r }); setModalOpen(true); };

  const handleSave = async () => {
    if (editTarget) {
      await reviewsService.update(editTarget.id, form);
      toast({ title: 'Отзыв обновлён' });
    } else {
      await reviewsService.create(form);
      toast({ title: 'Отзыв добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await reviewsService.delete(deleteId);
    toast({ title: 'Отзыв удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const avgRating = items.length ? (items.reduce((a, r) => a + r.rating, 0) / items.length).toFixed(1) : '0';
  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

  const setF = (k: keyof Omit<Review, 'id'>, v: string | number | null) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по клиенту или тексту отзыва..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="Plus" size={16} />
          Добавить отзыв
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего отзывов', value: items.length, icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Опубликованных', value: items.filter(r => r.status === 'published').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Ожидают модерации', value: items.filter(r => r.status === 'pending').length, icon: 'Clock', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Средняя оценка', value: avgRating, icon: 'Star', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon name={s.icon} size={16} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                <p className="text-xl font-bold font-golos">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(review => {
            const st = statusMap[review.status];
            return (
              <Card key={review.id} className="border-0 shadow-card hover-lift group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-grad-primary text-white font-bold text-xs">{initials(review.clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 font-golos text-sm">{review.clientName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Icon
                                  key={star}
                                  name="Star"
                                  size={12}
                                  className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground font-inter">{review.date}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 h-4 rounded-full ${st.class}`}>{st.label}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(review)}>
                            <Icon name="Pencil" size={12} className="text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(review.id)}>
                            <Icon name="Trash2" size={12} className="text-red-500" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm font-inter text-gray-700 mt-2 leading-relaxed">{review.text}</p>

                      {review.reply && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-300">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon name="Reply" size={12} className="text-blue-600" />
                            <span className="text-xs font-semibold font-golos text-blue-700">Ответ менеджера</span>
                          </div>
                          <p className="text-xs font-inter text-blue-800">{review.reply}</p>
                        </div>
                      )}

                      {review.orderId && (
                        <div className="mt-2 text-xs text-muted-foreground font-inter flex items-center gap-1">
                          <Icon name="FileText" size={11} />
                          Заказ-наряд: #{review.orderId}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-inter">
              Отзывы не найдены
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать отзыв' : 'Добавить отзыв'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">ФИО клиента</Label>
              <Input value={form.clientName} onChange={e => setF('clientName', e.target.value)} placeholder="Иванов Алексей Петрович" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">ID заказ-наряда</Label>
              <Input value={form.orderId} onChange={e => setF('orderId', e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Оценка (1-5)</Label>
              <Select value={String(form.rating)} onValueChange={v => setF('rating', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} звезда{n === 1 ? '' : n < 5 ? 'ы' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата</Label>
              <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setF('status', v as Review['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Опубликован</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="hidden">Скрыт</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Текст отзыва</Label>
              <Textarea value={form.text} onChange={e => setF('text', e.target.value)} placeholder="Текст отзыва клиента" rows={3} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Ответ менеджера</Label>
              <Textarea value={form.reply ?? ''} onChange={e => setF('reply', e.target.value || null)} placeholder="Оставьте ответ клиенту..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} className="bg-grad-primary hover:opacity-90 text-white">
              {editTarget ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-golos">Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Отзыв будет удалён из системы.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
