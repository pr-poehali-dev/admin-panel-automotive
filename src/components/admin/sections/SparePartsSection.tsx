import { useState, useEffect } from 'react';
import { SparePart, sparePartsService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  return (
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
          <Card key={i} className="border-0 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon name={s.icon} size={16} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-inter">{s.label}</p>
                <p className="text-sm font-bold font-golos">{s.value}</p>
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
                    <TableRow key={part.id} className={`hover:bg-muted/20 transition-colors group ${isLow ? 'bg-red-50/50' : ''}`}>
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
                      <TableCell className="text-sm font-inter text-muted-foreground">{part.supplier}</TableCell>
                      <TableCell className="text-sm font-inter text-muted-foreground">{part.location}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(part)}>
                            <Icon name="Pencil" size={12} className="text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(part.id)}>
                            <Icon name="Trash2" size={12} className="text-red-500" />
                          </Button>
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

      {/* Modal */}
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

      {/* Delete Confirm */}
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
  );
}
