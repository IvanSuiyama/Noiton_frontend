import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { Tarefa } from '../../models/Tarefa';
import { IP_WIFI } from '@env';

export default function CriaTarefa() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isDataFimEnabled, setIsDataFimEnabled] = useState(false);
  const [prioridade, setPrioridade] = useState<string>('media'); // Prioridade padrão
  const [categoria, setCategoria] = useState<string>(''); // Campo de categoria

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
    const validValues = ['baixa', 'media', 'alta'];
    if (!validValues.includes(prioridade)) {
      Alert.alert('Erro', 'Prioridade inválida. Use: baixa, media ou alta.');
      return;
    }

    const categoriaMap: { [key: string]: number } = {
      Trabalho: 1,
      Estudo: 2,
      Pessoal: 3,
    };

    const id_categoria = categoriaMap[categoria];
    if (!id_categoria) {
      Alert.alert('Erro', 'Categoria inválida. Use: Trabalho, Estudo ou Pessoal.');
      return;
    }

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
      prioridade: prioridade as 'baixa' | 'media' | 'alta', // Cast after validation
      id_categoria, // Adiciona o id_categoria mapeado
    };

    try {
      const response = await fetch(`${IP_WIFI}/api/tarefa`, { // Usando IP_WIFI
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
      setPrioridade('media');
      setCategoria('');
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

          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={prioridade}
              onValueChange={(itemValue) => setPrioridade(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Alta" value="alta" />
              <Picker.Item label="Média" value="media" />
              <Picker.Item label="Baixa" value="baixa" />
            </Picker>
          </View>

          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a categoria (Trabalho, Estudo, Pessoal)"
            value={categoria}
            onChangeText={setCategoria}
          />

          <Button title="Criar Tarefa" onPress={handleCreateTask} />
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
  textArea: {
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
    textAlignVertical: 'top',
    color: '#000', // Texto preto
  },
  dataFimContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#000', // Texto preto
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
  },
  picker: {
    height: 40,
    color: '#000', // Texto preto
  },
});
