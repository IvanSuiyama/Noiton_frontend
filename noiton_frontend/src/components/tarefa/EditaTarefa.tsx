import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useAuth } from '@/context/ApiContext';
import { useLanguage } from '@/context/LanguageContext';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

type EditaTarefaRouteProp = {
  params: {
    id_tarefa: number;
  };
};

// Removido o Header
const Footer = () => (
  <View style={{ backgroundColor: '#8B4513', height: 38 }} />
);

export default function EditaTarefa() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute() as EditaTarefaRouteProp;
  const { token, isAuthenticated } = useAuth();
  const { isEnglish } = useLanguage();

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
  const [eventId, setEventId] = useState<string | null>(null);

  const idPai = (route as any)?.params?.id_pai !== undefined ? (route as any)?.params?.id_pai : null;

  const translations = {
    pt: {
      title: idPai ? 'Editar Subtarefa' : 'Editar Tarefa',
      titulo: 'Título',
      conteudo: 'Conteúdo',
      prazoFinal: 'Prazo Final',
      prioridade: 'Prioridade',
      categoria: 'Categoria',
      salvar: idPai ? 'Salvar Subtarefa' : 'Salvar',
      status: 'Status',
      inicio: 'Início',
      sucesso: idPai ? 'Subtarefa atualizada com sucesso!' : 'Tarefa atualizada com sucesso!',
    },
    en: {
      title: idPai ? 'Edit Subtask' : 'Edit Task',
      titulo: 'Title',
      conteudo: 'Content',
      prazoFinal: 'Due Date',
      prioridade: 'Priority',
      categoria: 'Category',
      salvar: idPai ? 'Save Subtask' : 'Save',
      status: 'Status',
      inicio: 'Start',
      sucesso: idPai ? 'Subtask updated successfully!' : 'Task updated successfully!',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

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
          let response = await fetch(`http://192.168.95.119:4000/api/tarefa/${route.params.id_tarefa}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            response = await fetch(`http://192.168.95.119:4000/api/tarefa/${route.params.id_tarefa}`, {
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
          setEventId(tarefa.eventId || null); // Supondo que o eventId esteja vindo na tarefa
        } catch (error) {
          console.error('Erro ao carregar tarefa:', error);
          Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao carregar tarefa');
        }
      };

      const fetchCategorias = async () => {
        try {
          let response = await fetch(`http://192.168.95.119:4000/api/categorialist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            response = await fetch(`http://192.168.95.119:4000/api/categorialist`, {
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

  // Função para remover evento do calendário
  const removerEventoCalendario = async (eventId: string) => {
    try {
      await Calendar.deleteEventAsync(eventId);
      console.log('Evento do calendário removido (EditaTarefa):', eventId);
    } catch (error) {
      console.error('Erro ao remover evento do calendário (EditaTarefa):', error);
    }
  };

  // Função para salvar eventId no AsyncStorage
  const saveEventId = async (tarefaId: number, eventId: string) => {
    try {
      await AsyncStorage.setItem(`eventId_${tarefaId}`, eventId);
      console.log('eventId salvo no AsyncStorage (EditaTarefa):', eventId, 'para tarefa', tarefaId);
    } catch (e) {
      console.error('Erro ao salvar eventId no AsyncStorage (EditaTarefa):', e);
    }
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

    // Antes de atualizar, verifica se mudou a data_fim e há eventId: remove evento antigo e cria novo
    let novoEventId = eventId;
    if (isDataFimEnabled && dataFim) {
      const [dia, mes, ano] = dataFim.split('/');
      if (dia && mes && ano) {
        const novaData = new Date(Number(ano), Number(mes) - 1, Number(dia), 23, 59, 0);
        novaData.setHours(novaData.getHours() - 3);
        const novaDataISO = novaData.toISOString();
        // Se não há eventId, cria novo evento
        if (!eventId) {
          const eventStart = new Date(novaDataISO);
          eventStart.setHours(0, 0, 0, 0);
          const eventEnd = new Date(novaDataISO);
          eventEnd.setHours(23, 59, 59, 999);
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          const googleCalendar = calendars.find(cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER && cal.source && cal.source.type === 'com.google');
          if (googleCalendar) {
            novoEventId = await Calendar.createEventAsync(googleCalendar.id, {
              title: `Tarefa: ${titulo}`,
              startDate: eventStart,
              endDate: eventEnd,
              timeZone: 'America/Sao_Paulo',
              allDay: true,
              alarms: [{ relativeOffset: -60 }],
            });
            console.log('Novo eventId criado ao editar tarefa (sem antigo):', novoEventId);
          } else {
            console.error('Google Calendar não encontrado ao editar tarefa.');
          }
        } else if (data_fim !== dataInicio) {
          // Se já existe eventId e a data mudou, remove o antigo e cria novo
          await removerEventoCalendario(eventId);
          const eventStart = new Date(novaDataISO);
          eventStart.setHours(0, 0, 0, 0);
          const eventEnd = new Date(novaDataISO);
          eventEnd.setHours(23, 59, 59, 999);
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          const googleCalendar = calendars.find(cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER && cal.source && cal.source.type === 'com.google');
          if (googleCalendar) {
            novoEventId = await Calendar.createEventAsync(googleCalendar.id, {
              title: `Tarefa: ${titulo}`,
              startDate: eventStart,
              endDate: eventEnd,
              timeZone: 'America/Sao_Paulo',
              allDay: true,
              alarms: [{ relativeOffset: -60 }],
            });
            console.log('Novo eventId criado ao editar tarefa (trocando data):', novoEventId);
          } else {
            console.error('Google Calendar não encontrado ao editar tarefa.');
          }
        }
      }
    }
    console.log('eventId antes do update:', eventId, 'novoEventId:', novoEventId);

    // Payload para múltiplas categorias
    const tarefaAtualizada: any = {
      titulo,
      conteudo,
      data_inicio: dataInicio,
      data_fim,
      status,
      prioridade: prioridade as 'baixa' | 'media' | 'alta',
      categorias: categoriasSelecionadas.map(id => ({ id_categoria: id })),
      eventId: novoEventId,
      id_pai: idPai !== null ? idPai : null, // Sempre envia id_pai
    };

    try {
      const response = await fetch(`http://192.168.95.119:4000/api/tarefa/${route.params.id_tarefa}`, {
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

      // Se houver novoEventId, salva no AsyncStorage
      if (route.params.id_tarefa && novoEventId) {
        await saveEventId(route.params.id_tarefa, novoEventId);
      }

      // Se status for concluído e houver eventId, remove o evento do calendário
      if (status === 'concluido' && eventId) {
        await removerEventoCalendario(eventId);
        Alert.alert('Tarefa concluída!', 'O evento do calendário foi removido.');
      }

      Alert.alert('Sucesso', t.sucesso);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao atualizar tarefa');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      {/* Header removido */}
      <ScrollView contentContainerStyle={styles.scrollContainer} style={{ flex: 1 }}>
        <Text style={styles.label}>{t.title}</Text>
        <Text style={styles.label}>{t.titulo}</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Digite o título da tarefa"
        />

        <Text style={styles.label}>{t.conteudo}</Text>
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
            <Text style={styles.label}>{t.prazoFinal}</Text>
            <TextInput
              style={styles.input}
              placeholder="dd/mm/aaaa"
              value={dataFim || ''}
              onChangeText={handleDataFimChange}
              keyboardType="numeric"
            />
          </>
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

        {/* <Button title={t.salvar} onPress={handleUpdateTask} color="#8B4513" /> */}
        <TouchableOpacity
          style={{
            backgroundColor: '#8B4513',
            borderRadius: 5,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 16,
          }}
          onPress={handleUpdateTask}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.salvar}</Text>
        </TouchableOpacity>
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
