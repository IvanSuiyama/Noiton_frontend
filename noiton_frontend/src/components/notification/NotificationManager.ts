import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { IP_CELULAR } from '@env';
import { useEffect, useRef, useState } from 'react';
import { Tarefa } from '@/models/Tarefa';
import type { Notificacao } from '@/models/Notificacao';

// Hook para criar notificação usando o contexto correto
export function useCriarNotificacao() {
  const { token, isAuthenticated } = useAuth();
  const { userCpf, userNome } = useUserContext();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserEmail() {
      if (!userCpf || !token) return;
      try {
        const resp = await fetch(`${IP_CELULAR}/api/usuario/${userCpf}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const usuario = await resp.json();
          setUserEmail(usuario.email || null);
        }
      } catch {}
    }
    fetchUserEmail();
  }, [userCpf, token]);

  async function criarNotificacao({ id_tarefa, mensagem }: { id_tarefa: number, mensagem: string }) {
    try {
      if (!isAuthenticated || !token || !userCpf) throw new Error('Usuário não autenticado');
      // Busca email atualizado se não tiver
      let email = userEmail;
      if (!email) {
        const resp = await fetch(`${IP_CELULAR}/api/usuario/${userCpf}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const usuario = await resp.json();
          email = usuario.email || null;
        }
      }
      const response = await fetch(`${IP_CELULAR}/api/notificacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_tarefa, mensagem, cpf: userCpf, email }),
      });
      if (!response.ok) throw new Error('Erro ao criar notificação');
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  return criarNotificacao;
}

// Função para monitorar tarefas com data_fim igual a amanhã
export function useMonitorarTarefasAmanha(callback: (tarefas: Tarefa[]) => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token, isAuthenticated } = useAuth();
  const { userCpf } = useUserContext();

  useEffect(() => {
    async function verificarTarefasAmanha() {
      if (!isAuthenticated || !token || !userCpf) return;
      try {
        // Calcula a data de amanhã no formato ISO (apenas data)
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        const amanhaISO = amanha.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        // Busca tarefas com data_fim igual a amanhã
        const url = `${IP_CELULAR}/api/tarefa/list?prazoFinal=${amanhaISO}&cpf=${userCpf}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data: Tarefa[] = await response.json();
        // Filtra tarefas que realmente têm data_fim igual a amanhã
        const tarefasAmanha = data.filter(t => {
          if (!t.data_fim) return false;
          if (typeof t.data_fim === 'string') {
            return t.data_fim.startsWith(amanhaISO);
          } else if (t.data_fim instanceof Date) {
            return t.data_fim.toISOString().slice(0, 10) === amanhaISO;
          }
          return false;
        });
        if (tarefasAmanha.length > 0) {
          callback(tarefasAmanha);
        }
      } catch (error) {
        console.error('Erro ao monitorar tarefas para amanhã:', error);
      }
    }
    // Executa imediatamente e depois a cada 1 minuto
    verificarTarefasAmanha();
    intervalRef.current = setInterval(verificarTarefasAmanha, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, isAuthenticated, userCpf, callback]);
}

// Monitoramento detalhado para criar notificações para tarefas próximas do vencimento
export function useMonitorarTarefasVencimentoDetalhado() {
  const { token, isAuthenticated } = useAuth();
  const { userCpf } = useUserContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function monitorar() {
      if (!isAuthenticated || !token || !userCpf) return;
      try {
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        const amanhaISO = amanha.toISOString().slice(0, 10);
        // Busca tarefas do usuário
        const urlTarefas = `${IP_CELULAR}/api/tarefa/list?cpf=${userCpf}`;
        const respTarefas = await fetch(urlTarefas, { headers: { Authorization: `Bearer ${token}` } });
        if (!respTarefas.ok) { console.log('Erro ao buscar tarefas'); return; }
        const tarefas: Tarefa[] = await respTarefas.json();
        // Busca notificações existentes
        const urlNotificacoes = `${IP_CELULAR}/api/notificacoes?cpf=${userCpf}`;
        const respNotif = await fetch(urlNotificacoes, { headers: { Authorization: `Bearer ${token}` } });
        const notificacoes: Notificacao[] = respNotif.ok ? await respNotif.json() : [];
        for (const tarefa of tarefas) {
          if (!tarefa.data_fim) {
            console.log(`Tarefa (${tarefa.titulo}) sem data, ignorando...`);
            continue;
          }
          const dataFim = typeof tarefa.data_fim === 'string' ? tarefa.data_fim.slice(0, 10) : new Date(tarefa.data_fim).toISOString().slice(0, 10);
          if (dataFim === amanhaISO) {
            // Verifica duplicidade
            const jaNotificada = notificacoes.some(n => n.id_tarefa === tarefa.id_tarefa && n.mensagem.includes('vencimento'));
            if (jaNotificada) {
              console.log(`Tarefa (${tarefa.titulo}) data próxima, porém já possui notificação, não criar duplicata.`);
              continue;
            }
            console.log(`Tarefa (${tarefa.titulo}) data próxima, criando notificação...`);
            try {
              // Buscar email do usuário
              let email: string | null = null;
              try {
                const resp = await fetch(`${IP_CELULAR}/api/usuario/${userCpf}`, { headers: { Authorization: `Bearer ${token}` } });
                if (resp.ok) {
                  const usuario = await resp.json();
                  email = usuario.email || null;
                }
              } catch {}
              const response = await fetch(`${IP_CELULAR}/api/notificacoes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id_tarefa: tarefa.id_tarefa, mensagem: `Tarefa "${tarefa.titulo}" próxima do vencimento!`, cpf: userCpf, email }),
              });
              if (!response.ok) throw new Error('Erro ao criar notificação');
              console.log(`Notificação criada para tarefa (${tarefa.titulo})`);
            } catch (err) {
              console.log(`Notificação NÃO criada para tarefa (${tarefa.titulo}): ${err}`);
            }
          }
        }
      } catch (error) {
        console.log('Erro no monitoramento detalhado:', error);
      }
    }
    monitorar();
    intervalRef.current = setInterval(monitorar, 300000); // 5 minutos
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [token, isAuthenticated, userCpf]);
}

// Função utilitária para monitorar tarefas e criar notificações (NÃO usar hooks aqui)
export async function monitorarTarefasVencimentoDetalhadoNow(token?: string, userCpf?: string) {
  if (!token || !userCpf) return;
  try {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    const amanhaISO = amanha.toISOString().slice(0, 10);
    // Busca tarefas do usuário
    const urlTarefas = `${IP_CELULAR}/api/tarefa/list?cpf=${userCpf}`;
    const respTarefas = await fetch(urlTarefas, { headers: { Authorization: `Bearer ${token}` } });
    if (!respTarefas.ok) { console.log('Erro ao buscar tarefas'); return; }
    const tarefas: Tarefa[] = await respTarefas.json();
    // Busca notificações existentes
    const urlNotificacoes = `${IP_CELULAR}/api/notificacoes?cpf=${userCpf}`;
    const respNotif = await fetch(urlNotificacoes, { headers: { Authorization: `Bearer ${token}` } });
    const notificacoes: Notificacao[] = respNotif.ok ? await respNotif.json() : [];
    // Buscar email do usuário
    let email: string | null = null;
    try {
      const resp = await fetch(`${IP_CELULAR}/api/usuario/${userCpf}`, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.ok) {
        const usuario = await resp.json();
        email = usuario.email || null;
      }
    } catch {}
    for (const tarefa of tarefas) {
      if (!tarefa.data_fim) {
        console.log(`Tarefa (${tarefa.titulo}) sem data, ignorando...`);
        continue;
      }
      const dataFim = typeof tarefa.data_fim === 'string' ? tarefa.data_fim.slice(0, 10) : new Date(tarefa.data_fim).toISOString().slice(0, 10);
      if (dataFim === amanhaISO) {
        // Verifica duplicidade
        const jaNotificada = notificacoes.some(n => n.id_tarefa === tarefa.id_tarefa && n.mensagem.includes('vencimento'));
        if (jaNotificada) {
          console.log(`Tarefa (${tarefa.titulo}) data próxima, porém já possui notificação, não criar duplicata.`);
          continue;
        }
        console.log(`Tarefa (${tarefa.titulo}) data próxima, criando notificação...`);
        try {
          const response = await fetch(`${IP_CELULAR}/api/notificacoes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id_tarefa: tarefa.id_tarefa, mensagem: `Tarefa "${tarefa.titulo}" próxima do vencimento!`, cpf: userCpf, email }),
          });
          if (!response.ok) throw new Error('Erro ao criar notificação');
          console.log(`Notificação criada para tarefa (${tarefa.titulo})`);
        } catch (err) {
          console.log(`Notificação NÃO criada para tarefa (${tarefa.titulo}): ${err}`);
        }
      }
    }
  } catch (error) {
    console.log('Erro no monitoramento detalhado:', error);
  }
}
