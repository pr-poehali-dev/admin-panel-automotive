import { useState, useEffect, useMemo } from 'react';
import { Appointment, appointmentsService } from '@/services/mockService';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<Appointment['status'], { label: string; class: string; icon: string; color: string }> = {
  scheduled: { label: 'Запланировано', class: 'bg-blue-100 text-blue-700', icon: 'Clock', color: 'bg-blue-500' },
  confirmed: { label: 'Подтверждено', class: 'bg-green-100 text-green-700', icon: 'CheckCircle', color: 'bg-green-500' },
  cancelled: { label: 'Отменено', class: 'bg-red-100 text-red-600', icon: 'XCircle', color: 'bg-red-500' },
  completed: { label: 'Выполнено', class: 'bg-gray-100 text-gray-600', icon: 'Check', color: 'bg-gray-500' },
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

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

export default function AppointmentsSection() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [viewTarget, setViewTarget] = useState<Appointment | null>(null);
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
  const openView = (a: Appointment) => setViewTarget(a);
  const editFromView = () => {
    if (viewTarget) {
      const a = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(a), 100);
    }
  };

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

  // Аналитика
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })();

    const todayList = items.filter(a => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
    const tomorrowList = items.filter(a => a.date === tomorrow)
      .sort((a, b) => a.time.localeCompare(b.time));

    // По мастерам
    const masterStats: Record<string, number> = {};
    items.forEach(a => { if (a.masterName) masterStats[a.masterName] = (masterStats[a.masterName] || 0) + 1; });
    const byMaster = Object.entries(masterStats).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    const maxMaster = Math.max(...byMaster.map(m => m.count), 1);

    // По часам (8-19)
    const hours: { hour: number; count: number }[] = [];
    for (let h = 8; h <= 19; h++) {
      const count = items.filter(a => parseInt(a.time.split(':')[0]) === h).length;
      hours.push({ hour: h, count });
    }
    const maxHour = Math.max(...hours.map(h => h.count), 1);

    // Статусы
    const statuses = (['scheduled', 'confirmed', 'cancelled', 'completed'] as const).map(s => ({
      key: s,
      count: items.filter(a => a.status === s).length,
    }));

    // Популярные услуги
    const serviceStats: Record<string, number> = {};
    items.forEach(a => { serviceStats[a.serviceType] = (serviceStats[a.serviceType] || 0) + 1; });
    const topServices = Object.entries(serviceStats).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    const maxService = Math.max(...topServices.map(s => s.count), 1);

    return { today, todayList, tomorrowList, byMaster, maxMaster, hours, maxHour, statuses, topServices, maxService };
  }, [items]);

  const calcEndTime = (time: string, duration: number) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + duration;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  return (
    <TooltipProvider>
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
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
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

        {/* Сегодня и завтра */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center shadow-md">
                  <Icon name="CalendarCheck" size={18} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Сегодня</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">{analytics.todayList.length} записей</p>
                </div>
              </div>
              <Badge className="bg-blue-500 text-white">{new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long' })}</Badge>
            </CardHeader>
            <CardContent>
              {analytics.todayList.length === 0 ? (
                <div className="py-6 text-center">
                  <Icon name="CalendarX" size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-inter">Записей на сегодня нет</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.todayList.slice(0, 4).map(a => {
                    const st = statusMap[a.status];
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/70 hover:bg-white transition-colors cursor-pointer" onClick={() => openView(a)}>
                        <div className="text-center flex-shrink-0">
                          <p className="text-sm font-bold text-primary font-golos">{a.time}</p>
                          <p className="text-[9px] text-muted-foreground font-inter">{a.duration} мин</p>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold font-golos truncate">{a.clientName}</p>
                          <p className="text-[10px] text-muted-foreground font-inter truncate">{a.serviceType}</p>
                        </div>
                        <Badge className={`text-[10px] ${st.class}`}>{st.label}</Badge>
                      </div>
                    );
                  })}
                  {analytics.todayList.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center font-inter pt-1">+ ещё {analytics.todayList.length - 4} записей</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center shadow-md">
                  <Icon name="CalendarDays" size={18} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Завтра</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">{analytics.tomorrowList.length} записей</p>
                </div>
              </div>
              <Badge variant="outline">{(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' }); })()}</Badge>
            </CardHeader>
            <CardContent>
              {analytics.tomorrowList.length === 0 ? (
                <div className="py-6 text-center">
                  <Icon name="CalendarX" size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-inter">Записей на завтра нет</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.tomorrowList.slice(0, 4).map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(a)}>
                      <div className="text-center flex-shrink-0">
                        <p className="text-sm font-bold text-violet-600 font-golos">{a.time}</p>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{a.clientName}</p>
                        <p className="text-[10px] text-muted-foreground font-inter truncate">{a.carInfo}</p>
                      </div>
                      <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                    </div>
                  ))}
                  {analytics.tomorrowList.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center font-inter pt-1">+ ещё {analytics.tomorrowList.length - 4} записей</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Виджеты: мастера, часы, статусы */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Загрузка мастеров</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По числу записей</p>
              </div>
              <Icon name="HardHat" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.byMaster.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.byMaster.map(m => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-grad-secondary text-white text-[9px] font-bold">{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium font-inter text-gray-900 truncate">{m.name}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700 ml-2">{m.count}</span>
                    </div>
                    <Progress value={(m.count / analytics.maxMaster) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Загрузка по часам</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Пиковые часы (8–19)</p>
              </div>
              <Icon name="Clock" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-32 pt-2">
                {analytics.hours.map(h => (
                  <Tooltip key={h.hour}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '90px' }}>
                          <div
                            className="w-full bg-grad-primary rounded-t group-hover:opacity-80 transition-all"
                            style={{ height: `${Math.max((h.count / analytics.maxHour) * 100, 4)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-inter text-muted-foreground">{h.hour}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{h.hour}:00 — {h.count} записей</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Статусы записей</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение</p>
              </div>
              <Icon name="Activity" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.statuses.map(st => {
                const total = items.length || 1;
                const pct = (st.count / total) * 100;
                const cfg = statusMap[st.key];
                return (
                  <div key={st.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                        <span className="font-medium font-inter text-gray-900">{cfg.label}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{st.count} · {Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Виджеты: услуги + таймлайн */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Популярные услуги</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Топ-5 по количеству записей</p>
              </div>
              <Icon name="Flame" size={16} className="text-orange-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topServices.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.topServices.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-grad-warning flex items-center justify-center flex-shrink-0">
                      <Icon name="Wrench" size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                      <Progress value={(s.count / analytics.maxService) * 100} className="h-1 mt-1" />
                    </div>
                    <span className="text-xs font-bold font-golos text-gray-900">{s.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Сегодняшнее расписание</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Таймлайн записей</p>
              </div>
              <Icon name="ListChecks" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent>
              {analytics.todayList.length === 0 ? (
                <div className="py-6 text-center">
                  <Icon name="CalendarX" size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-inter">На сегодня записей нет</p>
                </div>
              ) : (
                <ScrollArea className="h-[220px] pr-2">
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                    {analytics.todayList.map(a => {
                      const st = statusMap[a.status];
                      return (
                        <div key={a.id} className="relative mb-3 cursor-pointer" onClick={() => openView(a)}>
                          <div className={`absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow ${st.color}`} />
                          <div className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold font-golos text-primary">{a.time} – {calcEndTime(a.time, a.duration)}</span>
                              <Badge className={`text-[9px] h-4 ${st.class}`}>{st.label}</Badge>
                            </div>
                            <p className="text-xs font-semibold font-golos truncate">{a.clientName}</p>
                            <p className="text-[10px] text-muted-foreground font-inter truncate">{a.serviceType} · {a.masterName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
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
                <Card key={appt.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(appt)}>
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
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(appt)}>
                                    <Icon name="Eye" size={12} className="text-emerald-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Просмотр</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(appt)}>
                                    <Icon name="Pencil" size={12} className="text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Редактировать</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(appt.id)}>
                                    <Icon name="Trash2" size={12} className="text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Удалить</TooltipContent>
                              </Tooltip>
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

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md flex-shrink-0">
                      <Icon name="CalendarCheck" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">
                        {new Date(viewTarget.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })} · {viewTarget.time}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${statusMap[viewTarget.status].class}`}>
                          <Icon name={statusMap[viewTarget.status].icon} size={10} className="mr-1" />
                          {statusMap[viewTarget.status].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{viewTarget.duration} мин</Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Клиент</h4>
                      <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-grad-primary text-white text-xs font-bold">{initials(viewTarget.clientName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold font-golos truncate">{viewTarget.clientName || '—'}</p>
                            <p className="text-[10px] text-muted-foreground font-inter">ID клиента: {viewTarget.clientId || '—'}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <Icon name="Phone" size={14} className="text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-inter">Телефон</p>
                              <p className="text-sm font-medium font-golos">{viewTarget.phone || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="Car" size={14} className="text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-inter">Автомобиль</p>
                              <p className="text-sm font-medium font-golos">{viewTarget.carInfo || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Услуга</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-warning flex items-center justify-center">
                          <Icon name="Wrench" size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold font-golos">{viewTarget.serviceType}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">Длительность: {viewTarget.duration} минут</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Мастер</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center">
                          <Icon name="HardHat" size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold font-golos">{viewTarget.masterName || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">ID мастера: {viewTarget.masterId || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Дата и время</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <Icon name="Calendar" size={16} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-[10px] text-blue-700/70 font-inter">Дата</p>
                          <p className="text-xs font-bold text-blue-700 font-golos mt-0.5">{new Date(viewTarget.date).toLocaleDateString('ru')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <Icon name="Clock" size={16} className="text-emerald-600 mx-auto mb-1" />
                          <p className="text-[10px] text-emerald-700/70 font-inter">Начало</p>
                          <p className="text-xs font-bold text-emerald-700 font-golos mt-0.5">{viewTarget.time}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-violet-50 text-center">
                          <Icon name="Timer" size={16} className="text-violet-600 mx-auto mb-1" />
                          <p className="text-[10px] text-violet-700/70 font-inter">Окончание</p>
                          <p className="text-xs font-bold text-violet-700 font-golos mt-0.5">{calcEndTime(viewTarget.time, viewTarget.duration)}</p>
                        </div>
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
                  {viewTarget.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({ title: 'Запись подтверждена' });
                        setViewTarget(null);
                      }}
                      className="gap-2"
                    >
                      <Icon name="CheckCircle" size={14} />
                      Подтвердить запись
                    </Button>
                  )}
                  <Button onClick={editFromView} className="bg-grad-primary hover:opacity-90 text-white gap-2">
                    <Icon name="Pencil" size={14} />
                    Редактировать
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit/Create Modal */}
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
    </TooltipProvider>
  );
}
