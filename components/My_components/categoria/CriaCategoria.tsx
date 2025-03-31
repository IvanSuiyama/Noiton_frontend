import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Categoria from '@/models/Categoria';

export default function CriaCategoria() {
  const [nome, setNome] = useState('');

  const handleCreateCategory = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }

    const novaCategoria: Omit<Categoria, 'id_categoria'> = {
      nome,
    };

    try {
      const response = await fetch(
        'http://192.168.247.119:4000/api/categoria', // Rota com IP celular
        // 'http://192.168.15.12:4000/api/categoria', // Rota com IP WiFi
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novaCategoria),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
      setNome('');
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
          <Button title="Criar Categoria" onPress={handleCreateCategory} />
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
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000', // Texto preto
  },
  input: {
    height: 40,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
    color: '#000', // Texto preto
  },
});
