import { useState, useEffect } from 'react';
import { Order, ordersService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<string, { label: string; class: string; icon: string }> = {
  new: { label: 'Новый', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'Plus' },
  in_progress: { label: 'В работе', class: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'Wrench' },
  ready: { label: 'Готов', class: 'bg-green-100 text-green-700 border-green-200', icon: 'CheckCircle' },
  completed: { label: 'Выполнен', class: 'bg-gray-100 text-gray-600 border-gray-200', icon: 'Check' },
  cancelled: { label: 'Отменён', class: 'bg-red-100 text-red-600 border-red-200', icon: 'X' },
};

const priorityMap: Record<string, { label: string; class: string }> = {
  urgent: { label: '🔴 Срочно', class: 'bg-red-500 text-white' },
  high: { label: '🟠 Высокий', class: 'bg-orange-500 text-white' },
  medium: { label: '🟡 Средний', class: 'bg-yellow-500 text-white' },
  low: { label: '🟢 Низкий', class: 'bg-green-500 text-white' },
};

const emptyOrder: Omit<Order, 'id'> = {
  orderNumber: '', clientId: '', clientName: '', carId: '', carInfo: '',
  masterId: '', masterName: '', status: 'new', priority: 'medium',
  createdAt: new Date().toISOString().split('T')[0], estimatedDate: '',
  completedAt: null, totalAmount: 0, services: [], notes: '',
};

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Order | null>(null);
  const [form, setForm] = useState<Omit<Order, 'id'>>(emptyOrder);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setOrders(await ordersService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => [o.orderNumber, o.clientName, o.carInfo, o.masterName].some(v => v.toLowerCase().includes(search.toLowerCase())));

  const openCreate = () => { setEditTarget(null); setForm({ ...emptyOrder, orderNumber: `ЗН-2024-${String(orders.length + 1).padStart(3, '0')}` }); setModalOpen(true); };
  const openEdit = (o: Order) => { setEditTarget(o); setForm({ ...o }); setModalOpen(true); };

  const handleSave = async () => {
    if (editTarget) {
      await ordersService.update(editTarget.id, form);
      toast({ title: 'Заказ-наряд обновлён' });
    } else {
      await ordersService.create(form);
      toast({ title: 'Заказ-наряд создан' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await ordersService.delete(deleteId);
    toast({ title: 'Заказ-наряд удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по номеру, клиенту, автомобилю..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="Plus" size={16} />
          Создать заказ-наряд
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto bg-muted/50 p-1 gap-1 flex-wrap">
          {[
            { value: 'all', label: 'Все', count: counts.all },
            { value: 'new', label: 'Новые', count: counts.new },
            { value: 'in_progress', label: 'В работе', count: counts.in_progress },
            { value: 'ready', label: 'Готовы', count: counts.ready },
            { value: 'completed', label: 'Выполнены', count: counts.completed },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2 font-inter text-sm">
              {t.label}
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{t.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(order => {
                const s = statusMap[order.status];
                const p = priorityMap[order.priority];
                return (
                  <Card key={order.id} className="border-0 shadow-card hover-lift group">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center shadow-sm">
                            <Icon name="ClipboardList" size={18} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 font-golos">{order.orderNumber}</span>
                            <Badge className={`text-xs border ${s.class}`}>{s.label}</Badge>
                            <Badge className={`text-xs ${p.class}`}>{p.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground font-inter flex-wrap">
                            <span className="flex items-center gap-1"><Icon name="User" size={11} />{order.clientName}</span>
                            <span className="flex items-center gap-1"><Icon name="Car" size={11} />{order.carInfo}</span>
                            <span className="flex items-center gap-1"><Icon name="HardHat" size={11} />{order.masterName}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-gray-900 font-golos">{order.totalAmount.toLocaleString('ru')} ₽</div>
                          <div className="text-xs text-muted-foreground font-inter">{order.createdAt}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(order)}><Icon name="Pencil" size={13} className="text-blue-600" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteId(order.id)}><Icon name="Trash2" size={13} className="text-red-500" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-golos">{editTarget ? 'Редактировать заказ-наряд' : 'Новый заказ-наряд'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Номер ЗН</Label>
              <Input value={form.orderNumber} onChange={e => setForm(p => ({ ...p, orderNumber: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as Order['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([v, s]) => <SelectItem key={v} value={v}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Приоритет</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as Order['priority'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="urgent">Срочный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Сумма (₽)</Label>
              <Input type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: +e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Клиент</Label>
              <Input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="ФИО клиента" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Автомобиль</Label>
              <Input value={form.carInfo} onChange={e => setForm(p => ({ ...p, carInfo: e.target.value }))} placeholder="Toyota Camry 2020 (А123БВ 77)" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Мастер</Label>
              <Input value={form.masterName} onChange={e => setForm(p => ({ ...p, masterName: e.target.value }))} placeholder="ФИО мастера" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата создания</Label>
              <Input type="date" value={form.createdAt} onChange={e => setForm(p => ({ ...p, createdAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Плановая дата</Label>
              <Input type="date" value={form.estimatedDate} onChange={e => setForm(p => ({ ...p, estimatedDate: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Примечания</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} className="bg-grad-primary hover:opacity-90 text-white">{editTarget ? 'Сохранить' : 'Создать'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-golos">Удалить заказ-наряд?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
