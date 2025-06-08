import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/ApiContext';
import { useLanguage } from '@/context/LanguageContext';
import { IP_CELULAR } from '@env';

import type { Notificacao } from '@/models/Notificacao';
import { Tarefa } from '@/models/Tarefa';

export default function ListarNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tarefasMap, setTarefasMap] = useState<{ [id: number]: string }>({});
  const { token, isAuthenticated } = useAuth();
  const { isEnglish } = useLanguage();

  const t = isEnglish
    ? {
        titulo: 'Notifications',
        nenhuma: 'No notifications found.',
        erro: 'Error',
      }
    : {
        titulo: 'Notificações',
        nenhuma: 'Nenhuma notificação encontrada.',
        erro: 'Erro',
      };

  useEffect(() => {
    const fetchNotificacoes = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const response = await fetch(`${IP_CELULAR}/api/notificacoes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(t.erro + ' ao buscar notificações');
        const data = await response.json();
        setNotificacoes(data);
      } catch (error) {
        Alert.alert(t.erro, error instanceof Error ? error.message : t.erro);
      } finally {
        setLoading(false);
      }
    };
    fetchNotificacoes();
  }, [isAuthenticated, token, isEnglish]);

  // Busca nomes das tarefas para as notificações
  useEffect(() => {
    async function fetchTarefasNomes() {
      if (!isAuthenticated || !token || notificacoes.length === 0) return;
      const ids = notificacoes.map(n => n.id_tarefa);
      const nomes: { [id: number]: string } = {};
      for (const id of ids) {
        if (tarefasMap[id]) continue;
        try {
          const resp = await fetch(`${IP_CELULAR}/api/tarefa/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (resp.ok) {
            const tarefa: Tarefa = await resp.json();
            nomes[id] = tarefa.titulo;
          }
        } catch {}
      }
      setTarefasMap(prev => ({ ...prev, ...nomes }));
    }
    fetchTarefasNomes();
  }, [notificacoes, isAuthenticated, token]);

  const renderItem = ({ item }: { item: Notificacao }) => {
    const nomeTarefa = tarefasMap[item.id_tarefa] || `ID: ${item.id_tarefa}`;
    const dataFormatada = (() => {
      const d = new Date(item.data);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();
      return `${dia}-${mes}-${ano}`;
    })();
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{`Tarefa: ${nomeTarefa}`}</Text>
        <Text style={styles.data}>{dataFormatada}</Text>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#8B4513" style={{ flex: 1, marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{t.titulo}</Text>
      {notificacoes.length === 0 ? (
        <Text style={styles.emptyText}>{t.nenhuma}</Text>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderColor: '#8B4513',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 6,
  },
  data: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8B4513',
    fontSize: 16,
    marginTop: 16,
  },
});
