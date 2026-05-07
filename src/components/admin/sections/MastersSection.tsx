import { useState, useEffect } from 'react';
import { Master, mastersService } from '@/services/mockService';
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

const statusMap: Record<Master['status'], { label: string; class: string }> = {
  active:   { label: 'Работает', class: 'bg-green-100 text-green-700' },
  vacation: { label: 'Отпуск',   class: 'bg-blue-100 text-blue-700' },
  sick:     { label: 'Болен',    class: 'bg-orange-100 text-orange-700' },
  fired:    { label: 'Уволен',   class: 'bg-red-100 text-red-600' },
};

const positions = ['Старший механик', 'Механик', 'Электрик', 'Шиномонтажник', 'Кузовщик', 'Диагност'];
const specializationOptions = [
  'Двигатель', 'Трансмиссия', 'Диагностика', 'Тормозная система', 'Ходовая часть',
  'Подвеска', 'Электрика', 'Мультимедиа', 'Сигнализация', 'Шиномонтаж', 'Балансировка',
  'Развал-схождение', 'Кузовной ремонт', 'Покраска', 'Антикор', 'ТО', 'Замена масла',
];

const emptyMaster: Omit<Master, 'id'> = {
  name: '', position: 'Механик', specialization: [], phone: '', email: '',
  hireDate: new Date().toISOString().split('T')[0], rating: 5.0,
  completedOrders: 0, status: 'active', salary: 0,
};

export default function MastersSection() {
  const [items, setItems] = useState<Master[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Master | null>(null);
  const [form, setForm] = useState<Omit<Master, 'id'>>(emptyMaster);
  const [specInput, setSpecInput] = useState('');
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await mastersService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.position.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyMaster); setSpecInput(''); setModalOpen(true); };
  const openEdit = (m: Master) => { setEditTarget(m); setForm({ ...m }); setSpecInput(m.specialization.join(', ')); setModalOpen(true); };

  const handleSave = async () => {
    const finalForm = { ...form, specialization: specInput.split(',').map(s => s.trim()).filter(Boolean) };
    if (editTarget) {
      await mastersService.update(editTarget.id, finalForm);
      toast({ title: 'Мастер обновлён' });
    } else {
      await mastersService.create(finalForm);
      toast({ title: 'Мастер добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await mastersService.delete(deleteId);
    toast({ title: 'Мастер удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');
  const avgRating = items.length ? (items.reduce((a, m) => a + m.rating, 0) / items.length).toFixed(1) : '0';
  const totalCompleted = items.reduce((a, m) => a + m.completedOrders, 0);

  const setF = (k: keyof Omit<Master, 'id'>, v: string | number | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по имени, должности, телефону..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="UserPlus" size={16} />
          Добавить мастера
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего мастеров', value: items.length, icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Работают', value: items.filter(m => m.status === 'active').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Средний рейтинг', value: avgRating, icon: 'Star', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Заказов выполнено', value: totalCompleted.toLocaleString('ru'), icon: 'ClipboardCheck', color: 'text-purple-600', bg: 'bg-purple-50' },
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

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(master => {
            const st = statusMap[master.status];
            return (
              <Card key={master.id} className="border-0 shadow-card hover-lift group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-grad-primary text-white font-bold text-sm">{initials(master.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 font-golos text-sm leading-tight">{master.name}</h3>
                          <p className="text-xs text-muted-foreground font-inter mt-0.5">{master.position}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 rounded-full ${st.class}`}>{st.label}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(master)}>
                              <Icon name="Pencil" size={12} className="text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(master.id)}>
                              <Icon name="Trash2" size={12} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Rating stars */}
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Icon
                            key={star}
                            name="Star"
                            size={12}
                            className={star <= Math.round(master.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                          />
                        ))}
                        <span className="text-xs font-semibold font-golos ml-1">{master.rating}</span>
                      </div>

                      {/* Specialization badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {master.specialization.slice(0, 3).map(spec => (
                          <Badge key={spec} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{spec}</Badge>
                        ))}
                        {master.specialization.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">+{master.specialization.length - 3}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                          <Icon name="Phone" size={11} />
                          <span>{master.phone}</span>
                        </div>
                        <div className="text-center ml-auto">
                          <p className="text-sm font-bold text-gray-900 font-golos">{master.completedOrders}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">заказов</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900 font-golos">{master.salary.toLocaleString('ru')} ₽</p>
                          <p className="text-[10px] text-muted-foreground font-inter">оклад</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать мастера' : 'Добавить мастера'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">ФИО</Label>
              <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Должность</Label>
              <Select value={form.position} onValueChange={v => setF('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setF('status', v as Master['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Работает</SelectItem>
                  <SelectItem value="vacation">Отпуск</SelectItem>
                  <SelectItem value="sick">Болен</SelectItem>
                  <SelectItem value="fired">Уволен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Телефон</Label>
              <Input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+7 (000) 000-00-00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Email</Label>
              <Input value={form.email} onChange={e => setF('email', e.target.value)} placeholder="master@sto.ru" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата приёма</Label>
              <Input type="date" value={form.hireDate} onChange={e => setF('hireDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Оклад (₽)</Label>
              <Input type="number" value={form.salary} onChange={e => setF('salary', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Рейтинг (1-5)</Label>
              <Input type="number" min={1} max={5} step={0.1} value={form.rating} onChange={e => setF('rating', Number(e.target.value))} placeholder="5.0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Выполнено заказов</Label>
              <Input type="number" value={form.completedOrders} onChange={e => setF('completedOrders', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Специализация (через запятую)</Label>
              <Textarea value={specInput} onChange={e => setSpecInput(e.target.value)} placeholder="Двигатель, Диагностика, ТО" rows={2} />
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
            <AlertDialogTitle className="font-golos">Удалить мастера?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Данные мастера будут удалены из системы.</AlertDialogDescription>
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
