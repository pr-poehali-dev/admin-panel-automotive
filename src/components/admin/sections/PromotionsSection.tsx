import { useState, useEffect, useMemo } from 'react';
import { Promotion, promotionsService } from '@/services/mockService';
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
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const typeMap: Record<Promotion['type'], { label: string; icon: string; bg: string; gradient: string; lightBg: string; color: string }> = {
  discount: { label: 'Скидка %', icon: 'Percent', bg: 'bg-blue-500', gradient: 'bg-grad-primary', lightBg: 'bg-blue-50', color: 'text-blue-600' },
  gift: { label: 'Подарок', icon: 'Gift', bg: 'bg-purple-500', gradient: 'bg-grad-secondary', lightBg: 'bg-purple-50', color: 'text-purple-600' },
  cashback: { label: 'Кэшбэк', icon: 'RefreshCcw', bg: 'bg-green-500', gradient: 'bg-grad-success', lightBg: 'bg-green-50', color: 'text-green-600' },
  bonus: { label: 'Бонус', icon: 'Zap', bg: 'bg-amber-500', gradient: 'bg-grad-warning', lightBg: 'bg-amber-50', color: 'text-amber-600' },
};

const emptyPromotion: Omit<Promotion, 'id'> = {
  title: '', description: '', type: 'discount', value: 10,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true, usageCount: 0, maxUsage: 100, services: [],
};

const valueLabel = (p: Promotion) => {
  if (p.type === 'discount') return `${p.value}%`;
  if (p.type === 'cashback') return `${p.value}%`;
  if (p.type === 'bonus') return `${p.value} баллов`;
  return `${p.value} ₽`;
};

export default function PromotionsSection() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [viewTarget, setViewTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState<Omit<Promotion, 'id'>>(emptyPromotion);
  const [servicesInput, setServicesInput] = useState('');
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await promotionsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyPromotion); setServicesInput(''); setModalOpen(true); };
  const openEdit = (p: Promotion) => { setEditTarget(p); setForm({ ...p }); setServicesInput(p.services.join(', ')); setModalOpen(true); };
  const openView = (p: Promotion) => setViewTarget(p);
  const editFromView = () => {
    if (viewTarget) {
      const p = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(p), 100);
    }
  };

  const handleSave = async () => {
    const finalForm = { ...form, services: servicesInput.split(',').map(s => s.trim()).filter(Boolean) };
    if (editTarget) {
      await promotionsService.update(editTarget.id, finalForm);
      toast({ title: 'Акция обновлена' });
    } else {
      await promotionsService.create(finalForm);
      toast({ title: 'Акция добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await promotionsService.delete(deleteId);
    toast({ title: 'Акция удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const setF = (k: keyof Omit<Promotion, 'id'>, v: string | number | boolean | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleToggleActive = async (promo: Promotion) => {
    await promotionsService.update(promo.id, { isActive: !promo.isActive });
    toast({ title: promo.isActive ? 'Акция деактивирована' : 'Акция активирована' });
    load();
  };

  const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Аналитика
  const analytics = useMemo(() => {
    const active = items.filter(p => p.isActive);

    // Топ по использованию
    const topUsage = [...items].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3);

    // Распределение по типам
    const types = (['discount', 'gift', 'cashback', 'bonus'] as const).map(t => ({
      key: t,
      count: items.filter(p => p.type === t).length,
    }));

    // Скоро заканчиваются (в ближайшие 14 дней)
    const ending = items.filter(p => {
      if (!p.isActive) return false;
      const d = daysUntil(p.endDate);
      return d >= 0 && d <= 14;
    }).sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate));

    // Эффективность
    const totalUsage = items.reduce((a, p) => a + p.usageCount, 0);
    const totalMax = items.reduce((a, p) => a + p.maxUsage, 0);
    const avgUsagePct = totalMax ? Math.round((totalUsage / totalMax) * 100) : 0;

    // Календарь — берём акции и считаем диапазон
    let minStart = Infinity;
    let maxEnd = -Infinity;
    items.forEach(p => {
      const s = new Date(p.startDate).getTime();
      const e = new Date(p.endDate).getTime();
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    });
    const calendarPromos = items.length ? items.slice(0, 6).map(p => {
      const s = new Date(p.startDate).getTime();
      const e = new Date(p.endDate).getTime();
      const range = maxEnd - minStart || 1;
      const left = ((s - minStart) / range) * 100;
      const width = ((e - s) / range) * 100;
      return { promo: p, left, width: Math.max(width, 4) };
    }) : [];

    return { active, topUsage, types, ending, totalUsage, totalMax, avgUsagePct, minStart, maxEnd, calendarPromos };
  }, [items]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по названию или описанию..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить акцию
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего акций', value: items.length, icon: 'Tag', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Активных', value: items.filter(p => p.isActive).length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Использований', value: items.reduce((a, p) => a + p.usageCount, 0), icon: 'Users', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Завершены', value: items.filter(p => !p.isActive).length, icon: 'Archive', color: 'text-gray-600', bg: 'bg-gray-50' },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Активные акции */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Активные акции</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Идут прямо сейчас</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-grad-success flex items-center justify-center shadow-md">
                <Icon name="Sparkles" size={18} className="text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold font-golos text-emerald-700 text-center mb-3">{analytics.active.length}</p>
              {analytics.active.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground font-inter">Нет активных акций</p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.active.slice(0, 3).map(p => {
                    const tp = typeMap[p.type];
                    return (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/70 hover:bg-white transition-colors cursor-pointer" onClick={() => openView(p)}>
                        <div className={`w-7 h-7 rounded-lg ${tp.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon name={tp.icon} size={12} className="text-white" />
                        </div>
                        <p className="text-xs font-semibold font-golos truncate flex-1">{p.title}</p>
                        <span className="text-xs font-bold text-emerald-700 font-golos">{valueLabel(p)}</span>
                      </div>
                    );
                  })}
                  {analytics.active.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center font-inter pt-1">+ ещё {analytics.active.length - 3}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Топ по использованию */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ по использованию</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Самые популярные</p>
              </div>
              <Icon name="Trophy" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topUsage.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.topUsage.map((p, i) => {
                  const medal = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400'][i];
                  const tp = typeMap[p.type];
                  const pct = p.maxUsage ? (p.usageCount / p.maxUsage) * 100 : 0;
                  return (
                    <div key={p.id} className="space-y-1.5 cursor-pointer" onClick={() => openView(p)}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${medal}`}>{i + 1}</div>
                        <Icon name={tp.icon} size={12} className={tp.color} />
                        <span className="text-xs font-semibold font-golos truncate flex-1">{p.title}</span>
                        <span className="text-xs font-bold text-gray-700 font-golos">{p.usageCount}/{p.maxUsage}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Распределение по типам */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Типы акций</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение</p>
              </div>
              <Icon name="LayoutGrid" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {analytics.types.map(t => {
                  const cfg = typeMap[t.key];
                  return (
                    <div key={t.key} className={`p-3 rounded-xl ${cfg.lightBg} text-center`}>
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} mx-auto mb-1.5 flex items-center justify-center`}>
                        <Icon name={cfg.icon} size={14} className="text-white" />
                      </div>
                      <p className="text-xl font-bold font-golos">{t.count}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Виджеты: окончание + эффективность + календарь */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4 border-l-4 border-l-orange-400">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon name="AlertTriangle" size={18} className="text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Скоро закончатся</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">{analytics.ending.length} акций (≤14 дней)</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.ending.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет заканчивающихся акций</p>
              ) : (
                analytics.ending.slice(0, 4).map(p => {
                  const days = daysUntil(p.endDate);
                  const tp = typeMap[p.type];
                  return (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/40 hover:bg-orange-50 cursor-pointer transition-colors" onClick={() => openView(p)}>
                      <div className={`w-7 h-7 rounded-lg ${tp.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon name={tp.icon} size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{new Date(p.endDate).toLocaleDateString('ru')}</p>
                      </div>
                      <Badge className={`text-[10px] ${days <= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {days === 0 ? 'Сегодня' : `${days} дн.`}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Эффективность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Использование акций</p>
              </div>
              <Icon name="TrendingUp" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center py-2">
              {(() => {
                const r = 50;
                const c = 2 * Math.PI * r;
                const offset = c - (analytics.avgUsagePct / 100) * c;
                return (
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle
                        cx="60" cy="60" r={r}
                        stroke="url(#prom-grad)" strokeWidth="12" fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="prom-grad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold font-golos">{analytics.avgUsagePct}%</p>
                      <p className="text-[9px] text-muted-foreground font-inter">использовано</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-2 w-full mt-3">
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Использований</p>
                  <p className="text-base font-bold text-blue-700 font-golos">{analytics.totalUsage}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Лимит</p>
                  <p className="text-base font-bold font-golos">{analytics.totalMax}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Календарь акций</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Период действия</p>
              </div>
              <Icon name="CalendarRange" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.calendarPromos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет акций</p>
              ) : (
                <>
                  {analytics.calendarPromos.map(({ promo, left, width }) => {
                    const tp = typeMap[promo.type];
                    return (
                      <div key={promo.id} className="space-y-0.5 cursor-pointer" onClick={() => openView(promo)}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium font-inter truncate flex-1">{promo.title}</span>
                          <span className="text-muted-foreground ml-2">{valueLabel(promo)}</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`absolute h-full rounded-full ${tp.bg}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-[9px] text-muted-foreground font-inter pt-1.5">
                    <span>{isFinite(analytics.minStart) ? new Date(analytics.minStart).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : '—'}</span>
                    <span>{isFinite(analytics.maxEnd) ? new Date(analytics.maxEnd).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : '—'}</span>
                  </div>
                </>
              )}
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
            {filtered.map(promo => {
              const tp = typeMap[promo.type];
              const usagePct = promo.maxUsage > 0 ? Math.min(100, Math.round((promo.usageCount / promo.maxUsage) * 100)) : 0;
              return (
                <Card key={promo.id} className={`border-0 shadow-card hover-lift group cursor-pointer ${!promo.isActive ? 'opacity-60' : ''}`} onClick={() => openView(promo)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${tp.bg} flex items-center justify-center shadow-sm`}>
                          <Icon name={tp.icon} size={20} className="text-white" />
                        </div>
                        <div>
                          <CardTitle className="font-golos text-sm">{promo.title}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{tp.label}</Badge>
                            <span className="text-xs font-bold text-gray-900 font-golos">{valueLabel(promo)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Switch checked={promo.isActive} onCheckedChange={() => handleToggleActive(promo)} />
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(promo)}>
                                <Icon name="Eye" size={12} className="text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Просмотр</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(promo)}>
                                <Icon name="Pencil" size={12} className="text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Редактировать</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(promo.id)}>
                                <Icon name="Trash2" size={12} className="text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground font-inter">{promo.description}</p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-inter">Использований: {promo.usageCount} / {promo.maxUsage}</span>
                        <span className="text-xs font-semibold font-golos">{usagePct}%</span>
                      </div>
                      <Progress value={usagePct} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-inter">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={11} />
                        {new Date(promo.startDate).toLocaleDateString('ru')}
                      </span>
                      <Icon name="ArrowRight" size={11} />
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={11} />
                        {new Date(promo.endDate).toLocaleDateString('ru')}
                      </span>
                    </div>

                    {promo.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {promo.services.slice(0, 2).map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 h-4">{s}</Badge>
                        ))}
                        {promo.services.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">+{promo.services.length - 2}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground font-inter">
                Акции не найдены
              </div>
            )}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (() => {
              const tp = typeMap[viewTarget.type];
              const usagePct = viewTarget.maxUsage > 0 ? Math.min(100, (viewTarget.usageCount / viewTarget.maxUsage) * 100) : 0;
              const days = daysUntil(viewTarget.endDate);
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl ${tp.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon name={tp.icon} size={28} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="font-golos text-xl">{viewTarget.title}</DialogTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary">{tp.label}</Badge>
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
                          {viewTarget.description || 'Без описания'}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Параметры</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-3 rounded-xl ${tp.lightBg} text-center`}>
                            <Icon name={tp.icon} size={18} className={`${tp.color} mx-auto mb-1`} />
                            <p className="text-[10px] text-muted-foreground font-inter">Тип</p>
                            <p className="text-sm font-bold font-golos">{tp.label}</p>
                          </div>
                          <div className={`p-3 rounded-xl ${tp.gradient} text-center`}>
                            <Icon name="BadgeRussianRuble" size={18} className="text-white mx-auto mb-1" />
                            <p className="text-[10px] text-white/80 font-inter">Значение</p>
                            <p className="text-lg font-bold font-golos text-white">{valueLabel(viewTarget)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Период действия</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-xl bg-blue-50 text-center">
                            <Icon name="Calendar" size={14} className="text-blue-600 mx-auto mb-1" />
                            <p className="text-[10px] text-blue-700/70 font-inter">Начало</p>
                            <p className="text-xs font-bold text-blue-700 font-golos mt-0.5">{new Date(viewTarget.startDate).toLocaleDateString('ru')}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-violet-50 text-center">
                            <Icon name="CalendarClock" size={14} className="text-violet-600 mx-auto mb-1" />
                            <p className="text-[10px] text-violet-700/70 font-inter">Окончание</p>
                            <p className="text-xs font-bold text-violet-700 font-golos mt-0.5">{new Date(viewTarget.endDate).toLocaleDateString('ru')}</p>
                          </div>
                          <div className={`p-3 rounded-xl text-center ${days < 0 ? 'bg-gray-100' : days <= 7 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                            <Icon name="Timer" size={14} className={`mx-auto mb-1 ${days < 0 ? 'text-gray-500' : days <= 7 ? 'text-red-500' : 'text-emerald-600'}`} />
                            <p className={`text-[10px] font-inter ${days < 0 ? 'text-gray-600' : days <= 7 ? 'text-red-700/70' : 'text-emerald-700/70'}`}>Осталось</p>
                            <p className={`text-xs font-bold font-golos mt-0.5 ${days < 0 ? 'text-gray-700' : days <= 7 ? 'text-red-700' : 'text-emerald-700'}`}>
                              {days < 0 ? 'Истекла' : days === 0 ? 'Сегодня' : `${days} дн.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Использование</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-inter">Использовано</span>
                            <span className="font-bold font-golos">{viewTarget.usageCount} / {viewTarget.maxUsage}</span>
                          </div>
                          <Progress value={usagePct} className="h-3" />
                          <p className="text-xs text-muted-foreground font-inter text-center">{Math.round(usagePct)}% использовано</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Применяется к услугам</h4>
                        {viewTarget.services.length === 0 ? (
                          <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground font-inter">Применяется ко всем услугам</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {viewTarget.services.map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
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
                                {viewTarget.isActive ? 'Акция активна' : 'Акция отключена'}
                              </p>
                              <p className="text-xs text-muted-foreground font-inter">
                                {viewTarget.isActive ? 'Применяется при оформлении заказов' : 'Не применяется к заказам'}
                              </p>
                            </div>
                          </div>
                          <Switch checked={viewTarget.isActive} onCheckedChange={() => handleToggleActive(viewTarget)} />
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
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Edit/Create Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать акцию' : 'Добавить акцию'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Название акции</Label>
                <Input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Сезонный шиномонтаж" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Тип</Label>
                <Select value={form.type} onValueChange={v => setF('type', v as Promotion['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Скидка %</SelectItem>
                    <SelectItem value="gift">Подарок</SelectItem>
                    <SelectItem value="cashback">Кэшбэк</SelectItem>
                    <SelectItem value="bonus">Бонус</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Значение (% или ₽)</Label>
                <Input type="number" value={form.value} onChange={e => setF('value', Number(e.target.value))} placeholder="10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Дата начала</Label>
                <Input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Дата окончания</Label>
                <Input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Макс. использований</Label>
                <Input type="number" value={form.maxUsage} onChange={e => setF('maxUsage', Number(e.target.value))} placeholder="100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Использовано</Label>
                <Input type="number" value={form.usageCount} onChange={e => setF('usageCount', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Описание</Label>
                <Textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Описание акции" rows={2} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Услуги (через запятую)</Label>
                <Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Шиномонтаж, Балансировка" />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setF('isActive', v)} />
                <Label className="text-sm font-inter">Акция активна</Label>
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
              <AlertDialogTitle className="font-golos">Удалить акцию?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Акция будет удалена из системы.</AlertDialogDescription>
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
