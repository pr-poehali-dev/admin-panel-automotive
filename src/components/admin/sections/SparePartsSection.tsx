import { useState, useEffect, useMemo } from 'react';
import { SparePart, sparePartsService } from '@/services/mockService';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const categories = ['Масла и жидкости', 'Фильтры', 'Тормозная система', 'Электрика', 'Двигатель', 'Шины', 'Химия', 'Подвеска', 'Трансмиссия', 'Прочее'];

const emptySparePart: Omit<SparePart, 'id'> = {
  article: '', name: '', brand: '', category: 'Фильтры',
  quantity: 0, minQuantity: 1, price: 0, salePrice: 0,
  supplier: '', location: '', lastUpdated: new Date().toISOString().split('T')[0],
};

export default function SparePartsSection() {
  const [items, setItems] = useState<SparePart[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SparePart | null>(null);
  const [viewTarget, setViewTarget] = useState<SparePart | null>(null);
  const [form, setForm] = useState<Omit<SparePart, 'id'>>(emptySparePart);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await sparePartsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(s => {
    const matchSearch = [s.article, s.name, s.brand, s.supplier].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openCreate = () => { setEditTarget(null); setForm(emptySparePart); setModalOpen(true); };
  const openEdit = (s: SparePart) => { setEditTarget(s); setForm({ ...s }); setModalOpen(true); };
  const openView = (s: SparePart) => setViewTarget(s);
  const editFromView = () => {
    if (viewTarget) {
      const s = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(s), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await sparePartsService.update(editTarget.id, form);
      toast({ title: 'Запчасть обновлена' });
    } else {
      await sparePartsService.create(form);
      toast({ title: 'Запчасть добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await sparePartsService.delete(deleteId);
    toast({ title: 'Запчасть удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const lowStock = items.filter(s => s.quantity <= s.minQuantity);
  const totalValue = items.reduce((a, s) => a + s.quantity * s.price, 0);

  const setF = (k: keyof Omit<SparePart, 'id'>, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  // Аналитика
  const analytics = useMemo(() => {
    // По категориям
    const catCounts: Record<string, number> = {};
    items.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const byCategory = Object.entries(catCounts).map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count);
    const maxCat = Math.max(...byCategory.map(c => c.count), 1);

    // Топ-5 по стоимости остатков
    const topValue = [...items]
      .map(s => ({ ...s, stockValue: s.quantity * s.price }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 5);

    // Маржинальность
    const withMargin = items
      .filter(s => s.price > 0)
      .map(s => ({ ...s, margin: ((s.salePrice - s.price) / s.price) * 100 }));
    const avgMargin = withMargin.length
      ? withMargin.reduce((a, s) => a + s.margin, 0) / withMargin.length
      : 0;
    const topMargin = [...withMargin].sort((a, b) => b.margin - a.margin).slice(0, 5);

    // Поставщики
    const suppCounts: Record<string, number> = {};
    items.forEach(s => { if (s.supplier) suppCounts[s.supplier] = (suppCounts[s.supplier] || 0) + 1; });
    const bySupplier = Object.entries(suppCounts).map(([supp, count]) => ({ supp, count }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    const maxSupp = Math.max(...bySupplier.map(s => s.count), 1);

    return { byCategory, maxCat, topValue, avgMargin, topMargin, bySupplier, maxSupp };
  }, [items]);

  const marginOf = (s: SparePart) => s.price > 0 ? ((s.salePrice - s.price) / s.price) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по артикулу, названию, бренду..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52 h-10">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить позицию
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего позиций', value: items.length, icon: 'Package', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Заканчиваются', value: lowStock.length, icon: 'AlertTriangle', color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Стоимость склада', value: totalValue.toLocaleString('ru') + ' ₽', icon: 'Warehouse', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Категорий', value: new Set(items.map(s => s.category)).size, icon: 'Tag', color: 'text-purple-600', bg: 'bg-purple-50' },
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

        {/* Тревога: заканчиваются */}
        {lowStock.length > 0 && (
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1 border-l-4 border-l-red-500 bg-red-50/30">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Icon name="AlertTriangle" size={18} className="text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos text-red-700">Заканчиваются на складе</CardTitle>
                  <p className="text-xs text-red-600/70 font-inter">{lowStock.length} позиций требуют пополнения</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white">Срочно</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStock.slice(0, 6).map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-white border border-red-200 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => openView(p)}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Icon name="Package" size={14} className="text-red-500 mt-0.5" />
                      <Badge variant="outline" className="text-[10px] h-5 border-red-200 text-red-700 bg-white">
                        {p.quantity} / {p.minQuantity}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold font-golos text-gray-900 line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter mt-1">{p.brand} · {p.article}</p>
                    <Progress value={(p.quantity / Math.max(p.minQuantity, 1)) * 100} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Категории</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение позиций</p>
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

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ по стоимости</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Самые дорогие остатки</p>
              </div>
              <Icon name="DollarSign" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topValue.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(p)}>
                  <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-lg bg-grad-warning flex items-center justify-center flex-shrink-0">
                    <Icon name="Package" size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{p.quantity} шт × {p.price.toLocaleString('ru')} ₽</p>
                  </div>
                  <span className="text-xs font-bold font-golos text-gray-900">{p.stockValue.toLocaleString('ru')} ₽</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Маржинальность</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Топ-5 по наценке</p>
              </div>
              <Icon name="Percent" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-center pb-3 border-b border-border/50 mb-3">
                <p className="text-3xl font-bold font-golos text-emerald-600">{analytics.avgMargin.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground font-inter">средняя наценка</p>
              </div>
              <div className="space-y-2">
                {analytics.topMargin.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(p)}>
                    <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{p.name}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] hover:bg-emerald-100">+{p.margin.toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Поставщики</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение позиций</p>
              </div>
              <Icon name="Truck" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.bySupplier.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.bySupplier.map(s => (
                  <div key={s.supp} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="Building2" size={12} className="text-violet-500" />
                        <span className="font-medium font-inter text-gray-900 truncate">{s.supp}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700 ml-2">{s.count} поз.</span>
                    </div>
                    <Progress value={(s.count / analytics.maxSupp) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Общая стоимость склада</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По закупочной цене</p>
              </div>
              <Icon name="Warehouse" size={16} className="text-indigo-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md mb-3">
                <Icon name="BadgeRussianRuble" size={26} className="text-white" />
              </div>
              <p className="text-3xl font-bold font-golos text-gray-900">{totalValue.toLocaleString('ru')} ₽</p>
              <p className="text-xs text-muted-foreground font-inter mt-1">{items.reduce((a, s) => a + s.quantity, 0).toLocaleString('ru')} единиц на складе</p>
              <div className="grid grid-cols-3 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Позиций</p>
                  <p className="text-base font-bold font-golos">{items.length}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Брендов</p>
                  <p className="text-base font-bold font-golos">{new Set(items.map(s => s.brand).filter(Boolean)).size}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Низкие</p>
                  <p className="text-base font-bold font-golos text-red-600">{lowStock.length}</p>
                </div>
              </div>
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
                    <TableHead className="font-semibold font-golos">Артикул / Название</TableHead>
                    <TableHead className="font-semibold font-golos">Бренд</TableHead>
                    <TableHead className="font-semibold font-golos">Категория</TableHead>
                    <TableHead className="font-semibold font-golos">Количество</TableHead>
                    <TableHead className="font-semibold font-golos">Цена / Продажа</TableHead>
                    <TableHead className="font-semibold font-golos">Поставщик</TableHead>
                    <TableHead className="font-semibold font-golos">Место</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(part => {
                    const isLow = part.quantity <= part.minQuantity;
                    return (
                      <TableRow key={part.id} className={`hover:bg-muted/20 transition-colors group cursor-pointer ${isLow ? 'bg-red-50/50' : ''}`} onClick={() => openView(part)}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-xs text-muted-foreground">{part.article}</div>
                            <div className="font-semibold text-gray-900 font-golos text-sm">{part.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-inter">{part.brand}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-inter">{part.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isLow && <Icon name="AlertTriangle" size={13} className="text-red-500 flex-shrink-0" />}
                            <span className={`text-sm font-semibold font-golos ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                              {part.quantity}
                            </span>
                            <span className="text-xs text-muted-foreground font-inter">/ мин. {part.minQuantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-xs text-muted-foreground font-inter">Закупка: {part.price.toLocaleString('ru')} ₽</div>
                            <div className="text-sm font-semibold font-golos">{part.salePrice.toLocaleString('ru')} ₽</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-inter">{part.supplier}</TableCell>
                        <TableCell className="text-sm font-inter text-muted-foreground">{part.location}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(part)}>
                                  <Icon name="Eye" size={12} className="text-emerald-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Просмотр</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(part)}>
                                  <Icon name="Pencil" size={12} className="text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Редактировать</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(part.id)}>
                                  <Icon name="Trash2" size={12} className="text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Удалить</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-inter">
                        Позиции не найдены
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
                      <Icon name="Package" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{viewTarget.brand}</Badge>
                        <Badge variant="secondary">{viewTarget.category}</Badge>
                        {viewTarget.quantity <= viewTarget.minQuantity && (
                          <Badge className="bg-red-100 text-red-700">Заканчивается</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Артикул и идентификация</h4>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-[10px] text-muted-foreground font-inter mb-1">Артикул</p>
                        <p className="text-base font-mono font-bold text-gray-900">{viewTarget.article || '—'}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Остатки на складе</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`p-3 rounded-xl text-center ${viewTarget.quantity <= viewTarget.minQuantity ? 'bg-red-50' : 'bg-emerald-50'}`}>
                          <Icon name="Package" size={16} className={`mx-auto mb-1 ${viewTarget.quantity <= viewTarget.minQuantity ? 'text-red-600' : 'text-emerald-600'}`} />
                          <p className={`text-xl font-bold font-golos ${viewTarget.quantity <= viewTarget.minQuantity ? 'text-red-700' : 'text-emerald-700'}`}>{viewTarget.quantity}</p>
                          <p className={`text-[10px] font-inter ${viewTarget.quantity <= viewTarget.minQuantity ? 'text-red-700/70' : 'text-emerald-700/70'}`}>в наличии</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <Icon name="AlertCircle" size={16} className="text-blue-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-blue-700 font-golos">{viewTarget.minQuantity}</p>
                          <p className="text-[10px] text-blue-700/70 font-inter">мин. остаток</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 text-center">
                          <Icon name="Wallet" size={16} className="text-amber-600 mx-auto mb-1" />
                          <p className="text-xl font-bold text-amber-700 font-golos">{(viewTarget.quantity * viewTarget.price).toLocaleString('ru')}</p>
                          <p className="text-[10px] text-amber-700/70 font-inter">стоимость ₽</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-inter">Уровень запаса</span>
                          <span className="font-bold font-golos">{viewTarget.quantity} / {viewTarget.minQuantity}</span>
                        </div>
                        <Progress value={Math.min((viewTarget.quantity / Math.max(viewTarget.minQuantity, 1)) * 100, 100)} className="h-2" />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Цены и маржа</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <p className="text-[10px] text-blue-700/70 font-inter">Закупка</p>
                          <p className="text-lg font-bold text-blue-700 font-golos">{viewTarget.price.toLocaleString('ru')} ₽</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <p className="text-[10px] text-emerald-700/70 font-inter">Продажа</p>
                          <p className="text-lg font-bold text-emerald-700 font-golos">{viewTarget.salePrice.toLocaleString('ru')} ₽</p>
                        </div>
                        <div className="p-3 rounded-xl bg-violet-50 text-center">
                          <p className="text-[10px] text-violet-700/70 font-inter">Маржа</p>
                          <p className="text-lg font-bold text-violet-700 font-golos">+{marginOf(viewTarget).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Хранение и поставка</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="Truck" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Поставщик</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.supplier || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="MapPin" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Место хранения</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.location || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <Icon name="Calendar" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Последнее обновление</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.lastUpdated ? new Date(viewTarget.lastUpdated).toLocaleDateString('ru') : '—'}</p>
                          </div>
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
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать запчасть' : 'Добавить запчасть'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Артикул</Label>
                <Input value={form.article} onChange={e => setF('article', e.target.value)} placeholder="OIL-5W30-4L" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Бренд</Label>
                <Input value={form.brand} onChange={e => setF('brand', e.target.value)} placeholder="Shell" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Название</Label>
                <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Масло моторное Shell 5W-30 4л" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Категория</Label>
                <Select value={form.category} onValueChange={v => setF('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Поставщик</Label>
                <Input value={form.supplier} onChange={e => setF('supplier', e.target.value)} placeholder="АвтоХим" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Количество</Label>
                <Input type="number" value={form.quantity} onChange={e => setF('quantity', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Мин. количество</Label>
                <Input type="number" value={form.minQuantity} onChange={e => setF('minQuantity', Number(e.target.value))} placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Закупочная цена (₽)</Label>
                <Input type="number" value={form.price} onChange={e => setF('price', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Цена продажи (₽)</Label>
                <Input type="number" value={form.salePrice} onChange={e => setF('salePrice', Number(e.target.value))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Место хранения</Label>
                <Input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="Стеллаж А1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Дата обновления</Label>
                <Input type="date" value={form.lastUpdated} onChange={e => setF('lastUpdated', e.target.value)} />
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
              <AlertDialogTitle className="font-golos">Удалить позицию?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Запчасть будет удалена из системы.</AlertDialogDescription>
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
