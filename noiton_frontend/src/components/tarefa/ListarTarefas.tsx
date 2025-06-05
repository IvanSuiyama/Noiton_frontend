import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Tarefa } from '../../models/Tarefa';
import { IP_WIFI, IP_CELULAR } from '@env';
import { useAuth } from '@/context/ApiContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';

export default function ListarTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(1); // Tab inicial: Trabalho
  const { token, isAuthenticated, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.warn('Token ausente ou usuário não autenticado. Não será feita a requisição.');
      return;
    }
    const fetchTarefas = async () => {
      try {
        console.log('Enviando token no header:', token);
        const response = await fetch(`${IP_CELULAR}/api/tarefa/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          console.error('Erro 401 ao buscar tarefas (token inválido ou expirado)');
          return;
        }
        if (!response.ok) {
          throw new Error('Erro ao buscar tarefas');
        }
        const data: Tarefa[] = await response.json();
        setTarefas(data);
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    fetchTarefas();
  }, [isAuthenticated, token]);

  const handleDelete = async (id: number) => {
    if (!token) {
      console.warn('Token ausente. Não será feita a requisição de exclusão.');
      return;
    }
    try {
      console.log('Enviando token no header (delete):', token);
      const response = await fetch(`${IP_CELULAR}/api/tarefa/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error('Erro 401 ao deletar tarefa (token inválido ou expirado)');
        return;
      }

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Tarefa excluída com sucesso!');
      setTarefas((prev) => prev.filter((tarefa) => tarefa.id_tarefa !== id));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem prazo';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  const filteredTarefas = tarefas.filter((tarefa) => tarefa.id_categoria === selectedTab);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Lista de Tarefas</Text>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 1 && styles.activeTab]}
          onPress={() => setSelectedTab(1)}
        >
          <Text style={[styles.tabText, selectedTab === 1 && styles.activeTabText]}>Trabalho</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 2 && styles.activeTab]}
          onPress={() => setSelectedTab(2)}
        >
          <Text style={[styles.tabText, selectedTab === 2 && styles.activeTabText]}>Estudo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 3 && styles.activeTab]}
          onPress={() => setSelectedTab(3)}
        >
          <Text style={[styles.tabText, selectedTab === 3 && styles.activeTabText]}>Pessoal</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tarefas */}
      <FlatList
        data={filteredTarefas}
        keyExtractor={(item) => item.id_tarefa.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>ID: {item.id_tarefa}</Text>
            <Text style={styles.itemText}>Título: {item.titulo}</Text>
            <Text style={styles.itemText}>Conteúdo: {item.conteudo}</Text>
            <Text style={styles.itemText}>Data Início: {formatDate(item.data_inicio as string)}</Text>
            <Text style={styles.itemText}>Data Fim: {formatDate(item.data_fim as string | null)}</Text>
            <Text style={styles.itemText}>Status: {item.status}</Text>
            <Text style={styles.itemText}>Prioridade: {item.prioridade}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id_tarefa)}
              >
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8B4513', // Texto marrom escuro
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
    minWidth: 0,
  },
  tab: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5dc', // Fundo bege claro
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#8B4513', // Borda marrom
    minWidth: 0,
  },
  activeTab: {
    backgroundColor: '#8B4513', // Fundo marrom para a aba ativa
  },
  tabText: {
    color: '#8B4513', // Texto marrom escuro
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff', // Texto branco para a aba ativa
  },
  itemContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff', // Fundo branco
    borderColor: '#8B4513', // Borda marrom
    borderWidth: 1,
    width: '100%',
    minWidth: 0,
  },
  itemText: {
    fontSize: 14,
    color: '#8B4513', // Texto marrom escuro
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: '#8B4513', // Fundo marrom
    padding: 10,
    borderRadius: 5, // Bordas arredondadas
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff', // Texto branco
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8B4513', // Texto marrom escuro
    marginTop: 20,
    fontSize: 16,
  },
});



