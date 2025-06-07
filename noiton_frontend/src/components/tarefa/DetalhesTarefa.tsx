import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useLanguage } from '@/context/LanguageContext';
import type { Tarefa } from '@/models/Tarefa';

export default function DetalhesTarefa() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isEnglish } = useLanguage();
  const { tarefa } = route.params || {};

  // Tradução
  const t = isEnglish
    ? {
        prioridade: 'Priority',
        status: 'Status',
        inicio: 'Start',
        fim: 'End',
        categorias: 'Categories',
        voltar: 'Back',
        detalhes: 'Details',
        notFound: 'Task not found',
      }
    : {
        prioridade: 'Prioridade',
        status: 'Status',
        inicio: 'Início',
        fim: 'Fim',
        categorias: 'Categorias',
        voltar: 'Voltar',
        detalhes: 'Detalhes',
        notFound: 'Tarefa não encontrada',
      };

  if (!tarefa) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>{t.notFound}</Text>
      </View>
    );
  }

  // Formata datas para dd/mm/aaaa
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>{tarefa.titulo}</Text>
      <Text style={styles.data}>
        {t.inicio}: {formatDate(tarefa.data_inicio)}
        {tarefa.data_fim ? `  |  ${t.fim}: ${formatDate(tarefa.data_fim)}` : ''}
      </Text>
      <View style={styles.chipRow}>
        <View style={[styles.chip, (styles as any)[`chip_${tarefa.prioridade}`]]}>
          <Text style={styles.chipText}>{t.prioridade}: {tarefa.prioridade}</Text>
        </View>
        <View style={[styles.chip, tarefa.status === 'concluido' ? styles.chip_concluido : styles.chip_pendente]}>
          <Text style={styles.chipText}>{t.status}: {tarefa.status}</Text>
        </View>
      </View>
      {tarefa.categorias && tarefa.categorias.length > 0 && (
        <View style={styles.categoriasContainer}>
          <Text style={styles.categoriasTitulo}>{t.categorias}:</Text>
          <View style={styles.categoriasRow}>
            {tarefa.categorias.map((cat: { id_categoria: number; nome: string }) => (
              <View key={cat.id_categoria} style={styles.categoriaChip}>
                <Text style={styles.categoriaChipText}>{cat.nome}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={styles.conteudoContainer}>
        <Text style={styles.conteudo}>{tarefa.conteudo}</Text>
      </View>
      <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.botaoVoltarText}>{t.voltar}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    padding: 18,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  data: {
    color: '#8B4513',
    marginBottom: 10,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B4513',
    alignSelf: 'flex-start',
  },
  chip_baixa: { backgroundColor: '#f5ecd2' },
  chip_media: { backgroundColor: '#ffe4b5' },
  chip_alta: { backgroundColor: '#ffd700' },
  chip_concluido: { borderColor: 'green' },
  chip_pendente: { borderColor: '#8B4513' },
  chipText: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoriasContainer: {
    marginBottom: 10,
  },
  categoriasTitulo: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  categoriasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoriaChip: {
    backgroundColor: '#fff',
    borderColor: '#8B4513',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  categoriaChipText: {
    color: '#8B4513',
    fontSize: 13,
  },
  conteudoContainer: {
    marginVertical: 18,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderColor: '#8B4513',
    borderWidth: 1,
  },
  conteudo: {
    fontSize: 16,
    color: '#8B4513',
  },
  botaoVoltar: {
    backgroundColor: '#8B4513',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoVoltarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
