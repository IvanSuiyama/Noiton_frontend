import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useUserContext } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { IP_WIFI, IP_CELULAR } from '@env'; // Import the variable from .env
import { useNavigation, CommonActions } from '@react-navigation/native'; // Import navigation hook and CommonActions

export default function EditaUsuario() {
  const { userCpf } = useUserContext(); // Obtém o CPF do contexto
  const { isEnglish } = useLanguage();
  const navigation = useNavigation(); // Initialize navigation
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState(''); // Add state to store the existing password
  const [senhaAlterada, setSenhaAlterada] = useState(false); // Novo estado para rastrear alterações na senha

  useEffect(() => {
    if (userCpf) {
      fetchUserData(userCpf);
    }
  }, [userCpf]);

  const fetchUserData = async (cpf: string) => {
    try {
      const response = await fetch(`${IP_CELULAR}/api/usuario/${cpf}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      const usuario = await response.json();
      setNome(usuario.nome);
      setEmail(usuario.email);
      setTelefone(usuario.telefone);
      setSenha(''); // Reseta a senha para evitar envio desnecessário
      setSenhaAlterada(false); // Reseta o estado de alteração da senha
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  const handleUpdateUser = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erro', 'E-mail inválido.');
      return;
    }

    try {
      const updatedUsuario = {
        cpf: userCpf,
        nome,
        email,
        telefone,
        ...(senhaAlterada && { senha }), // Inclui a senha apenas se ela foi alterada
      };

      const response = await fetch(`${IP_CELULAR}/api/usuario/${userCpf}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUsuario),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Usuário atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'TelaPrincipal' }], // Reset stack to TelaPrincipal
              })
            ),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  const translations = {
    pt: {
      title: 'Editar Usuário',
      cpf: 'CPF',
      nome: 'Nome',
      email: 'E-mail',
      telefone: 'Telefone',
      senha: 'Senha',
      salvar: 'Salvar',
    },
    en: {
      title: 'Edit User',
      cpf: 'CPF',
      nome: 'Name',
      email: 'Email',
      telefone: 'Phone',
      senha: 'Password',
      salvar: 'Save',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>{t.title}</Text>
        <Text style={styles.label}>{t.cpf}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#e0e0e0' }]} // Campo readonly com fundo cinza
          value={userCpf || ''}
          editable={false} // CPF é somente leitura
        />

        <Text style={styles.label}>{t.nome}</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o nome"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>{t.email}</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>{t.telefone}</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>{t.senha}</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <View style={styles.buttonContainer}>
          <Button title={t.salvar} onPress={handleUpdateUser} color="#8B4513" /> {/* Botão marrom */}
        </View>
      </ScrollView>
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
    maxWidth: 500,
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
  buttonContainer: {
    marginTop: 15,
  },
});


