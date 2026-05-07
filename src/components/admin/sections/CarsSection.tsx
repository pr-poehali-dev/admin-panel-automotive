import { useState, useEffect, useMemo } from 'react';
import { Car, carsService } from '@/services/mockService';
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

const emptyCar: Omit<Car, 'id'> = {
  clientId: '', clientName: '', brand: '', model: '', year: 2020,
  licensePlate: '', vin: '', color: '', mileage: 0, lastService: '', status: 'active',
};

const brands = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Lada', 'Porsche', 'Lexus', 'Ford', 'Chevrolet', 'Другой'];

export default function CarsSection() {
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Car | null>(null);
  const [viewTarget, setViewTarget] = useState<Car | null>(null);
  const [form, setForm] = useState<Omit<Car, 'id'>>(emptyCar);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setCars(await carsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = cars.filter(c =>
    [c.brand, c.model, c.licensePlate, c.clientName, c.vin].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyCar); setModalOpen(true); };
  const openEdit = (c: Car) => { setEditTarget(c); setForm({ ...c }); setModalOpen(true); };
  const openView = (c: Car) => setViewTarget(c);
  const editFromView = () => {
    if (viewTarget) {
      const c = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(c), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await carsService.update(editTarget.id, form);
      toast({ title: 'Автомобиль обновлён' });
    } else {
      await carsService.create(form);
      toast({ title: 'Автомобиль добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await carsService.delete(deleteId);
    toast({ title: 'Автомобиль удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  // Аналитика
  const analytics = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Топ марок
    const brandCounts: Record<string, number> = {};
    cars.forEach(c => { brandCounts[c.brand] = (brandCounts[c.brand] || 0) + 1; });
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
    const maxBrand = Math.max(...topBrands.map(b => b.count), 1);

    // Возраст автопарка
    const age = {
      new: cars.filter(c => currentYear - c.year <= 3).length,
      young: cars.filter(c => currentYear - c.year > 3 && currentYear - c.year <= 7).length,
      mature: cars.filter(c => currentYear - c.year > 7 && currentYear - c.year <= 15).length,
      old: cars.filter(c => currentYear - c.year > 15).length,
    };

    // Авто, требующие ТО
    const today = new Date();
    const needService = cars
      .filter(c => {
        const last = c.lastService ? new Date(c.lastService) : null;
        const monthsSince = last ? (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24 * 30) : 999;
        return c.mileage > 80000 || monthsSince > 6;
      })
      .slice(0, 5);

    // Топ по пробегу
    const topMileage = [...cars].sort((a, b) => b.mileage - a.mileage).slice(0, 5);

    // Распределение по году выпуска (5-летние группы)
    const yearGroups: { label: string; count: number }[] = [];
    const baseYear = Math.floor(currentYear / 5) * 5;
    for (let i = 4; i >= 0; i--) {
      const from = baseYear - i * 5;
      const to = from + 4;
      const count = cars.filter(c => c.year >= from && c.year <= to).length;
      yearGroups.push({ label: `${from}-${to}`, count });
    }
    const maxYearGroup = Math.max(...yearGroups.map(y => y.count), 1);

    // Самые популярные модели
    const modelCounts: Record<string, { count: number; brand: string; model: string }> = {};
    cars.forEach(c => {
      const key = `${c.brand} ${c.model}`;
      if (!modelCounts[key]) modelCounts[key] = { count: 0, brand: c.brand, model: c.model };
      modelCounts[key].count++;
    });
    const topModels = Object.values(modelCounts).sort((a, b) => b.count - a.count).slice(0, 3);

    return { topBrands, maxBrand, age, needService, topMileage, yearGroups, maxYearGroup, topModels };
  }, [cars]);

  const setF = <K extends keyof Omit<Car, 'id'>>(k: K, v: Car[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по марке, гос. номеру, VIN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить авто
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего авто', value: cars.length, icon: 'Car', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Активных', value: cars.filter(c => c.status === 'active').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Марок', value: new Set(cars.map(c => c.brand)).size, icon: 'Tag', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Ср. пробег', value: Math.round(cars.reduce((a, c) => a + c.mileage, 0) / (cars.length || 1) / 1000) + ' тыс.км', icon: 'Gauge', color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon name={s.icon} size={16} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                  <p className="text-lg font-bold font-golos">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Аналитика */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ марок</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Самые частые марки</p>
              </div>
              <Icon name="Award" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topBrands.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
              ) : (
                analytics.topBrands.map((b, i) => (
                  <div key={b.brand} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                        <span className="font-medium font-inter text-gray-900">{b.brand}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{b.count}</span>
                    </div>
                    <Progress value={(b.count / analytics.maxBrand) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Возраст автопарка</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение по возрасту</p>
              </div>
              <Icon name="Clock" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'До 3 лет', count: analytics.age.new, color: 'bg-emerald-500' },
                { label: '3–7 лет', count: analytics.age.young, color: 'bg-blue-500' },
                { label: '7–15 лет', count: analytics.age.mature, color: 'bg-amber-500' },
                { label: 'Старше 15 лет', count: analytics.age.old, color: 'bg-red-500' },
              ].map((g, i) => {
                const total = cars.length || 1;
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

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3 border-l-4 border-l-red-400">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Требуют ТО</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Большой пробег или давно не обслуживались</p>
              </div>
              <Icon name="AlertTriangle" size={16} className="text-red-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.needService.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Все авто в порядке</p>
              ) : (
                analytics.needService.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50/40 hover:bg-red-50 transition-colors cursor-pointer" onClick={() => openView(c)}>
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Icon name="Wrench" size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos text-gray-900 truncate">{c.brand} {c.model}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{c.licensePlate} · {c.mileage.toLocaleString('ru')} км</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ по пробегу</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Самый большой пробег</p>
              </div>
              <Icon name="Gauge" size={16} className="text-orange-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topMileage.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(c)}>
                  <span className="text-xs font-bold text-muted-foreground w-4 font-golos">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center">
                    <Icon name="Car" size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-golos truncate">{c.brand} {c.model}</p>
                    <p className="text-[10px] text-muted-foreground font-inter">{c.licensePlate}</p>
                  </div>
                  <span className="text-xs font-bold font-golos text-gray-900">{c.mileage.toLocaleString('ru')} км</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Год выпуска</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение</p>
              </div>
              <Icon name="BarChart3" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32 pt-2">
                {analytics.yearGroups.map((g, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '90px' }}>
                          <div
                            className="w-full bg-grad-secondary rounded-t-md group-hover:opacity-80 transition-all"
                            style={{ height: `${Math.max((g.count / analytics.maxYearGroup) * 100, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-inter text-muted-foreground">{g.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{g.label}: {g.count} авто</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Популярные модели</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Топ-3 модели</p>
              </div>
              <Icon name="Star" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topModels.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
              ) : (
                analytics.topModels.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon name="Car" size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-golos text-gray-900 truncate">{m.brand} {m.model}</p>
                      <p className="text-xs text-muted-foreground font-inter">{m.count} {m.count === 1 ? 'автомобиль' : 'автомобилей'}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">#{i + 1}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold font-golos">Автомобиль</TableHead>
                    <TableHead className="font-semibold font-golos">Владелец</TableHead>
                    <TableHead className="font-semibold font-golos">Гос. номер</TableHead>
                    <TableHead className="font-semibold font-golos">Пробег</TableHead>
                    <TableHead className="font-semibold font-golos">Посл. ТО</TableHead>
                    <TableHead className="font-semibold font-golos">Статус</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(car => (
                    <TableRow key={car.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openView(car)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-grad-primary flex items-center justify-center shadow-sm">
                            <Icon name="Car" size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 font-golos text-sm">{car.brand} {car.model}</div>
                            <div className="text-xs text-muted-foreground font-inter">{car.year} · {car.color}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-inter">{car.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{car.licensePlate}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-inter">{car.mileage.toLocaleString('ru')} км</TableCell>
                      <TableCell className="text-sm font-inter text-muted-foreground">{car.lastService}</TableCell>
                      <TableCell>
                        <Badge className={car.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                          {car.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(car)}><Icon name="Eye" size={12} className="text-emerald-600" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Просмотр</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(car)}><Icon name="Pencil" size={12} className="text-blue-600" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Редактировать</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(car.id)}><Icon name="Trash2" size={12} className="text-red-500" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                      <Icon name="Car" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.brand} {viewTarget.model} {viewTarget.year}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-xs">{viewTarget.licensePlate}</Badge>
                        <Badge className={viewTarget.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {viewTarget.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Технические характеристики</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="Tag" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Марка</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.brand}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Box" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Модель</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.model}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Calendar" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Год выпуска</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.year}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Palette" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Цвет</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.color || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Hash" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Гос. номер</p>
                            <p className="text-sm font-medium font-mono font-golos">{viewTarget.licensePlate}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="Fingerprint" size={14} className="text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground font-inter">VIN</p>
                            <p className="text-sm font-medium font-mono font-golos truncate">{viewTarget.vin || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Эксплуатация</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-orange-50 text-center">
                          <p className="text-xl font-bold text-orange-700 font-golos">{viewTarget.mileage.toLocaleString('ru')}</p>
                          <p className="text-[10px] text-orange-700/70 font-inter mt-0.5">пробег, км</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <p className="text-xl font-bold text-blue-700 font-golos">{new Date().getFullYear() - viewTarget.year}</p>
                          <p className="text-[10px] text-blue-700/70 font-inter mt-0.5">лет авто</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-center">
                          <p className="text-xl font-bold text-emerald-700 font-golos">
                            {viewTarget.lastService ? Math.floor((Date.now() - new Date(viewTarget.lastService).getTime()) / (1000 * 60 * 60 * 24)) : '—'}
                          </p>
                          <p className="text-[10px] text-emerald-700/70 font-inter mt-0.5">дн. с посл. ТО</p>
                        </div>
                      </div>
                      {viewTarget.lastService && (
                        <p className="text-xs text-muted-foreground font-inter mt-2 text-center">
                          Последнее ТО: {new Date(viewTarget.lastService).toLocaleDateString('ru')}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Владелец</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-grad-secondary flex items-center justify-center">
                          <Icon name="User" size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-golos text-gray-900">{viewTarget.clientName || '—'}</p>
                          <p className="text-xs text-muted-foreground font-inter">ID: {viewTarget.clientId || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">История ТО</h4>
                      <div className="p-4 rounded-xl bg-muted/30 text-center">
                        <Icon name="FileSearch" size={24} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-inter">Данные о работах будут доступны после интеграции с заказ-нарядами</p>
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

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-golos">{editTarget ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Марка</Label>
                <Select value={form.brand} onValueChange={v => setF('brand', v)}>
                  <SelectTrigger><SelectValue placeholder="Выберите марку" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Модель</Label>
                <Input value={form.model} onChange={e => setF('model', e.target.value)} placeholder="Camry" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Год выпуска</Label>
                <Input type="number" value={form.year} onChange={e => setF('year', +e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Цвет</Label>
                <Input value={form.color} onChange={e => setF('color', e.target.value)} placeholder="Белый" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Гос. номер</Label>
                <Input value={form.licensePlate} onChange={e => setF('licensePlate', e.target.value)} placeholder="А000АА 77" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Пробег (км)</Label>
                <Input type="number" value={form.mileage} onChange={e => setF('mileage', +e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">VIN</Label>
                <Input value={form.vin} onChange={e => setF('vin', e.target.value)} placeholder="VIN номер" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Владелец</Label>
                <Input value={form.clientName} onChange={e => setF('clientName', e.target.value)} placeholder="ФИО клиента" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Последнее ТО</Label>
                <Input type="date" value={form.lastService} onChange={e => setF('lastService', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
              <Button onClick={handleSave} className="bg-grad-primary hover:opacity-90 text-white">{editTarget ? 'Сохранить' : 'Добавить'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-golos">Удалить автомобиль?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Запись об автомобиле будет удалена из системы.</AlertDialogDescription>
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
