'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Sesión iniciada correctamente');
      router.push('/suite');
    } catch (error: any) {
      toast.error('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada con Google');
      router.push('/suite');
    } catch (error: any) {
      toast.error('Error con Google: ' + error.message);
    }
  };

  const handleMicrosoftLogin = async () => {
    const provider = new OAuthProvider('microsoft.com');
    try {
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada con Microsoft');
      router.push('/cso/whatsapp');
    } catch (error: any) {
      toast.error('Error con Microsoft: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Left side - Brand/Logo */}
      <div className="flex-1 flex items-center justify-center p-12 bg-[#050505]">
        <div className="relative w-full max-w-[400px] aspect-square">
          <Image
            src="/assets/Logo Udreamms.png"
            alt="Udreamms Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12 border-l border-white/10">
        <div className="max-w-[400px] w-full mx-auto space-y-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-medium tracking-tighter mb-12">
              Es un gusto que trabajes con nosotros
            </h1>
            <h2 className="text-3xl font-medium mb-8 italic text-white/90">Acceso Staff</h2>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-medium text-base flex items-center justify-center gap-3 border-none"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-medium text-base flex items-center justify-center gap-3 border-none"
              onClick={handleMicrosoftLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h11v11H0z" />
                <path fill="#f3f3f3" d="M12 0h11v11H12z" />
                <path fill="#f3f3f3" d="M0 12h11v11H0z" />
                <path fill="#f3f3f3" d="M12 12h11v11H12z" />
              </svg>
              Continuar con Outlook
            </Button>

            <div className="flex items-center gap-2">
              <Separator className="flex-1 bg-white/20" />
              <span className="text-sm">o</span>
              <Separator className="flex-1 bg-white/20" />
            </div>

            <div className="space-y-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo institucional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@udreamms.com"
                    className="bg-black border-white/20 rounded-md h-12 focus:border-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-black border-white/20 rounded-md h-12 focus:border-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium text-base transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                </Button>
              </form>
            </div>

            <p className="text-[11px] text-gray-500 mt-4 leading-normal">
              Este es un sistema privado. Al ingresar, aceptas los <Link href="/terminos" className="text-blue-400 hover:underline">Términos de servicio</Link> y la <Link href="/privacidad" className="text-blue-400 hover:underline">Política de seguridad</Link>.
            </p>
          </div>

          <div className="pt-10">
            <Button
              variant="outline"
              className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-medium text-base border-none"
              onClick={() => toast.info('Contacta al administrador del sistema')}
            >
              ¿Necesitas ayuda?
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
