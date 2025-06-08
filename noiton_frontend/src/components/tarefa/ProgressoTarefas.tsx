import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { IP_CELULAR } from '@env';
import { useLanguage } from '@/context/LanguageContext';
import * as FileSystem from 'expo-file-system';
import { jsPDF } from 'jspdf';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker';

// Barra de progresso simples
function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

export default function ProgressoTarefas() {
  const { token } = useAuth();
  const { userCpf } = useUserContext();
  const { isEnglish } = useLanguage();
  const [total, setTotal] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estado para data customizada
  const [periodo, setPeriodo] = useState<'dia' | 'mes' | 'ano'>('dia');

  const labels = {
    pt: {
      tarefas: 'tarefas concluídas',
      de: 'de',
    },
    en: {
      tarefas: 'tasks completed',
      de: 'of',
    }
  };
  const t = isEnglish ? labels.en : labels.pt;

  // Remove o input de data, sempre usa o valor atual do sistema
  // Função para parsear a data do input (agora ignora dataInput)
  function parseDataInput() {
    const now = new Date();
    if (periodo === 'dia') {
      return { dia: now.getDate(), mes: now.getMonth() + 1, ano: now.getFullYear() };
    } else if (periodo === 'mes') {
      return { mes: now.getMonth() + 1, ano: now.getFullYear() };
    } else if (periodo === 'ano') {
      return { ano: now.getFullYear() };
    }
    return { dia: 1, mes: 1, ano: 1970 };
  }

  // Calcula datas de início/fim do período baseado no valor atual
  function getPeriodoRange(periodo: 'dia' | 'mes' | 'ano') {
    const { dia = 1, mes = 1, ano = 1970 } = parseDataInput();
    if (periodo === 'dia') {
      const start = new Date(ano, mes - 1, dia);
      const end = new Date(ano, mes - 1, dia + 1);
      return { start, end };
    } else if (periodo === 'mes') {
      const start = new Date(ano, mes - 1, 1);
      const end = new Date(ano, mes, 1);
      return { start, end };
    } else if (periodo === 'ano') {
      const start = new Date(ano, 0, 1);
      const end = new Date(ano + 1, 0, 1);
      return { start, end };
    }
    return { start: new Date(), end: new Date() };
  }

  // Função para pegar só a parte da data (yyyy-mm-dd) e criar Date local
  function parseBackendDate(str: string) {
    if (!str) return null;
    // Aceita formatos 'yyyy-mm-dd' ou 'yyyy-mm-dd hh:mm:ss'
    const [datePart] = str.split(' ');
    const [ano, mes, dia] = datePart.split('-').map(Number);
    if (!ano || !mes || !dia) return null;
    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  useEffect(() => {
    const fetchProgresso = async () => {
      if (!token || !userCpf) return;
      setLoading(true);
      try {
        const resp = await fetch(`${IP_CELULAR}/api/usuario/progresso?cpf=${userCpf}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        const { start, end } = getPeriodoRange(periodo);
        // datas_criacao, status_tarefas são arrays paralelos
        let total = 0;
        let concluidas = 0;
        for (let i = 0; i < (data.datas_criacao || []).length; i++) {
          const criacao = parseBackendDate(data.datas_criacao[i]);
          if (!criacao) continue;
          if (criacao >= start && criacao < end) {
            total++;
            if (data.status_tarefas && data.status_tarefas[i] === 'concluida') {
              concluidas++;
            }
          }
        }
        setTotal(total);
        setConcluidas(concluidas);
      } catch {
        setTotal(0); setConcluidas(0);
      } finally {
        setLoading(false);
      }
    };
    fetchProgresso();
  }, [token, userCpf, periodo]);

  // Função para gerar e salvar PDF do progresso
  const handleGerarPdf = async () => {
    try {
      const doc = new jsPDF();
      const periodoLabel = t.de.toUpperCase();
      doc.setFontSize(18);
      doc.text(isEnglish ? 'Task Progress Report' : 'Relatório de Progresso de Tarefas', 14, 20);
      doc.setFontSize(13);
      doc.text(`${isEnglish ? 'Period:' : 'Período:'} ${periodoLabel}`, 14, 35);
      doc.text(`${isEnglish ? 'Completed:' : 'Concluídas:'} ${concluidas}`, 14, 45);
      doc.text(`${isEnglish ? 'Total:' : 'Total:'} ${total}`, 14, 55);
      doc.text(`${isEnglish ? 'Date:' : 'Data:'} ${new Date().toLocaleDateString()}`, 14, 65);
      doc.setFontSize(11);
      doc.text(
        isEnglish
          ? 'This report shows your task completion progress for the selected period.'
          : 'Este relatório mostra seu progresso de conclusão de tarefas para o período selecionado.',
        14,
        75
      );
      // Gera o PDF em base64 (compatível com React Native)
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `progresso_tarefas_${Date.now()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
      // Abre o diálogo de compartilhamento para o usuário escolher onde salvar
      await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert(isEnglish ? 'Error' : 'Erro', isEnglish ? 'Failed to generate PDF.' : 'Falha ao gerar PDF.');
    }
  };

  // UI para seleção de período (sem input de data)
  const periodos: Array<'dia' | 'mes' | 'ano'> = ['dia', 'mes', 'ano'];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.titulo}>{isEnglish ? 'Progress' : 'Progresso'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {periodos.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.switchButton, periodo === p && styles.switchButtonAtivo]}
                onPress={() => setPeriodo(p as 'dia' | 'mes' | 'ano')}
              >
                <Text style={[styles.switchButtonText, periodo === p && styles.switchButtonTextAtivo]}>
                  {p === 'dia' ? (isEnglish ? 'Day' : 'Dia') : p === 'mes' ? (isEnglish ? 'Month' : 'Mês') : (isEnglish ? 'Year' : 'Ano')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleGerarPdf}
            accessibilityLabel={isEnglish ? 'Generate PDF' : 'Gerar PDF'}
          >
            <Text style={styles.pdfButtonText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Sem input de data, só mostra progresso */}
      <View style={styles.progressInfoRow}>
        {loading ? (
          <Text style={styles.progressInfoText}>...</Text>
        ) : total === 0 ? (
          <Text style={styles.progressInfoText}>
            {isEnglish
              ? 'No tasks for this period. Add new tasks!'
              : 'Nenhuma tarefa para este período. Adicione novas tarefas!'}
          </Text>
        ) : (
          <Text style={styles.progressInfoText}>
            {`${concluidas} ${t.de} ${total} ${t.tarefas}`}
          </Text>
        )}
      </View>
      <ProgressBar progress={total === 0 ? 0 : concluidas / total} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5ecd2',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 30, // aumentado para descer o container
    padding: 14,
    borderWidth: 1,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  progressInfoRow: {
    marginBottom: 8,
    marginTop: 2,
  },
  progressInfoText: {
    color: '#8B4513',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#e6cfa6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 16,
    backgroundColor: '#8B4513',
    borderRadius: 8,
  },
  pdfButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  switchButton: {
    backgroundColor: '#f7f3e6',
    borderColor: '#8B4513',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonAtivo: {
    backgroundColor: '#8B4513',
  },
  switchButtonText: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 14,
  },
  switchButtonTextAtivo: {
    color: '#fff',
  },
});
