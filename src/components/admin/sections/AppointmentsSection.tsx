import { useState, useEffect } from 'react';
import { Appointment, appointmentsService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<Appointment['status'], { label: string; class: string; icon: string }> = {
  scheduled:  { label: 'Запланировано',  class: 'bg-blue-100 text-blue-700',   icon: 'Clock' },
  confirmed:  { label: 'Подтверждено',   class: 'bg-green-100 text-green-700', icon: 'CheckCircle' },
  cancelled:  { label: 'Отменено',       class: 'bg-red-100 text-red-600',     icon: 'XCircle' },
  completed:  { label: 'Выполнено',      class: 'bg-gray-100 text-gray-600',   icon: 'Check' },
};

const serviceTypes = [
  'Техническое обслуживание', 'Диагностика', 'Замена масла', 'Шиномонтаж',
  'Кузовной ремонт', 'Детейлинг', 'Электрика', 'Замена тормозных колодок',
  'Развал-схождение', 'Консультация', 'Прочее',
];

const emptyAppointment: Omit<Appointment, 'id'> = {
  clientId: '', clientName: '', phone: '', carInfo: '',
  serviceType: 'Диагностика', masterId: '', masterName: '',
  date: new Date().toISOString().split('T')[0], time: '09:00',
  duration: 60, status: 'scheduled', notes: '',
};

export default function AppointmentsSection() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Omit<Appointment, 'id'>>(emptyAppointment);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await appointmentsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = [...items]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .filter(a =>
      a.clientName.toLowerCase().includes(search.toLowerCase()) ||
      a.masterName.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search)
    );

  const openCreate = () => { setEditTarget(null); setForm(emptyAppointment); setModalOpen(true); };
  const openEdit = (a: Appointment) => { setEditTarget(a); setForm({ ...a }); setModalOpen(true); };

  const handleSave = async () => {
    if (editTarget) {
      await appointmentsService.update(editTarget.id, form);
      toast({ title: 'Запись обновлена' });
    } else {
      await appointmentsService.create(form);
      toast({ title: 'Запись добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await appointmentsService.delete(deleteId);
    toast({ title: 'Запись удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const setF = (k: keyof Omit<Appointment, 'id'>, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по клиенту, мастеру, услуге..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="CalendarPlus" size={16} />
          Добавить запись
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего записей', value: items.length, icon: 'CalendarDays', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Запланировано', value: items.filter(a => a.status === 'scheduled').length, icon: 'Clock', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Подтверждено', value: items.filter(a => a.status === 'confirmed').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Выполнено', value: items.filter(a => a.status === 'completed').length, icon: 'Check', color: 'text-gray-600', bg: 'bg-gray-50' },
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(appt => {
            const st = statusMap[appt.status];
            return (
              <Card key={appt.id} className="border-0 shadow-card hover-lift group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-grad-primary flex items-center justify-center shadow-sm">
                        <Icon name="CalendarCheck" size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 font-golos text-sm leading-tight">{appt.clientName}</h3>
                          <p className="text-xs text-muted-foreground font-inter">{appt.carInfo}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 ${st.class}`}>{st.label}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(appt)}>
                              <Icon name="Pencil" size={12} className="text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(appt.id)}>
                              <Icon name="Trash2" size={12} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-inter flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={11} />
                          {new Date(appt.date).toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={11} />
                          {appt.time} ({appt.duration} мин)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-inter flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icon name="Wrench" size={11} />
                          {appt.serviceType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="HardHat" size={11} />
                          {appt.masterName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Phone" size={11} />
                          {appt.phone}
                        </span>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-muted-foreground font-inter mt-2 italic line-clamp-1">{appt.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground font-inter">
              Записи не найдены
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать запись' : 'Новая запись на приём'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">ФИО клиента</Label>
              <Input value={form.clientName} onChange={e => setF('clientName', e.target.value)} placeholder="Иванов Алексей Петрович" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Телефон</Label>
              <Input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+7 (000) 000-00-00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Автомобиль</Label>
              <Input value={form.carInfo} onChange={e => setF('carInfo', e.target.value)} placeholder="Toyota Camry 2020" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Тип услуги</Label>
              <Select value={form.serviceType} onValueChange={v => setF('serviceType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{serviceTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Мастер</Label>
              <Input value={form.masterName} onChange={e => setF('masterName', e.target.value)} placeholder="Захаров В.А." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата</Label>
              <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Время</Label>
              <Input type="time" value={form.time} onChange={e => setF('time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Длительность (мин)</Label>
              <Input type="number" value={form.duration} onChange={e => setF('duration', Number(e.target.value))} placeholder="60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setF('status', v as Appointment['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Запланировано</SelectItem>
                  <SelectItem value="confirmed">Подтверждено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                  <SelectItem value="completed">Выполнено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Примечания</Label>
              <Textarea value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Дополнительная информация" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} className="bg-grad-primary hover:opacity-90 text-white">
              {editTarget ? 'Сохранить' : 'Создать запись'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-golos">Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Запись на приём будет удалена.</AlertDialogDescription>
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
