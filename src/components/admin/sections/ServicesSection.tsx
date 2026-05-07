import { useState, useEffect, useMemo } from 'react';
import { Service, servicesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const categories = [
  'Техническое обслуживание', 'Диагностика', 'Двигатель', 'Тормозная система',
  'Ходовая часть', 'Шиномонтаж', 'Электрика', 'Кузов', 'Детейлинг', 'Прочее',
];

const emptyService: Omit<Service, 'id'> = {
  name: '', category: 'Диагностика', description: '', price: 0, duration: 60, isActive: true, popularity: 50,
};

export default function ServicesSection() {
  const [items, setItems] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [viewTarget, setViewTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyService);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await servicesService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openCreate = () => { setEditTarget(null); setForm(emptyService); setModalOpen(true); };
  const openEdit = (s: Service) => { setEditTarget(s); setForm({ ...s }); setModalOpen(true); };
  const openView = (s: Service) => setViewTarget(s);
  const editFromView = () => {
    if (viewTarget) {
      const s = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(s), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await servicesService.update(editTarget.id, form);
      toast({ title: 'Услуга обновлена' });
    } else {
      await servicesService.create(form);
      toast({ title: 'Услуга добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await servicesService.delete(deleteId);
    toast({ title: 'Услуга удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const avgPrice = items.length ? Math.round(items.reduce((a, s) => a + s.price, 0) / items.length) : 0;
  const mostPopular = items.length ? items.reduce((a, b) => a.popularity > b.popularity ? a : b, items[0]) : null;

  const setF = (k: keyof Omit<Service, 'id'>, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // Аналитика
  const analytics = useMemo(() => {
    // Распределение по категориям
    const catCounts: Record<string, number> = {};
    items.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const byCategory = Object.entries(catCounts).map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count);
    const maxCat = Math.max(...byCategory.map(c => c.count), 1);

    // Топ-5 популярных
    const topPopular = [...items].sort((a, b) => b.popularity - a.popularity).slice(0, 5);

    // Самые дорогие
    const topPrice = [...items].sort((a, b) => b.price - a.price).slice(0, 5);

    // Средняя длительность
    const avgDuration = items.length ? Math.round(items.reduce((a, s) => a + s.duration, 0) / items.length) : 0;

    // Длительность по категориям
    const catDuration: Record<string, { sum: number; count: number }> = {};
    items.forEach(s => {
      if (!catDuration[s.category]) catDuration[s.category] = { sum: 0, count: 0 };
      catDuration[s.category].sum += s.duration;
      catDuration[s.category].count++;
    });
    const durationByCategory = Object.entries(catDuration).map(([cat, d]) => ({
      cat, avg: Math.round(d.sum / d.count),
    })).sort((a, b) => b.avg - a.avg).slice(0, 5);
    const maxDur = Math.max(...durationByCategory.map(d => d.avg), 1);

    // Активные / неактивные
    const active = items.filter(s => s.isActive).length;
    const inactive = items.length - active;

    // Самые быстрые
    const topFast = [...items].sort((a, b) => a.duration - b.duration).slice(0, 3);

    return { byCategory, maxCat, topPopular, topPrice, avgDuration, durationByCategory, maxDur, active, inactive, topFast };
  }, [items]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по названию или категории..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56 h-10">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить услугу
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего услуг', value: items.length, icon: 'Wrench', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Активных', value: items.filter(s => s.isActive).length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Средняя цена', value: avgPrice.toLocaleString('ru') + ' ₽', icon: 'BadgeRussianRuble', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Самая популярная', value: mostPopular?.name?.split(' ').slice(0, 2).join(' ') ?? '—', icon: 'TrendingUp', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={s.icon} size={16} className={s.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                  <p className="text-sm font-bold font-golos truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Категории</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Услуг по категориям</p>
              </div>
              <Icon name="Grid3x3" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.byCategory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
              ) : (
                analytics.byCategory.slice(0, 6).map(c => (
                  <div key={c.cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium font-inter text-gray-900 truncate">{c.cat}</span>
                      <span className="text-xs font-bold font-golos text-gray-700 ml-2">{c.count}</span>
                    </div>
                    <Progress value={(c.count / analytics.maxCat) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ-5 популярных</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По индексу популярности</p>
              </div>
              <Icon name="Flame" size={16} className="text-orange-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topPopular.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(s)}>
                  <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-grad-warning flex items-center justify-center flex-shrink-0">
                    <Icon name="Wrench" size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                    <Progress value={s.popularity} className="h-1 mt-1" />
                  </div>
                  <span className="text-xs font-bold font-golos text-gray-900">{s.popularity}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Самые дорогие</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Топ-5 по цене</p>
              </div>
              <Icon name="BadgeRussianRuble" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topPrice.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(s)}>
                  <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center flex-shrink-0">
                    <Icon name="DollarSign" size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{s.category}</p>
                  </div>
                  <span className="text-xs font-bold font-golos text-gray-900">{s.price.toLocaleString('ru')} ₽</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Длительность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Средняя по категориям</p>
              </div>
              <Icon name="Clock" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center pb-3 border-b border-border/50">
                <p className="text-3xl font-bold font-golos text-gray-900">{analytics.avgDuration}</p>
                <p className="text-xs text-muted-foreground font-inter">минут — в среднем</p>
              </div>
              {analytics.durationByCategory.map(d => (
                <div key={d.cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-inter text-gray-700 truncate">{d.cat}</span>
                    <span className="font-bold font-golos">{d.avg} мин</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-grad-secondary" style={{ width: `${(d.avg / analytics.maxDur) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Активность услуг</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Соотношение</p>
              </div>
              <Icon name="ToggleRight" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-2">
              {(() => {
                const total = analytics.active + analytics.inactive || 1;
                const activePct = (analytics.active / total) * 100;
                const inactivePct = 100 - activePct;
                const r = 54;
                const c = 2 * Math.PI * r;
                const offset1 = c - (activePct / 100) * c;
                return (
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r={r} stroke="#e5e7eb" strokeWidth="14" fill="none" />
                      <circle
                        cx="64" cy="64" r={r}
                        stroke="#10b981" strokeWidth="14" fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset1}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold font-golos text-gray-900">{Math.round(activePct)}%</p>
                      <p className="text-[10px] text-muted-foreground font-inter">активных</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-xs text-emerald-700/70 font-inter">Активные</p>
                  <p className="text-lg font-bold text-emerald-700 font-golos">{analytics.active}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-100">
                  <p className="text-xs text-gray-600 font-inter">Отключены</p>
                  <p className="text-lg font-bold text-gray-700 font-golos">{analytics.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Самые быстрые</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По длительности</p>
              </div>
              <Icon name="Zap" size={16} className="text-yellow-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topFast.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openView(s)}>
                  <div className="w-10 h-10 rounded-xl bg-grad-success flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon name="Zap" size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-golos truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-inter">{s.category}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">{s.duration} мин</Badge>
                </div>
              ))}
              {analytics.topFast.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Icon name="Loader2" size={28} className="animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold font-golos">Название</TableHead>
                    <TableHead className="font-semibold font-golos">Категория</TableHead>
                    <TableHead className="font-semibold font-golos">Цена</TableHead>
                    <TableHead className="font-semibold font-golos">Длительность</TableHead>
                    <TableHead className="font-semibold font-golos">Популярность</TableHead>
                    <TableHead className="font-semibold font-golos">Статус</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(svc => (
                    <TableRow key={svc.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openView(svc)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center shadow-sm flex-shrink-0">
                            <Icon name="Wrench" size={14} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 font-golos text-sm">{svc.name}</div>
                            <div className="text-xs text-muted-foreground font-inter line-clamp-1">{svc.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-inter">{svc.category}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold font-golos text-sm">{svc.price.toLocaleString('ru')} ₽</TableCell>
                      <TableCell className="text-sm font-inter text-muted-foreground">{svc.duration} мин</TableCell>
                      <TableCell className="w-36">
                        <div className="flex items-center gap-2">
                          <Progress value={svc.popularity} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground font-inter w-8">{svc.popularity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={svc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}>
                          {svc.isActive ? 'Активна' : 'Отключена'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(svc)}>
                                <Icon name="Eye" size={12} className="text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Просмотр</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(svc)}>
                                <Icon name="Pencil" size={12} className="text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Редактировать</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(svc.id)}>
                                <Icon name="Trash2" size={12} className="text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-inter">
                        Услуги не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md flex-shrink-0">
                      <Icon name="Wrench" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{viewTarget.category}</Badge>
                        <Badge className={viewTarget.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {viewTarget.isActive ? 'Активна' : 'Отключена'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Описание</h4>
                      <div className="p-3 rounded-xl bg-muted/30 text-sm font-inter text-gray-700 min-h-[60px]">
                        {viewTarget.description || 'Описание не добавлено'}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Параметры</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-amber-50 text-center">
                          <Icon name="BadgeRussianRuble" size={18} className="text-amber-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-amber-700 font-golos">{viewTarget.price.toLocaleString('ru')}</p>
                          <p className="text-[10px] text-amber-700/70 font-inter">цена ₽</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <Icon name="Clock" size={18} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-blue-700 font-golos">{viewTarget.duration}</p>
                          <p className="text-[10px] text-blue-700/70 font-inter">минут</p>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50 text-center">
                          <Icon name="Flame" size={18} className="text-orange-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-orange-700 font-golos">{viewTarget.popularity}%</p>
                          <p className="text-[10px] text-orange-700/70 font-inter">популярность</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-inter">Индекс популярности</span>
                          <span className="font-bold font-golos">{viewTarget.popularity}/100</span>
                        </div>
                        <Progress value={viewTarget.popularity} className="h-2" />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Статус</h4>
                      <div className={`p-4 rounded-xl flex items-center justify-between ${viewTarget.isActive ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewTarget.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            <Icon name={viewTarget.isActive ? 'Check' : 'X'} size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold font-golos ${viewTarget.isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {viewTarget.isActive ? 'Услуга активна' : 'Услуга отключена'}
                            </p>
                            <p className="text-xs text-muted-foreground font-inter">
                              {viewTarget.isActive ? 'Доступна для заказа клиентами' : 'Не отображается клиентам'}
                            </p>
                          </div>
                        </div>
                        <Switch checked={viewTarget.isActive} disabled />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Связанные данные</h4>
                      <div className="p-4 rounded-xl bg-muted/30 text-center">
                        <Icon name="Database" size={24} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-inter">
                          Статистика по заказ-нарядам, использующим эту услугу, будет доступна после интеграции
                        </p>
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

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать услугу' : 'Добавить услугу'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Название услуги</Label>
                <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Введите название" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Категория</Label>
                <Select value={form.category} onValueChange={v => setF('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Цена (₽)</Label>
                <Input type="number" value={form.price} onChange={e => setF('price', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Длительность (мин)</Label>
                <Input type="number" value={form.duration} onChange={e => setF('duration', Number(e.target.value))} placeholder="60" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Популярность (%)</Label>
                <Input type="number" min={0} max={100} value={form.popularity} onChange={e => setF('popularity', Number(e.target.value))} placeholder="50" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Описание</Label>
                <Textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Описание услуги" rows={3} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setF('isActive', v)} />
                <Label className="text-sm font-inter">Услуга активна</Label>
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
              <AlertDialogTitle className="font-golos">Удалить услугу?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Услуга будет удалена из системы.</AlertDialogDescription>
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
