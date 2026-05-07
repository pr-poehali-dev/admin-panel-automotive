import { useState, useEffect } from 'react';
import { Car, carsService } from '@/services/mockService';
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
  const [form, setForm] = useState<Omit<Car, 'id'>>(emptyCar);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setCars(await carsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = cars.filter(c =>
    [c.brand, c.model, c.licensePlate, c.clientName, c.vin].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyCar); setModalOpen(true); };
  const openEdit = (c: Car) => { setEditTarget(c); setForm({ ...c }); setModalOpen(true); };

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

  const brandColors: Record<string, string> = {
    'Toyota': 'bg-red-100 text-red-700', 'BMW': 'bg-blue-100 text-blue-700',
    'Mercedes-Benz': 'bg-gray-100 text-gray-700', 'Porsche': 'bg-yellow-100 text-yellow-700',
    'Hyundai': 'bg-cyan-100 text-cyan-700', 'Kia': 'bg-orange-100 text-orange-700',
    'Volkswagen': 'bg-indigo-100 text-indigo-700', 'Lada': 'bg-green-100 text-green-700',
  };

  return (
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
          <Card key={i} className="border-0 shadow-card">
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
                  <TableRow key={car.id} className="hover:bg-muted/20 transition-colors group">
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(car)}><Icon name="Pencil" size={12} className="text-blue-600" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(car.id)}><Icon name="Trash2" size={12} className="text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-golos">{editTarget ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Марка</Label>
              <Select value={form.brand} onValueChange={v => setForm(p => ({ ...p, brand: v }))}>
                <SelectTrigger><SelectValue placeholder="Выберите марку" /></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Модель</Label>
              <Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="Camry" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Год выпуска</Label>
              <Input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Цвет</Label>
              <Input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="Белый" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Гос. номер</Label>
              <Input value={form.licensePlate} onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} placeholder="А000АА 77" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Пробег (км)</Label>
              <Input type="number" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: +e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">VIN</Label>
              <Input value={form.vin} onChange={e => setForm(p => ({ ...p, vin: e.target.value }))} placeholder="VIN номер" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Владелец</Label>
              <Input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="ФИО клиента" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Последнее ТО</Label>
              <Input type="date" value={form.lastService} onChange={e => setForm(p => ({ ...p, lastService: e.target.value }))} />
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
  );
}
