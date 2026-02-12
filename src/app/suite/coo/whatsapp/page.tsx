
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

import KanbanBoard from './components/KanbanBoard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CsoWhatsappPage() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex h-full bg-black text-white">
        <main className="flex-1 flex items-center justify-center">
          <p>Cargando...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full bg-black text-white">
        <main className="flex-1 flex items-center justify-center">
          <p>Error: {error.message}</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full bg-black text-white">
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-xl mb-4">Acceso denegado</h2>
          <p className="mb-6">Por favor, inicia sesión para ver el tablero Kanban.</p>
          <Link href="/login" passHref>
            <Button>Ir a la página de inicio de sesión</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-black text-white">
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
