import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HamburgerMenu from '../menu/HamburguerMenu';
import PopUpUser from './PopUpUser';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useIsFocused } from '@react-navigation/native';

export default function TelaPrincipal() {
  const [isPopUpVisible, setPopUpVisible] = useState(false);
  const { userCpf } = useUserContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleAvatarPress = () => {
    setPopUpVisible(true);
  };

  const handleCriarTarefa = () => {
    navigation.navigate('CriaTarefa'); // Ajuste o nome da rota conforme seu projeto
  };

  // Dica do dia - carrossel automático
  const dicas = [
    'Dica: Use categorias para organizar melhor suas tarefas!',
    'Dica: Priorize as tarefas mais importantes primeiro.',
    'Dica: Marque as tarefas concluídas para acompanhar seu progresso.',
    'Dica: Divida grandes tarefas em pequenas etapas para facilitar.',
    'Dica: Reserve um tempo do seu dia para revisar suas tarefas.'
  ];
  const [dicaIndex, setDicaIndex] = useState(Math.floor(Math.random() * dicas.length));
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % dicas.length);
    }, 9000); // 9 segundos
    return () => clearInterval(interval);
  }, []);
  const isFocused = useIsFocused();
  React.useEffect(() => {
    setDicaIndex(Math.floor(Math.random() * dicas.length));
  }, [isFocused]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Menu Sanduíche */}
        <HamburgerMenu />

        {/* Ícone de Avatar */}
        <TouchableOpacity style={styles.avatarButton} onPress={handleAvatarPress}>
          <MaterialIcons name="account-circle" size={40} color="#000" />
        </TouchableOpacity>

        {/* PopUpUser */}
        <PopUpUser visible={isPopUpVisible} onClose={() => setPopUpVisible(false)} />

        {/* Mensagem de boas-vindas personalizada com ícone de calendário */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <MaterialIcons name="calendar-today" size={38} color="#8B4513" style={{ marginRight: 10 }} />
            <Text style={styles.welcomeText}>Organize seu dia. Faça acontecer.</Text>
          </View>
        </View>

        {/* Mensagem motivacional e botão de criar tarefa */}
        <View style={styles.criarTarefaContainer}>
          <Text style={styles.criarTarefaMsg}>
            Não seja tímido, pode criar quantas tarefas quiser!
          </Text>
          <TouchableOpacity style={styles.criarTarefaButton} onPress={handleCriarTarefa}>
            <Text style={styles.criarTarefaButtonText}>Criar Nova Tarefa</Text>
          </TouchableOpacity>
        </View>

        {/* Dica do dia */}
        <View style={styles.dicaContainer}>
          <Text style={styles.dicaTitle}>Dica do dia</Text>
          <Text style={styles.dicaText}>{dicas[dicaIndex]}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5dc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    paddingBottom: 30,
    minHeight: '100%',
  },
  avatarButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  welcomeContainer: {
    marginTop: 120,
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    width: '100%',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'left',
  },
  criarTarefaContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  criarTarefaMsg: {
    fontSize: 22,
    color: '#8B4513',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  criarTarefaButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  criarTarefaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dicaContainer: {
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 18,
    marginTop: 40, // aumenta o espaço acima
    padding: 14,
    borderWidth: 1,
    borderColor: '#e6c200',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  dicaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bfa100',
    marginBottom: 4,
    textAlign: 'center',
  },
  dicaText: {
    fontSize: 15,
    color: '#8B4513',
    textAlign: 'center',
  },
});
