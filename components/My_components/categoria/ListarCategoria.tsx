import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Categoria from '@/models/Categoria';

export default function ListarCategoria() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch(
          'http://192.168.247.119:4000/api/categorialist', // Rota com IP celular
          // 'http://192.168.15.12:4000/api/categorialist', // Rota com IP WiFi
        );
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
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `http://192.168.247.119:4000/api/categoria/${id}`, // Rota com IP celular
        // `http://192.168.15.12:4000/api/categoria/${id}`, // Rota com IP WiFi
        {
          method: 'DELETE',
        }
      );

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
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000', // Texto preto
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
});
