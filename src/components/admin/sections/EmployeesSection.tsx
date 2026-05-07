import { useState, useEffect, useMemo } from 'react';
import { Employee, employeesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const roleMap: Record<Employee['role'], { label: string; class: string; icon: string; color: string; bg: string }> = {
  admin: { label: 'Администратор', class: 'bg-purple-100 text-purple-700', icon: 'ShieldCheck', color: 'text-purple-600', bg: 'bg-purple-50' },
  manager: { label: 'Менеджер', class: 'bg-blue-100 text-blue-700', icon: 'Briefcase', color: 'text-blue-600', bg: 'bg-blue-50' },
  master: { label: 'Мастер', class: 'bg-green-100 text-green-700', icon: 'Wrench', color: 'text-green-600', bg: 'bg-green-50' },
  cashier: { label: 'Кассир', class: 'bg-orange-100 text-orange-700', icon: 'Wallet', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const departments = ['Администрация', 'Управление', 'Автосервис', 'Касса', 'Склад', 'IT'];

const emptyEmployee: Omit<Employee, 'id'> = {
  name: '', role: 'master', email: '', phone: '',
  department: 'Автосервис', status: 'active',
  lastLogin: new Date().toLocaleString('ru'),
  permissions: [],
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

// Парсер lastLogin (попытка прочитать дату из ru-форматов)
const parseLastLogin = (s: string): Date | null => {
  if (!s) return null;
  // ISO
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // ru: "16.10.2024, 09:15" или "16.10.2024 09:15"
  const m = s.match(/(\d{1,2})[.](\d{1,2})[.](\d{4})[, ]+(\d{1,2}):(\d{2})/);
  if (m) {
    d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const timeAgo = (s: string): string => {
  const d = parseLastLogin(s);
  if (!d) return s || '—';
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} дн назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед назад`;
  return d.toLocaleDateString('ru');
};

export default function EmployeesSection() {
  const [items, setItems] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [viewTarget, setViewTarget] = useState<Employee | null>(null);
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
  const openView = (e: Employee) => setViewTarget(e);
  const editFromView = () => {
    if (viewTarget) {
      const e = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(e), 100);
    }
  };

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

  const setF = (k: keyof Omit<Employee, 'id'>, v: string | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Аналитика
  const analytics = useMemo(() => {
    // По ролям
    const roles = (['admin', 'manager', 'master', 'cashier'] as const).map(r => ({
      key: r,
      count: items.filter(e => e.role === r).length,
    }));

    // По отделам
    const deptMap: Record<string, number> = {};
    items.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
    const byDept = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count);
    const maxDept = Math.max(...byDept.map(d => d.count), 1);

    // Последние логины
    const recentLogins = [...items]
      .map(e => ({ ...e, _ts: parseLastLogin(e.lastLogin)?.getTime() ?? 0 }))
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 5);

    // Активные/неактивные
    const active = items.filter(e => e.status === 'active').length;
    const inactive = items.length - active;

    // Безопасность: давно не входили (>7 дней)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const stale = items.filter(e => {
      const d = parseLastLogin(e.lastLogin);
      return d && Date.now() - d.getTime() > sevenDaysMs;
    });

    // Распределение прав
    const permMap: Record<string, number> = {};
    items.forEach(e => e.permissions.forEach(p => { permMap[p] = (permMap[p] || 0) + 1; }));
    const topPerms = Object.entries(permMap).map(([perm, count]) => ({ perm, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
    const maxPerm = Math.max(...topPerms.map(p => p.count), 1);

    return { roles, byDept, maxDept, recentLogins, active, inactive, stale, topPerms, maxPerm };
  }, [items]);

  return (
    <TooltipProvider>
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
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Роли</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение по должностям</p>
              </div>
              <Icon name="UserCog" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {analytics.roles.map(r => {
                  const cfg = roleMap[r.key];
                  return (
                    <div key={r.key} className={`p-3 rounded-xl ${cfg.bg} text-center cursor-default`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${cfg.class}`}>
                        <Icon name={cfg.icon} size={14} />
                      </div>
                      <p className="text-xl font-bold font-golos">{r.count}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Отделы</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Численность по отделам</p>
              </div>
              <Icon name="Building2" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.byDept.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.byDept.map(d => (
                  <div key={d.dept} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="Building" size={12} className="text-blue-500" />
                        <span className="font-medium font-inter text-gray-900 truncate">{d.dept}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{d.count}</span>
                    </div>
                    <Progress value={(d.count / analytics.maxDept) * 100} className="h-1.5" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Активность входов</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Последние 5 логинов</p>
              </div>
              <Icon name="Clock" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.recentLogins.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.recentLogins.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openView(e)}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-grad-primary text-white text-[9px] font-bold">{initials(e.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{roleMap[e.role].label}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-inter whitespace-nowrap">{timeAgo(e.lastLogin)}</span>
                  </div>
                ))
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
                <p className="text-xs text-muted-foreground font-inter">Состояние аккаунтов</p>
              </div>
              <Icon name="Activity" size={16} className="text-emerald-500" />
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

          {/* Безопасность */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5 border-l-4 border-l-orange-400">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon name="ShieldAlert" size={18} className="text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Безопасность</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">Давно не входили (&gt;7 дней)</p>
                </div>
              </div>
              <Badge className={`${analytics.stale.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {analytics.stale.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.stale.length === 0 ? (
                <div className="py-3 text-center">
                  <Icon name="ShieldCheck" size={20} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-emerald-700 font-medium font-inter">Все сотрудники активны</p>
                </div>
              ) : (
                analytics.stale.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/40 hover:bg-orange-50 cursor-pointer transition-colors" onClick={() => openView(e)}>
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-orange-500 text-white text-[9px] font-bold">{initials(e.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-golos truncate">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground font-inter">{roleMap[e.role].label}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-700">{timeAgo(e.lastLogin)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Права доступа */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Права доступа</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Топ выдаваемых прав</p>
              </div>
              <Icon name="Key" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topPerms.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Нет данных</p>
              ) : (
                analytics.topPerms.map(p => (
                  <div key={p.perm} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="Lock" size={11} className="text-amber-500" />
                        <span className="font-medium font-inter text-gray-900 font-mono text-xs truncate">{p.perm}</span>
                      </div>
                      <span className="text-xs font-bold font-golos text-gray-700">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${(p.count / analytics.maxPerm) * 100}%` }} />
                    </div>
                  </div>
                ))
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
                      <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openView(emp)}>
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(emp)}>
                                  <Icon name="Eye" size={12} className="text-emerald-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Просмотр</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(emp)}>
                                  <Icon name="Pencil" size={12} className="text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Редактировать</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(emp.id)}>
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

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (() => {
              const role = roleMap[viewTarget.role];
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-grad-primary text-white text-lg font-bold">{initials(viewTarget.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <DialogTitle className="font-golos text-xl">{viewTarget.name}</DialogTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`text-xs gap-1 ${role.class}`}>
                            <Icon name={role.icon} size={10} />
                            {role.label}
                          </Badge>
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
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Контактная информация</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <Icon name="Mail" size={14} className="text-muted-foreground mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground font-inter">Email</p>
                              <p className="text-sm font-medium font-golos truncate">{viewTarget.email || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="Phone" size={14} className="text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-inter">Телефон</p>
                              <p className="text-sm font-medium font-golos">{viewTarget.phone || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Должность и отдел</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`p-3 rounded-xl ${role.bg} flex items-center gap-3`}>
                            <div className={`w-10 h-10 rounded-xl ${role.class} flex items-center justify-center`}>
                              <Icon name={role.icon} size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground font-inter">Должность</p>
                              <p className="text-sm font-bold font-golos">{role.label}</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-grad-primary flex items-center justify-center">
                              <Icon name="Building2" size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground font-inter">Отдел</p>
                              <p className="text-sm font-bold font-golos">{viewTarget.department}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Активность</h4>
                        <div className="p-4 rounded-xl bg-blue-50 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Icon name="Clock" size={20} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-blue-700/70 font-inter">Последний вход</p>
                            <p className="text-sm font-bold text-blue-700 font-golos">{viewTarget.lastLogin || '—'}</p>
                            <p className="text-xs text-blue-600 font-inter mt-0.5">{timeAgo(viewTarget.lastLogin)}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">
                          Права доступа ({viewTarget.permissions.length})
                        </h4>
                        {viewTarget.permissions.length === 0 ? (
                          <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground font-inter">Права не назначены</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {viewTarget.permissions.map(p => (
                              <Badge key={p} variant="secondary" className="text-xs gap-1 font-mono">
                                <Icon name="Lock" size={10} />
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Статус аккаунта</h4>
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${viewTarget.status === 'active' ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewTarget.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            <Icon name={viewTarget.status === 'active' ? 'CheckCircle2' : 'XCircle'} size={18} className="text-white" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold font-golos ${viewTarget.status === 'active' ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {viewTarget.status === 'active' ? 'Аккаунт активен' : 'Аккаунт неактивен'}
                            </p>
                            <p className="text-xs text-muted-foreground font-inter">
                              {viewTarget.status === 'active' ? 'Сотрудник может входить в систему' : 'Доступ к системе закрыт'}
                            </p>
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
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Edit/Create Modal */}
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
    </TooltipProvider>
  );
}
