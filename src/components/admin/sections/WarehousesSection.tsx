import { useState, useEffect } from 'react';
import { Warehouse, warehousesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
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

  return (
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
          <Card key={i} className="border-0 shadow-card">
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

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(wh => (
            <Card key={wh.id} className="border-0 shadow-card hover-lift group">
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(wh)}>
                      <Icon name="Pencil" size={12} className="text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(wh.id)}>
                      <Icon name="Trash2" size={12} className="text-red-500" />
                    </Button>
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

      {/* Modal */}
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

      {/* Delete Confirm */}
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
  );
}
