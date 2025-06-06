import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useAuth } from '@/context/ApiContext';
import { IP_WIFI, IP_CELULAR } from '@env';

type EditaTarefaRouteProp = {
  params: {
    id_tarefa: number;
  };
};

export default function EditaTarefa() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute() as EditaTarefaRouteProp;
  const { token, isAuthenticated } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isDataFimEnabled, setIsDataFimEnabled] = useState(false);
  const [prioridade, setPrioridade] = useState<string>('media');
  const [status, setStatus] = useState<string>('pendente');
  const [categorias, setCategorias] = useState<{ id_categoria: number; nome: string }[]>([]);
  const [categoria, setCategoria] = useState<number | null>(null);
  // Permitir múltiplas categorias
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([]);

  // Carrega dados da tarefa e categorias ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || !token) return;

      const fetchTarefa = async () => {
        try {
          if (!route?.params?.id_tarefa) {
            Alert.alert('Erro', 'ID da tarefa não informado.');
            return;
          }
          let response = await fetch(`${IP_CELULAR}/api/tarefa/${route.params.id_tarefa}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            response = await fetch(`${IP_WIFI}/api/tarefa/${route.params.id_tarefa}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro ao buscar tarefa:', errorText);
            throw new Error('Erro ao buscar tarefa');
          }
          let tarefa = await response.json();
          if (!tarefa || typeof tarefa !== 'object' || !('titulo' in tarefa)) {
            Alert.alert('Erro', 'Tarefa não encontrada ou resposta inválida.');
            return;
          }
          setTitulo(tarefa.titulo || '');
          setConteudo(tarefa.conteudo || '');
          setDataInicio(tarefa.data_inicio || '');
          setPrioridade(tarefa.prioridade || 'media');
          setStatus(tarefa.status || 'pendente');
          // Seleção múltipla de categorias
          setCategoriasSelecionadas(Array.isArray(tarefa.categorias) ? tarefa.categorias.map((cat: { id_categoria: number }) => cat.id_categoria) : []);
          if (tarefa.data_fim) {
            setIsDataFimEnabled(true);
            setDataFim(formatDateToInput(tarefa.data_fim));
          } else {
            setIsDataFimEnabled(false);
            setDataFim(null);
          }
        } catch (error) {
          console.error('Erro ao carregar tarefa:', error);
          Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao carregar tarefa');
        }
      };

      const fetchCategorias = async () => {
        try {
          let response = await fetch(`${IP_CELULAR}/api/categorialist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            response = await fetch(`${IP_WIFI}/api/categorialist`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          if (!response.ok) throw new Error('Erro ao buscar categorias');
          const data = await response.json();
          const categoriasArray = Array.isArray(data)
            ? data
            : (Array.isArray(data.categorias) ? data.categorias : []);
          setCategorias(categoriasArray);
        } catch {
          setCategorias([]);
        }
      };

      fetchTarefa();
      fetchCategorias();
    }, [isAuthenticated, token, route.params.id_tarefa])
  );

  const formatDateInput = (input: string) => {
    const cleaned = input.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);
    if (!match) return input;
    const [, day, month, year] = match;
    let formatted = day;
    if (month) formatted += '/' + month;
    if (year) formatted += '/' + year;
    return formatted;
  };

  const formatDateToInput = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDataFimChange = (input: string) => {
    const formatted = formatDateInput(input);
    setDataFim(formatted);
  };

  const handleUpdateTask = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    if (!titulo.trim()) {
      Alert.alert('Erro', 'O título é obrigatório.');
      return;
    }
    if (categoriasSelecionadas.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma categoria.');
      return;
    }
    const validValues = ['baixa', 'media', 'alta'];
    if (!validValues.includes(prioridade)) {
      Alert.alert('Erro', 'Prioridade inválida. Use: baixa, media ou alta.');
      return;
    }

    let data_fim: string | null = null;
    if (isDataFimEnabled && dataFim) {
      const [dia, mes, ano] = dataFim.split('/');
      if (dia && mes && ano) {
        const dateObj = new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 0);
        dateObj.setHours(dateObj.getHours() - 3);
        data_fim = dateObj.toISOString();
      }
    }

    // Payload para múltiplas categorias
    const tarefaAtualizada: any = {
      titulo,
      conteudo,
      data_inicio: dataInicio,
      data_fim,
      status,
      prioridade: prioridade as 'baixa' | 'media' | 'alta',
      categorias: categoriasSelecionadas.map(id => ({ id_categoria: id })),
    };

    try {
      const response = await fetch(`${IP_CELULAR}/api/tarefa/${route.params.id_tarefa}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tarefaAtualizada),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Tarefa atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Digite o título da tarefa"
          />

          <Text style={styles.label}>Conteúdo</Text>
          <TextInput
            style={styles.textArea}
            value={conteudo}
            onChangeText={setConteudo}
            placeholder="Digite o conteúdo da tarefa"
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
          <View style={styles.pickerContainerPriority}>
            <Picker
              selectedValue={prioridade}
              onValueChange={(itemValue) => setPrioridade(itemValue)}
              style={styles.pickerPriority}
              itemStyle={styles.pickerItemPriority}
            >
              <Picker.Item label="Alta" value="alta" />
              <Picker.Item label="Média" value="media" />
              <Picker.Item label="Baixa" value="baixa" />
            </Picker>
          </View>

          <Text style={styles.label}>Categorias</Text>
          <View style={{ marginBottom: 15 }}>
            {categorias.length > 0 ? (
              categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id_categoria}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                  onPress={() => {
                    setCategoriasSelecionadas((prev) =>
                      prev.includes(cat.id_categoria)
                        ? prev.filter((id) => id !== cat.id_categoria)
                        : [...prev, cat.id_categoria]
                    );
                  }}
                >
                  <View style={{
                    width: 22,
                    height: 22,
                    borderWidth: 2,
                    borderColor: '#8B4513',
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: categoriasSelecionadas.includes(cat.id_categoria) ? '#8B4513' : '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {categoriasSelecionadas.includes(cat.id_categoria) && (
                      <View style={{ width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 }} />
                    )}
                  </View>
                  <Text style={{ color: '#8B4513', fontSize: 15 }}>{cat.nome}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: '#8B4513' }}>Nenhuma categoria encontrada</Text>
            )}
          </View>

          <Button title="Salvar Alterações" onPress={handleUpdateTask} color="#8B4513" />
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
    maxWidth: 600,
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
  textArea: {
    borderColor: '#8B4513',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    color: '#8B4513',
    width: '100%',
    minWidth: 0,
  },
  dataFimContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#000',
  },
  pickerContainerPriority: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
    minHeight: 60,
    justifyContent: 'center',
    width: '100%',
    minWidth: 0,
  },
  pickerPriority: {
    height: 60,
    color: '#8B4513',
    fontSize: 12,
    width: '100%',
    minWidth: 0,
  },
  pickerItemPriority: {
    fontSize: 12,
    color: '#8B4513',
  },
  categoriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    minWidth: 0,
  },
  categoriaPickerContainer: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 0,
    minHeight: 60,
    justifyContent: 'center',
  },
});
