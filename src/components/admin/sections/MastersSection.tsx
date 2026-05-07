import { useState, useEffect, useMemo } from 'react';
import { Master, mastersService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<Master['status'], { label: string; class: string; color: string }> = {
  active: { label: 'Работает', class: 'bg-green-100 text-green-700', color: 'bg-green-500' },
  vacation: { label: 'Отпуск', class: 'bg-blue-100 text-blue-700', color: 'bg-blue-500' },
  sick: { label: 'Болен', class: 'bg-orange-100 text-orange-700', color: 'bg-orange-500' },
  fired: { label: 'Уволен', class: 'bg-red-100 text-red-600', color: 'bg-red-500' },
};

const positions = ['Старший механик', 'Механик', 'Электрик', 'Шиномонтажник', 'Кузовщик', 'Диагност'];

const emptyMaster: Omit<Master, 'id'> = {
  name: '', position: 'Механик', specialization: [], phone: '', email: '',
  hireDate: new Date().toISOString().split('T')[0], rating: 5.0,
  completedOrders: 0, status: 'active', salary: 0,
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

export default function MastersSection() {
  const [items, setItems] = useState<Master[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Master | null>(null);
  const [viewTarget, setViewTarget] = useState<Master | null>(null);
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
  const openView = (m: Master) => setViewTarget(m);
  const editFromView = () => {
    if (viewTarget) {
      const m = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(m), 100);
    }
  };

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

  const avgRating = items.length ? (items.reduce((a, m) => a + m.rating, 0) / items.length).toFixed(1) : '0';
  const totalCompleted = items.reduce((a, m) => a + m.completedOrders, 0);

  const setF = (k: keyof Omit<Master, 'id'>, v: string | number | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Аналитика
  const analytics = useMemo(() => {
    const top3 = [...items].sort((a, b) => b.rating - a.rating).slice(0, 3);

    // Распределение по специализациям
    const specCounts: Record<string, number> = {};
    items.forEach(m => m.specialization.forEach(s => { specCounts[s] = (specCounts[s] || 0) + 1; }));
    const specs = Object.entries(specCounts).map(([s, count]) => ({ s, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
    const maxSpec = Math.max(...specs.map(s => s.count), 1);

    // Распределение по статусам
    const statuses = (['active', 'vacation', 'sick', 'fired'] as const).map(st => ({
      key: st,
      count: items.filter(m => m.status === st).length,
    }));

    // Стаж
    const today = Date.now();
    const tenure = {
      junior: items.filter(m => (today - new Date(m.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365) < 1).length,
      middle: items.filter(m => {
        const y = (today - new Date(m.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return y >= 1 && y < 3;
      }).length,
      senior: items.filter(m => {
        const y = (today - new Date(m.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return y >= 3 && y < 5;
      }).length,
      veteran: items.filter(m => (today - new Date(m.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365) >= 5).length,
    };

    // Фонд оплаты труда
    const payroll = items.filter(m => m.status === 'active').reduce((a, m) => a + m.salary, 0);

    // Лучший мастер месяца (комбинация рейтинга и количества)
    const bestMaster = items
      .filter(m => m.status === 'active')
      .sort((a, b) => (b.rating * b.completedOrders) - (a.rating * a.completedOrders))[0];

    return { top3, specs, maxSpec, statuses, tenure, payroll, bestMaster };
  }, [items]);

  const yearsOf = (date: string) => {
    const ms = Date.now() - new Date(date).getTime();
    return (ms / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
  };
  const daysOf = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <TooltipProvider>
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

        {/* Виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Топ-3 мастера */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ-3 по рейтингу</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Лучшие специалисты</p>
              </div>
              <Icon name="Trophy" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.top3.map((m, i) => {
                const medal = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400'][i];
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(m)}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${medal}`}>{i + 1}</div>
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-grad-primary text-white text-xs font-bold">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{m.name}</p>
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold font-golos">{m.rating}</span>
                        <span className="text-[10px] text-muted-foreground font-inter ml-1">· {m.completedOrders} ЗН</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Специализации */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Специализации</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение мастеров</p>
              </div>
              <Icon name="Wrench" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.specs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.specs.map(s => (
                  <div key={s.s} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium font-inter text-gray-900 truncate">{s.s}</span>
                      <span className="text-xs font-bold font-golos text-gray-700 ml-2">{s.count}</span>
                    </div>
                    <Progress value={(s.count / analytics.maxSpec) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Статусы */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Статусы</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Текущее состояние</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Стаж */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Стаж работы</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение по опыту</p>
              </div>
              <Icon name="Clock" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'До 1 года', count: analytics.tenure.junior, color: 'bg-emerald-500' },
                { label: '1–3 года', count: analytics.tenure.middle, color: 'bg-blue-500' },
                { label: '3–5 лет', count: analytics.tenure.senior, color: 'bg-amber-500' },
                { label: 'Более 5 лет', count: analytics.tenure.veteran, color: 'bg-violet-500' },
              ].map((g, i) => {
                const total = items.length || 1;
                const pct = (g.count / total) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${g.color}`} />
                        <span className="font-medium font-inter text-gray-900">{g.label}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{g.count} · {Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${g.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Фонд оплаты труда */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Фонд оплаты труда</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Месячный ФОТ активных</p>
              </div>
              <Icon name="Wallet" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-grad-success flex items-center justify-center shadow-md mb-3">
                <Icon name="BadgeRussianRuble" size={26} className="text-white" />
              </div>
              <p className="text-3xl font-bold font-golos text-gray-900">{analytics.payroll.toLocaleString('ru')} ₽</p>
              <p className="text-xs text-muted-foreground font-inter mt-1">в месяц на {items.filter(m => m.status === 'active').length} активных</p>
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-[10px] text-emerald-700/70 font-inter">Средняя ЗП</p>
                  <p className="text-sm font-bold text-emerald-700 font-golos">
                    {items.filter(m => m.status === 'active').length
                      ? Math.round(analytics.payroll / items.filter(m => m.status === 'active').length).toLocaleString('ru')
                      : 0} ₽
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-50">
                  <p className="text-[10px] text-blue-700/70 font-inter">В год</p>
                  <p className="text-sm font-bold text-blue-700 font-golos">{((analytics.payroll * 12) / 1_000_000).toFixed(1)} млн ₽</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Лучший мастер месяца */}
          {analytics.bestMaster && (
            <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-l-4 border-l-amber-400 cursor-pointer" onClick={() => openView(analytics.bestMaster!)}>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold font-golos text-amber-900">Лучший мастер месяца</CardTitle>
                  <p className="text-xs text-amber-700/70 font-inter">По комбинации рейтинга и заказов</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-md">
                  <Icon name="Crown" size={18} className="text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 ring-2 ring-amber-300">
                    <AvatarFallback className="bg-grad-warning text-white text-base font-bold">{initials(analytics.bestMaster.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-golos text-amber-900 truncate">{analytics.bestMaster.name}</p>
                    <p className="text-xs text-amber-800/70 font-inter">{analytics.bestMaster.position}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={11} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold font-golos">{analytics.bestMaster.rating}</span>
                      </div>
                      <span className="text-xs text-amber-800 font-inter">·</span>
                      <span className="text-xs text-amber-800 font-inter">{analytics.bestMaster.completedOrders} заказов</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                <Card key={master.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(master)}>
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
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(master)}>
                                    <Icon name="Eye" size={12} className="text-emerald-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Просмотр</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(master)}>
                                    <Icon name="Pencil" size={12} className="text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Редактировать</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(master.id)}>
                                    <Icon name="Trash2" size={12} className="text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Удалить</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

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

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-grad-primary text-white text-lg font-bold">{initials(viewTarget.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary">{viewTarget.position}</Badge>
                        <Badge className={`text-xs ${statusMap[viewTarget.status].class}`}>
                          {statusMap[viewTarget.status].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Контакты</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="Phone" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Телефон</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.phone || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Mail" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Email</p>
                            <p className="text-sm font-medium font-golos truncate">{viewTarget.email || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Профессиональная информация</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-inter mb-1.5">Специализация</p>
                          <div className="flex flex-wrap gap-1.5">
                            {viewTarget.specialization.length === 0 ? (
                              <span className="text-sm text-muted-foreground font-inter">не указана</span>
                            ) : (
                              viewTarget.specialization.map(s => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-xl bg-blue-50 text-center">
                            <Icon name="CalendarPlus" size={16} className="text-blue-600 mx-auto mb-1" />
                            <p className="text-[10px] text-blue-700/70 font-inter">Принят</p>
                            <p className="text-xs font-bold text-blue-700 font-golos mt-0.5">
                              {new Date(viewTarget.hireDate).toLocaleDateString('ru')}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 text-center">
                            <Icon name="Clock" size={16} className="text-emerald-600 mx-auto mb-1" />
                            <p className="text-[10px] text-emerald-700/70 font-inter">Стаж</p>
                            <p className="text-xs font-bold text-emerald-700 font-golos mt-0.5">{yearsOf(viewTarget.hireDate)} лет</p>
                          </div>
                          <div className="p-3 rounded-xl bg-violet-50 text-center">
                            <Icon name="CalendarDays" size={16} className="text-violet-600 mx-auto mb-1" />
                            <p className="text-[10px] text-violet-700/70 font-inter">Дней</p>
                            <p className="text-xs font-bold text-violet-700 font-golos mt-0.5">{daysOf(viewTarget.hireDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Статистика работы</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-amber-50 text-center">
                          <div className="flex items-center justify-center gap-0.5 mb-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Icon key={s} name="Star" size={11} className={s <= Math.round(viewTarget.rating) ? 'text-amber-500 fill-amber-500' : 'text-amber-200 fill-amber-200'} />
                            ))}
                          </div>
                          <p className="text-xl font-bold text-amber-700 font-golos">{viewTarget.rating}</p>
                          <p className="text-[10px] text-amber-700/70 font-inter">рейтинг</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <Icon name="ClipboardCheck" size={16} className="text-emerald-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-emerald-700 font-golos">{viewTarget.completedOrders}</p>
                          <p className="text-[10px] text-emerald-700/70 font-inter">заказов</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <Icon name="TrendingUp" size={16} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-blue-700 font-golos">
                            {Math.round(viewTarget.completedOrders / Math.max(parseFloat(yearsOf(viewTarget.hireDate)), 0.1))}
                          </p>
                          <p className="text-[10px] text-blue-700/70 font-inter">в год</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Зарплата</h4>
                      <div className="p-4 rounded-xl bg-grad-primary text-center">
                        <Icon name="Wallet" size={20} className="text-white mx-auto mb-1" />
                        <p className="text-3xl font-bold text-white font-golos">{viewTarget.salary.toLocaleString('ru')} ₽</p>
                        <p className="text-xs text-white/80 font-inter mt-1">в месяц</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewTarget(null)}>Закрыть</Button>
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
    </TooltipProvider>
  );
}
