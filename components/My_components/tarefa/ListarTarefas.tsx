import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Tarefa } from '@/models/Tarefa';

export default function ListarTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(1); // Tab inicial: Trabalho

  useEffect(() => {
    const fetchTarefas = async () => {
      try {
        const response = await fetch(
          'http://192.168.247.119:4000/api/tarefa/list', // Rota com IP celular
          // 'http://192.168.15.12:4000/api/tarefa/list', // Rota com IP WiFi
        );
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
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `http://192.168.247.119:4000/api/tarefa/${id}`, // Rota com IP celular
        // `http://192.168.15.12:4000/api/tarefa/${id}`, // Rota com IP WiFi
        {
          method: 'DELETE',
        }
      );

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
            <Text style={styles.itemText}>Data Início: {item.data_inicio}</Text>
            <Text style={styles.itemText}>Data Fim: {item.data_fim || 'Sem prazo'}</Text>
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
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000', // Texto preto
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    padding: 10,
    backgroundColor: '#d3d3d3', // Fundo cinza claro
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#8B4513', // Fundo marrom para a aba ativa
  },
  tabText: {
    color: '#000', // Texto preto
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff', // Texto branco para a aba ativa
  },
  itemContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderWidth: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#000', // Texto preto
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: 'red', // Fundo vermelho
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
    color: '#000', // Texto preto
    marginTop: 20,
    fontSize: 16,
  },
});



