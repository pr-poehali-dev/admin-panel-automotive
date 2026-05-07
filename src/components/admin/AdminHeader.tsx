import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const sectionTitles: Record<string, { title: string; subtitle: string; icon: string }> = {
  '/admin': { title: 'Дашборд', subtitle: 'Общая сводка по станции', icon: 'LayoutDashboard' },
  '/admin/clients': { title: 'Клиенты', subtitle: 'Управление базой клиентов', icon: 'Users' },
  '/admin/cars': { title: 'Автомобили', subtitle: 'Реестр транспортных средств', icon: 'Car' },
  '/admin/orders': { title: 'Заказ-наряды', subtitle: 'Управление работами', icon: 'ClipboardList' },
  '/admin/appointments': { title: 'Записи', subtitle: 'Расписание приёма', icon: 'CalendarCheck' },
  '/admin/masters': { title: 'Мастера', subtitle: 'Персонал автосервиса', icon: 'HardHat' },
  '/admin/employees': { title: 'Сотрудники', subtitle: 'Управление доступом', icon: 'UserCog' },
  '/admin/services': { title: 'Услуги', subtitle: 'Прайс-лист услуг', icon: 'Wrench' },
  '/admin/spare-parts': { title: 'Запчасти', subtitle: 'Склад запасных частей', icon: 'Package' },
  '/admin/warehouses': { title: 'Склады', subtitle: 'Управление складами', icon: 'Warehouse' },
  '/admin/suppliers': { title: 'Поставщики', subtitle: 'База поставщиков', icon: 'Truck' },
  '/admin/finances': { title: 'Финансы', subtitle: 'Доходы и расходы', icon: 'Wallet' },
  '/admin/reviews': { title: 'Отзывы', subtitle: 'Работа с отзывами клиентов', icon: 'Star' },
  '/admin/promotions': { title: 'Акции', subtitle: 'Маркетинговые акции', icon: 'Tag' },
};

interface Props {
  pathname: string;
}

export default function AdminHeader({ pathname }: Props) {
  const navigate = useNavigate();
  const info = sectionTitles[pathname] || { title: 'Раздел', subtitle: '', icon: 'Layout' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleLogout = () => {
    localStorage.removeItem('ais_auth');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-6 gap-4 sticky top-0 z-30">
      {/* Left: Section info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-grad-primary flex items-center justify-center shadow-glow">
          <Icon name={info.icon} size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight font-golos">{info.title}</h1>
          <p className="text-xs text-muted-foreground font-inter hidden sm:block">{info.subtitle}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg font-inter">
          <Icon name="Calendar" size={12} />
          <span className="capitalize">{dateStr}</span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative w-9 h-9 p-0 rounded-xl">
          <Icon name="Bell" size={18} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-white" />
        </Button>

        {/* Settings shortcut */}
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-xl">
          <Icon name="Settings" size={18} className="text-gray-600" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/50 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-grad-primary text-white text-xs font-bold">АС</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-gray-900 leading-tight font-golos">Смирнов А.Ю.</div>
                <div className="text-xs text-muted-foreground font-inter">Администратор</div>
              </div>
              <Icon name="ChevronDown" size={14} className="text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-golos">Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 font-inter">
              <Icon name="User" size={14} />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 font-inter">
              <Icon name="Settings" size={14} />
              Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive font-inter" onClick={handleLogout}>
              <Icon name="LogOut" size={14} />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
