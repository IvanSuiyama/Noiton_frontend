import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, StyleSheet, FlatList, TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView, Button, TextInput } from 'react-native';
import { Tarefa } from '../../models/Tarefa';
import { IP_WIFI, IP_CELULAR } from '@env';
import { useAuth } from '@/context/ApiContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Habilita animação no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Categoria = {
  id_categoria: number;
  nome: string;
};

export default function ListarTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const { token, isAuthenticated } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Estado para os filtros
  const [filtros, setFiltros] = useState({
    palavraChave: '',
    categoria: null,
    prioridade: null,
    status: null,
    ordenarPor: null,
    prazoFinal: null,  // Prazo final (data_fim)
    semPrazo: false,   // Filtro para tarefas sem data de fim
  });
  const prioridades = ['alta', 'media', 'baixa'];
  const statusList = ['pendente', 'concluido'];

  // Função para buscar eventId do AsyncStorage
  const getEventId = async (tarefaId: number): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(`eventId_${tarefaId}`);
    } catch (e) {
      console.error('Erro ao buscar eventId no AsyncStorage:', e);
      return null;
    }
  };

  // Função para remover eventId do AsyncStorage
  const removeEventId = async (tarefaId: number) => {
    try {
      await AsyncStorage.removeItem(`eventId_${tarefaId}`);
      console.log('eventId removido do AsyncStorage:', tarefaId);
    } catch (e) {
      console.error('Erro ao remover eventId do AsyncStorage:', e);
    }
  };

  // Função para buscar tarefas (extraída para ser reutilizada)
  const fetchTarefas = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.warn('Token ausente ou usuário não autenticado. Não será feita a requisição.');
      return;
    }
    // Só busca se prazoFinal estiver vazio ou completo (AAAA-MM-DD)
    if (filtros.prazoFinal && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(filtros.prazoFinal)) {
      // Não faz nada se o campo está incompleto
      return;
    }
    try {
      // Monta a query string de filtros
      const params = new URLSearchParams();
      if (filtros.prazoFinal) params.append('prazoFinal', filtros.prazoFinal);
      if (filtros.semPrazo) params.append('semPrazo', 'true');
      const url = `${IP_CELULAR}/api/tarefa/list${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        console.error('Erro 401 ao buscar tarefas (token inválido ou expirado)');
        return;
      }
      if (!response.ok) throw new Error('Erro ao buscar tarefas');
      const data: Tarefa[] = await response.json();
      // Injeta eventId do AsyncStorage se existir
      const tarefasComEventId = await Promise.all(
        data.map(async (tarefa) => {
          const eventId = await getEventId(tarefa.id_tarefa);
          return eventId ? { ...tarefa, eventId } : tarefa;
        })
      );
      setTarefas(tarefasComEventId);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [isAuthenticated, token, filtros.prazoFinal, filtros.semPrazo]);

  // Recarrega tarefas ao focar na tela
  useFocusEffect(
    useCallback(() => {
      fetchTarefas();
    }, [fetchTarefas])
  );

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        let response = await fetch(`${IP_CELULAR}/api/categorialist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          response = await fetch(`${IP_WIFI}/api/categoria/list`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (!response.ok) throw new Error('Erro ao buscar categorias');
        const data = await response.json();
        const categoriasArray = Array.isArray(data)
          ? data
          : (Array.isArray(data.categorias) ? data.categorias : []);
        setCategorias(categoriasArray);
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };
    fetchTarefas();
    fetchCategorias();
  }, [isAuthenticated, token, fetchTarefas]);

  const handleDelete = async (id: number) => {
    if (!token) {
      console.warn('Token ausente. Não será feita a requisição de exclusão.');
      return;
    }
    try {
      // Busca o eventId antes de excluir
      const eventId = await getEventId(id);
      if (eventId) {
        await removerEventoCalendario(eventId, id);
      }
      const response = await fetch(`${IP_CELULAR}/api/tarefa/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        console.error('Erro 401 ao deletar tarefa (token inválido ou expirado)');
        return;
      }
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }
      Alert.alert('Sucesso', 'Tarefa excluída com sucesso!');
      setTarefas((prev) => prev.filter((tarefa) => tarefa.id_tarefa !== id));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Remove evento do calendário ao concluir tarefa
  const removerEventoCalendario = async (eventId: string, tarefaId?: number) => {
    try {
      await Calendar.deleteEventAsync(eventId);
      if (tarefaId) {
        await removeEventId(tarefaId);
      }
      console.log('Evento do calendário removido:', eventId);
    } catch (error) {
      console.error('Erro ao remover evento do calendário:', error);
    }
  };

  // Atualiza o status da tarefa para "concluido"
  const handleToggleConcluido = async (tarefaId: number, value: boolean) => {
    if (!token) return;
    try {
      const tarefaAtual = tarefas.find((t) => t.id_tarefa === tarefaId);
      if (!tarefaAtual) throw new Error('Tarefa não encontrada');
      // Remove evento do calendário se estiver concluindo e houver eventId
      if (value && tarefaAtual.eventId) {
        await removerEventoCalendario(tarefaAtual.eventId, tarefaId);
        Alert.alert('Tarefa concluída!', 'O evento do calendário foi removido.');
      }
      const body = {
        ...tarefaAtual,
        status: value ? 'concluido' : 'pendente',
      };
      const response = await fetch(`${IP_CELULAR}/api/tarefa/${tarefaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }
      setTarefas((prev) =>
        prev.map((t) =>
          t.id_tarefa === tarefaId ? { ...t, status: value ? 'concluido' : 'pendente' } : t
        )
      );
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Sem prazo';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  const filteredTarefas = tarefas;

  const handleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  // Função para pegar o nome da categoria pelo id_categoria
  // Agora, cada tarefa pode ter múltiplas categorias, mas o backend ainda retorna apenas uma?
  // Se sim, mantenha a função, senão adapte para múltiplas categorias no futuro.
  const getCategoriaNome = (id_categoria: number) => {
    const categoria = categorias.find((cat) => cat.id_categoria === id_categoria);
    return categoria ? categoria.nome : 'Sem categoria';
  };

  // Função para pegar o nome das categorias de uma tarefa
  const getCategoriasNomes = (categoriasArr?: { id_categoria: number; nome: string }[]) => {
    if (!Array.isArray(categoriasArr) || categoriasArr.length === 0) return 'Sem categoria';
    // Filtra categorias válidas e remove duplicatas por nome
    const nomes = categoriasArr
      .filter(cat => cat && typeof cat.nome === 'string' && cat.nome.trim() !== '')
      .map(cat => cat.nome.trim());
    if (nomes.length === 0) return 'Sem categoria';
    return [...new Set(nomes)].join(', ');
  };

  // LOG para depuração: veja como está vindo o campo categorias em cada tarefa
  useEffect(() => {
    if (tarefas && tarefas.length > 0) {
      console.log('Tarefas recebidas:', tarefas.map(t => ({ id: t.id_tarefa, categorias: t.categorias })));
    }
  }, [tarefas]);

  // Função para aplicar os filtros
  const tarefasFiltradas = filteredTarefas
    .filter(tarefa => !tarefa.id_pai) // Exclui subtarefas
    .filter(tarefa => {
      if (filtros.palavraChave && !(
        tarefa.titulo.toLowerCase().includes(filtros.palavraChave.toLowerCase()) ||
        tarefa.conteudo.toLowerCase().includes(filtros.palavraChave.toLowerCase())
      )) return false;
      if (filtros.categoria && !(tarefa.categorias && tarefa.categorias.some(cat => cat.id_categoria === filtros.categoria))) return false;
      if (filtros.prioridade && tarefa.prioridade !== filtros.prioridade) return false;
      if (filtros.status && tarefa.status !== filtros.status) return false;
      return true;
    });
  let tarefasOrdenadas = [...tarefasFiltradas];
  if (filtros.ordenarPor === 'data_inicio') {
    tarefasOrdenadas.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  } else if (filtros.ordenarPor === 'data_fim') {
    tarefasOrdenadas.sort((a, b) => new Date(a.data_fim || 0).getTime() - new Date(b.data_fim || 0).getTime());
  } else if (filtros.ordenarPor === 'mais_recentes') {
    tarefasOrdenadas.sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  } else if (filtros.ordenarPor === 'mais_antigas') {
    tarefasOrdenadas.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  }

  const { isEnglish } = useLanguage();
  const translations = {
    pt: {
      palavraChave: 'Buscar por palavra-chave...',
      categoria: 'Categoria',
      prioridade: 'Prioridade',
      status: 'Status',
      ordenarPor: 'Ordenar por',
      prazoFinal: 'Prazo Final',
      limpar: 'Limpar',
      semPrazo: 'Sem Prazo',
      dataCriacao: 'Data Criação',
      prazo: 'Prazo Final',
      maisRecentes: 'Mais Recentes',
      maisAntigas: 'Mais Antigas',
      editar: 'Editar',
      excluir: 'Excluir',
      nenhumaTarefa: 'Nenhuma tarefa encontrada.',
      conteudo: 'Conteúdo',
      inicio: 'Início',
      fim: 'Fim',
    },
    en: {
      palavraChave: 'Search by keyword...',
      categoria: 'Category',
      prioridade: 'Priority',
      status: 'Status',
      ordenarPor: 'Sort by',
      prazoFinal: 'Due Date',
      limpar: 'Clear',
      semPrazo: 'No Due Date',
      dataCriacao: 'Creation Date',
      prazo: 'Due Date',
      maisRecentes: 'Most Recent',
      maisAntigas: 'Oldest',
      editar: 'Edit',
      excluir: 'Delete',
      nenhumaTarefa: 'No tasks found.',
      conteudo: 'Content',
      inicio: 'Start',
      fim: 'End',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  const Footer = () => (
    <View style={{ backgroundColor: '#8B4513', height: 38 }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      {/* Header removido */}
      <View style={styles.container}>
        <FiltrosTarefa
          filtros={filtros}
          setFiltros={setFiltros}
          categorias={categorias}
          onPesquisar={() => {}}
          prioridades={prioridades}
          statusList={statusList}
          t={t}
        />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {tarefasOrdenadas.length === 0 ? (
            <Text style={styles.emptyText}>{t.nenhumaTarefa}</Text>
          ) : (
            tarefasOrdenadas.map((item) => (
              <View key={item.id_tarefa} style={[styles.cardContainer, item.status === 'concluido' && { opacity: 0.5 }]}> 
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => handleExpand(item.id_tarefa)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.titulo}</Text>
                    <Text style={styles.cardCategoriasDestacada}>
                      {t.categoria}: {getCategoriasNomes(item.categorias)}
                    </Text>
                  </View>
                  {/* Checkbox para marcar como concluída, alinhado à direita antes do expandIcon */}
                  <TouchableOpacity
                    style={[
                      styles.checkboxSquare,
                      item.status === 'concluido' && styles.checkboxSquareChecked,
                      { marginRight: 24 }
                    ]}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      handleToggleConcluido(item.id_tarefa, item.status !== 'concluido');
                    }}
                    activeOpacity={0.7}
                  >
                    {item.status === 'concluido' && <View style={styles.checkboxInnerChecked} />}
                  </TouchableOpacity>
                  <Text style={styles.expandIcon}>{expanded === item.id_tarefa ? '-' : '+'}</Text>
                </TouchableOpacity>
                {expanded === item.id_tarefa && (
                  <View style={styles.cardContent}>
                    <Text style={styles.itemText}>{t.conteudo}: {item.conteudo}</Text>
                    <Text style={styles.itemText}>{t.status}: {item.status}</Text>
                    <Text style={styles.itemText}>{t.prioridade}: {item.prioridade}</Text>
                    <Text style={styles.itemText}>{t.inicio}: {formatDate(typeof item.data_inicio === 'string' ? item.data_inicio : item.data_inicio?.toString() ?? '')}</Text>
                    <Text style={styles.itemText}>{t.fim}: {formatDate(typeof item.data_fim === 'string' ? item.data_fim : item.data_fim?.toString() ?? '')}</Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.deleteButton, { marginRight: 10 }]}
                        onPress={() => navigation.navigate('EditaTarefa', { id_tarefa: item.id_tarefa })}>
                        <Text style={styles.deleteButtonText}>{t.editar}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, { marginRight: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#8B4513' }]}
                        onPress={() => navigation.navigate('DetalhesTarefa', { tarefa: item })}
                      >
                        <Text style={[styles.deleteButtonText, { color: '#8B4513' }]}>
                          {isEnglish ? 'Details' : 'Detalhes'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id_tarefa)}
                      >
                        <Text style={styles.deleteButtonText}>{t.excluir}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
      <Footer />
    </View>
  );
}

function FiltrosTarefa({
  filtros, setFiltros, categorias, onPesquisar, prioridades, statusList, t
}: {
  filtros: any,
  setFiltros: (f: any) => void,
  categorias: Categoria[],
  onPesquisar: () => void,
  prioridades: string[],
  statusList: string[],
  t: any,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openFilters, setOpenFilters] = useState<{ [key: string]: boolean }>({});

  const toggleFilter = (key: string) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.filtrosBarContainer}>
      <View style={styles.filtrosBarRow}>
        <TextInput
          style={styles.filtroInput}
          placeholder={t.palavraChave}
          value={filtros.palavraChave}
          onChangeText={text => setFiltros({ ...filtros, palavraChave: text })}
          returnKeyType="search"
          onSubmitEditing={onPesquisar}
        />
        <TouchableOpacity style={styles.filtroSearchButton} onPress={onPesquisar}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filtroExpandButton}
          onPress={() => setShowAdvanced(v => !v)}
        >
          <MaterialIcons
            name={showAdvanced ? 'expand-less' : 'add'}
            size={24}
            color="#8B4513"
          />
        </TouchableOpacity>
      </View>
      {showAdvanced && (
        <View style={styles.filtrosAvancadosContainer}>
          {/* Categoria */}
          <TouchableOpacity style={styles.filtroTituloLinhaGrande} onPress={() => toggleFilter('categoria')}>
            <Text style={styles.filtroLabelGrande}>{t.categoria}</Text>
            <MaterialIcons name={openFilters['categoria'] ? 'expand-less' : 'expand-more'} size={24} color="#8B4513" />
          </TouchableOpacity>
          {openFilters['categoria'] && (
            <View style={styles.filtroOpcoesLinha}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {categorias.map(cat => (
                    <TouchableOpacity
                      key={`cat_${cat.id_categoria}`} // <-- Garante chave única
                      style={[
                        styles.filtroChipMini,
                        filtros.categoria === cat.id_categoria && styles.filtroChipSelecionadoMini
                      ]}
                      onPress={() => setFiltros({ ...filtros, categoria: filtros.categoria === cat.id_categoria ? null : cat.id_categoria })}
                    >
                      <Text style={[
                        styles.filtroChipTextGrande,
                        filtros.categoria === cat.id_categoria && { color: '#fff' }
                      ]}>{cat.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          {/* Prioridade */}
          <TouchableOpacity style={styles.filtroTituloLinhaGrande} onPress={() => toggleFilter('prioridade')}>
            <Text style={styles.filtroLabelGrande}>{t.prioridade}</Text>
            <MaterialIcons name={openFilters['prioridade'] ? 'expand-less' : 'expand-more'} size={24} color="#8B4513" />
          </TouchableOpacity>
          {openFilters['prioridade'] && (
            <View style={styles.filtroOpcoesLinha}>
              {prioridades.map(pri => (
                <TouchableOpacity
                  key={`pri_${pri}`} // <-- Garante chave única
                  style={[
                    styles.filtroChipMini,
                    filtros.prioridade === pri && styles.filtroChipSelecionadoMini
                  ]}
                  onPress={() => setFiltros({ ...filtros, prioridade: filtros.prioridade === pri ? null : pri })}
                >
                  <Text style={[
                    styles.filtroChipTextGrande,
                    filtros.prioridade === pri && { color: '#fff' }
                  ]}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Status */}
          <TouchableOpacity style={styles.filtroTituloLinhaGrande} onPress={() => toggleFilter('status')}>
            <Text style={styles.filtroLabelGrande}>{t.status}</Text>
            <MaterialIcons name={openFilters['status'] ? 'expand-less' : 'expand-more'} size={24} color="#8B4513" />
          </TouchableOpacity>
          {openFilters['status'] && (
            <View style={styles.filtroOpcoesLinha}>
              {statusList.map(st => (
                <TouchableOpacity
                  key={`status_${st}`} // <-- Garante chave única
                  style={[
                    styles.filtroChipMini,
                    filtros.status === st && styles.filtroChipSelecionadoMini
                  ]}
                  onPress={() => setFiltros({ ...filtros, status: filtros.status === st ? null : st })}
                >
                  <Text style={[
                    styles.filtroChipTextGrande,
                    filtros.status === st && { color: '#fff' }
                  ]}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Ordenar por */}
          <TouchableOpacity style={styles.filtroTituloLinhaGrande} onPress={() => toggleFilter('ordenarPor')}>
            <Text style={styles.filtroLabelGrande}>{t.ordenarPor}</Text>
            <MaterialIcons name={openFilters['ordenarPor'] ? 'expand-less' : 'expand-more'} size={24} color="#8B4513" />
          </TouchableOpacity>
          {openFilters['ordenarPor'] && (
            <View style={styles.filtroOpcoesLinha}>
              {['data_inicio', 'data_fim', 'mais_recentes', 'mais_antigas'].map(ord => (
                <TouchableOpacity
                  key={`ord_${ord}`} // <-- Garante chave única
                  style={[
                    styles.filtroChipMini,
                    filtros.ordenarPor === ord && styles.filtroChipSelecionadoMini
                  ]}
                  onPress={() => setFiltros({ ...filtros, ordenarPor: filtros.ordenarPor === ord ? null : ord })}
                >
                  <Text style={[
                    styles.filtroChipTextGrande,
                    filtros.ordenarPor === ord && { color: '#fff' }
                  ]}>
                    {ord === 'data_inicio' ? t.dataCriacao :
                      ord === 'data_fim' ? t.prazo :
                        ord === 'mais_recentes' ? t.maisRecentes :
                          t.maisAntigas}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Prazo Final */}
          <TouchableOpacity style={styles.filtroTituloLinhaGrande} onPress={() => toggleFilter('prazoFinal')}>
            <Text style={styles.filtroLabelGrande}>{t.prazoFinal}</Text>
            <MaterialIcons name={openFilters['prazoFinal'] ? 'expand-less' : 'expand-more'} size={24} color="#8B4513" />
          </TouchableOpacity>
          {openFilters['prazoFinal'] && (
            <View style={styles.filtroOpcoesLinha}>
              <TextInput
                style={styles.filtroInputData}
                placeholder="AAAA-MM-DD"
                value={filtros.prazoFinal || ''}
                onChangeText={text => setFiltros({ ...filtros, prazoFinal: text })}
                keyboardType="numeric"
                maxLength={10}
              />
              {filtros.prazoFinal && (
                <TouchableOpacity
                  style={[styles.filtroChipMini, { backgroundColor: '#ffe6e6', borderColor: '#8B4513' }]}
                  onPress={() => setFiltros({ ...filtros, prazoFinal: null })}
                >
                  <Text style={styles.filtroChipTextGrande}>{t.limpar}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.filtroChipMini, filtros.semPrazo && styles.filtroChipSelecionadoMini]}
                onPress={() => setFiltros({ ...filtros, semPrazo: !filtros.semPrazo })}
              >
                <Text style={[
                  styles.filtroChipTextGrande,
                  filtros.semPrazo && { color: '#fff' }
                ]}>{t.semPrazo}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5dc',
  },
  filtrosBarContainer: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
  },
  filtrosBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  filtroInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    borderColor: '#8B4513',
    borderWidth: 1,
    color: '#8B4513',
    minWidth: 60,
    fontSize: 14,
  },
  filtroSearchButton: {
    backgroundColor: '#8B4513',
    borderRadius: 4,
    padding: 7,
    marginRight: 6,
  },
  filtroExpandButton: {
    backgroundColor: '#f5f5dc',
    borderRadius: 4,
    padding: 7,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  filtrosAvancadosContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    borderColor: '#8B4513',
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  filtroTituloLinhaGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 0,
    minHeight: 48,
  },
  filtroLabelGrande: {
    fontWeight: 'bold',
    color: '#8B4513',
    fontSize: 20,
  },
  filtroOpcoesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 4,
    marginRight: 4,
    gap: 2,
  },
  filtroChipMini: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 4,
    marginBottom: 2,
    borderColor: '#8B4513',
    borderWidth: 1,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtroChipSelecionadoMini: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  filtroChipTextMini: {
    color: '#8B4513',
    fontWeight: '500',
    fontSize: 12,
  },
  filtroChipTextGrande: {
    color: '#8B4513',
    fontWeight: '500',
    fontSize: 18,
  },
  filtroInputMini: {
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 6,
    borderColor: '#8B4513',
    borderWidth: 1,
    color: '#8B4513',
    minWidth: 80,
    fontSize: 12,
    marginRight: 4,
  },
  filtroInputData: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 14,
    borderColor: '#8B4513',
    borderWidth: 1,
    color: '#8B4513',
    minWidth: 160,
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20, // aumentado para combinar com os filtros
    fontWeight: 'bold',
    color: '#8B4513',
  },
  cardCategoriasDestacada: {
    fontSize: 16, // aumentado para combinar com os filtros
    color: '#8B4513',
    marginTop: 2,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#8B4513',
  },
  checkboxInnerChecked: {
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  expandIcon: {
    fontSize: 16,
    color: '#8B4513',
    marginLeft: 6,
  },
  cardContent: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemText: {
    fontSize: 16, // aumentado para combinar com os filtros
    color: '#8B4513',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    marginLeft: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16, // aumentado para melhor legibilidade
  },
  emptyText: {
    textAlign: 'center',
    color: '#8B4513',
    fontSize: 16, // aumentado para melhor visibilidade
    marginTop: 16,
  },
});



