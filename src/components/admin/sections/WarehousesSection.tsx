import { useState, useEffect, useMemo } from 'react';
import { Warehouse, warehousesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const emptyWarehouse: Omit<Warehouse, 'id'> = {
  name: '', location: '', responsible: '',
  totalItems: 0, totalValue: 0, status: 'active',
  lastInventory: new Date().toISOString().split('T')[0],
};

export default function WarehousesSection() {
  const [items, setItems] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [viewTarget, setViewTarget] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Omit<Warehouse, 'id'>>(emptyWarehouse);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await warehousesService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase()) ||
    w.responsible.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyWarehouse); setModalOpen(true); };
  const openEdit = (w: Warehouse) => { setEditTarget(w); setForm({ ...w }); setModalOpen(true); };
  const openView = (w: Warehouse) => setViewTarget(w);
  const editFromView = () => {
    if (viewTarget) {
      const w = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(w), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await warehousesService.update(editTarget.id, form);
      toast({ title: 'Склад обновлён' });
    } else {
      await warehousesService.create(form);
      toast({ title: 'Склад добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await warehousesService.delete(deleteId);
    toast({ title: 'Склад удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const totalItems = items.reduce((a, w) => a + w.totalItems, 0);
  const totalValue = items.reduce((a, w) => a + w.totalValue, 0);

  const setF = (k: keyof Omit<Warehouse, 'id'>, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  // Аналитика
  const analytics = useMemo(() => {
    const active = items.filter(w => w.status === 'active').length;
    const inactive = items.length - active;

    // Заполненность (нормализуем по максимуму totalItems)
    const maxItems = Math.max(...items.map(w => w.totalItems), 1);
    const fillness = items
      .map(w => ({ ...w, fill: (w.totalItems / maxItems) * 100 }))
      .sort((a, b) => b.fill - a.fill);

    // Последние инвентаризации
    const recentInv = [...items]
      .filter(w => w.lastInventory)
      .sort((a, b) => new Date(b.lastInventory).getTime() - new Date(a.lastInventory).getTime())
      .slice(0, 5);

    // Топ по стоимости
    const topValue = [...items].sort((a, b) => b.totalValue - a.totalValue).slice(0, 3);
    // Топ по количеству позиций
    const topItems = [...items].sort((a, b) => b.totalItems - a.totalItems).slice(0, 3);

    return { active, inactive, fillness, recentInv, topValue, topItems };
  }, [items]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по названию, адресу, ответственному..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить склад
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего складов', value: items.length, icon: 'Warehouse', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Активных', value: items.filter(w => w.status === 'active').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Позиций итого', value: totalItems.toLocaleString('ru'), icon: 'Package', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Стоимость', value: (totalValue / 1000).toFixed(0) + ' тыс. ₽', icon: 'TrendingUp', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon name={s.icon} size={16} className={s.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                  <p className="text-lg font-bold font-golos">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Общая стоимость */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Общая стоимость</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По всем складам</p>
              </div>
              <Icon name="BadgeRussianRuble" size={16} className="text-indigo-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md mb-3">
                <Icon name="Warehouse" size={26} className="text-white" />
              </div>
              <p className="text-3xl font-bold font-golos text-gray-900">{totalValue.toLocaleString('ru')} ₽</p>
              <p className="text-xs text-muted-foreground font-inter mt-1">{totalItems.toLocaleString('ru')} позиций суммарно</p>
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Среднее на склад</p>
                  <p className="text-sm font-bold font-golos">{items.length ? Math.round(totalValue / items.length).toLocaleString('ru') : 0} ₽</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Складов</p>
                  <p className="text-sm font-bold font-golos">{items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Активные / неактивные */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Активность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Соотношение складов</p>
              </div>
              <Icon name="ToggleRight" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-2">
              {(() => {
                const total = analytics.active + analytics.inactive || 1;
                const activePct = (analytics.active / total) * 100;
                const r = 54;
                const c = 2 * Math.PI * r;
                const offset = c - (activePct / 100) * c;
                return (
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r={r} stroke="#e5e7eb" strokeWidth="14" fill="none" />
                      <circle
                        cx="64" cy="64" r={r}
                        stroke="#10b981" strokeWidth="14" fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold font-golos text-gray-900">{Math.round(activePct)}%</p>
                      <p className="text-[10px] text-muted-foreground font-inter">активны</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-xs text-emerald-700/70 font-inter">Активных</p>
                  <p className="text-lg font-bold text-emerald-700 font-golos">{analytics.active}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-100">
                  <p className="text-xs text-gray-600 font-inter">Неактивных</p>
                  <p className="text-lg font-bold text-gray-700 font-golos">{analytics.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Заполненность */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Заполненность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Относительно макс.</p>
              </div>
              <Icon name="BarChart3" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.fillness.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
              ) : (
                analytics.fillness.slice(0, 5).map(w => (
                  <div key={w.id} className="space-y-1 cursor-pointer" onClick={() => openView(w)}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium font-inter text-gray-900 truncate">{w.name}</span>
                      <span className="text-xs font-bold font-golos text-gray-700 ml-2">{w.totalItems}</span>
                    </div>
                    <Progress value={w.fill} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Последние инвентаризации */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Инвентаризации</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Последние проверки</p>
              </div>
              <Icon name="ClipboardCheck" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.recentInv.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.recentInv.map(w => {
                  const days = daysSince(w.lastInventory);
                  const isOld = days > 90;
                  return (
                    <div key={w.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(w)}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOld ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <Icon name="Calendar" size={13} className={isOld ? 'text-red-500' : 'text-emerald-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{new Date(w.lastInventory).toLocaleDateString('ru')}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] h-5 ${isOld ? 'border-red-200 text-red-700' : ''}`}>
                        {days} дн.
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Топ по стоимости */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ по стоимости</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Самые ценные склады</p>
              </div>
              <Icon name="Trophy" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topValue.map((w, i) => {
                const medal = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400'][i];
                return (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openView(w)}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${medal}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-golos truncate">{w.name}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{w.location}</p>
                    </div>
                    <span className="text-xs font-bold font-golos text-gray-900">{w.totalValue.toLocaleString('ru')} ₽</span>
                  </div>
                );
              })}
              {analytics.topValue.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>}
            </CardContent>
          </Card>

          {/* Топ по позициям */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ по позициям</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Большее количество</p>
              </div>
              <Icon name="Package" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topItems.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openView(w)}>
                  <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon name="Boxes" size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-golos truncate">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{w.responsible}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">#{i + 1}</Badge>
                  <span className="text-xs font-bold font-golos text-gray-900">{w.totalItems}</span>
                </div>
              ))}
              {analytics.topItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>}
            </CardContent>
          </Card>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(wh => (
              <Card key={wh.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(wh)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${wh.status === 'active' ? 'bg-grad-primary' : 'bg-gray-200'}`}>
                        <Icon name="Warehouse" size={20} className={wh.status === 'active' ? 'text-white' : 'text-gray-500'} />
                      </div>
                      <div>
                        <CardTitle className="font-golos text-base">{wh.name}</CardTitle>
                        <Badge className={`mt-1 text-[10px] px-1.5 py-0 h-4 ${wh.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {wh.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(wh)}>
                            <Icon name="Eye" size={12} className="text-emerald-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Просмотр</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(wh)}>
                            <Icon name="Pencil" size={12} className="text-blue-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Редактировать</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(wh.id)}>
                            <Icon name="Trash2" size={12} className="text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Удалить</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-start gap-2 text-sm font-inter text-muted-foreground">
                    <Icon name="MapPin" size={13} className="mt-0.5 flex-shrink-0" />
                    <span>{wh.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-inter text-muted-foreground">
                    <Icon name="User" size={13} className="flex-shrink-0" />
                    <span>Ответственный: <span className="text-gray-900 font-medium">{wh.responsible}</span></span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 font-golos">{wh.totalItems}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">позиций</p>
                    </div>
                    <div className="text-center border-x border-border/50">
                      <p className="text-sm font-bold text-gray-900 font-golos">{wh.totalValue.toLocaleString('ru')} ₽</p>
                      <p className="text-[10px] text-muted-foreground font-inter">стоимость</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-900 font-golos">{new Date(wh.lastInventory).toLocaleDateString('ru')}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">инвентаризация</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground font-inter">
                Склады не найдены
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
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${viewTarget.status === 'active' ? 'bg-grad-primary' : 'bg-gray-300'}`}>
                      <Icon name="Warehouse" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={viewTarget.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {viewTarget.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-inter">ID: {viewTarget.id}</span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Расположение</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="MapPin" size={16} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-inter">Адрес / Местоположение</p>
                          <p className="text-sm font-medium font-golos">{viewTarget.location || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Ответственный</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center">
                          <Icon name="User" size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-golos">{viewTarget.responsible || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">Кладовщик / Ответственное лицо</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Содержимое склада</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-blue-50 text-center">
                          <Icon name="Package" size={20} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-blue-700 font-golos">{viewTarget.totalItems.toLocaleString('ru')}</p>
                          <p className="text-[10px] text-blue-700/70 font-inter">позиций</p>
                        </div>
                        <div className="p-4 rounded-xl bg-grad-primary text-center">
                          <Icon name="Wallet" size={20} className="text-white mx-auto mb-1" />
                          <p className="text-2xl font-bold text-white font-golos">{viewTarget.totalValue.toLocaleString('ru')} ₽</p>
                          <p className="text-[10px] text-white/80 font-inter">общая стоимость</p>
                        </div>
                      </div>
                      {viewTarget.totalItems > 0 && (
                        <div className="p-3 rounded-xl bg-muted/30 mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-inter text-muted-foreground">Средняя стоимость позиции</span>
                            <span className="font-bold font-golos">
                              {Math.round(viewTarget.totalValue / viewTarget.totalItems).toLocaleString('ru')} ₽
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Учёт и инвентаризация</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-violet-50 text-center">
                          <Icon name="Calendar" size={16} className="text-violet-600 mx-auto mb-1" />
                          <p className="text-[10px] text-violet-700/70 font-inter">Последняя инвентаризация</p>
                          <p className="text-xs font-bold text-violet-700 font-golos mt-0.5">
                            {viewTarget.lastInventory ? new Date(viewTarget.lastInventory).toLocaleDateString('ru') : '—'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <Icon name="Clock" size={16} className="text-emerald-600 mx-auto mb-1" />
                          <p className="text-[10px] text-emerald-700/70 font-inter">Дней с проверки</p>
                          <p className="text-xs font-bold text-emerald-700 font-golos mt-0.5">
                            {viewTarget.lastInventory ? daysSince(viewTarget.lastInventory) : '—'}
                          </p>
                        </div>
                      </div>
                      {viewTarget.lastInventory && daysSince(viewTarget.lastInventory) > 90 && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                          <Icon name="AlertTriangle" size={14} className="text-red-500" />
                          <p className="text-xs text-red-700 font-inter">Рекомендуется провести инвентаризацию — прошло более 3 месяцев</p>
                        </div>
                      )}
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
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать склад' : 'Добавить склад'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Название склада</Label>
                <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Основной склад" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Адрес / Местоположение</Label>
                <Input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="Бокс №1, стеллажи А-Д" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Ответственный</Label>
                <Input value={form.responsible} onChange={e => setF('responsible', e.target.value)} placeholder="Кладовщик Иванов" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Кол-во позиций</Label>
                <Input type="number" value={form.totalItems} onChange={e => setF('totalItems', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Стоимость (₽)</Label>
                <Input type="number" value={form.totalValue} onChange={e => setF('totalValue', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Дата инвентаризации</Label>
                <Input type="date" value={form.lastInventory} onChange={e => setF('lastInventory', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Статус</Label>
                <Select value={form.status} onValueChange={v => setF('status', v as Warehouse['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
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
              <AlertDialogTitle className="font-golos">Удалить склад?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Склад будет удалён из системы.</AlertDialogDescription>
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
