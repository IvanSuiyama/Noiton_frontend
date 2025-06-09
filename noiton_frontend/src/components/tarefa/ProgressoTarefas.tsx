import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { IP_CELULAR } from '@env';
import { useLanguage } from '@/context/LanguageContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { jsPDF } from 'jspdf';

// Barra de progresso simples
function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

type Periodo = 'dia' | 'mes' | 'ano';

export default function ProgressoTarefas() {
  const { token } = useAuth();
  const { userCpf } = useUserContext();
  const { isEnglish } = useLanguage();
  const [periodo, setPeriodo] = useState<Periodo>('dia');
  const [total, setTotal] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [loading, setLoading] = useState(false);

  const labels = {
    pt: {
      dia: 'Dia', mes: 'Mês', ano: 'Ano',
      tarefas: 'tarefas concluídas',
      de: 'de',
    },
    en: {
      dia: 'Day', mes: 'Month', ano: 'Year',
      tarefas: 'tasks completed',
      de: 'of',
    }
  };
  const t = isEnglish ? labels.en : labels.pt;

  // Calcula datas de início/fim do período
  function getPeriodoRange(periodo: Periodo) {
    const now = new Date();
    if (periodo === 'dia') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    } else if (periodo === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    } else {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
  }

  useEffect(() => {
    const fetchTarefas = async () => {
      if (!token || !userCpf) return;
      setLoading(true);
      try {
        const resp = await fetch(`${IP_CELULAR}/api/tarefa/list?cpf=${userCpf}`,
          { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        const { start, end } = getPeriodoRange(periodo);
        // Filtra tarefas do período
        const tarefasPeriodo = Array.isArray(data)
          ? data.filter((t: any) => {
              if (!t.data_inicio) return false;
              const d = new Date(t.data_inicio);
              return d >= start && d < end && !t.id_pai;
            })
          : [];
        setTotal(tarefasPeriodo.length);
        setConcluidas(tarefasPeriodo.filter((t: any) => t.status === 'concluido').length);
      } catch {
        setTotal(0); setConcluidas(0);
      } finally {
        setLoading(false);
      }
    };
    fetchTarefas();
  }, [token, userCpf, periodo]);

  // Função para gerar e salvar PDF do progresso
  const handleGerarPdf = async () => {
    try {
      const doc = new jsPDF();
      const periodoLabel = t[periodo].toUpperCase();
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
      // Gera PDF em base64 e salva
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileUri = FileSystem.cacheDirectory + `progresso_tarefas_${periodo}_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert(isEnglish ? 'Error' : 'Erro', isEnglish ? 'Failed to generate PDF.' : 'Falha ao gerar PDF.');
    }
  };

  // Alternância de período: Dia/Mês/Ano
  const periodos: Periodo[] = ['dia', 'mes', 'ano'];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.titulo}>{isEnglish ? 'Progress' : 'Progresso'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.switchRow}>
            {periodos.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.switchButton, periodo === p && styles.switchButtonAtivo]}
                onPress={() => setPeriodo(p)}
              >
                <Text style={[styles.switchButtonText, periodo === p && styles.switchButtonTextAtivo]}>
                  {t[p]}
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
  switchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  switchButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
    marginLeft: 4,
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
});
