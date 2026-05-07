import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';

const stats = [
  { label: 'Выручка (месяц)', value: '485 000 ₽', change: '+12%', icon: 'TrendingUp', gradient: 'bg-grad-primary', iconColor: 'text-white' },
  { label: 'Заказ-нарядов', value: '124', change: '+8%', icon: 'ClipboardList', gradient: 'bg-grad-success', iconColor: 'text-white' },
  { label: 'Новых клиентов', value: '18', change: '+23%', icon: 'UserPlus', gradient: 'bg-grad-warning', iconColor: 'text-white' },
  { label: 'Средний чек', value: '3 911 ₽', change: '+5%', icon: 'Wallet', gradient: 'bg-grad-secondary', iconColor: 'text-white' },
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
  { name: 'Захаров В.А.', orders: 38, target: 45, rating: 4.9 },
  { name: 'Алексеев Д.С.', orders: 42, target: 45, rating: 4.9 },
  { name: 'Попов А.В.', orders: 29, target: 40, rating: 4.8 },
  { name: 'Лебедев П.И.', orders: 25, target: 40, rating: 4.7 },
];

export default function DashboardSection() {
  return (
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
                  <Icon name={s.icon} size={22} className={s.iconColor} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-card animate-slide-up stagger-2">
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

        {/* Masters performance */}
        <Card className="border-0 shadow-card animate-slide-up stagger-3">
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up stagger-4">
        {[
          { label: 'Записей сегодня', value: '6', icon: 'CalendarCheck', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ожидают ответа', value: '1 отзыв', icon: 'MessageSquare', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Заканчиваются на складе', value: '2 позиции', icon: 'AlertTriangle', color: 'text-orange-600', bg: 'bg-orange-50' },
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
  );
}
