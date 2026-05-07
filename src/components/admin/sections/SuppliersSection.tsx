import { useState, useEffect } from 'react';
import { Supplier, suppliersService } from '@/services/mockService';
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

  return (
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
          <Card key={i} className="border-0 shadow-card">
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
                  <TableRow key={sup.id} className="hover:bg-muted/20 transition-colors group">
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
                        <span className="text-xs font-semibold font-golos ml-1">{sup.rating}</span>
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(sup)}>
                          <Icon name="Pencil" size={12} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(sup.id)}>
                          <Icon name="Trash2" size={12} className="text-red-500" />
                        </Button>
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

      {/* Modal */}
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

      {/* Delete Confirm */}
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
  );
}
