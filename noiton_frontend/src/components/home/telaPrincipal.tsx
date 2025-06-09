import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HamburgerMenu from '../menu/HamburguerMenu';
import PopUpUser from './PopUpUser';
import { IP_CELULAR } from '@env';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useIsFocused } from '@react-navigation/native';
import { useLanguage } from '@/context/LanguageContext';
import { useMonitorarTarefasVencimentoDetalhado } from '../notification/NotificationManager';
import ProgressoTarefas from '../tarefa/ProgressoTarefas';

export default function TelaPrincipal() {
  const [isPopUpVisible, setPopUpVisible] = useState(false);
  const { token } = useAuth();
  const { userCpf } = useUserContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isEnglish, setIsEnglish } = useLanguage();

  const translations = {
    pt:{
      welcome: 'Organize seu dia. Faça acontecer.',
      // Removido createTask e createTaskButton
      dailyTip: 'Dica do dia',
      tips:[
        'Dica: Use categorias para organizar melhor suas tarefas!',
        'Dica: Priorize as tarefas mais importantes primeiro.',
        'Dica: Marque as tarefas concluídas para acompanhar seu progresso.',
        'Dica: Divida grandes tarefas em pequenas etapas para facilitar.',
        'Dica: Reserve um tempo do seu dia para revisar suas tarefas.'
      ]
    },
    en: {
      welcome: 'Organize your day. Make it happen.',
      // Removido createTask e createTaskButton
      dailyTip: 'Tip of the day',
      tips: [
        'Tip: Use categories to better organize your tasks!',
        'Tip: Prioritize the most important tasks first.',
        'Tip: Mark completed tasks to track your progress.',
        'Tip: Break down large tasks into smaller steps for easier management.',
        'Tip: Set aside time each day to review your tasks.'
      ]
    }
  };

  const dicas = isEnglish ? translations.en.tips : translations.pt.tips;
  const [dicaIndex, setDicaIndex] = useState(Math.floor(Math.random() * dicas.length));
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % dicas.length);
    }, 9000); // 9 segundos
    return () => clearInterval(interval);
  }, [dicas.length]);
  const isFocused = useIsFocused();
  React.useEffect(() => {
    setDicaIndex(Math.floor(Math.random() * dicas.length));
  }, [isFocused, dicas.length]);

  const handleAvatarPress = () => {
    setPopUpVisible(true);
  };

  const handleCriarTarefa = () => {
    navigation.navigate('CriaTarefa'); // Ajuste o nome da rota conforme seu projeto
  };

  // Estados para rotinas e tarefas comuns
  const [rotinasHoje, setRotinasHoje] = useState<any[]>([]);
  const [tarefasRecentes, setTarefasRecentes] = useState<any[]>([]);

  // Tradução dos dias da semana
  const diasSemanaPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  const diasSemanaEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const diasSemanaApi = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  // Pega o dia da semana atual
  const hoje = new Date();
  const diaSemanaIndex = hoje.getDay(); // 0 (domingo) a 6 (sábado)
  const diaSemanaNome = isEnglish ? diasSemanaEn[diaSemanaIndex] : diasSemanaPt[diaSemanaIndex];
  const diaSemanaApi = diasSemanaApi[diaSemanaIndex];

  // Buscar rotinas do usuário e filtrar para hoje
  useEffect(() => {
    const fetchRotinas = async () => {
      if (!token || !userCpf) return;
      try {
        const resp = await fetch(`${IP_CELULAR}/api/rotinas?cpf=${userCpf}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        // Filtra rotinas ativas, não expiradas, que tenham o dia da semana de hoje e já estejam criadas (data_criacao <= hoje)
        const hojeDate = new Date();
        const hojeISO = hojeDate.toISOString().slice(0, 10); // yyyy-mm-dd
        let rotinasHoje = Array.isArray(data)
          ? data.filter((r) => {
              if (!r.ativa) return false;
              if (r.data_fim && r.data_fim < hojeISO) return false;
              if (typeof r.dias_semana !== 'string') return false;
              const dias = (r.dias_semana as string).split(',').map((s: string) => s.trim().toLowerCase());
              if (!dias.includes(diaSemanaApi)) return false;
              // Considera rotina criada hoje: data_criacao <= hoje
              const dataCriacao = r.data_criacao || r.data_inicio || r.createdAt;
              if (dataCriacao) {
                const dataCriacaoISO = new Date(dataCriacao).toISOString().slice(0, 10);
                if (dataCriacaoISO > hojeISO) return false;
              }
              return true;
            })
          : [];
        // Remove duplicadas por id_rotina
        rotinasHoje = rotinasHoje.filter(
          (r, idx, arr) => r.id_rotina != null && arr.findIndex(x => x.id_rotina === r.id_rotina) === idx
        );
        setRotinasHoje(rotinasHoje);
      } catch {
        setRotinasHoje([]);
      }
    };
    fetchRotinas();
  }, [token, userCpf, diaSemanaApi]);

  // Buscar tarefas comuns (não rotinas) e pegar as 3 mais recentes
  useEffect(() => {
    const fetchTarefas = async () => {
      if (!token || !userCpf) return;
      try {
        const resp = await fetch(`${IP_CELULAR}/api/tarefa/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        // Filtra tarefas que não têm id_rotina (ou campo similar, ajuste conforme seu backend)
        let comuns = Array.isArray(data)
          ? data.filter((t: any) => !t.id_rotina && !t.id_pai)
          : [];
        // Remove duplicatas por id_tarefa (forçando string)
        const seen = new Set<string>();
        const comunsUnicas: typeof comuns = [];
        for (const t of comuns) {
          const idStr = String(t.id_tarefa);
          if (!seen.has(idStr)) {
            seen.add(idStr);
            comunsUnicas.push(t);
          }
        }
        // Ordena por data_inicio decrescente e pega as 3 mais recentes
        comunsUnicas.sort((a: any, b: any) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
        // Loga ids e chaves para depuração
        const ids = comunsUnicas.map(t => String(t.id_tarefa));
        const duplicados = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        if (duplicados.length > 0) {
          console.warn('IDs de tarefas recentes duplicados detectados:', duplicados);
        }
        const renderKeys = comunsUnicas.map((t, idx) => `tarefa_${t.id_tarefa}_${idx}`);
        console.log('Chaves usadas para renderização das tarefas recentes:', renderKeys);
        setTarefasRecentes(comunsUnicas.slice(0, 3));
      } catch {
        setTarefasRecentes([]);
      }
    };
    fetchTarefas();
  }, [token, userCpf]);

  useMonitorarTarefasVencimentoDetalhado();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Menu Sanduíche */}
        <HamburgerMenu />
        {/* Cabeçalho de ícones (avatar e idioma) */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setIsEnglish(!isEnglish)}
          >
            <Text style={styles.languageButtonText}>
              {isEnglish ? "PT" : "EN"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={handleAvatarPress}>
            <MaterialIcons name="account-circle" size={40} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Espaço para afastar do topo/fixar containers abaixo dos ícones */}
        <View style={{ height: 20 }} />

        {/* Barra de Progresso de Tarefas */}
        <ProgressoTarefas />

        {/* Calendário e dia da semana destacado */}
        <View style={styles.calendarioDiaSemanaRow}>
          <MaterialIcons name="calendar-today" size={28} color="#8B4513" style={{ marginRight: 10 }} />
          <Text style={styles.calendarioDiaSemanaSimples}>
            {diaSemanaNome}
          </Text>
        </View>

        {/* Container do dia da semana e rotinas de hoje */}
        <View style={styles.diaSemanaContainer}>
          <Text style={styles.diaSemanaSubtitulo}>
            {isEnglish ? 'Routines for today:' : 'Rotinas para hoje:'}
          </Text>
          {rotinasHoje.length === 0 ? (
            <Text style={styles.diaSemanaVazio}>
              {isEnglish ? 'No routines for today.' : 'Nenhuma rotina para hoje.'}
            </Text>
          ) : (
            rotinasHoje.map((rotina, idx) => (
              <View key={`rotina_${rotina.id_rotina}`} style={styles.rotinaItem}>
                <Text style={styles.rotinaTitulo}>
                  {isEnglish ? 'Routine:' : 'Rotina:'} {rotina.titulo || rotina.nome || rotina.id_tarefa_base}
                </Text>
                <Text style={styles.rotinaDias}>
                  {isEnglish ? 'Days:' : 'Dias:'} {rotina.dias_semana}
                </Text>
                {rotina.data_fim && (
                  <Text style={styles.rotinaDias}>
                    {isEnglish ? 'End:' : 'Fim:'} {new Date(rotina.data_fim).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Container das 3 tarefas comuns mais recentes */}
        <View style={styles.recentesContainer}>
          <Text style={styles.recentesTitulo}>
            {isEnglish ? 'Most Recent Tasks' : 'Tarefas Mais Recentes'}
          </Text>
          {tarefasRecentes.length === 0 ? (
            <Text style={styles.recentesVazio}>
              {isEnglish ? 'No recent tasks.' : 'Nenhuma tarefa recente.'}
            </Text>
          ) : (
            tarefasRecentes.map((tarefa, idx) => (
              <TouchableOpacity
                key={`tarefa_${tarefa.id_tarefa}_${idx}`}
                style={styles.tarefaItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('DetalhesTarefa', { tarefa })}
              >
                <Text style={styles.tarefaTitulo}>{tarefa.titulo}</Text>
                <Text style={styles.tarefaData}>
                  {isEnglish ? 'Created:' : 'Criada:'} {new Date(tarefa.data_inicio).toLocaleDateString()}
                </Text>
                <Text style={{ color: '#8B4513', fontSize: 13, marginTop: 2, fontWeight: 'bold' }}>
                  {isEnglish ? 'Details' : 'Detalhes'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Pequeno espaço antes do bloco de boas-vindas */}
        <View style={{ height: 8 }} />

        {/* Dica do dia */}
        <View style={styles.dicaContainer}>
          <Text style={styles.dicaTitle}>{isEnglish ? translations.en.dailyTip : translations.pt.dailyTip}</Text>
          <Text style={styles.dicaText}>{dicas[dicaIndex]}</Text>
        </View>
        {/* Espaço extra para garantir scroll até o final */}
        <View style={{ height: 90 }} />
      </ScrollView>
      {/* Rodapé para cobrir botões de navegação do Android */}
      <View style={styles.androidFooter} />
      {/* PopUpUser permanece fora do ScrollView */}
      <PopUpUser visible={isPopUpVisible} onClose={() => setPopUpVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5dc',
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    minHeight: '100%',
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48, // reduzido para alinhar verticalmente com o menu
    height: 48, // altura fixa para alinhar centro
    marginBottom: 0,
  },
  avatarButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48, // igual ao headerIcons
  },
  languageButton: {
    backgroundColor: '#fffbe6',
    borderColor: '#8B4513',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    height: 36, // altura para centralizar texto
    marginTop: 0,
  },
  languageButtonText: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textAlignVertical: 'center',
    height: 36, // igual ao botão para centralizar
    lineHeight: 36, // centraliza verticalmente
  },
  dicaContainer: {
    backgroundColor: '#fffbe6', // fundo mais claro e suave
    borderRadius: 16, // mais arredondado
    marginHorizontal: 20,
    marginBottom: 18,
    marginTop: 18, // menos espaço superior
    paddingVertical: 22, // mais espaçamento interno
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e6c200', // borda mais suave
    shadowColor: '#000',
    shadowOpacity: 0.07, // sombra mais sutil
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  dicaTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#bfa100', // cor mais suave
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dicaText: {
    fontSize: 15.5,
    color: '#8B4513',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  calendarioDiaSemanaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 10,
  },
  calendarioDiaSemanaSimples: {
    fontSize: 40,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  diaSemanaContainer: {
    backgroundColor: '#f5ecd2',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6c200',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  diaSemanaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
    textAlign: 'left',
  },
  diaSemanaSubtitulo: {
    fontSize: 15,
    color: '#bfa100',
    marginBottom: 4,
    textAlign: 'left',
  },
  diaSemanaVazio: {
    fontSize: 14,
    color: '#8B4513',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  rotinaItem: {
    marginBottom: 6,
    backgroundColor: '#f5f5dc',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e6c200',
    width: '100%',
  },
  rotinaTitulo: {
    fontWeight: 'bold',
    color: '#8B4513',
    fontSize: 15,
  },
  rotinaDias: {
    color: '#8B4513',
    fontSize: 13,
  },
  recentesContainer: {
    backgroundColor: '#f5ecd2',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 3,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  recentesTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
    textAlign: 'left',
  },
  recentesVazio: {
    fontSize: 14,
    color: '#8B4513',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  tarefaItem: {
    marginBottom: 6,
    backgroundColor: '#f5f5dc',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    width: '100%',
  },
  tarefaTitulo: {
    fontWeight: 'bold',
    color: '#8B4513',
    fontSize: 15,
  },
  tarefaData: {
    color: '#8B4513',
    fontSize: 13,
  },
  androidFooter: {
    height: 32,
    backgroundColor: '#8B4513', // marrom dos botões
    width: '100%',
  },
  // Removidos: criarTarefaContainer, criarTarefaMsg, criarTarefaButton, criarTarefaButtonText, welcomeContainer, welcomeRow, welcomeText
});
