import { useState, useEffect, useMemo } from 'react';
import { Order, ordersService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<string, { label: string; class: string; icon: string; color: string }> = {
  new: { label: 'Новый', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'Plus', color: 'bg-blue-500' },
  in_progress: { label: 'В работе', class: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'Wrench', color: 'bg-amber-500' },
  ready: { label: 'Готов', class: 'bg-green-100 text-green-700 border-green-200', icon: 'CheckCircle', color: 'bg-green-500' },
  completed: { label: 'Выполнен', class: 'bg-gray-100 text-gray-600 border-gray-200', icon: 'Check', color: 'bg-gray-500' },
  cancelled: { label: 'Отменён', class: 'bg-red-100 text-red-600 border-red-200', icon: 'X', color: 'bg-red-500' },
};

const priorityMap: Record<string, { label: string; class: string; color: string; rawLabel: string }> = {
  urgent: { label: '🔴 Срочно', class: 'bg-red-500 text-white', color: 'bg-red-500', rawLabel: 'Срочные' },
  high: { label: '🟠 Высокий', class: 'bg-orange-500 text-white', color: 'bg-orange-500', rawLabel: 'Высокие' },
  medium: { label: '🟡 Средний', class: 'bg-yellow-500 text-white', color: 'bg-yellow-500', rawLabel: 'Средние' },
  low: { label: '🟢 Низкий', class: 'bg-green-500 text-white', color: 'bg-green-500', rawLabel: 'Низкие' },
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
  const [viewTarget, setViewTarget] = useState<Order | null>(null);
  const [form, setForm] = useState<Omit<Order, 'id'>>(emptyOrder);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setOrders(await ordersService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => [o.orderNumber, o.clientName, o.carInfo, o.masterName].some(v => v.toLowerCase().includes(search.toLowerCase())));

  const openCreate = () => { setEditTarget(null); setForm({ ...emptyOrder, orderNumber: `ЗН-2024-${String(orders.length + 1).padStart(3, '0')}` }); setModalOpen(true); };
  const openEdit = (o: Order) => { setEditTarget(o); setForm({ ...o }); setModalOpen(true); };
  const openView = (o: Order) => setViewTarget(o);
  const editFromView = () => {
    if (viewTarget) {
      const o = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(o), 100);
    }
  };

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

  const analytics = useMemo(() => {
    const total = orders.length || 1;

    // Воронка статусов
    const funnel = [
      { key: 'new', label: 'Новые', count: counts.new, color: 'bg-blue-500' },
      { key: 'in_progress', label: 'В работе', count: counts.in_progress, color: 'bg-amber-500' },
      { key: 'ready', label: 'Готовы', count: counts.ready, color: 'bg-green-500' },
      { key: 'completed', label: 'Выполнены', count: counts.completed, color: 'bg-gray-500' },
    ];

    // Распределение по приоритетам
    const priorities = (['urgent', 'high', 'medium', 'low'] as const).map(p => ({
      key: p,
      count: orders.filter(o => o.priority === p).length,
      percent: Math.round((orders.filter(o => o.priority === p).length / total) * 100),
    }));

    // Выручка за 7 дней
    const today = new Date();
    const days: { label: string; sum: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('ru', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      const sum = orders.filter(o => o.createdAt === dateStr).reduce((a, o) => a + o.totalAmount, 0);
      days.push({ label, sum, date: dateStr });
    }
    const maxDay = Math.max(...days.map(d => d.sum), 1);
    const weekTotal = days.reduce((a, d) => a + d.sum, 0);

    // Топ мастеров
    const masterStats: Record<string, { name: string; count: number; sum: number }> = {};
    orders.forEach(o => {
      if (!o.masterName) return;
      if (!masterStats[o.masterName]) masterStats[o.masterName] = { name: o.masterName, count: 0, sum: 0 };
      masterStats[o.masterName].count++;
      masterStats[o.masterName].sum += o.totalAmount;
    });
    const topMasters = Object.values(masterStats).sort((a, b) => b.count - a.count).slice(0, 5);

    // Средний срок выполнения
    const completed = orders.filter(o => o.completedAt && o.createdAt);
    const avgDays = completed.length
      ? Math.round(completed.reduce((acc, o) => {
          const c = new Date(o.createdAt).getTime();
          const e = new Date(o.completedAt!).getTime();
          return acc + (e - c) / (1000 * 60 * 60 * 24);
        }, 0) / completed.length)
      : 0;

    // Просроченные заказы
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = orders.filter(o =>
      o.estimatedDate &&
      o.estimatedDate < todayStr &&
      o.status !== 'completed' &&
      o.status !== 'cancelled'
    );

    return { funnel, priorities, days, maxDay, weekTotal, topMasters, avgDays, overdue };
  }, [orders, counts]);

  return (
    <TooltipProvider>
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего ЗН', value: counts.all, icon: 'ClipboardList', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'В работе', value: counts.in_progress, icon: 'Wrench', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Готовы', value: counts.ready, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Сумма всех', value: orders.reduce((a, o) => a + o.totalAmount, 0).toLocaleString('ru') + ' ₽', icon: 'Wallet', color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={s.icon} size={16} className={s.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                  <p className="text-base font-bold font-golos truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Виджеты — воронка + приоритеты + средний срок */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-golos">Воронка статусов</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">Движение заказ-нарядов</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {analytics.funnel.map((s, i) => (
                  <div key={s.key} className="flex items-center flex-1 gap-2">
                    <div className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30">
                      <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center shadow-md`}>
                        <Icon name={statusMap[s.key]?.icon || 'Circle'} size={16} className="text-white" />
                      </div>
                      <p className="text-2xl font-bold font-golos text-gray-900">{s.count}</p>
                      <p className="text-[10px] text-muted-foreground font-inter text-center">{s.label}</p>
                    </div>
                    {i < analytics.funnel.length - 1 && (
                      <Icon name="ChevronRight" size={20} className="text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Средний срок</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Время выполнения</p>
              </div>
              <Icon name="Timer" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted" />
                  <circle
                    cx="64" cy="64" r="54"
                    stroke="url(#timer-grad)" strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 - (Math.min(analytics.avgDays, 14) / 14) * (2 * Math.PI * 54)}
                  />
                  <defs>
                    <linearGradient id="timer-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold font-golos text-gray-900">{analytics.avgDays}</p>
                  <p className="text-[10px] text-muted-foreground font-inter">{analytics.avgDays === 1 ? 'день' : 'дней'}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-inter text-center mt-2">
                В среднем уходит на выполнение заказ-наряда
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Приоритеты</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение по важности</p>
              </div>
              <Icon name="Flag" size={16} className="text-orange-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.priorities.map(p => (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${priorityMap[p.key].color}`} />
                      <span className="font-medium font-inter text-gray-900">{priorityMap[p.key].rawLabel}</span>
                    </div>
                    <span className="text-xs font-bold font-golos text-gray-700">{p.count} · {p.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${priorityMap[p.key].color}`} style={{ width: `${p.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Выручка (7 дней)</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Итого: {analytics.weekTotal.toLocaleString('ru')} ₽</p>
              </div>
              <Icon name="LineChart" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-28 pt-2">
                {analytics.days.map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                          <div
                            className="w-full bg-grad-success rounded-t group-hover:opacity-80 transition-all"
                            style={{ height: `${Math.max((d.sum / analytics.maxDay) * 100, 4)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-inter text-muted-foreground capitalize">{d.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{d.label}: {d.sum.toLocaleString('ru')} ₽</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ мастеров</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По заказ-нарядам</p>
              </div>
              <Icon name="HardHat" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topMasters.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.topMasters.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-grad-secondary flex items-center justify-center flex-shrink-0">
                      <Icon name="HardHat" size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{m.count} ЗН · {m.sum.toLocaleString('ru')} ₽</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Просроченные */}
        {analytics.overdue.length > 0 && (
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6 border-l-4 border-l-red-500 bg-red-50/30">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Icon name="AlertCircle" size={18} className="text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos text-red-700">Просроченные заказ-наряды</CardTitle>
                  <p className="text-xs text-red-600/70 font-inter">{analytics.overdue.length} ЗН превысили плановую дату</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white">Внимание</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.overdue.slice(0, 6).map(o => (
                  <div key={o.id} className="p-3 rounded-xl bg-white border border-red-200 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => openView(o)}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-bold font-golos">{o.orderNumber}</span>
                      <Badge className="text-[10px] bg-red-100 text-red-700">{o.estimatedDate}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-inter truncate">{o.clientName}</p>
                    <p className="text-xs text-muted-foreground font-inter truncate">{o.carInfo}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    <Card key={order.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(order)}>
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openView(order)}><Icon name="Eye" size={13} className="text-emerald-600" /></Button>
                              </TooltipTrigger>
                              <TooltipContent>Просмотр</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(order)}><Icon name="Pencil" size={13} className="text-blue-600" /></Button>
                              </TooltipTrigger>
                              <TooltipContent>Редактировать</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteId(order.id)}><Icon name="Trash2" size={13} className="text-red-500" /></Button>
                              </TooltipTrigger>
                              <TooltipContent>Удалить</TooltipContent>
                            </Tooltip>
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

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-3xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md flex-shrink-0">
                      <Icon name="ClipboardList" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.orderNumber}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs border ${statusMap[viewTarget.status].class}`}>{statusMap[viewTarget.status].label}</Badge>
                        <Badge className={`text-xs ${priorityMap[viewTarget.priority].class}`}>{priorityMap[viewTarget.priority].label}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Клиент и автомобиль</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center">
                            <Icon name="User" size={16} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground font-inter">Клиент</p>
                            <p className="text-sm font-semibold font-golos truncate">{viewTarget.clientName}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center">
                            <Icon name="Car" size={16} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground font-inter">Автомобиль</p>
                            <p className="text-sm font-semibold font-golos truncate">{viewTarget.carInfo}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Исполнитель</h4>
                      <div className="p-3 rounded-xl bg-violet-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-warning flex items-center justify-center">
                          <Icon name="HardHat" size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-golos">{viewTarget.masterName || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">Мастер</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Сроки</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <Icon name="CalendarPlus" size={16} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-[10px] text-blue-700/70 font-inter">Создан</p>
                          <p className="text-xs font-bold text-blue-700 font-golos mt-0.5">{viewTarget.createdAt || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 text-center">
                          <Icon name="CalendarClock" size={16} className="text-amber-600 mx-auto mb-1" />
                          <p className="text-[10px] text-amber-700/70 font-inter">Плановая дата</p>
                          <p className="text-xs font-bold text-amber-700 font-golos mt-0.5">{viewTarget.estimatedDate || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <Icon name="CalendarCheck" size={16} className="text-emerald-600 mx-auto mb-1" />
                          <p className="text-[10px] text-emerald-700/70 font-inter">Завершён</p>
                          <p className="text-xs font-bold text-emerald-700 font-golos mt-0.5">{viewTarget.completedAt || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Услуги ({viewTarget.services.length})</h4>
                      {viewTarget.services.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3 font-inter">Услуги не указаны</p>
                      ) : (
                        <div className="space-y-1.5">
                          {viewTarget.services.map((srv, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                              <div className="w-6 h-6 rounded bg-grad-primary flex items-center justify-center flex-shrink-0">
                                <Icon name="Wrench" size={11} className="text-white" />
                              </div>
                              <span className="text-sm font-inter">{srv}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Сумма заказа</h4>
                      <div className="p-4 rounded-xl bg-grad-primary text-center">
                        <p className="text-3xl font-bold text-white font-golos">{viewTarget.totalAmount.toLocaleString('ru')} ₽</p>
                        <p className="text-xs text-white/80 font-inter mt-1">Итого по заказ-наряду</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Примечания</h4>
                      <div className="p-3 rounded-xl bg-muted/30 text-sm font-inter text-gray-700 min-h-[60px]">
                        {viewTarget.notes || 'Нет примечаний'}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setViewTarget(null)}>Закрыть</Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Функция в разработке' })} className="gap-2">
                    <Icon name="Printer" size={14} />
                    Распечатать
                  </Button>
                  <Button onClick={editFromView} className="bg-grad-primary hover:opacity-90 text-white gap-2">
                    <Icon name="Pencil" size={14} />
                    Редактировать
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

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
    </TooltipProvider>
  );
}
