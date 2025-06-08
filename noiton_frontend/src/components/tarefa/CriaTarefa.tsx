import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Switch, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Tarefa } from '../../models/Tarefa';
import { IP_WIFI, IP_CELULAR } from '@env';
import { useNavigation, useFocusEffect, useIsFocused, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/routes/Route';
import { useAuth } from '@/context/ApiContext';
import { useLanguage } from '@/context/LanguageContext';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMonitorarTarefasVencimentoDetalhado } from '../notification/NotificationManager';
import { monitorarTarefasVencimentoDetalhadoNow } from '../notification/NotificationManager';
import { useUserContext } from '@/context/UserContext';

const Footer = () => (
  <View style={{ backgroundColor: '#8B4513', height: 38 }} />
);

export default function CriaTarefa() {
  const { isEnglish } = useLanguage();
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [isDataFimEnabled, setIsDataFimEnabled] = useState(false);
  const [prioridade, setPrioridade] = useState<string>('media'); // Prioridade padrão
  const [categorias, setCategorias] = useState<{ id_categoria: number; nome: string }[]>([]);
  const [categoria, setCategoria] = useState<number | null>(null); // id da categoria selecionada
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([]); // Permitir múltiplas categorias
  const [ehRecorrente, setEhRecorrente] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, isAuthenticated, logout } = useAuth();
  const { userCpf } = useUserContext();
  const isFocused = useIsFocused();
  const route = useRoute();
  useMonitorarTarefasVencimentoDetalhado();

  // Se vier via navegação, permite criar subtarefa
  const idPai = (route as any)?.params?.id_pai !== undefined ? (route as any)?.params?.id_pai : null;
  console.log('[CriaTarefa] idPai value at component mount:', idPai);

  // Traduções dos textos
  const translations = {
    pt: {
      title: idPai ? 'Criar Subtarefa' : 'Criar Tarefa',
      titulo: 'Título',
      conteudo: 'Conteúdo',
      prazoFinal: 'Prazo Final',
      prioridade: 'Prioridade',
      categoria: 'Categoria',
      criar: idPai ? 'Criar Subtarefa' : 'Criar Tarefa',
      selecione: 'Selecione',
      obrigatorio: 'Campo obrigatório',
      sucesso: idPai ? 'Subtarefa criada com sucesso!' : 'Tarefa criada com sucesso!',
    },
    en: {
      title: idPai ? 'Create Subtask' : 'Create Task',
      titulo: 'Title',
      conteudo: 'Content',
      prazoFinal: 'Due Date',
      prioridade: 'Priority',
      categoria: 'Category',
      criar: idPai ? 'Create Subtask' : 'Create Task',
      selecione: 'Select',
      obrigatorio: 'Required field',
      sucesso: idPai ? 'Subtask created successfully!' : 'Task created successfully!',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

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
            (categoriasSelecionadas.length === 0 || !categoriasArray.some((cat: { id_categoria: number }) => categoriasSelecionadas.includes(cat.id_categoria)))
          ) {
            setCategoriasSelecionadas([categoriasArray[0].id_categoria]);
          }
        } catch (error) {
          console.error('Erro inesperado ao buscar categorias:', error);
          setCategorias([]);
        }
      };
      fetchCategorias();
    }, [isFocused, isAuthenticated, token])
  );

  const requestCalendarPermission = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(isEnglish ? 'Permission denied' : 'Permissão negada',
        isEnglish ? 'Cannot access calendar without permission.' : 'Não é possível acessar o calendário sem permissão.');
      return false;
    }
    return true;
  };

  const adicionarAoCalendario = async (tarefa: { titulo: string, dataFim: string | null }) => {
    if (!tarefa.dataFim) return;
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) return;
    try {
      let dataFinal: Date;
      if (tarefa.dataFim.includes('/')) {
        const [dia, mes, ano] = tarefa.dataFim.split('/');
        dataFinal = new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 0);
      } else {
        dataFinal = new Date(tarefa.dataFim);
      }
      const startDate = new Date();
      const endDate = dataFinal;
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('Todos os calendários disponíveis:', calendars);
      // Seleciona o calendário Google com accessLevel OWNER
      const googleCalendar = calendars.find(cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER && cal.source && cal.source.type === 'com.google');
      if (!googleCalendar) {
        console.error('Nenhum calendário Google com permissão de proprietário encontrado. Não é possível adicionar evento.');
        Alert.alert(
          isEnglish ? 'No Google Calendar found' : 'Nenhum Google Agenda encontrado',
          isEnglish
            ? 'Could not find a Google Calendar with owner access. Please check your calendar settings.'
            : 'Não foi possível encontrar um Google Agenda com acesso de proprietário. Verifique as configurações do seu calendário.'
        );
        return;
      }
      const calendarId = googleCalendar.id;
      console.log('Google Calendar ID selecionado:', calendarId);
      // O evento deve aparecer apenas no dia do prazo final
      // Evento de dia inteiro no prazo final
      const eventStart = new Date(endDate);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(endDate);
      eventEnd.setHours(23, 59, 59, 999);
      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `Tarefa: ${tarefa.titulo}`,
        startDate: eventStart,
        endDate: eventEnd,
        timeZone: 'America/Sao_Paulo',
        allDay: true,
        alarms: [{ relativeOffset: -60 }],
      });
      // Salvar o eventId junto com a tarefa, se possível, para permitir remoção posterior
      return eventId;
    } catch (error) {
      console.error('Erro ao adicionar ao calendário:', error);
      Alert.alert(isEnglish ? 'Error' : 'Erro', (error instanceof Error ? error.message : String(error)) || (isEnglish ? 'Could not add to calendar.' : 'Não foi possível adicionar ao calendário.'));
    }
  };

  // Função para salvar eventId no AsyncStorage
  const saveEventId = async (tarefaId: number, eventId: string) => {
    try {
      await AsyncStorage.setItem(`eventId_${tarefaId}`, eventId);
      console.log('eventId salvo no AsyncStorage:', eventId, 'para tarefa', tarefaId);
    } catch (e) {
      console.error('Erro ao salvar eventId no AsyncStorage:', e);
    }
  };

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

    // Validação
    if (categoriasSelecionadas.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma categoria.');
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

    // Adiciona ao calendário se tiver data_fim
    let eventId = null;
    if (data_fim) {
      eventId = await adicionarAoCalendario({ titulo, dataFim });
      console.log('eventId criado pelo Calendar:', eventId);
    }
    // Payload para múltiplas categorias
    const novaTarefa: any = {
      titulo,
      conteudo,
      data_inicio,
      data_fim,
      status,
      prioridade: prioridade as 'baixa' | 'media' | 'alta',
      categorias: categoriasSelecionadas.map(id => ({ id_categoria: id })),
      eventId, // Salva o eventId junto com a tarefa
      id_pai: idPai !== null ? idPai : null, // Sempre envia id_pai explicitamente
    };
    console.log('[CriaTarefa] idPai before sending:', idPai);
    console.log('[CriaTarefa] id_pai in payload:', novaTarefa.id_pai);
    console.log('[CriaTarefa] Full payload to backend:', JSON.stringify(novaTarefa, null, 2));

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

      const data = await response.json();
      console.log('Resposta da API ao criar tarefa:', data);
      // Se a resposta da API retornar o id_tarefa (ou id) e houver eventId, salva no AsyncStorage
      const tarefaId = data?.id_tarefa || data?.id;
      if (tarefaId && eventId) {
        await saveEventId(tarefaId, eventId);
      }
      Alert.alert('Sucesso', t.sucesso);
      // Executa monitoramento imediatamente após criar tarefa
      if (token && userCpf) {
        await monitorarTarefasVencimentoDetalhadoNow(token, userCpf);
      }
      navigation.navigate('TelaPrincipal');
    } catch (error) {
      console.error('Erro inesperado ao criar tarefa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Botão Voltar para Tela Principal */}
          <TouchableOpacity
            style={{ margin: 12, alignSelf: 'flex-start', backgroundColor: '#8B4513', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18 }}
            onPress={() => navigation.navigate('TelaPrincipal')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{isEnglish ? 'Back' : 'Voltar'}</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]}>{t.title}</Text>
          <Text style={styles.label}>{t.titulo}</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o título da tarefa"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>{t.conteudo}</Text>
          <TextInput
            style={[styles.textArea, { minHeight: 100, maxHeight: 300 }]}
            value={conteudo}
            onChangeText={setConteudo}
            placeholder={t.conteudo}
            multiline={true}
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={styles.label}>{t.prazoFinal}</Text>
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
            <TextInput
              style={styles.input}
              placeholder="dd/mm/aaaa"
              value={dataFim || ''}
              onChangeText={handleDataFimChange}
              keyboardType="numeric"
            />
          )}

          <Text style={styles.label}>{t.prioridade}</Text>
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

          <Text style={styles.label}>{t.categoria}</Text>
          <View style={{ marginBottom: 30 }}>
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
            {/* <Button
              title="Criar Categoria"
              onPress={() => navigation.navigate('CriaCategoria')}
              color="#8B4513"
            /> */}
            <TouchableOpacity
              style={{
                backgroundColor: '#8B4513',
                borderRadius: 5,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 8,
              }}
              onPress={() => navigation.navigate('CriaCategoria')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Criar Categoria</Text>
            </TouchableOpacity>
          </View>

          {/* <Button title={t.criar} onPress={handleCreateTask} color="#8B4513" /> */}
          <TouchableOpacity
            style={{
              backgroundColor: '#8B4513',
              borderRadius: 5,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 16,
            }}
            onPress={handleCreateTask}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.criar}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Footer />
    </View>
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
