import { useState, useEffect, useMemo } from 'react';
import { Finance, financesService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const incomeCategories = ['Оплата услуг', 'Продажа запчастей', 'Предоплата', 'Прочие доходы'];
const expenseCategories = ['Закупка запчастей', 'Заработная плата', 'Аренда', 'Коммунальные услуги', 'Оборудование', 'Прочие расходы'];

const statusMap: Record<Finance['status'], { label: string; class: string }> = {
  paid: { label: 'Оплачено', class: 'bg-green-100 text-green-700' },
  pending: { label: 'Ожидание', class: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Отменено', class: 'bg-gray-100 text-gray-500' },
};

const paymentMethodMap: Record<Finance['paymentMethod'], { label: string; icon: string; color: string; bg: string }> = {
  cash: { label: 'Наличные', icon: 'Banknote', color: 'text-green-600', bg: 'bg-green-50' },
  card: { label: 'Карта', icon: 'CreditCard', color: 'text-blue-600', bg: 'bg-blue-50' },
  transfer: { label: 'Перевод', icon: 'ArrowLeftRight', color: 'text-violet-600', bg: 'bg-violet-50' },
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
  const [viewTarget, setViewTarget] = useState<Finance | null>(null);
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
  const openView = (f: Finance) => setViewTarget(f);
  const editFromView = () => {
    if (viewTarget) {
      const f = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(f), 100);
    }
  };

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

  // Аналитика
  const analytics = useMemo(() => {
    // Динамика 7 дней
    const today = new Date();
    const days: { label: string; income: number; expense: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('ru', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      const income = items.filter(f => f.date === dateStr && f.type === 'income').reduce((a, f) => a + f.amount, 0);
      const expense = items.filter(f => f.date === dateStr && f.type === 'expense').reduce((a, f) => a + f.amount, 0);
      days.push({ label, income, expense, date: dateStr });
    }
    const maxDay = Math.max(...days.flatMap(d => [d.income, d.expense]), 1);

    // Категории расходов
    const expenseCatMap: Record<string, number> = {};
    items.filter(f => f.type === 'expense').forEach(f => {
      expenseCatMap[f.category] = (expenseCatMap[f.category] || 0) + f.amount;
    });
    const byExpenseCat = Object.entries(expenseCatMap).map(([cat, sum]) => ({ cat, sum }))
      .sort((a, b) => b.sum - a.sum);
    const maxExpenseCat = Math.max(...byExpenseCat.map(c => c.sum), 1);

    // Способы оплаты
    const methods = (['cash', 'card', 'transfer'] as const).map(m => {
      const sum = items.filter(f => f.paymentMethod === m).reduce((a, f) => a + f.amount, 0);
      const count = items.filter(f => f.paymentMethod === m).length;
      return { method: m, sum, count };
    });
    const totalSum = methods.reduce((a, m) => a + m.sum, 0) || 1;

    // Топ-5 крупнейших операций
    const topOps = [...items].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Средний дневной доход
    const incomeDates = new Set(items.filter(f => f.type === 'income').map(f => f.date));
    const avgDaily = incomeDates.size ? Math.round(totalIncome / incomeDates.size) : 0;

    // Тренд прибыли
    const last7Profit = days.reduce((a, d) => a + (d.income - d.expense), 0);
    const prevDays: { income: number; expense: number }[] = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      prevDays.push({
        income: items.filter(f => f.date === dateStr && f.type === 'income').reduce((a, f) => a + f.amount, 0),
        expense: items.filter(f => f.date === dateStr && f.type === 'expense').reduce((a, f) => a + f.amount, 0),
      });
    }
    const prev7Profit = prevDays.reduce((a, d) => a + (d.income - d.expense), 0);
    const trend = prev7Profit ? ((last7Profit - prev7Profit) / Math.abs(prev7Profit)) * 100 : 0;

    return { days, maxDay, byExpenseCat, maxExpenseCat, methods, totalSum, topOps, avgDaily, trend };
  }, [items, totalIncome]);

  return (
    <TooltipProvider>
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
            <Card key={i} className={`border-0 shadow-card animate-slide-up stagger-${i + 1}`}>
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

        {/* Виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Динамика 7 дней */}
          <Card className="lg:col-span-2 border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Динамика за 7 дней</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Доходы и расходы по дням</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-inter">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />Доход
                </span>
                <span className="flex items-center gap-1.5 font-inter">
                  <span className="w-2 h-2 rounded-full bg-red-500" />Расход
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40 pt-2">
                {analytics.days.map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="w-full flex gap-1 items-end justify-center" style={{ height: '120px' }}>
                          <div
                            className="flex-1 bg-emerald-500 rounded-t transition-all group-hover:opacity-80"
                            style={{ height: `${(d.income / analytics.maxDay) * 100}%`, minHeight: d.income > 0 ? '4px' : '0' }}
                          />
                          <div
                            className="flex-1 bg-red-500 rounded-t transition-all group-hover:opacity-80"
                            style={{ height: `${(d.expense / analytics.maxDay) * 100}%`, minHeight: d.expense > 0 ? '4px' : '0' }}
                          />
                        </div>
                        <span className="text-[10px] font-inter text-muted-foreground capitalize">{d.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-semibold">{d.label}</p>
                        <p className="text-emerald-600">+{d.income.toLocaleString('ru')} ₽</p>
                        <p className="text-red-600">−{d.expense.toLocaleString('ru')} ₽</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Чистая прибыль с трендом */}
          <Card className={`border-0 shadow-card hover-lift animate-slide-up stagger-2 ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50' : 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50'}`}>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Чистая прибыль</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Доход − Расход</p>
              </div>
              <Icon name={netProfit >= 0 ? 'TrendingUp' : 'TrendingDown'} size={16} className={netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 ${netProfit >= 0 ? 'bg-grad-success' : 'bg-red-500'}`}>
                <Icon name="BadgeRussianRuble" size={26} className="text-white" />
              </div>
              <p className={`text-3xl font-bold font-golos ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('ru')} ₽
              </p>
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${analytics.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                <Icon name={analytics.trend >= 0 ? 'ArrowUpRight' : 'ArrowDownRight'} size={10} />
                {analytics.trend >= 0 ? '+' : ''}{analytics.trend.toFixed(1)}% к прошлой неделе
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Доход</p>
                  <p className="text-sm font-bold text-emerald-600 font-golos">{totalIncome.toLocaleString('ru')}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white">
                  <p className="text-[10px] text-muted-foreground font-inter">Расход</p>
                  <p className="text-sm font-bold text-red-600 font-golos">{totalExpense.toLocaleString('ru')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Категории расходов */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Категории расходов</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Распределение трат</p>
              </div>
              <Icon name="PieChart" size={16} className="text-red-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.byExpenseCat.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 font-inter">Расходов нет</p>
              ) : (
                analytics.byExpenseCat.slice(0, 6).map(c => (
                  <div key={c.cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium font-inter text-gray-900 truncate">{c.cat}</span>
                      <span className="text-xs font-bold font-golos text-red-600 ml-2">{c.sum.toLocaleString('ru')} ₽</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(c.sum / analytics.maxExpenseCat) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Способы оплаты */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Способы оплаты</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По общей сумме</p>
              </div>
              <Icon name="CreditCard" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.methods.map(m => {
                const cfg = paymentMethodMap[m.method];
                const pct = (m.sum / analytics.totalSum) * 100;
                return (
                  <div key={m.method} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                          <Icon name={cfg.icon} size={13} className={cfg.color} />
                        </div>
                        <span className="font-medium font-inter text-gray-900">{cfg.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-golos">{Math.round(pct)}%</p>
                        <p className="text-[10px] text-muted-foreground font-inter">{m.count} оп.</p>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Средний дневной доход */}
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Средний доход</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">В день</p>
              </div>
              <Icon name="Calendar" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-grad-success flex items-center justify-center shadow-md mb-3">
                <Icon name="TrendingUp" size={26} className="text-white" />
              </div>
              <p className="text-3xl font-bold font-golos text-emerald-700">{analytics.avgDaily.toLocaleString('ru')} ₽</p>
              <p className="text-xs text-muted-foreground font-inter mt-1">в день в среднем</p>
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-[10px] text-emerald-700/70 font-inter">В неделю</p>
                  <p className="text-xs font-bold text-emerald-700 font-golos">{(analytics.avgDaily * 7).toLocaleString('ru')} ₽</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-50">
                  <p className="text-[10px] text-blue-700/70 font-inter">В месяц</p>
                  <p className="text-xs font-bold text-blue-700 font-golos">{(analytics.avgDaily * 30).toLocaleString('ru')} ₽</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Топ-5 крупнейших */}
        <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-golos">Топ-5 крупнейших операций</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">По сумме</p>
            </div>
            <Icon name="Trophy" size={16} className="text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {analytics.topOps.map((f, i) => {
                const isIncome = f.type === 'income';
                return (
                  <div key={f.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openView(f)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground font-golos">#{i + 1}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Icon name={isIncome ? 'TrendingUp' : 'TrendingDown'} size={13} className={isIncome ? 'text-green-600' : 'text-red-600'} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold font-golos line-clamp-2">{f.description || f.category}</p>
                    <p className={`text-base font-bold font-golos mt-2 ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isIncome ? '+' : '−'}{f.amount.toLocaleString('ru')} ₽
                    </p>
                    <p className="text-[10px] text-muted-foreground font-inter mt-1">{f.date}</p>
                  </div>
                );
              })}
              {analytics.topOps.length === 0 && (
                <p className="col-span-5 text-xs text-muted-foreground text-center py-4 font-inter">Операций нет</p>
              )}
            </div>
          </CardContent>
        </Card>

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
                          <TableRow key={fin.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => openView(fin)}>
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
                              <Badge variant="outline" className="text-xs font-inter">{paymentMethodMap[fin.paymentMethod].label}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${st.class} hover:${st.class}`}>{st.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={e => e.stopPropagation()}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(fin)}>
                                      <Icon name="Eye" size={12} className="text-emerald-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Просмотр</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(fin)}>
                                      <Icon name="Pencil" size={12} className="text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Редактировать</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteId(fin.id)}>
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

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${viewTarget.type === 'income' ? 'bg-grad-success' : 'bg-red-500'}`}>
                      <Icon name={viewTarget.type === 'income' ? 'TrendingUp' : 'TrendingDown'} size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">
                        {viewTarget.type === 'income' ? 'Доход' : 'Расход'}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${statusMap[viewTarget.status].class}`}>{statusMap[viewTarget.status].label}</Badge>
                        <Badge variant="outline" className="text-xs">{paymentMethodMap[viewTarget.paymentMethod].label}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Категория</h4>
                      <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewTarget.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Icon name="Tag" size={16} className={viewTarget.type === 'income' ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-inter">Категория</p>
                          <p className="text-sm font-semibold font-golos">{viewTarget.category}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Описание</h4>
                      <div className="p-3 rounded-xl bg-muted/30 text-sm font-inter text-gray-700 min-h-[60px]">
                        {viewTarget.description || 'Без описания'}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Сумма</h4>
                      <div className={`p-6 rounded-xl text-center ${viewTarget.type === 'income' ? 'bg-grad-success' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
                        <Icon name="BadgeRussianRuble" size={24} className="text-white mx-auto mb-2" />
                        <p className="text-4xl font-bold text-white font-golos">
                          {viewTarget.type === 'income' ? '+' : '−'}{viewTarget.amount.toLocaleString('ru')} ₽
                        </p>
                        <p className="text-xs text-white/80 font-inter mt-2">
                          {viewTarget.type === 'income' ? 'Поступление средств' : 'Расходная операция'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Детали операции</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="Calendar" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Дата</p>
                            <p className="text-sm font-medium font-golos">{viewTarget.date ? new Date(viewTarget.date).toLocaleDateString('ru') : '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-md ${paymentMethodMap[viewTarget.paymentMethod].bg} flex items-center justify-center mt-0`}>
                            <Icon name={paymentMethodMap[viewTarget.paymentMethod].icon} size={12} className={paymentMethodMap[viewTarget.paymentMethod].color} />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Способ оплаты</p>
                            <p className="text-sm font-medium font-golos">{paymentMethodMap[viewTarget.paymentMethod].label}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <Icon name="ClipboardList" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Связанный заказ-наряд</p>
                            <p className="text-sm font-medium font-mono font-golos">{viewTarget.orderId || '—'}</p>
                          </div>
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
            )}
          </DialogContent>
        </Dialog>

        {/* Edit/Create Modal */}
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
                <Textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Описание операции" rows={2} />
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
    </TooltipProvider>
  );
}
