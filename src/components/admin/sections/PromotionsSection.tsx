import { useState, useEffect } from 'react';
import { Promotion, promotionsService } from '@/services/mockService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const typeMap: Record<Promotion['type'], { label: string; icon: string; bg: string; color: string }> = {
  discount: { label: 'Скидка %',  icon: 'Percent',     bg: 'bg-blue-500',   color: 'text-white' },
  gift:     { label: 'Подарок',   icon: 'Gift',         bg: 'bg-purple-500', color: 'text-white' },
  cashback: { label: 'Кэшбэк',   icon: 'RefreshCcw',   bg: 'bg-green-500',  color: 'text-white' },
  bonus:    { label: 'Бонус',     icon: 'Zap',          bg: 'bg-amber-500',  color: 'text-white' },
};

const emptyPromotion: Omit<Promotion, 'id'> = {
  title: '', description: '', type: 'discount', value: 10,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true, usageCount: 0, maxUsage: 100, services: [],
};

export default function PromotionsSection() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState<Omit<Promotion, 'id'>>(emptyPromotion);
  const [servicesInput, setServicesInput] = useState('');
  const { toast } = useToast();

  const load = async () => { setLoading(true); setItems(await promotionsService.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditTarget(null); setForm(emptyPromotion); setServicesInput(''); setModalOpen(true); };
  const openEdit = (p: Promotion) => { setEditTarget(p); setForm({ ...p }); setServicesInput(p.services.join(', ')); setModalOpen(true); };

  const handleSave = async () => {
    const finalForm = { ...form, services: servicesInput.split(',').map(s => s.trim()).filter(Boolean) };
    if (editTarget) {
      await promotionsService.update(editTarget.id, finalForm);
      toast({ title: 'Акция обновлена' });
    } else {
      await promotionsService.create(finalForm);
      toast({ title: 'Акция добавлена' });
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await promotionsService.delete(deleteId);
    toast({ title: 'Акция удалена', variant: 'destructive' });
    setDeleteId(null); load();
  };

  const setF = (k: keyof Omit<Promotion, 'id'>, v: string | number | boolean | string[]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleToggleActive = async (promo: Promotion) => {
    await promotionsService.update(promo.id, { isActive: !promo.isActive });
    toast({ title: promo.isActive ? 'Акция деактивирована' : 'Акция активирована' });
    load();
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по названию или описанию..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Button onClick={openCreate} className="bg-grad-primary hover:opacity-90 text-white shadow-glow gap-2 h-10">
          <Icon name="Plus" size={16} />
          Добавить акцию
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего акций', value: items.length, icon: 'Tag', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Активных', value: items.filter(p => p.isActive).length, icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Использований', value: items.reduce((a, p) => a + p.usageCount, 0), icon: 'Users', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Завершены', value: items.filter(p => !p.isActive).length, icon: 'Archive', color: 'text-gray-600', bg: 'bg-gray-50' },
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

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={32} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(promo => {
            const tp = typeMap[promo.type];
            const usagePct = promo.maxUsage > 0 ? Math.min(100, Math.round((promo.usageCount / promo.maxUsage) * 100)) : 0;
            return (
              <Card key={promo.id} className={`border-0 shadow-card hover-lift group ${!promo.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${tp.bg} flex items-center justify-center shadow-sm`}>
                        <Icon name={tp.icon} size={20} className={tp.color} />
                      </div>
                      <div>
                        <CardTitle className="font-golos text-sm">{promo.title}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{tp.label}</Badge>
                          <span className="text-xs font-bold text-gray-900 font-golos">{promo.value}{promo.type === 'discount' ? '%' : ' ₽'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={promo.isActive} onCheckedChange={() => handleToggleActive(promo)} />
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEdit(promo)}>
                          <Icon name="Pencil" size={12} className="text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setDeleteId(promo.id)}>
                          <Icon name="Trash2" size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground font-inter">{promo.description}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-inter">Использований: {promo.usageCount} / {promo.maxUsage}</span>
                      <span className="text-xs font-semibold font-golos">{usagePct}%</span>
                    </div>
                    <Progress value={usagePct} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-inter pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={11} />
                      {new Date(promo.startDate).toLocaleDateString('ru')}
                    </span>
                    <Icon name="ArrowRight" size={11} />
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={11} />
                      {new Date(promo.endDate).toLocaleDateString('ru')}
                    </span>
                  </div>

                  {promo.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {promo.services.slice(0, 2).map(s => (
                        <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 h-4">{s}</Badge>
                      ))}
                      {promo.services.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">+{promo.services.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground font-inter">
              Акции не найдены
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-golos">{editTarget ? 'Редактировать акцию' : 'Добавить акцию'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Название акции</Label>
              <Input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Сезонный шиномонтаж" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Тип</Label>
              <Select value={form.type} onValueChange={v => setF('type', v as Promotion['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Скидка %</SelectItem>
                  <SelectItem value="gift">Подарок</SelectItem>
                  <SelectItem value="cashback">Кэшбэк</SelectItem>
                  <SelectItem value="bonus">Бонус</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Значение (% или ₽)</Label>
              <Input type="number" value={form.value} onChange={e => setF('value', Number(e.target.value))} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата начала</Label>
              <Input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Дата окончания</Label>
              <Input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Макс. использований</Label>
              <Input type="number" value={form.maxUsage} onChange={e => setF('maxUsage', Number(e.target.value))} placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-inter">Использовано</Label>
              <Input type="number" value={form.usageCount} onChange={e => setF('usageCount', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Описание</Label>
              <Textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Описание акции" rows={2} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-inter">Услуги (через запятую)</Label>
              <Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Шиномонтаж, Балансировка" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setF('isActive', v)} />
              <Label className="text-sm font-inter">Акция активна</Label>
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
            <AlertDialogTitle className="font-golos">Удалить акцию?</AlertDialogTitle>
            <AlertDialogDescription className="font-inter">Это действие необратимо. Акция будет удалена из системы.</AlertDialogDescription>
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
