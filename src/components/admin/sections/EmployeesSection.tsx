import { useState, useEffect } from 'react';
import { Employee, employeesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const roleMap: Record<Employee['role'], { label: string; class: string; icon: string }> = {
  admin:   { label: 'Администратор', class: 'bg-purple-100 text-purple-700', icon: 'ShieldCheck' },
  manager: { label: 'Менеджер',      class: 'bg-blue-100 text-blue-700',     icon: 'Briefcase' },
  master:  { label: 'Мастер',        class: 'bg-green-100 text-green-700',   icon: 'Wrench' },
  cashier: { label: 'Кассир',        class: 'bg-orange-100 text-orange-700', icon: 'Wallet' },
};

const departments = ['Администрация', 'Управление', 'Автосервис', 'Касса', 'Склад', 'IT'];

const emptyEmployee: Omit<Employee, 'id'> = {
  name: '', role: 'master', email: '', phone: '',
  department: 'Автосервис', status: 'active',
  lastLogin: new Date().toLocaleString('ru'),
  permissions: [],
};

export default function EmployeesSection() {
  const [items, setItems] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, 'id'>>(emptyEmployee);
  const [permInput, setPermInput] = useState('');
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await employeesService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyEmployee); setPermInput(''); setModalOpen(true); };
  const openEdit = (e: Employee) => { setEditTarget(e); setForm({ ...e }); setPermInput(e.permissions.join(', ')); setModalOpen(true); };

  const handleSave = async () => {
    const finalForm = { ...form, permissions: permInput.split(',').map(s => s.trim()).filter(Boolean) };
    if (editTarget) {
      await employeesService.update(editTarget.id, finalForm);
      toast({ title: 'Сотрудник обновлён' });
    } else {
      await employeesService.create(finalForm);
      toast({ title: 'Сотрудник добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await employeesService.delete(deleteId);
    toast({ title: 'Сотрудник удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

  const setF = (k: keyof Omit<Employee, 'id'>, v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по имени, email, отделу..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="UserPlus" size={16} />
          Добавить сотрудника
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего сотрудников', value: items.length, icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Активных', value: items.filter(e => e.status === 'active').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Администраторов', value: items.filter(e => e.role === 'admin').length, icon: 'ShieldCheck', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Отделов', value: new Set(items.map(e => e.department)).size, icon: 'Building2', color: 'text-amber-600', bg: 'bg-amber-50' },
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
                  <TableHead className="font-semibold font-golos">Сотрудник</TableHead>
                  <TableHead className="font-semibold font-golos">Роль</TableHead>
                  <TableHead className="font-semibold font-golos">Отдел</TableHead>
                  <TableHead className="font-semibold font-golos">Контакты</TableHead>
                  <TableHead className="font-semibold font-golos">Последний вход</TableHead>
                  <TableHead className="font-semibold font-golos">Статус</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(emp => {
                  const role = roleMap[emp.role];
                  return (
                    <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-grad-primary text-white text-xs font-bold">{initials(emp.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900 font-golos text-sm">{emp.name}</div>
                            <div className="text-xs text-muted-foreground font-inter">{emp.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs gap-1 ${role.class} hover:${role.class}`}>
                          <Icon name={role.icon} size={10} />
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-inter text-muted-foreground">{emp.department}</TableCell>
                      <TableCell>
                        <div className="text-xs font-inter text-muted-foreground">{emp.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                          <Icon name="Clock" size={11} />
                          {emp.lastLogin}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={emp.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}>
                          {emp.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(emp)}>
                            <Icon name="Pencil" size={12} className="text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(emp.id)}>
                            <Icon name="Trash2" size={12} className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-inter">
                      Сотрудники не найдены
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
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">ФИО</Label>
              <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Роль</Label>
              <Select value={form.role} onValueChange={v => setF('role', v as Employee['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="master">Мастер</SelectItem>
                  <SelectItem value="cashier">Кассир</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Отдел</Label>
              <Select value={form.department} onValueChange={v => setF('department', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Email</Label>
              <Input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="user@sto.ru" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Телефон</Label>
              <Input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+7 (000) 000-00-00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setF('status', v as Employee['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Последний вход</Label>
              <Input value={form.lastLogin} onChange={e => setF('lastLogin', e.target.value)} placeholder="2024-10-16 09:15" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Права доступа (через запятую)</Label>
              <Textarea value={permInput} onChange={e => setPermInput(e.target.value)} placeholder="clients, orders, finance" rows={2} />
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
            <AlertDialogTitle className="font-golos">Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Данные сотрудника будут удалены из системы.</AlertDialogDescription>
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
