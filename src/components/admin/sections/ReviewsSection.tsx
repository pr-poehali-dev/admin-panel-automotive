import { useState, useEffect, useMemo } from 'react';
import { Review, reviewsService } from '@/services/mockService';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const statusMap: Record<Review['status'], { label: string; class: string; color: string }> = {
  published: { label: 'Опубликован', class: 'bg-green-100 text-green-700', color: 'bg-green-500' },
  hidden: { label: 'Скрыт', class: 'bg-red-100 text-red-600', color: 'bg-red-500' },
  pending: { label: 'Ожидает', class: 'bg-amber-100 text-amber-700', color: 'bg-amber-500' },
};

const emptyReview: Omit<Review, 'id'> = {
  clientId: '', clientName: '', orderId: '', rating: 5,
  text: '', date: new Date().toISOString().split('T')[0],
  status: 'pending', reply: null,
};

const initials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('');

export default function ReviewsSection() {
  const [items, setItems] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [viewTarget, setViewTarget] = useState<Review | null>(null);
  const [form, setForm] = useState<Omit<Review, 'id'>>(emptyReview);
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await reviewsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(r =>
    r.clientName.toLowerCase().includes(search.toLowerCase()) ||
    r.text.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyReview); setModalOpen(true); };
  const openEdit = (r: Review) => { setEditTarget(r); setForm({ ...r }); setModalOpen(true); };
  const openView = (r: Review) => setViewTarget(r);
  const editFromView = () => {
    if (viewTarget) {
      const r = viewTarget;
      setViewTarget(null);
      setTimeout(() => openEdit(r), 100);
    }
  };

  const handleSave = async () => {
    if (editTarget) {
      await reviewsService.update(editTarget.id, form);
      toast({ title: 'Отзыв обновлён' });
    } else {
      await reviewsService.create(form);
      toast({ title: 'Отзыв добавлен' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await reviewsService.delete(deleteId);
    toast({ title: 'Отзыв удалён', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const avgRating = items.length ? items.reduce((a, r) => a + r.rating, 0) / items.length : 0;

  const setF = (k: keyof Omit<Review, 'id'>, v: string | number | null) =>
    setForm(f => ({ ...f, [k]: v }));

  // Аналитика
  const analytics = useMemo(() => {
    const total = items.length || 1;
    // Распределение оценок 5..1
    const ratings = [5, 4, 3, 2, 1].map(r => ({
      stars: r,
      count: items.filter(x => x.rating === r).length,
      percent: Math.round((items.filter(x => x.rating === r).length / total) * 100),
    }));

    // Без ответа
    const noReply = items.filter(r => !r.reply);

    // Динамика 6 месяцев
    const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const now = new Date();
    const dynamics: { month: string; count: number; percent: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = items.filter(r => {
        const rd = new Date(r.date);
        return rd >= d && rd < next;
      }).length;
      dynamics.push({ month: monthsRu[d.getMonth()], count, percent: 0 });
    }
    const maxDyn = Math.max(...dynamics.map(d => d.count), 1);
    dynamics.forEach(d => { d.percent = (d.count / maxDyn) * 100; });

    // Статусы
    const statuses = (['published', 'pending', 'hidden'] as const).map(s => ({
      key: s,
      count: items.filter(r => r.status === s).length,
    }));

    // Лучшие/худшие (последние)
    const best = [...items].filter(r => r.rating >= 4)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const worst = [...items].filter(r => r.rating <= 2)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

    return { ratings, noReply, dynamics, statuses, best, worst };
  }, [items]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по клиенту или тексту отзыва..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
            <Icon name="Plus" size={16} />
            Добавить отзыв
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Всего отзывов', value: items.length, icon: 'MessageSquare', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Опубликованных', value: items.filter(r => r.status === 'published').length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Ожидают модерации', value: items.filter(r => r.status === 'pending').length, icon: 'Clock', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Средняя оценка', value: avgRating.toFixed(1), icon: 'Star', color: 'text-purple-600', bg: 'bg-purple-50' },
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

        {/* Распределение оценок + Средний рейтинг + Без ответа */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-1">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Распределение оценок</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По звёздам</p>
              </div>
              <Icon name="BarChart3" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-2.5">
              {analytics.ratings.map(r => (
                <div key={r.stars} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold font-golos w-4">{r.stars}</span>
                      <Icon name="Star" size={11} className="text-amber-400 fill-amber-400" />
                    </div>
                    <span className="text-xs font-bold font-golos text-gray-700">{r.count} · {r.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${r.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-2 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Средний рейтинг</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">По всем отзывам</p>
              </div>
              <Icon name="Award" size={16} className="text-amber-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <p className="text-5xl font-bold font-golos text-amber-700">{avgRating.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 mt-3">
                {[1, 2, 3, 4, 5].map(s => {
                  const filled = avgRating >= s;
                  const half = avgRating >= s - 0.5 && avgRating < s;
                  return (
                    <Icon
                      key={s}
                      name={half ? 'StarHalf' : 'Star'}
                      size={22}
                      className={filled || half ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground font-inter mt-3">{items.length} отзывов учтено</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-3 border-l-4 border-l-orange-400">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon name="MessageCircleWarning" size={18} className="text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-golos">Без ответа</CardTitle>
                  <p className="text-xs text-muted-foreground font-inter">{analytics.noReply.length} отзывов ждут</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-700">!</Badge>
            </CardHeader>
            <CardContent>
              {analytics.noReply.length === 0 ? (
                <div className="py-4 text-center">
                  <Icon name="CheckCircle2" size={24} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-emerald-700 font-medium font-inter">Все отзывы отвечены</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.noReply.slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/40 hover:bg-orange-50 transition-colors cursor-pointer" onClick={() => openView(r)}>
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-grad-primary text-white text-[9px] font-bold">{initials(r.clientName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-golos truncate">{r.clientName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Icon key={s} name="Star" size={9} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Динамика + Статусы + Лучшие/Худшие */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-4">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Динамика отзывов</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">За 6 месяцев</p>
              </div>
              <Icon name="LineChart" size={16} className="text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32 pt-2">
                {analytics.dynamics.map((d, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full flex flex-col items-center justify-end" style={{ height: '90px' }}>
                          <div
                            className="w-full bg-grad-primary rounded-t-md group-hover:opacity-80 transition-all"
                            style={{ height: `${Math.max(d.percent, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-inter text-muted-foreground">{d.month}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-semibold">{d.month}: {d.count} отзывов</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-5">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Статусы отзывов</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Модерация</p>
              </div>
              <Icon name="ShieldCheck" size={16} className="text-violet-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center py-2">
              {(() => {
                const total = items.length || 1;
                const pubPct = (analytics.statuses[0].count / total) * 100;
                const r = 54;
                const c = 2 * Math.PI * r;
                const offset = c - (pubPct / 100) * c;
                return (
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle
                        cx="64" cy="64" r={r}
                        stroke="#10b981" strokeWidth="12" fill="none"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold font-golos">{Math.round(pubPct)}%</p>
                      <p className="text-[10px] text-muted-foreground font-inter">опубл.</p>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-3 gap-2 w-full mt-3">
                {analytics.statuses.map(st => {
                  const cfg = statusMap[st.key];
                  return (
                    <div key={st.key} className="text-center p-1.5 rounded-lg bg-muted/30">
                      <div className={`w-2 h-2 rounded-full ${cfg.color} mx-auto mb-1`} />
                      <p className="text-sm font-bold font-golos">{st.count}</p>
                      <p className="text-[9px] text-muted-foreground font-inter">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card hover-lift animate-slide-up stagger-6">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-golos">Позитивные / Негативные</CardTitle>
                <p className="text-xs text-muted-foreground font-inter">Последние</p>
              </div>
              <Icon name="ThumbsUp" size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide font-inter mb-1">Лучшие (4-5★)</p>
                {analytics.best.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-inter py-1">Нет данных</p>
                ) : (
                  <div className="space-y-1">
                    {analytics.best.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer" onClick={() => openView(r)}>
                        <Icon name="ThumbsUp" size={11} className="text-emerald-500" />
                        <span className="text-xs font-medium font-golos truncate flex-1">{r.clientName}</span>
                        <span className="text-xs font-bold text-emerald-700 font-golos">{r.rating}★</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide font-inter mb-1">Худшие (1-2★)</p>
                {analytics.worst.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-inter py-1">Нет негативных</p>
                ) : (
                  <div className="space-y-1">
                    {analytics.worst.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-red-50/50 hover:bg-red-50 cursor-pointer" onClick={() => openView(r)}>
                        <Icon name="ThumbsDown" size={11} className="text-red-500" />
                        <span className="text-xs font-medium font-golos truncate flex-1">{r.clientName}</span>
                        <span className="text-xs font-bold text-red-700 font-golos">{r.rating}★</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(review => {
              const st = statusMap[review.status];
              return (
                <Card key={review.id} className="border-0 shadow-card hover-lift group cursor-pointer" onClick={() => openView(review)}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-grad-primary text-white font-bold text-xs">{initials(review.clientName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 font-golos text-sm">{review.clientName}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Icon
                                    key={star}
                                    name="Star"
                                    size={12}
                                    className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground font-inter">{review.date}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 rounded-full ${st.class}`}>{st.label}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openView(review)}>
                                  <Icon name="Eye" size={12} className="text-emerald-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Просмотр</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(review)}>
                                  <Icon name="Pencil" size={12} className="text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Редактировать</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(review.id)}>
                                  <Icon name="Trash2" size={12} className="text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Удалить</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <p className="text-sm font-inter text-gray-700 mt-2 leading-relaxed">{review.text}</p>

                        {review.reply && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-300">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon name="Reply" size={12} className="text-blue-600" />
                              <span className="text-xs font-semibold font-golos text-blue-700">Ответ менеджера</span>
                            </div>
                            <p className="text-xs font-inter text-blue-800">{review.reply}</p>
                          </div>
                        )}

                        {review.orderId && (
                          <div className="mt-2 text-xs text-muted-foreground font-inter flex items-center gap-1">
                            <Icon name="ClipboardList" size={11} />
                            Заказ-наряд: #{review.orderId}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-inter">
                Отзывы не найдены
              </div>
            )}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewTarget} onOpenChange={open => !open && setViewTarget(null)}>
          <DialogContent className="max-w-2xl">
            {viewTarget && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-grad-primary flex items-center justify-center shadow-md flex-shrink-0">
                      <Icon name="MessageSquare" size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-golos text-xl">{viewTarget.clientName}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${statusMap[viewTarget.status].class}`}>{statusMap[viewTarget.status].label}</Badge>
                        <span className="text-xs text-muted-foreground font-inter">{new Date(viewTarget.date).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-3">
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Оценка</h4>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center gap-4">
                        <p className="text-5xl font-bold font-golos text-amber-700">{viewTarget.rating}.0</p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Icon
                                key={s}
                                name="Star"
                                size={20}
                                className={s <= viewTarget.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground font-inter">из 5 возможных</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Текст отзыва</h4>
                      <div className="p-4 rounded-xl bg-muted/30 text-sm font-inter text-gray-700 leading-relaxed min-h-[80px]">
                        {viewTarget.text || 'Текст отзыва не указан'}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Информация</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Icon name="User" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Клиент</p>
                            <p className="text-sm font-medium font-golos truncate">{viewTarget.clientName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon name="ClipboardList" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Заказ-наряд</p>
                            <p className="text-sm font-medium font-mono font-golos">#{viewTarget.orderId || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 col-span-2">
                          <Icon name="Calendar" size={14} className="text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-inter">Дата отзыва</p>
                            <p className="text-sm font-medium font-golos">{new Date(viewTarget.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-inter mb-2">Ответ менеджера</h4>
                      {viewTarget.reply ? (
                        <div className="p-3 bg-blue-50 rounded-xl border-l-2 border-blue-300">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon name="Reply" size={12} className="text-blue-600" />
                            <span className="text-xs font-semibold font-golos text-blue-700">Ответ</span>
                          </div>
                          <p className="text-sm font-inter text-blue-800 leading-relaxed">{viewTarget.reply}</p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-center">
                          <Icon name="MessageCircleWarning" size={20} className="text-orange-500 mx-auto mb-1" />
                          <p className="text-xs text-orange-700 font-medium font-inter mb-2">Ответ ещё не добавлен</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1"
                            onClick={() => toast({ title: 'Откройте редактирование', description: 'Добавьте ответ через диалог редактирования' })}
                          >
                            <Icon name="Plus" size={11} />
                            Добавить ответ
                          </Button>
                        </div>
                      )}
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
              <DialogTitle className="font-golos">{editTarget ? 'Редактировать отзыв' : 'Добавить отзыв'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">ФИО клиента</Label>
                <Input value={form.clientName} onChange={e => setF('clientName', e.target.value)} placeholder="Иванов Алексей Петрович" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">ID заказ-наряда</Label>
                <Input value={form.orderId} onChange={e => setF('orderId', e.target.value)} placeholder="1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Оценка (1-5)</Label>
                <Select value={String(form.rating)} onValueChange={v => setF('rating', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} звезда{n === 1 ? '' : n < 5 ? 'ы' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Дата</Label>
                <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-inter">Статус</Label>
                <Select value={form.status} onValueChange={v => setF('status', v as Review['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Опубликован</SelectItem>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="hidden">Скрыт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Текст отзыва</Label>
                <Textarea value={form.text} onChange={e => setF('text', e.target.value)} placeholder="Текст отзыва клиента" rows={3} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-inter">Ответ менеджера</Label>
                <Textarea value={form.reply ?? ''} onChange={e => setF('reply', e.target.value || null)} placeholder="Оставьте ответ клиенту..." rows={2} />
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
              <AlertDialogTitle className="font-golos">Удалить отзыв?</AlertDialogTitle>
              <AlertDialogDescription className="font-inter">Это действие необратимо. Отзыв будет удалён из системы.</AlertDialogDescription>
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
