import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, Alert } from 'react-native';
import { useUserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; // Corrigir a importação
import Usuario from '@/models/Usuario';
import { IP_WIFI, IP_CELULAR } from '@env';
import Logoff from './Logoff';
import { useLanguage } from '@/context/LanguageContext';

interface PopUpUserProps {
  visible: boolean;
  onClose: () => void;
}

export default function PopUpUser({ visible, onClose }: PopUpUserProps) {
  const { userCpf } = useUserContext();
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [showLogoff, setShowLogoff] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { isEnglish } = useLanguage();

  const translations = {
    pt: {
      cpf: 'CPF',
      nome: 'Nome',
      email: 'E-mail',
      telefone: 'Telefone',
      editar: 'Editar',
      carregando: 'Carregando dados do usuário...',
      fechar: 'Fechar',
      logoff: 'LogOff',
    },
    en: {
      cpf: 'CPF',
      nome: 'Name',
      email: 'Email',
      telefone: 'Phone',
      editar: 'Edit',
      carregando: 'Loading user data...',
      fechar: 'Close',
      logoff: 'LogOff',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  useEffect(() => {
    if (visible && userCpf) {
      console.log('Buscando dados do usuário com CPF:', userCpf); // Log para depuração
      fetchUserData(userCpf);
    } else if (visible) {
      console.warn('CPF do usuário não está disponível.');
    }
  }, [visible, userCpf]);

  const fetchUserData = async (cpf: string) => {
    try {
      if (!cpf) {
        console.error('CPF inválido ou ausente.');
        throw new Error('CPF inválido ou ausente.');
      }

      const url = `${IP_CELULAR}/api/usuario/${cpf}`;
      console.log('URL da requisição:', url); // Log da URL para depuração

      const response = await fetch(url);
      console.log('Status da resposta:', response.status); // Log do status da resposta

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', errorText); // Log do erro detalhado
        throw new Error(`Erro ao buscar dados do usuário: ${response.status} - ${errorText}`);
      }

      const data: Usuario = await response.json();
      console.log('Dados do usuário recebidos:', data); // Log dos dados recebidos

      if (!data || !data.nome || !data.email || !data.cpf) {
        console.error('Dados do usuário incompletos ou inválidos:', data);
        throw new Error('Dados do usuário incompletos ou inválidos.');
      }

      setUserData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao buscar dados do usuário:', errorMessage); // Log do erro
      Alert.alert('Erro', errorMessage);
    }
  };

  if (showLogoff) {
    return <Logoff />;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          {userData ? (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.labelBold}>{t.cpf}: </Text>
                <Text style={styles.label}>{userData.cpf}</Text>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.labelBold}>{t.nome}: </Text>
                <Text style={styles.label}>{userData.nome}</Text>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.labelBold}>{t.email}: </Text>
                <Text style={styles.label}>{userData.email}</Text>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.labelBold}>{t.telefone}: </Text>
                <Text style={styles.label}>{userData.telefone}</Text>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  title={t.editar}
                  onPress={() => navigation.navigate('EditaUsuario')}
                  color="#8B4513"
                />
              </View>
            </>
          ) : (
            <Text>{t.carregando}</Text>
          )}
          <View style={styles.buttonContainer}>
            <Button title={t.fechar} onPress={onClose} color="#8B4513" />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title={t.logoff}
              color="#B22222"
              onPress={() => setShowLogoff(true)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Posiciona no topo
    alignItems: 'flex-end', // Posiciona no canto superior direito
    padding: 20, // Espaçamento do canto
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
  },
  content: {
    width: '80%',
    padding: 20,
    backgroundColor: '#f5f5dc', // Fundo bege claro
    borderRadius: 10,
  },
  fieldContainer: {
    marginBottom: 10, // Aumentei o espaçamento entre os campos
  },
  label: {
    fontSize: 16,
    color: '#000', // Preto normal
  },
  labelBold: {
    fontSize: 16,
    fontWeight: 'bold', // Preto negrito
    color: '#000',
  },
  buttonContainer: {
    marginTop: 15, // Espaçamento maior entre os botões
  },
});
