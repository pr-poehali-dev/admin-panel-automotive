import { useState, useEffect } from 'react';
import { Finance, financesService } from '@/services/mockService';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const incomeCategories = ['Оплата услуг', 'Продажа запчастей', 'Предоплата', 'Прочие доходы'];
const expenseCategories = ['Закупка запчастей', 'Заработная плата', 'Аренда', 'Коммунальные услуги', 'Оборудование', 'Прочие расходы'];

const statusMap: Record<Finance['status'], { label: string; class: string }> = {
  paid:      { label: 'Оплачено',  class: 'bg-green-100 text-green-700' },
  pending:   { label: 'Ожидание', class: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Отменено', class: 'bg-gray-100 text-gray-500' },
};

const paymentMethodMap: Record<Finance['paymentMethod'], string> = {
  cash:     'Наличные',
  card:     'Карта',
  transfer: 'Перевод',
};

const emptyFinance: Omit<Finance, 'id'> = {
  type: 'income', category: 'Оплата услуг', description: '',
  amount: 0, date: new Date().toISOString().split('T')[0],
  orderId: null, paymentMethod: 'cash', status: 'paid',
};

export default function FinancesSection() {
  const [items, setItems] = useState<Finance[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Finance | null>(null);
  const [form, setForm] = useState<Omit<Finance, 'id'>>(emptyFinance);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await financesService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(f => {
    const matchTab = tab === 'all' || f.type === tab;
    const matchSearch = f.description.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const openCreate = () => { setEditTarget(null); setForm(emptyFinance); setModalOpen(true); };
  const openEdit = (f: Finance) => { setEditTarget(f); setForm({ ...f }); setModalOpen(true); };

  const handleSave = async () => {
    if (editTarget) {
      await financesService.update(editTarget.id, form);
      toast({ title: 'Запись обновлена' });
    } else {
      await financesService.create(form);
      toast({ title: 'Запись добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await financesService.delete(deleteId);
    toast({ title: 'Запись удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const totalIncome = items.filter(f => f.type === 'income').reduce((a, f) => a + f.amount, 0);
  const totalExpense = items.filter(f => f.type === 'expense').reduce((a, f) => a + f.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const setF = (k: keyof Omit<Finance, 'id'>, v: string | number | null) =>
    setForm(f => ({ ...f, [k]: v }));

  const currentCategories = form.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по описанию или категории..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="Plus" size={16} />
          Добавить запись
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Общий доход', value: totalIncome.toLocaleString('ru') + ' ₽', icon: 'TrendingUp', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Общий расход', value: totalExpense.toLocaleString('ru') + ' ₽', icon: 'TrendingDown', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Чистая прибыль', value: netProfit.toLocaleString('ru') + ' ₽', icon: 'BadgeRussianRuble', color: netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50' },
          { label: 'Записей всего', value: items.length, icon: 'FileText', color: 'text-purple-600', bg: 'bg-purple-50' },
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

      {/* Tabs + Table */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto bg-muted/50 p-1 gap-1">
          {[
            { value: 'all', label: 'Все', count: items.length },
            { value: 'income', label: 'Доходы', count: items.filter(f => f.type === 'income').length },
            { value: 'expense', label: 'Расходы', count: items.filter(f => f.type === 'expense').length },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2 font-inter text-sm">
              {t.label}
              <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{t.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
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
                      <TableHead className="font-semibold font-golos">Тип / Категория</TableHead>
                      <TableHead className="font-semibold font-golos">Описание</TableHead>
                      <TableHead className="font-semibold font-golos">Сумма</TableHead>
                      <TableHead className="font-semibold font-golos">Дата</TableHead>
                      <TableHead className="font-semibold font-golos">Способ</TableHead>
                      <TableHead className="font-semibold font-golos">Статус</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(fin => {
                      const st = statusMap[fin.status];
                      const isIncome = fin.type === 'income';
                      return (
                        <TableRow key={fin.id} className="hover:bg-muted/20 transition-colors group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Icon name={isIncome ? 'ArrowDownLeft' : 'ArrowUpRight'} size={13} className={isIncome ? 'text-green-600' : 'text-red-600'} />
                              </div>
                              <div>
                                <div className="text-xs font-semibold font-golos">{fin.category}</div>
                                <div className={`text-[10px] font-inter ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncome ? 'Доход' : 'Расход'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-inter text-muted-foreground max-w-48 truncate">{fin.description}</TableCell>
                          <TableCell>
                            <span className={`font-bold font-golos text-sm ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                              {isIncome ? '+' : '-'}{fin.amount.toLocaleString('ru')} ₽
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-inter text-muted-foreground">{fin.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-inter">{paymentMethodMap[fin.paymentMethod]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${st.class} hover:${st.class}`}>{st.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(fin)}>
                                <Icon name="Pencil" size={12} className="text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(fin.id)}>
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
                          Записи не найдены
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать запись' : 'Добавить запись'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Тип</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Finance['type'], category: v === 'income' ? incomeCategories[0] : expenseCategories[0] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Категория</Label>
              <Select value={form.category} onValueChange={v => setF('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{currentCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Описание</Label>
              <Input value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Описание операции" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Сумма (₽)</Label>
              <Input type="number" value={form.amount} onChange={e => setF('amount', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата</Label>
              <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Способ оплаты</Label>
              <Select value={form.paymentMethod} onValueChange={v => setF('paymentMethod', v as Finance['paymentMethod'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Статус</Label>
              <Select value={form.status} onValueChange={v => setF('status', v as Finance['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">ID заказ-наряда (если есть)</Label>
              <Input value={form.orderId ?? ''} onChange={e => setF('orderId', e.target.value || null)} placeholder="ID заказа" />
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
            <AlertDialogTitle className="font-golos">Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Финансовая запись будет удалена.</AlertDialogDescription>
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
