import { useState, useEffect } from 'react';
import { Service, servicesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const mostPopular = items.reduce((a, b) => a.popularity > b.popularity ? a : b, items[0]);

  const setF = (k: keyof Omit<Service, 'id'>, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
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
          <Card key={i} className="border-0 shadow-card">
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
                  <TableRow key={svc.id} className="hover:bg-muted/20 transition-colors group">
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(svc)}>
                          <Icon name="Pencil" size={12} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(svc.id)}>
                          <Icon name="Trash2" size={12} className="text-red-500" />
                        </Button>
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
  );
}
