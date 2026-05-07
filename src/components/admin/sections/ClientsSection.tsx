import { useState, useEffect, useMemo } from 'react';
import { Client, clientsService } from '@/services/mockService';
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

const loyaltyMap = {
  bronze: { label: 'Бронза', class: 'bg-amber-700 text-white', color: 'bg-amber-700' },
  silver: { label: 'Серебро', class: 'bg-gray-400 text-white', color: 'bg-gray-400' },
  gold: { label: 'Золото', class: 'bg-amber-400 text-white', color: 'bg-amber-400' },
  platinum: { label: 'Платина', class: 'bg-violet-600 text-white', color: 'bg-violet-600' },
};

const emptyClient: Omit<Client, 'id'> = {
  name: '', phone: '', email: '', address: '', birthDate: '',
  registeredAt: new Date().toISOString().split('T')[0],
  loyaltyLevel: 'bronze', totalOrders: 0, totalSpent: 0, notes: '',
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

export default function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [viewTarget, setViewTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id'>>(emptyClient);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setClients(await clientsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyClient); setModalOpen(true); };
  const openEdit = (c: Client) => {
    setEditTarget(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, birthDate: c.birthDate, registeredAt: c.registeredAt, loyaltyLevel: c.loyaltyLevel, totalOrders: c.totalOrders, totalSpent: c.totalSpent, notes: c.notes });
    setModalOpen(true);
  };
  const openView = (c: Client) => setViewTarget(c);
  const editFromView = () => {
    if (viewTarget) {
      const c = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(c), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await clientsService.update(editTarget.id, form);
      toast({ title: 'Клиент обновлён' });
    } else {
      await clientsService.create(form);
      toast({ title: 'Клиент добавлен' });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await clientsService.delete(deleteId);
    toast({ title: 'Клиент удалён', variant: 'destructive' });
    setDeleteId(null);
    load();
  };

  // Аналитика
  const analytics = useMemo(() => {
    const total = clients.length || 1;
    const levels = (['bronze', 'silver', 'gold', 'platinum'] as const).map(lvl => ({
      level: lvl,
      count: clients.filter(c => c.loyaltyLevel === lvl).length,
      percent: Math.round((clients.filter(c => c.loyaltyLevel === lvl).length / total) * 100),
      avgCheck: (() => {
        const subset = clients.filter(c => c.loyaltyLevel === lvl);
        const orders = subset.reduce((s, c) => s + c.totalOrders, 0);
        const spent = subset.reduce((s, c) => s + c.totalSpent, 0);
        return orders ? Math.round(spent / orders) : 0;
      })(),
    }));

    const top5 = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    const recentClients = [...clients]
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
      .slice(0, 4);

    const today = new Date();
    const upcomingBirthdays = clients
      .filter(c => c.birthDate)
      .map(c => {
        const bd = new Date(c.birthDate);
        const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        const days = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { client: c, days, dateLabel: next.toLocaleDateString('ru', { day: 'numeric', month: 'long' }) };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 4);

    // Динамика регистраций (мок — последние 6 месяцев)
    const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const dynamics: { month: string; count: number; percent: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = clients.filter(c => {
        const r = new Date(c.registeredAt);
        return r >= d && r < next;
      }).length;
      dynamics.push({ month: monthsRu[d.getMonth()], count, percent: 0 });
    }
    const maxCount = Math.max(...dynamics.map(d => d.count), 1);
    dynamics.forEach(d => { d.percent = (d.count / maxCount) * 100; });

    return { levels, top5, recentClients, upcomingBirthdays, dynamics };
  }, [clients]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по имени, телефону или email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="UserPlus" size={16} />
            Добавить клиента
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего', value: clients.length, icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Платина', value: clients.filter(c => c.loyaltyLevel === 'platinum').length, icon: 'Award', color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Золото', value: clients.filter(c => c.loyaltyLevel === 'gold').length, icon: 'Star', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Новых (месяц)', value: analytics.dynamics[analytics.dynamics.length - 1]?.count ?? 0, icon: 'UserPlus', color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
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

        {/* Аналитические виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Уровни лояльности */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-golos">Уровни лояльности</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">Распределение клиентов</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.levels.map((l) => (
                <div key={l.level} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${loyaltyMap[l.level].color}`} />
                      <span className="font-medium text-gray-900 font-inter">{loyaltyMap[l.level].label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700 font-golos">{l.count} · {l.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${loyaltyMap[l.level].color} transition-all`} style={{ width: `${l.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Топ-5 по выручке */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ-5 клиентов</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По общей выручке</p>
              </div>
              <Icon name="Trophy" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.top5.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(c)}>
                  <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-grad-primary text-white text-[10px] font-bold">{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos text-gray-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{c.totalOrders} заказов</p>
                  </div>
                  <span className="text-xs font-bold font-golos text-gray-900">{c.totalSpent.toLocaleString('ru')} ₽</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Новые клиенты */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Новые клиенты</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Последние регистрации</p>
              </div>
              <Icon name="UserPlus" size={16} className="text-green-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.recentClients.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(c)}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-grad-success text-white text-[10px] font-bold">{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos text-gray-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{c.phone}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-inter">{new Date(c.registeredAt).toLocaleDateString('ru')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Дни рождения */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Ближайшие именинники</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Не забудьте поздравить</p>
              </div>
              <Icon name="Cake" size={16} className="text-pink-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.upcomingBirthdays.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных о датах рождения</p>
              ) : (
                analytics.upcomingBirthdays.map(({ client, days, dateLabel }) => (
                  <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(client)}>
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <Icon name="Gift" size={14} className="text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos text-gray-900 truncate">{client.name}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{dateLabel}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {days === 0 ? 'Сегодня' : `через ${days} дн.`}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Динамика регистраций */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Динамика регистраций</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">За последние 6 месяцев</p>
              </div>
              <Icon name="LineChart" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32 pt-2">
                {analytics.dynamics.map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '90px' }}>
                          <div
                            className="w-full bg-grad-primary rounded-t-md group-hover:opacity-80 transition-all"
                            style={{ height: `${Math.max(d.percent, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-inter text-muted-foreground">{d.month}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{d.month}: {d.count} клиентов</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Средний чек по уровням */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Средний чек</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По уровням лояльности</p>
              </div>
              <Icon name="Wallet" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.levels.map(l => {
                const max = Math.max(...analytics.levels.map(x => x.avgCheck), 1);
                const w = (l.avgCheck / max) * 100;
                return (
                  <div key={l.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-inter text-gray-700">{loyaltyMap[l.level].label}</span>
                      <span className="font-bold font-golos text-gray-900">{l.avgCheck.toLocaleString('ru')} ₽</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${loyaltyMap[l.level].color}`} style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(client => (
              <Card key={client.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(client)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-grad-primary text-white font-bold text-sm">{initials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 font-golos text-sm leading-tight">{client.name}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge className={`text-[10px] px-1.5 py-0 h-4 rounded-full ${loyaltyMap[client.loyaltyLevel].class}`}>
                              {loyaltyMap[client.loyaltyLevel].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(client)}>
                                <Icon name="Eye" size={12} className="text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Просмотр</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(client)}>
                                <Icon name="Pencil" size={12} className="text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Редактировать</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(client.id)}>
                                <Icon name="Trash2" size={12} className="text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                          <Icon name="Phone" size={11} />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                          <Icon name="Mail" size={11} />
                          <span>{client.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-base font-bold text-gray-900 font-golos">{client.totalOrders}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">заказов</p>
                        </div>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="text-center">
                          <p className="text-base font-bold text-gray-900 font-golos">{client.totalSpent.toLocaleString('ru')} ₽</p>
                          <p className="text-[10px] text-muted-foreground font-inter">потрачено</p>
                        </div>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground font-inter">с {new Date(client.registeredAt).toLocaleDateString('ru')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${loyaltyMap[viewTarget.loyaltyLevel].class}`}>
                          {loyaltyMap[viewTarget.loyaltyLevel].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-inter">ID: {viewTarget.id}</span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Контактная информация</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="Phone" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Телефон</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Mail" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Email</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <Icon name="MapPin" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Адрес</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.address || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Cake" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Дата рождения</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.birthDate ? new Date(viewTarget.birthDate).toLocaleDateString('ru') : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="CalendarPlus" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Зарегистрирован</p>
                            <p className="text-sm font-medium font-golos">{new Date(viewTarget.registeredAt).toLocaleDateString('ru')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Статистика</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <p className="text-xl font-bold text-blue-700 font-golos">{viewTarget.totalOrders}</p>
                          <p className="text-[10px] text-blue-700/70 font-inter mt-0.5">заказов</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <p className="text-xl font-bold text-emerald-700 font-golos">{viewTarget.totalSpent.toLocaleString('ru')}</p>
                          <p className="text-[10px] text-emerald-700/70 font-inter mt-0.5">потрачено ₽</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 text-center">
                          <p className="text-xl font-bold text-amber-700 font-golos">
                            {viewTarget.totalOrders ? Math.round(viewTarget.totalSpent / viewTarget.totalOrders).toLocaleString('ru') : 0}
                          </p>
                          <p className="text-[10px] text-amber-700/70 font-inter mt-0.5">средний чек ₽</p>
                        </div>
                        <div className="p-3 rounded-xl bg-violet-50 text-center">
                          <p className="text-xl font-bold text-violet-700 font-golos">
                            {Math.floor((Date.now() - new Date(viewTarget.registeredAt).getTime()) / (1000 * 60 * 60 * 24))}
                          </p>
                          <p className="text-[10px] text-violet-700/70 font-inter mt-0.5">дней с нами</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Прогресс лояльности</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-inter">Текущий: {loyaltyMap[viewTarget.loyaltyLevel].label}</span>
                          <span className="text-muted-foreground font-inter">Платина</span>
                        </div>
                        <Progress
                          value={viewTarget.loyaltyLevel === 'platinum' ? 100 : viewTarget.loyaltyLevel === 'gold' ? 75 : viewTarget.loyaltyLevel === 'silver' ? 50 : 25}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Заметки</h4>
                      <div className="p-3 rounded-xl bg-muted/30 text-sm font-inter text-gray-700 min-h-[60px]">
                        {viewTarget.notes || 'Нет заметок'}
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
          <DialogContent className="max-w-lg glass">
            <DialogHeader>
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="font-inter text-xs">ФИО</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иванов Иван Иванович" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-inter text-xs">Телефон</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 (900) 000-00-00" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-inter text-xs">Email</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="mail@example.com" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="font-inter text-xs">Адрес</Label>
                <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="г. Москва, ул. Примерная, 1" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-inter text-xs">Дата рождения</Label>
                <Input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-inter text-xs">Уровень лояльности</Label>
                <Select value={form.loyaltyLevel} onValueChange={v => setForm(p => ({ ...p, loyaltyLevel: v as Client['loyaltyLevel'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Бронза</SelectItem>
                    <SelectItem value="silver">Серебро</SelectItem>
                    <SelectItem value="gold">Золото</SelectItem>
                    <SelectItem value="platinum">Платина</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="font-inter text-xs">Заметки</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Дополнительная информация..." rows={2} />
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

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-golos">Удалить клиента?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие нельзя отменить. Все данные клиента будут удалены.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
