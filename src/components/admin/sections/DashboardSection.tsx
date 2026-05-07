import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Icon from '@/components/ui/icon';

const stats = [
  { label: 'Выручка (месяц)', value: '485 000 ₽', change: '+12%', icon: 'TrendingUp', gradient: 'bg-grad-primary' },
  { label: 'Заказ-нарядов', value: '124', change: '+8%', icon: 'ClipboardList', gradient: 'bg-grad-success' },
  { label: 'Новых клиентов', value: '18', change: '+23%', icon: 'UserPlus', gradient: 'bg-grad-warning' },
  { label: 'Средний чек', value: '3 911 ₽', change: '+5%', icon: 'Wallet', gradient: 'bg-grad-secondary' },
];

const recentOrders = [
  { id: 'ЗН-2024-004', client: 'Волков И.М.', car: 'Porsche Cayenne', status: 'new', amount: '15 000 ₽', priority: 'urgent' },
  { id: 'ЗН-2024-002', client: 'Сидоров Д.Н.', car: 'BMW X5', status: 'in_progress', amount: '25 000 ₽', priority: 'high' },
  { id: 'ЗН-2024-005', client: 'Козлова А.И.', car: 'Kia Rio', status: 'in_progress', amount: '6 700 ₽', priority: 'medium' },
  { id: 'ЗН-2024-003', client: 'Петрова М.С.', car: 'Hyundai Solaris', status: 'ready', amount: '2 800 ₽', priority: 'low' },
];

const statusMap: Record<string, { label: string; class: string }> = {
  new: { label: 'Новый', class: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'В работе', class: 'bg-amber-100 text-amber-700' },
  ready: { label: 'Готов', class: 'bg-green-100 text-green-700' },
  completed: { label: 'Выполнен', class: 'bg-gray-100 text-gray-600' },
};

const priorityMap: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

const masters = [
  { name: 'Захаров В.А.', orders: 38, target: 45, rating: 4.9, load: 84 },
  { name: 'Алексеев Д.С.', orders: 42, target: 45, rating: 4.9, load: 93 },
  { name: 'Попов А.В.', orders: 29, target: 40, rating: 4.8, load: 72 },
  { name: 'Лебедев П.И.', orders: 25, target: 40, rating: 4.7, load: 62 },
];

const weekRevenue = [
  { day: 'Пн', value: 62, sum: '52 000 ₽' },
  { day: 'Вт', value: 78, sum: '65 000 ₽' },
  { day: 'Ср', value: 55, sum: '46 000 ₽' },
  { day: 'Чт', value: 92, sum: '77 000 ₽' },
  { day: 'Пт', value: 100, sum: '84 000 ₽' },
  { day: 'Сб', value: 85, sum: '71 000 ₽' },
  { day: 'Вс', value: 48, sum: '40 000 ₽' },
];

const orderStatusDist = [
  { label: 'Новые', count: 12, percent: 22, color: 'bg-blue-500' },
  { label: 'В работе', count: 18, percent: 33, color: 'bg-amber-500' },
  { label: 'Готовы', count: 9, percent: 17, color: 'bg-green-500' },
  { label: 'Выполнены', count: 15, percent: 28, color: 'bg-gray-500' },
];

const topServices = [
  { name: 'Замена масла и фильтров', count: 87, percent: 100, icon: 'Droplet' },
  { name: 'Диагностика двигателя', count: 64, percent: 74, icon: 'Stethoscope' },
  { name: 'Шиномонтаж', count: 52, percent: 60, icon: 'Disc' },
  { name: 'Замена тормозных колодок', count: 41, percent: 47, icon: 'CircleDashed' },
  { name: 'Развал-схождение', count: 33, percent: 38, icon: 'Activity' },
];

const activityFeed = [
  { user: 'Иван Захаров', action: 'создал заказ-наряд', target: 'ЗН-2024-007', time: '2 мин назад', icon: 'FileText', color: 'text-blue-600 bg-blue-50' },
  { user: 'Касса', action: 'получен платёж', target: '5 000 ₽', time: '15 мин назад', icon: 'CreditCard', color: 'text-green-600 bg-green-50' },
  { user: 'Мария Петрова', action: 'оставила отзыв', target: '5 звёзд', time: '38 мин назад', icon: 'Star', color: 'text-amber-600 bg-amber-50' },
  { user: 'Склад', action: 'поступление товара', target: 'Тормозные колодки', time: '1 ч назад', icon: 'Package', color: 'text-purple-600 bg-purple-50' },
  { user: 'Алексей Попов', action: 'завершил работу', target: 'ЗН-2024-002', time: '2 ч назад', icon: 'CheckCircle', color: 'text-emerald-600 bg-emerald-50' },
  { user: 'Администратор', action: 'добавил клиента', target: 'Кузнецов А.И.', time: '3 ч назад', icon: 'UserPlus', color: 'text-cyan-600 bg-cyan-50' },
];

const todaySchedule = [
  { time: '10:00', client: 'Волков И.М.', car: 'Porsche Cayenne', service: 'Диагностика' },
  { time: '12:30', client: 'Сидоров Д.Н.', car: 'BMW X5', service: 'Замена масла' },
  { time: '14:00', client: 'Козлова А.И.', car: 'Kia Rio', service: 'Шиномонтаж' },
  { time: '16:30', client: 'Петрова М.С.', car: 'Hyundai Solaris', service: 'Тормоза' },
];

const finance = {
  income: 485000,
  expense: 187000,
  profit: 298000,
  trend: [40, 55, 48, 62, 70, 65, 78, 85, 92, 88, 95, 100],
};

const lowStock = [
  { name: 'Масляный фильтр Mann W712', qty: 3, min: 10, brand: 'Mann' },
  { name: 'Тормозные колодки Brembo', qty: 2, min: 8, brand: 'Brembo' },
  { name: 'Свечи зажигания NGK', qty: 5, min: 15, brand: 'NGK' },
  { name: 'Антифриз G12 5л', qty: 1, min: 6, brand: 'Felix' },
];

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

export default function DashboardSection() {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className={`border-0 shadow-card hover-lift stagger-${i + 1} animate-slide-up`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-inter">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1 font-golos">{s.value}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Icon name="ArrowUpRight" size={10} />
                      {s.change} vs прошлый месяц
                    </span>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${s.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon name={s.icon} size={22} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Week revenue + Status distribution */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Выручка за неделю</CardTitle>
                <p className="text-xs text-muted-foreground font-inter mt-0.5">Динамика по дням</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold font-golos text-gray-900">435 000 ₽</p>
                <span className="text-xs text-emerald-600 font-medium">+18% к прошлой неделе</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40 pt-2">
                {weekRevenue.map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '120px' }}>
                          <div
                            className="w-full bg-grad-primary rounded-t-lg shadow-sm group-hover:opacity-90 transition-all"
                            style={{ height: `${d.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-inter text-muted-foreground group-hover:text-gray-900 transition-colors">{d.day}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{d.day}: {d.sum}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-golos">Распределение заказов</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">По статусам выполнения</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderStatusDist.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="font-medium text-gray-900 font-inter">{s.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-golos font-bold">{s.count} · {s.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${s.color} transition-all`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent orders + Masters performance */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-card animate-slide-up stagger-3">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base font-bold font-golos">Актуальные заказ-наряды</CardTitle>
                <Badge variant="secondary" className="font-inter">4 активных</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityMap[order.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 font-golos">{order.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-inter ${statusMap[order.status]?.class}`}>
                            {statusMap[order.status]?.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-inter truncate">{order.client} · {order.car}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 font-golos">{order.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-card animate-slide-up stagger-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-golos">Эффективность мастеров</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">За текущий месяц</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {masters.map((m, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 font-golos">{m.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Icon name="Star" size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-gray-700">{m.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(m.orders / m.target) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground font-inter w-14 text-right">{m.orders}/{m.target}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Masters load + Top services */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-golos">Загрузка мастеров</CardTitle>
              <p className="text-xs text-muted-foreground font-inter">Текущая занятость</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {masters.map((m, i) => {
                  const circumference = 2 * Math.PI * 26;
                  const offset = circumference - (m.load / 100) * circumference;
                  const color = m.load > 85 ? '#ef4444' : m.load > 70 ? '#f59e0b' : '#10b981';
                  return (
                    <HoverCard key={i}>
                      <HoverCardTrigger asChild>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" fill="none" className="text-muted" />
                              <circle
                                cx="32" cy="32" r="26"
                                stroke={color} strokeWidth="5" fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Avatar className="w-9 h-9">
                                <AvatarFallback className="bg-grad-primary text-white text-[10px] font-bold">{initials(m.name)}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold font-golos text-gray-900 truncate max-w-[100px]">{m.name.split(' ')[0]}</p>
                            <p className="text-xs font-bold" style={{ color }}>{m.load}%</p>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-60">
                        <div className="space-y-1 text-sm">
                          <p className="font-bold font-golos">{m.name}</p>
                          <p className="text-xs text-muted-foreground">Загрузка: {m.load}%</p>
                          <p className="text-xs text-muted-foreground">Заказов: {m.orders} / {m.target}</p>
                          <p className="text-xs text-muted-foreground">Рейтинг: {m.rating} ★</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 border-0 shadow-card hover-lift animate-slide-up stagger-2">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Топ услуг</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По количеству заказов</p>
              </div>
              <Badge variant="secondary" className="font-inter">За месяц</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {topServices.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center flex-shrink-0">
                    <Icon name={s.icon} size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 font-inter truncate">{s.name}</span>
                      <span className="text-xs font-bold text-gray-700 font-golos ml-2">{s.count}</span>
                    </div>
                    <Progress value={s.percent} className="h-1.5" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity feed + Today schedule + Finance */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base font-bold font-golos">Недавняя активность</CardTitle>
              <Icon name="Activity" size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div className="px-6 pb-4 space-y-3">
                  {activityFeed.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                        <Icon name={a.icon} size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-inter">
                          <span className="font-semibold">{a.user}</span>{' '}
                          <span className="text-muted-foreground">{a.action}</span>{' '}
                          <span className="font-medium text-primary">{a.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground font-inter mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Сегодня запланировано</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">{todaySchedule.length} записи</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-grad-secondary flex items-center justify-center">
                <Icon name="CalendarCheck" size={16} className="text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySchedule.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="text-center flex-shrink-0">
                    <p className="text-sm font-bold text-primary font-golos">{t.time}</p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 font-golos truncate">{t.client}</p>
                    <p className="text-xs text-muted-foreground font-inter truncate">{t.car} · {t.service}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Финансы за месяц</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Доход / Расход / Прибыль</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-grad-success flex items-center justify-center">
                <Icon name="TrendingUp" size={16} className="text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-inter">Доход</span>
                  <span className="text-sm font-bold font-golos text-emerald-600">{finance.income.toLocaleString('ru')} ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-inter">Расход</span>
                  <span className="text-sm font-bold font-golos text-red-500">−{finance.expense.toLocaleString('ru')} ₽</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-golos text-gray-900">Прибыль</span>
                  <span className="text-base font-bold font-golos text-gray-900">{finance.profit.toLocaleString('ru')} ₽</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-16 pt-2">
                {finance.trend.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-t"
                    style={{ height: `${v}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-emerald-600 font-medium font-inter text-center">
                <Icon name="ArrowUpRight" size={10} className="inline mr-1" />
                Прибыль выросла на 14% в этом месяце
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low stock alert */}
        <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6 border-l-4 border-l-orange-400">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Icon name="AlertTriangle" size={18} className="text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-golos">Заканчиваются на складе</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">{lowStock.length} позиций требуют пополнения</p>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-inter">Внимание</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {lowStock.map((p, i) => (
                <div key={i} className="p-3 rounded-xl border border-orange-100 bg-orange-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <Icon name="Package" size={14} className="text-orange-500 mt-0.5" />
                    <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-700 bg-white">
                      {p.qty} / {p.min}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 font-golos mt-2 line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-inter mt-1">{p.brand}</p>
                  <Progress value={(p.qty / p.min) * 100} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom row stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: 'Записей сегодня', value: '6', icon: 'CalendarCheck', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Ожидают ответа', value: '1 отзыв', icon: 'MessageSquare', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Заканчиваются на складе', value: '4 позиции', icon: 'AlertTriangle', color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Активных акций', value: '4', icon: 'Tag', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((item, i) => (
            <Card key={i} className="border-0 shadow-card hover-lift">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <Icon name={item.icon} size={18} className={item.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-inter">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900 font-golos">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
