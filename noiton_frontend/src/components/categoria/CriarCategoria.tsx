import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Categoria from '@/models/Categoria';
import { IP_CELULAR, IP_WIFI } from '@env'; // Importa a variável do .env
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/routes/Route'; // Certifique-se que o caminho está correto
import { useAuth } from '@/context/ApiContext';

export default function CriaCategoria() {
  const [nome, setNome] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // ADICIONADO
  const { token, isAuthenticated, logout } = useAuth();

  const handleCreateCategory = async () => {
    if (!isAuthenticated || !token) {
      console.warn('Token ausente ou usuário não autenticado. Não será feita a requisição.');
      return;
    }
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }

    const novaCategoria: Omit<Categoria, 'id_categoria'> = {
      nome,
    };

    try {
      console.log('Enviando token no header (criar):', token);
      const response = await fetch(
        `${IP_CELULAR}/api/categoria`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(novaCategoria),
        }
      );

      if (response.status === 401) {
        console.error('Erro 401 ao criar categoria (token inválido ou expirado)');
        return;
      }

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
      setNome('');
      navigation.navigate('CriaTarefa');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.label}>Criar Categoria</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome da categoria"
            value={nome}
            onChangeText={setNome}
          />
          <Button title="Criar Categoria" onPress={handleCreateCategory} color="#8B4513" /> {/* Botão marrom */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#8B4513',
  },
  input: {
    height: 40,
    borderColor: '#8B4513',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#8B4513',
    width: '100%',
    minWidth: 0,
  },
});
