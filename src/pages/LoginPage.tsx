import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const DEMO_LOGIN = 'admin@sto.ru';
const DEMO_PASS = 'admin123';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    if (email === DEMO_LOGIN && password === DEMO_PASS) {
      localStorage.setItem('ais_auth', 'true');
      toast({ title: 'Добро пожаловать!', description: 'Вход выполнен успешно' });
      navigate('/admin');
    } else {
      setError('Неверный email или пароль');
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setEmail(DEMO_LOGIN);
    setPassword(DEMO_PASS);
  };

  return (
    <div className="min-h-screen bg-grad-page flex items-center justify-center p-4 relative overflow-hidden">
      {/* Декоративные круги */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-500/20 to-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-brand-400/15 to-pink-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-300/10 to-orange-300/10 blur-2xl pointer-events-none" />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-grad-primary shadow-glow-lg mb-4 pulse-glow">
            <Icon name="Wrench" size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-golos">АИС СТО</h1>
          <p className="text-sm text-muted-foreground mt-1 font-inter">Автоматизированная информационная система</p>
          <p className="text-xs text-muted-foreground font-inter">Станция технического обслуживания</p>
        </div>

        <Card className="shadow-card-hover border-0 glass">
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Вход в систему</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@sto.ru"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-11 border-border/70 focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Пароль</Label>
                <div className="relative">
                  <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-border/70 focus:border-primary transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name={showPass ? 'EyeOff' : 'Eye'} size={16} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2 animate-slide-up">
                  <Icon name="AlertCircle" size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={v => setRemember(!!v)}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Запомнить меня</Label>
                </div>
                <button type="button" className="text-sm text-primary hover:underline font-medium">
                  Забыли пароль?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-grad-primary hover:opacity-90 transition-opacity text-white font-semibold shadow-glow"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="LogIn" size={16} />
                    Войти в систему
                  </span>
                )}
              </Button>
            </form>

            {/* Демо доступ */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-center text-xs text-muted-foreground mb-3">Демонстрационный доступ</p>
              <button
                onClick={fillDemo}
                className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors bg-primary/5 hover:bg-primary/10 rounded-lg py-2.5 px-4"
              >
                <Icon name="Zap" size={14} />
                Заполнить демо-данными
              </button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">admin@sto.ru</span>
                {' / '}
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">admin123</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-inter">
          © 2024 АИС СТО. Все права защищены.
        </p>
      </div>
    </div>
  );
}
