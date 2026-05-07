import { useState, useEffect } from 'react';
import { Client, clientsService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const loyaltyMap = {
  bronze: { label: 'Бронза', class: 'bg-amber-700 text-white' },
  silver: { label: 'Серебро', class: 'bg-gray-400 text-white' },
  gold: { label: 'Золото', class: 'bg-amber-400 text-white' },
  platinum: { label: 'Платина', class: 'bg-violet-600 text-white' },
};

const emptyClient: Omit<Client, 'id'> = {
  name: '', phone: '', email: '', address: '', birthDate: '',
  registeredAt: new Date().toISOString().split('T')[0],
  loyaltyLevel: 'bronze', totalOrders: 0, totalSpent: 0, notes: '',
};

export default function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, 'id'>>(emptyClient);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setClients(await clientsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyClient); setModalOpen(true); };
  const openEdit = (c: Client) => { setEditTarget(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, birthDate: c.birthDate, registeredAt: c.registeredAt, loyaltyLevel: c.loyaltyLevel, totalOrders: c.totalOrders, totalSpent: c.totalSpent, notes: c.notes }); setModalOpen(true); };

  const handleSave = async () => {
    if (editTarget) {
      await clientsService.update(editTarget.id, form);
      toast({ title: 'Клиент обновлён' });
    } else {
      await clientsService.create(form);
      toast({ title: 'Клиент добавлен' });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await clientsService.delete(deleteId);
    toast({ title: 'Клиент удалён', variant: 'destructive' });
    setDeleteId(null);
    load();
  };

  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по имени, телефону или email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="UserPlus" size={16} />
          Добавить клиента
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего', value: clients.length, icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Платина', value: clients.filter(c => c.loyaltyLevel === 'platinum').length, icon: 'Award', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Золото', value: clients.filter(c => c.loyaltyLevel === 'gold').length, icon: 'Star', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Новых (месяц)', value: 3, icon: 'UserPlus', color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
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

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(client => (
            <Card key={client.id} className="border-0 shadow-card hover-lift group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-grad-primary text-white font-bold text-sm">{initials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 font-golos text-sm leading-tight">{client.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 rounded-full ${loyaltyMap[client.loyaltyLevel].class}`}>
                            {loyaltyMap[client.loyaltyLevel].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(client)}>
                          <Icon name="Pencil" size={12} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(client.id)}>
                          <Icon name="Trash2" size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                        <Icon name="Phone" size={11} />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                        <Icon name="Mail" size={11} />
                        <span>{client.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-base font-bold text-gray-900 font-golos">{client.totalOrders}</p>
                        <p className="text-[10px] text-muted-foreground font-inter">заказов</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div className="text-center">
                        <p className="text-base font-bold text-gray-900 font-golos">{client.totalSpent.toLocaleString('ru')} ₽</p>
                        <p className="text-[10px] text-muted-foreground font-inter">потрачено</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground font-inter">с {new Date(client.registeredAt).toLocaleDateString('ru')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg glass">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="font-inter text-xs">ФИО</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-inter text-xs">Телефон</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 (900) 000-00-00" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-inter text-xs">Email</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="mail@example.com" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="font-inter text-xs">Адрес</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="г. Москва, ул. Примерная, 1" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-inter text-xs">Дата рождения</Label>
              <Input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-inter text-xs">Уровень лояльности</Label>
              <Select value={form.loyaltyLevel} onValueChange={v => setForm(p => ({ ...p, loyaltyLevel: v as Client['loyaltyLevel'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Бронза</SelectItem>
                  <SelectItem value="silver">Серебро</SelectItem>
                  <SelectItem value="gold">Золото</SelectItem>
                  <SelectItem value="platinum">Платина</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="font-inter text-xs">Заметки</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Дополнительная информация..." rows={2} />
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-golos">Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие нельзя отменить. Все данные клиента будут удалены.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
