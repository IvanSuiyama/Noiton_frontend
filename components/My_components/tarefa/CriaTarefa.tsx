import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Switch } from 'react-native';
import { Tarefa } from '@/models/Tarefa';

export default function CriaTarefa() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isDataFimEnabled, setIsDataFimEnabled] = useState(false);

  const getHorarioBrasilia = () => {
    const now = new Date();
    const brasiliaOffset = -3; // Horário de Brasília (UTC-3)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000; // Convert local time to UTC
    const brasiliaTime = new Date(utcTime + brasiliaOffset * 60 * 60 * 1000);
    return brasiliaTime.toISOString().slice(0, 16).replace('T', ' ');
  };

  const formatDateInput = (input: string) => {
    const cleaned = input.replace(/\D/g, ''); // Remove non-numeric characters
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);

    if (!match) return input;

    const [, day, month, year] = match;
    let formatted = day;
    if (month) formatted += '/' + month;
    if (year) formatted += '/' + year;

    return formatted;
  };

  const handleDataFimChange = (input: string) => {
    const formatted = formatDateInput(input);
    setDataFim(formatted);
  };

  const handleCreateTask = async () => {
    const dataInicio = getHorarioBrasilia(); // Data e hora atual no horário de Brasília
    const status = 'pendente'; // Status padrão

    const formattedDataFim = isDataFimEnabled && dataFim
      ? `${dataFim.split('/').reverse().join('-')}T23:59:00-03:00` // Explicitly set timezone to UTC-3
      : null;

    const novaTarefa: Partial<Tarefa> = {
      titulo,
      conteudo,
      data_inicio: dataInicio,
      data_fim: formattedDataFim,
      status,
    };

    try {
      const response = await fetch('http://192.168.15.12:4000/api/tarefa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novaTarefa),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Tarefa criada com sucesso!');
      setTitulo('');
      setConteudo('');
      setDataFim(null);
      setIsDataFimEnabled(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o título da tarefa"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>Conteúdo</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Digite o conteúdo da tarefa"
        value={conteudo}
        onChangeText={setConteudo}
        multiline={true}
        numberOfLines={4}
      />

      <View style={styles.dataFimContainer}>
        <Switch
          value={isDataFimEnabled}
          onValueChange={setIsDataFimEnabled}
        />
        <Text style={styles.checkboxLabel}>
          {isDataFimEnabled ? 'Definir prazo' : 'Sem prazo'}
        </Text>
      </View>

      {isDataFimEnabled && (
        <>
          <Text style={styles.label}>Data de Fim</Text>
          <TextInput
            style={styles.input}
            placeholder="dd/mm/aaaa"
            value={dataFim || ''}
            onChangeText={handleDataFimChange}
            keyboardType="numeric"
          />
        </>
      )}

      <Button title="Criar Tarefa" onPress={handleCreateTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  dataFimContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#555',
  },
});
