import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { IP_CELULAR } from '@env';
import { useLanguage } from '@/context/LanguageContext';

export default function RotinasScreen() {
  const { token } = useAuth();
  const { userCpf } = useUserContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rotinas, setRotinas] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isEnglish } = useLanguage();

  const t = isEnglish
    ? {
        title: 'Routines',
        nova: 'New Routine',
        dias: 'Days',
        tarefa: 'Base Task',
        dataFim: 'End Date',
        ativa: 'Active',
        excluir: 'Delete',
        nenhuma: 'No routines found.',
        confirmar: 'Are you sure you want to delete this routine?',
        sim: 'Yes',
        nao: 'No',
      }
    : {
        title: 'Rotinas',
        nova: 'Nova Rotina',
        dias: 'Dias',
        tarefa: 'Tarefa Base',
        dataFim: 'Data Fim',
        ativa: 'Ativa',
        excluir: 'Excluir',
        nenhuma: 'Nenhuma rotina encontrada.',
        confirmar: 'Deseja excluir esta rotina?',
        sim: 'Sim',
        nao: 'Não',
      };

  // Função para formatar data para dd/mm/aaaa
  const formatDateBr = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Busca tarefas para mostrar o nome da tarefa base
  useEffect(() => {
    if (!token) return;
    fetch(`${IP_CELULAR}/api/tarefa/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setTarefas(Array.isArray(data) ? data : []))
      .catch(() => setTarefas([]));
  }, [token]);

  const fetchRotinas = useCallback(async () => {
    if (!token || !userCpf) return;
    setLoading(true);
    try {
      const resp = await fetch(`${IP_CELULAR}/api/rotinas?cpf=${userCpf}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('Erro ao buscar rotinas');
      const data = await resp.json();
      // Filtra rotinas sem id válido e remove duplicadas por id_rotina
      const rotinasValidas = Array.isArray(data)
        ? data.filter((r, idx, arr) =>
            r.id_rotina != null &&
            arr.findIndex(x => x.id_rotina === r.id_rotina) === idx
          )
        : [];
      setRotinas(rotinasValidas);
    } catch (e) {
      setRotinas([]);
    } finally {
      setLoading(false);
    }
  }, [token, userCpf]);

  // Recarrega sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchRotinas();
    }, [fetchRotinas])
  );

  const handleDelete = (id: number) => {
    Alert.alert(
      t.excluir,
      t.confirmar,
      [
        { text: t.nao, style: 'cancel' },
        {
          text: t.sim,
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${IP_CELULAR}/api/rotinas/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchRotinas();
            } catch {}
          },
        },
      ]
    );
  };

  // Busca o nome da tarefa base pelo id
  const getTarefaBaseNome = (id_tarefa_base: number) => {
    const tarefa = tarefas.find((t: any) => t.id_tarefa === id_tarefa_base);
    return tarefa ? tarefa.titulo : `ID ${id_tarefa_base}`;
  };

  const Footer = () => (
    <View style={{ backgroundColor: '#8B4513', height: 38 }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      <View style={styles.container}>
        <Text style={styles.title}>{t.title}</Text>
        {/* <Button title={t.nova} color="#8B4513" onPress={() => navigation.navigate('CriaRotina')} /> */}
        <TouchableOpacity
          style={{
            backgroundColor: '#8B4513',
            borderRadius: 5,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 16,
          }}
          onPress={() => navigation.navigate('CriaRotina')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.nova}</Text>
        </TouchableOpacity>
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : rotinas.length === 0 ? (
          <Text style={styles.empty}>{t.nenhuma}</Text>
        ) : (
          <FlatList
            data={rotinas}
            keyExtractor={item =>
              item && item.id_rotina != null
                ? `rotina_${String(item.id_rotina)}`
                : `rotina_${Math.random().toString(36).slice(2)}`
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {t.tarefa}: {getTarefaBaseNome(item.id_tarefa_base)}
                </Text>
                <Text>{t.dias}: {item.dias_semana}</Text>
                <Text>{t.dataFim}: {formatDateBr(item.data_fim)}</Text>
                <Text>{t.ativa}: {item.ativa ? '✔️' : '❌'}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id_rotina)}>
                  <Text style={styles.deleteBtnText}>{t.excluir}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5dc', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#8B4513', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginVertical: 8, elevation: 2 },
  cardTitle: { fontWeight: 'bold', color: '#8B4513', fontSize: 16 },
  deleteBtn: { marginTop: 8, backgroundColor: '#8B4513', borderRadius: 4, padding: 8, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#8B4513', marginTop: 30 },
});
