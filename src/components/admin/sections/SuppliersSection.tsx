import { useState, useEffect, useMemo } from 'react';
import { Supplier, suppliersService } from '@/services/mockService';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '', contactPerson: '', phone: '', email: '',
  address: '', category: [], rating: 5.0,
  status: 'active', totalOrders: 0, lastOrder: new Date().toISOString().split('T')[0],
};

export default function SuppliersSection() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [viewTarget, setViewTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(emptySupplier);
  const [categoryInput, setCategoryInput] = useState('');
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await suppliersService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptySupplier); setCategoryInput(''); setModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditTarget(s); setForm({ ...s }); setCategoryInput(s.category.join(', ')); setModalOpen(true); };
  const openView = (s: Supplier) => setViewTarget(s);
  const editFromView = () => {
    if (viewTarget) {
      const s = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(s), 100);
    }
  };

  const handleSave = async () => {
    const finalForm = { ...form, category: categoryInput.split(',').map(s => s.trim()).filter(Boolean) };
    if (editTarget) {
      await suppliersService.update(editTarget.id, finalForm);
      toast({ title: 'Поставщик обновлён' });
    } else {
      await suppliersService.create(finalForm);
      toast({ title: 'Поставщик добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await suppliersService.delete(deleteId);
    toast({ title: 'Поставщик удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const avgRating = items.length ? (items.reduce((a, s) => a + s.rating, 0) / items.length).toFixed(1) : '0';
  const totalOrders = items.reduce((a, s) => a + s.totalOrders, 0);

  const setF = (k: keyof Omit<Supplier, 'id'>, v: string | number | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  // Аналитика
  const analytics = useMemo(() => {
    // Топ-5 по рейтингу
    const topRated = [...items].sort((a, b) => b.rating - a.rating).slice(0, 5);

    // По категориям
    const catMap: Record<string, number> = {};
    items.forEach(s => s.category.forEach(c => { catMap[c] = (catMap[c] || 0) + 1; }));
    const byCategory = Object.entries(catMap).map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
    const maxCat = Math.max(...byCategory.map(c => c.count), 1);

    // Активность (последние lastOrder)
    const recentActivity = [...items]
      .sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime())
      .slice(0, 5);

    // Активные/неактивные
    const active = items.filter(s => s.status === 'active').length;
    const inactive = items.length - active;

    // Самые надёжные (totalOrders + rating)
    const reliable = [...items]
      .map(s => ({ ...s, score: s.totalOrders * (s.rating / 5) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Давно не было заказов (>60 дней)
    const stale = items
      .filter(s => daysSince(s.lastOrder) > 60)
      .sort((a, b) => daysSince(b.lastOrder) - daysSince(a.lastOrder))
      .slice(0, 5);

    return { topRated, byCategory, maxCat, recentActivity, active, inactive, reliable, stale };
  }, [items]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по названию, контакту, телефону..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить поставщика
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего поставщиков', value: items.length, icon: 'Truck', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Активных', value: items.filter(s => s.status === 'active').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Средний рейтинг', value: avgRating, icon: 'Star', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Заказов итого', value: totalOrders, icon: 'ShoppingCart', color: 'text-purple-600', bg: 'bg-purple-50' },
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
          {/* Топ-5 по рейтингу */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ-5 по рейтингу</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Лучшие поставщики</p>
              </div>
              <Icon name="Trophy" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topRated.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.topRated.map((s, i) => {
                  const medal = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400', 'bg-blue-400', 'bg-violet-400'][i];
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(s)}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${medal}`}>{i + 1}</div>
                      <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center flex-shrink-0">
                        <Icon name="Truck" size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Icon
                              key={star}
                              name="Star"
                              size={9}
                              className={star <= Math.round(s.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                            />
                          ))}
                          <span className="text-[10px] font-bold ml-1 font-golos">{s.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Категории */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Категории поставок</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение</p>
              </div>
              <Icon name="LayoutGrid" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.byCategory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.byCategory.map(c => (
                  <div key={c.cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="Tag" size={11} className="text-blue-500" />
                        <span className="font-medium font-inter text-gray-900 truncate">{c.cat}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{c.count}</span>
                    </div>
                    <Progress value={(c.count / analytics.maxCat) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Активность */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Последние заказы</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Активность поставщиков</p>
              </div>
              <Icon name="Activity" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.recentActivity.map(s => {
                  const days = daysSince(s.lastOrder);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(s)}>
                      <div className="w-8 h-8 rounded-lg bg-grad-success flex items-center justify-center flex-shrink-0">
                        <Icon name="Package" size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{new Date(s.lastOrder).toLocaleDateString('ru')}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {days === 0 ? 'Сегодня' : `${days} дн.`}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Активные/неактивные */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Активность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Состояние сотрудничества</p>
              </div>
              <Icon name="ToggleRight" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center py-2">
              {(() => {
                const total = items.length || 1;
                const activePct = (analytics.active / total) * 100;
                const r = 50;
                const c = 2 * Math.PI * r;
                const offset = c - (activePct / 100) * c;
                return (
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle
                        cx="60" cy="60" r={r}
                        stroke="#10b981" strokeWidth="12" fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold font-golos">{Math.round(activePct)}%</p>
                      <p className="text-[10px] text-muted-foreground font-inter">активны</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-2 w-full mt-3">
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Активных</p>
                  <p className="text-lg font-bold text-emerald-700 font-golos">{analytics.active}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Неактивных</p>
                  <p className="text-lg font-bold text-gray-700 font-golos">{analytics.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Самые надёжные */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Самые надёжные</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По заказам и рейтингу</p>
              </div>
              <Icon name="ShieldCheck" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.reliable.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.reliable.map((s, i) => {
                  const medal = ['bg-amber-400', 'bg-gray-400', 'bg-orange-400'][i];
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openView(s)}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${medal}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold font-golos truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-inter">{s.totalOrders} зак.</span>
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                            <Icon name="Star" size={9} className="fill-amber-500" />
                            {s.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Давно не было заказов */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6 border-l-4 border-l-orange-400">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon name="AlertTriangle" size={18} className="text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Давно не было заказов</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">Более 60 дней</p>
                </div>
              </div>
              <Badge className={`${analytics.stale.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {analytics.stale.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.stale.length === 0 ? (
                <div className="py-3 text-center">
                  <Icon name="CheckCircle2" size={20} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-emerald-700 font-medium font-inter">Все поставщики активны</p>
                </div>
              ) : (
                analytics.stale.map(s => {
                  const days = daysSince(s.lastOrder);
                  return (
                    <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/40 hover:bg-orange-50 cursor-pointer transition-colors" onClick={() => openView(s)}>
                      <div className="w-7 h-7 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                        <Icon name="Truck" size={12} className="text-orange-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{new Date(s.lastOrder).toLocaleDateString('ru')}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-700">{days} дн.</Badge>
                    </div>
                  );
                })
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
                    <TableHead className="font-semibold font-golos">Поставщик</TableHead>
                    <TableHead className="font-semibold font-golos">Контактное лицо</TableHead>
                    <TableHead className="font-semibold font-golos">Категории</TableHead>
                    <TableHead className="font-semibold font-golos">Рейтинг</TableHead>
                    <TableHead className="font-semibold font-golos">Заказов</TableHead>
                    <TableHead className="font-semibold font-golos">Посл. заказ</TableHead>
                    <TableHead className="font-semibold font-golos">Статус</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(sup => (
                    <TableRow key={sup.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openView(sup)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-grad-primary flex items-center justify-center shadow-sm flex-shrink-0">
                            <Icon name="Truck" size={15} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 font-golos text-sm">{sup.name}</div>
                            <div className="text-xs text-muted-foreground font-inter truncate max-w-32">{sup.address}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-inter font-medium">{sup.contactPerson}</div>
                          <div className="text-xs text-muted-foreground font-inter">{sup.phone}</div>
                          <div className="text-xs text-muted-foreground font-inter">{sup.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sup.category.slice(0, 2).map(c => (
                            <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{c}</Badge>
                          ))}
                          {sup.category.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">+{sup.category.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Icon
                              key={star}
                              name="Star"
                              size={12}
                              className={star <= Math.round(sup.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                            />
                          ))}
                          <span className="text-xs font-semibold font-golos ml-1">{sup.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold font-golos text-sm">{sup.totalOrders}</span>
                      </TableCell>
                      <TableCell className="text-sm font-inter text-muted-foreground">
                        {new Date(sup.lastOrder).toLocaleDateString('ru')}
                      </TableCell>
                      <TableCell>
                        <Badge className={sup.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}>
                          {sup.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(sup)}>
                                <Icon name="Eye" size={12} className="text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Просмотр</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(sup)}>
                                <Icon name="Pencil" size={12} className="text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Редактировать</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(sup.id)}>
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
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-inter">
                        Поставщики не найдены
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
                      <Icon name="Truck" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={viewTarget.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {viewTarget.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Icon name="Star" size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-amber-700 font-golos">{viewTarget.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Контактное лицо</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center">
                          <Icon name="User" size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-golos">{viewTarget.contactPerson || '—'}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">Представитель компании</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

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
                        <div className="flex items-start gap-2 min-w-0">
                          <Icon name="Mail" size={14} className="text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground font-inter">Email</p>
                            <p className="text-sm font-medium font-golos truncate">{viewTarget.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <Icon name="MapPin" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Адрес</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.address || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">
                        Специализация ({viewTarget.category.length})
                      </h4>
                      {viewTarget.category.length === 0 ? (
                        <div className="p-3 rounded-xl bg-muted/30 text-center">
                          <p className="text-xs text-muted-foreground font-inter">Категории не указаны</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {viewTarget.category.map(c => (
                            <Badge key={c} variant="secondary" className="text-xs gap-1">
                              <Icon name="Tag" size={10} />
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Сотрудничество</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-grad-primary text-center">
                          <Icon name="ShoppingCart" size={18} className="text-white mx-auto mb-1" />
                          <p className="text-2xl font-bold text-white font-golos">{viewTarget.totalOrders}</p>
                          <p className="text-[10px] text-white/80 font-inter">всего заказов</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <Icon name="Calendar" size={18} className="text-emerald-600 mx-auto mb-1" />
                          <p className="text-[10px] text-emerald-700/70 font-inter">Последний заказ</p>
                          <p className="text-xs font-bold text-emerald-700 font-golos mt-0.5">
                            {viewTarget.lastOrder ? new Date(viewTarget.lastOrder).toLocaleDateString('ru') : '—'}
                          </p>
                        </div>
                        <div className={`p-3 rounded-xl text-center ${daysSince(viewTarget.lastOrder) > 60 ? 'bg-orange-50' : 'bg-blue-50'}`}>
                          <Icon name="Clock" size={18} className={`mx-auto mb-1 ${daysSince(viewTarget.lastOrder) > 60 ? 'text-orange-500' : 'text-blue-600'}`} />
                          <p className={`text-[10px] font-inter ${daysSince(viewTarget.lastOrder) > 60 ? 'text-orange-700/70' : 'text-blue-700/70'}`}>Дней с заказа</p>
                          <p className={`text-xl font-bold font-golos mt-0.5 ${daysSince(viewTarget.lastOrder) > 60 ? 'text-orange-700' : 'text-blue-700'}`}>
                            {daysSince(viewTarget.lastOrder)}
                          </p>
                        </div>
                      </div>
                      {daysSince(viewTarget.lastOrder) > 60 && (
                        <div className="mt-3 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-2">
                          <Icon name="AlertTriangle" size={14} className="text-orange-500" />
                          <p className="text-xs text-orange-700 font-inter">Поставщик давно не получал заказов — стоит связаться</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Рейтинг</h4>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center gap-4">
                        <p className="text-5xl font-bold font-golos text-amber-700">{viewTarget.rating.toFixed(1)}</p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Icon
                                key={s}
                                name="Star"
                                size={20}
                                className={s <= Math.round(viewTarget.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground font-inter">из 5 баллов</p>
                        </div>
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
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать поставщика' : 'Добавить поставщика'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Название компании</Label>
                <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="ООО ЕвроАвто" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Контактное лицо</Label>
                <Input value={form.contactPerson} onChange={e => setF('contactPerson', e.target.value)} placeholder="Иванов Иван" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Телефон</Label>
                <Input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+7 (495) 000-00-00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Email</Label>
                <Input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="info@supplier.ru" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Рейтинг (1-5)</Label>
                <Input type="number" min={1} max={5} step={0.1} value={form.rating} onChange={e => setF('rating', Number(e.target.value))} placeholder="5.0" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Адрес</Label>
                <Input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="г. Москва, ул. Промышленная, 15" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Категории (через запятую)</Label>
                <Textarea value={categoryInput} onChange={e => setCategoryInput(e.target.value)} placeholder="Тормозная система, Электрика, Двигатель" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Всего заказов</Label>
                <Input type="number" value={form.totalOrders} onChange={e => setF('totalOrders', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Последний заказ</Label>
                <Input type="date" value={form.lastOrder} onChange={e => setF('lastOrder', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Статус</Label>
                <Select value={form.status} onValueChange={v => setF('status', v as Supplier['status'])}>
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
              <AlertDialogTitle className="font-golos">Удалить поставщика?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Данные поставщика будут удалены из системы.</AlertDialogDescription>
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
