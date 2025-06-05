import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Categoria from '@/models/Categoria';
import { IP_WIFI, IP_CELULAR } from '@env'; // Importa a variável do .env
import { useAuth } from '@/context/ApiContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';

export default function ListarCategoria() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const { token, isAuthenticated, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.warn('Token ausente ou usuário não autenticado. Não será feita a requisição.');
      return;
    }
    const fetchCategorias = async () => {
      try {
        console.log('Enviando token no header:', token);
        const response = await fetch(`${IP_WIFI}/api/categorialist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          console.error('Erro 401 ao buscar categorias (token inválido ou expirado)');
          return;
        }
        if (!response.ok) {
          throw new Error('Erro ao buscar categorias');
        }
        const data: Categoria[] = await response.json();
        setCategorias(data);
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    fetchCategorias();
  }, [isAuthenticated, token]);

  const handleDelete = async (id: number) => {
    if (!token) {
      console.warn('Token ausente. Não será feita a requisição de exclusão.');
      return;
    }
    try {
      console.log('Enviando token no header (delete):', token);
      const response = await fetch(
        `${IP_CELULAR}/api/categoria/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        console.error('Erro 401 ao deletar categoria (token inválido ou expirado)');
        return;
      }

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
      setCategorias((prev) => prev.filter((categoria) => categoria.id_categoria !== id));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Lista de Categorias</Text>
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id_categoria.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>ID: {item.id_categoria}</Text>
            <Text style={styles.itemText}>Nome: {item.nome}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id_categoria)}
              >
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    maxWidth: 600,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8B4513', // Texto marrom escuro
  },
  itemContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderColor: '#8B4513',
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
});
