import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { IP_WIFI } from '@env';

export default function CriaWorkspace() {
  const [nome, setNome] = useState('');

  const handleCreateWorkspace = async () => {
    if (!nome) {
      Alert.alert('Erro', 'O nome do workspace é obrigatório.');
      return;
    }

    try {
      const response = await fetch(`${IP_WIFI}/api/workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Workspace criado com sucesso!');
      setNome('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome do Workspace</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o nome do workspace"
        value={nome}
        onChangeText={setNome}
      />
      <Button title="Criar Workspace" onPress={handleCreateWorkspace} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  input: {
    height: 40,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#000',
  },
});
