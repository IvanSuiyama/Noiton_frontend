import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useLanguage } from '@/context/LanguageContext';
import type { Tarefa } from '@/models/Tarefa';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/ApiContext';
import * as FileSystem from 'expo-file-system';

// const Header = () => (
//   <View style={{ backgroundColor: '#8B4513', paddingTop: 36, paddingBottom: 12, alignItems: 'center' }}>
//     <Text style={{ color: '#f5f5dc', fontSize: 28, fontWeight: 'bold', letterSpacing: 2 }}>noiton</Text>
//   </View>
// );
const Footer = () => (
  <View style={{ backgroundColor: '#8B4513', height: 38 }} />
);

export default function DetalhesTarefa() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isEnglish } = useLanguage();
  const { tarefa } = route.params || {};
  const { token } = useAuth();
  const [subtarefas, setSubtarefas] = useState<any[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loadingArquivos, setLoadingArquivos] = useState(false);
  const tarefaId = tarefa?.id_tarefa;

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
        anexos: 'Attachments',
        addPdf: 'Attach PDF',
        baixar: 'Download',
        deletar: 'Delete',
        carregandoArquivos: 'Loading files...',
        nenhumArquivo: 'No files.',
        confirmDelete: 'Delete this file?',
        erroUpload: 'Error uploading file.',
        sucessoUpload: 'File uploaded successfully!',
        erroDelete: 'Error deleting file.',
        sucessoDelete: 'File deleted successfully!',
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
        anexos: 'Anexos',
        addPdf: 'Anexar PDF',
        baixar: 'Baixar',
        deletar: 'Excluir',
        carregandoArquivos: 'Carregando arquivos...',
        nenhumArquivo: 'Nenhum arquivo.',
        confirmDelete: 'Excluir este arquivo?',
        erroUpload: 'Erro ao enviar arquivo.',
        sucessoUpload: 'Arquivo enviado com sucesso!',
        erroDelete: 'Erro ao excluir arquivo.',
        sucessoDelete: 'Arquivo excluído com sucesso!',
      };

  // Função para buscar arquivos
  const fetchArquivos = async () => {
    if (!tarefaId) return;
    setLoadingArquivos(true);
    try {
      const resp = await fetch(`${process.env.IP_CELULAR || ''}/api/tarefa/${tarefaId}/arquivos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await resp.json();
      setArquivos(Array.isArray(data) ? data : []);
    } catch {
      setArquivos([]);
    } finally {
      setLoadingArquivos(false);
    }
  };

  useEffect(() => {
    if (!tarefaId) return;
    setLoadingSub(true);
    fetch(`${process.env.IP_CELULAR || ''}/api/tarefa/${tarefaId}/subtarefas`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setSubtarefas(Array.isArray(data) ? data : []))
      .catch(() => setSubtarefas([]))
      .finally(() => setLoadingSub(false));

    fetchArquivos();
  }, [tarefaId, token]);

  // Função para upload de PDF
  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append('pdf', {
        uri: file.uri,
        name: file.name || 'file.pdf',
        type: 'application/pdf',
      } as any);
      const resp = await fetch(`${process.env.IP_CELULAR || ''}/api/tarefa/${tarefaId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      Alert.alert(t.sucessoUpload);
      fetchArquivos();
    } catch (e) {
      Alert.alert(t.erroUpload);
    }
  };

  // Função para baixar PDF
  const handleDownload = async (caminho: string) => {
    try {
      const url = `${process.env.IP_CELULAR || ''}/api/tarefa/arquivo/download?caminho=${encodeURIComponent(caminho)}`;
      const fileName = caminho.split('/').pop() || 'arquivo.pdf';
      const tempFileUri = FileSystem.cacheDirectory + fileName;
      const response = await FileSystem.downloadAsync(url, tempFileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status !== 200) throw new Error('Erro ao baixar arquivo');
      const fileInfo = await FileSystem.getInfoAsync(response.uri);
      if (!fileInfo.exists) {
        Alert.alert(isEnglish ? 'File not found' : 'Arquivo não encontrado', response.uri);
        return;
      }
      let finalPath = response.uri;
      // Tenta mover para a pasta de downloads do dispositivo (Android)
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(response.uri, { encoding: FileSystem.EncodingType.Base64 });
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          finalPath = uri;
          Alert.alert(
            isEnglish ? 'File downloaded!' : 'Arquivo baixado!',
            isEnglish ? 'Saved on device!' : 'Salvo no celular!'
          );
          return;
        } else {
          Alert.alert(
            isEnglish ? 'Permission denied' : 'Permissão negada',
            isEnglish ? 'Could not save to Downloads. File remains in app cache.' : 'Não foi possível salvar em Downloads. O arquivo está no cache do app.'
          );
        }
      }
      // iOS ou fallback
      Alert.alert(
        isEnglish ? 'File downloaded!' : 'Arquivo baixado!',
        (isEnglish ? 'Saved at: ' : 'Salvo em: ') + finalPath +
          (isEnglish ? '\nOpen it manually with a PDF reader.' : '\nAbra manualmente com um leitor de PDF.')
      );
    } catch (e) {
      Alert.alert(
        isEnglish ? 'Error downloading file' : 'Erro ao baixar arquivo',
        (e instanceof Error ? e.message : String(e))
      );
    }
  };

  // Função para deletar PDF
  const handleDelete = async (id_arquivo: number) => {
    Alert.alert(
      t.deletar,
      t.confirmDelete,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: t.deletar,
          style: 'destructive',
          onPress: async () => {
            try {
              const resp = await fetch(`${process.env.IP_CELULAR || ''}/api/tarefa/arquivo/${id_arquivo}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!resp.ok) throw new Error('Delete failed');
              Alert.alert(t.sucessoDelete);
              fetchArquivos();
            } catch {
              Alert.alert(t.erroDelete);
            }
          },
        },
      ]
    );
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
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      {/* Header removido */}
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
        {/* SUBTAREFAS */}
        <View style={{ marginTop: 18, marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#8B4513', fontSize: 18, marginBottom: 6 }}>
            {isEnglish ? 'Subtasks' : 'Subtarefas'}
          </Text>
          {loadingSub ? (
            <Text style={{ color: '#8B4513' }}>{isEnglish ? 'Loading...' : 'Carregando...'}</Text>
          ) : subtarefas.length === 0 ? (
            <Text style={{ color: '#8B4513' }}>{isEnglish ? 'No subtasks.' : 'Nenhuma subtarefa.'}</Text>
          ) : (
            subtarefas.map((sub) => (
              <View key={sub.id_tarefa} style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 6, borderColor: '#8B4513', borderWidth: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#8B4513' }}>{sub.titulo}</Text>
                <Text style={{ color: '#8B4513' }}>{sub.status}</Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={{ backgroundColor: '#8B4513', borderRadius: 5, paddingVertical: 10, alignItems: 'center', marginTop: 8 }}
            onPress={() => navigation.navigate('CriaTarefa', { id_pai: tarefaId })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{isEnglish ? 'Add Subtask' : 'Adicionar Subtarefa'}</Text>
          </TouchableOpacity>
        </View>
        {/* ANEXOS PDF */}
        <View style={{ marginTop: 18, marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#8B4513', fontSize: 18, marginBottom: 6 }}>
            {t.anexos}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#8B4513', borderRadius: 5, paddingVertical: 10, alignItems: 'center', marginBottom: 8 }}
            onPress={handleUploadPdf}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t.addPdf}</Text>
          </TouchableOpacity>
          {loadingArquivos ? (
            <Text style={{ color: '#8B4513' }}>{t.carregandoArquivos}</Text>
          ) : arquivos.length === 0 ? (
            <Text style={{ color: '#8B4513' }}>{t.nenhumArquivo}</Text>
          ) : (
            arquivos.map((arq) => (
              <View key={arq.id_arquivo} style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 6, borderColor: '#8B4513', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#8B4513', flex: 1 }}>{arq.nome_arquivo}</Text>
                <TouchableOpacity onPress={() => handleDownload(arq.caminho_servidor)} style={{ marginRight: 12 }}>
                  <Text style={{ color: '#007bff', fontWeight: 'bold' }}>{t.baixar}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(arq.id_arquivo)}>
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>{t.deletar}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
          <Text style={styles.botaoVoltarText}>{t.voltar}</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </View>
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
