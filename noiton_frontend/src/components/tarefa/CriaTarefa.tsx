import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Tarefa } from '../../models/Tarefa';
import { IP_WIFI, IP_CELULAR } from '@env';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/routes/Route';
import { useAuth } from '@/context/ApiContext';

export default function CriaTarefa() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isDataFimEnabled, setIsDataFimEnabled] = useState(false);
  const [prioridade, setPrioridade] = useState<string>('media'); // Prioridade padrão
  const [categorias, setCategorias] = useState<{ id_categoria: number; nome: string }[]>([]);
  const [categoria, setCategoria] = useState<number | null>(null); // id da categoria selecionada
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, isAuthenticated, logout } = useAuth();
  const isFocused = useIsFocused();

  const getHorarioBrasiliaISO = () => {
    const now = new Date();
    // Ajusta para UTC-3 (Brasília)
    now.setHours(now.getHours() - (now.getTimezoneOffset() / 60) - 3);
    return now.toISOString();
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

  // useEffect substituído por useFocusEffect para atualizar categorias ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      // Só busca categorias se a tela estiver focada, autenticada e o token existir
      if (!isFocused || !isAuthenticated || !token) {
        return;
      }
      const fetchCategorias = async () => {
        try {
          console.log('Enviando token no header (categorias):', token);
          let response = await fetch(`${IP_CELULAR}/api/categoria/list`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.status === 401) {
            console.error('Erro 401 ao buscar categorias (token inválido ou expirado)');
            return;
          }
          if (!response.ok) {
            response = await fetch(`${IP_WIFI}/api/categorialist`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro ao buscar categorias:', response.status, errorText);
            throw new Error('Erro ao buscar categorias');
          }
          const data = await response.json();
          const categoriasArray = Array.isArray(data)
            ? data
            : (Array.isArray(data.categorias) ? data.categorias : []);
          setCategorias(categoriasArray);
          if (
            categoriasArray.length > 0 &&
            (categoria === null || !categoriasArray.some(cat => cat.id_categoria === categoria))
          ) {
            setCategoria(categoriasArray[0].id_categoria);
          }
        } catch (error) {
          console.error('Erro inesperado ao buscar categorias:', error);
          setCategorias([]);
        }
      };
      fetchCategorias();
    }, [isFocused, isAuthenticated, token])
  );

  const handleCreateTask = async () => {
    if (!isAuthenticated || !token) {
      console.warn('Token ausente ou usuário não autenticado. Não será feita a requisição de criação de tarefa.');
      return;
    }
    const validValues = ['baixa', 'media', 'alta'];
    if (!validValues.includes(prioridade)) {
      Alert.alert('Erro', 'Prioridade inválida. Use: baixa, media ou alta.');
      return;
    }

    if (!categoria) {
      Alert.alert('Erro', 'Selecione uma categoria.');
      return;
    }

    const data_inicio = getHorarioBrasiliaISO();
    const status = 'pendente';

    let data_fim: string | null = null;
    if (isDataFimEnabled && dataFim) {
      // Espera dataFim no formato dd/mm/aaaa
      const [dia, mes, ano] = dataFim.split('/');
      if (dia && mes && ano) {
        // Cria objeto Date no fuso de Brasília
        const dateObj = new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 0);
        // Ajusta para UTC-3
        dateObj.setHours(dateObj.getHours() - 3);
        data_fim = dateObj.toISOString();
      }
    }

    const novaTarefa: Partial<Tarefa> = {
      titulo,
      conteudo,
      data_inicio,
      data_fim,
      status,
      prioridade: prioridade as 'baixa' | 'media' | 'alta',
      id_categoria: categoria,
    };

    try {
      console.log('Enviando token no header (criar tarefa):', token);
      const response = await fetch(`${IP_CELULAR}/api/tarefa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(novaTarefa),
      });

      if (response.status === 401) {
        console.error('Erro 401 ao criar tarefa (token inválido ou expirado)');
        return;
      }

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Erro ao criar tarefa:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Tarefa criada com sucesso!');
      setTitulo('');
      setConteudo('');
      setDataFim(null);
      setIsDataFimEnabled(false);
      setPrioridade('media');
      setCategoria(null);
    } catch (error) {
      console.error('Erro inesperado ao criar tarefa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // AJUSTE PARA SUBIR O TECLADO
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

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoriaRow}>
            <View style={styles.categoriaPickerContainer}>
              <Picker
                selectedValue={categoria}
                onValueChange={(itemValue) => setCategoria(itemValue)}
                style={styles.picker}
              >
                {categorias.length > 0 ? (
                  categorias.map((cat: { id_categoria: number; nome: string }) => (
                    <Picker.Item key={cat.id_categoria} label={cat.nome} value={cat.id_categoria} />
                  ))
                ) : (
                  <Picker.Item label="Nenhuma categoria encontrada" value={null} />
                )}
              </Picker>
            </View>
            <Button
              title="Criar nova"
              onPress={() => navigation.navigate('CriaCategoria')}
              color="#8B4513"
            />
          </View>

          <Button title="Criar Tarefa" onPress={handleCreateTask} color="#8B4513" /> {/* Botão marrom */}
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
    color: '#8B4513', // Texto marrom escuro
  },
  input: {
    height: 40,
    borderColor: '#8B4513', // Borda marrom
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff', // Fundo branco
    color: '#8B4513', // Texto marrom escuro
    width: '100%',
    minWidth: 0,
  },
  textArea: {
    borderColor: '#8B4513', // Borda marrom
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff', // Fundo branco
    textAlignVertical: 'top',
    color: '#8B4513', // Texto marrom escuro
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
    color: '#000', // Texto preto
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
    width: '100%',
    minWidth: 0,
  },
  picker: {
    height: 60, // Aumenta a altura do Picker de categoria
    color: '#8B4513',
    width: '100%',
    minWidth: 0,
  },
  // NOVOS ESTILOS PARA PRIORIDADE
  pickerContainerPriority: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
    minHeight: 60, // Aumenta a altura mínima para o select aparecer melhor
    justifyContent: 'center',
    width: '100%',
    minWidth: 0,
  },
  pickerPriority: {
    height: 60, // Aumenta a altura do Picker
    color: '#8B4513',
    fontSize: 12,
    width: '100%',
    minWidth: 0,
  },
  pickerItemPriority: {
    fontSize: 12, // Diminui o tamanho da fonte dos itens
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
    minHeight: 60, // Aumenta a altura do campo de categoria
    justifyContent: 'center',
  },
});
