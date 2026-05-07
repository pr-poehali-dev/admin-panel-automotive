import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
  group?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard', path: '/admin', group: 'Обзор' },
  { id: 'clients', label: 'Клиенты', icon: 'Users', path: '/admin/clients', group: 'База данных' },
  { id: 'cars', label: 'Автомобили', icon: 'Car', path: '/admin/cars', group: 'База данных' },
  { id: 'orders', label: 'Заказ-наряды', icon: 'ClipboardList', path: '/admin/orders', badge: 4, group: 'Работа' },
  { id: 'appointments', label: 'Записи', icon: 'CalendarCheck', path: '/admin/appointments', badge: 3, group: 'Работа' },
  { id: 'masters', label: 'Мастера', icon: 'HardHat', path: '/admin/masters', group: 'Персонал' },
  { id: 'employees', label: 'Сотрудники', icon: 'UserCog', path: '/admin/employees', group: 'Персонал' },
  { id: 'services', label: 'Услуги', icon: 'Wrench', path: '/admin/services', group: 'Каталог' },
  { id: 'spare-parts', label: 'Запчасти', icon: 'Package', path: '/admin/spare-parts', group: 'Каталог' },
  { id: 'warehouses', label: 'Склады', icon: 'Warehouse', path: '/admin/warehouses', group: 'Каталог' },
  { id: 'suppliers', label: 'Поставщики', icon: 'Truck', path: '/admin/suppliers', group: 'Каталог' },
  { id: 'finances', label: 'Финансы', icon: 'Wallet', path: '/admin/finances', group: 'Аналитика' },
  { id: 'reviews', label: 'Отзывы', icon: 'Star', path: '/admin/reviews', badge: 1, group: 'Аналитика' },
  { id: 'promotions', label: 'Акции', icon: 'Tag', path: '/admin/promotions', group: 'Маркетинг' },
];

const groups = ['Обзор', 'База данных', 'Работа', 'Персонал', 'Каталог', 'Аналитика', 'Маркетинг'];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('ais_auth');
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-full bg-grad-sidebar shadow-sidebar transition-all duration-300 ease-in-out relative"
      style={{ width: collapsed ? 68 : 260 }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-white shadow-card border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 group"
      >
        <Icon
          name={collapsed ? 'ChevronRight' : 'ChevronLeft'}
          size={12}
          className="text-muted-foreground group-hover:text-white transition-colors"
        />
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon name="Wrench" size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <div className="text-white font-bold text-base leading-tight font-golos">АИС СТО</div>
            <div className="text-white/50 text-xs font-inter">v2.0 Professional</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-2">
                  <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest font-inter">{group}</span>
                </div>
              )}
              {collapsed && <div className="my-1 mx-3 h-px bg-white/10" />}
              {items.map(item => {
                const active = isActive(item.path);
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 transition-all duration-200 sidebar-item relative
                          ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'}
                          ${active ? 'sidebar-item-active' : ''}
                        `}
                      >
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                          ${active ? 'bg-white/25 shadow-sm' : 'bg-transparent'}`}
                        >
                          <Icon
                            name={item.icon}
                            size={18}
                            className={active ? 'text-white' : 'text-white/60'}
                          />
                        </div>
                        {!collapsed && (
                          <span className={`text-sm font-medium flex-1 text-left font-golos truncate animate-fade-in ${active ? 'text-white' : 'text-white/70'}`}>
                            {item.label}
                          </span>
                        )}
                        {!collapsed && item.badge && (
                          <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full animate-fade-in">
                            {item.badge}
                          </Badge>
                        )}
                        {collapsed && item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-golos">{item.label}</span>
                          {item.badge && (
                            <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User panel */}
      <div className={`border-t border-white/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer hover:bg-white/10 transition-colors ${collapsed ? 'justify-center' : ''}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-white/20 text-white text-xs font-bold">АС</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <div className="text-white text-sm font-semibold truncate font-golos">Смирнов А.Ю.</div>
                  <div className="text-white/50 text-xs truncate font-inter">Администратор</div>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="text-white/40 hover:text-white transition-colors animate-fade-in"
                  title="Выйти"
                >
                  <Icon name="LogOut" size={16} />
                </button>
              )}
            </div>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
              <div className="space-y-1">
                <div className="font-semibold font-golos">Смирнов А.Ю.</div>
                <div className="text-gray-400 text-xs">Администратор</div>
                <Separator className="bg-gray-700 my-1" />
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs w-full">
                  <Icon name="LogOut" size={12} />
                  Выйти
                </button>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
