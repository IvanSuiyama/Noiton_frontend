import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import Usuario from '../../models/Usuario';
import { IP_WIFI, IP_CELULAR } from '@env'; // Import the variable from .env
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useLanguage } from '@/context/LanguageContext';

export default function CriaUsuario() {
  const { isEnglish } = useLanguage();
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const translations = {
    pt: {
      title: 'Criar Usuário',
      cpf: 'CPF',
      nome: 'Nome',
      email: 'E-mail',
      senha: 'Senha',
      telefone: 'Telefone',
      criar: 'Criar Usuário',
      placeholderNome: 'Digite o nome',
      placeholderEmail: 'Digite o e-mail',
      placeholderSenha: 'Digite a senha',
      placeholderTelefone: 'Digite o telefone',
    },
    en: {
      title: 'Create User',
      cpf: 'CPF',
      nome: 'Name',
      email: 'Email',
      senha: 'Password',
      telefone: 'Phone',
      criar: 'Create User',
      placeholderNome: 'Enter name',
      placeholderEmail: 'Enter email',
      placeholderSenha: 'Enter password',
      placeholderTelefone: 'Enter phone',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  const validarCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    const calcDV = (cpf: string, factor: number): number => {
      let total = 0;
      for (let i = 0; i < factor - 1; i++) {
        total += parseInt(cpf[i]) * (factor - i);
      }
      const remainder = total % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const dv1 = calcDV(cpf, 10);
    const dv2 = calcDV(cpf, 11);
    return dv1 === parseInt(cpf[9]) && dv2 === parseInt(cpf[10]);
  };

  const handleCreateUser = async () => {
    if (!validarCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erro', 'E-mail inválido.');
      return;
    }

    try {
      // Verifica se o e-mail já está cadastrado
      const response = await fetch(
        `${IP_CELULAR}/api/usuario/list`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      const usuarios: Usuario[] = await response.json();
      const emailExists = usuarios.some((usuario) => usuario.email === email);

      if (emailExists) {
        Alert.alert('Erro', 'E-mail já cadastrado.');
        return;
      }

      // Cria o novo usuário
      const novoUsuario = {
        cpf,
        nome,
        email,
        senha,
        telefone,
      };

      const createResponse = await fetch(
        `${IP_CELULAR}/api/usuario`, // Use the IP_WIFI variable
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novoUsuario),
        }
      );

      if (!createResponse.ok) {
        const errorMessage = await createResponse.text();
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      setCpf('');
      setNome('');
      setEmail('');
      setSenha('');
      setTelefone('');
      // Redireciona para a tela HomePage após cadastro
      navigation.navigate('HomePage');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.label, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]}>{t.title}</Text>
        <Text style={styles.label}>{t.cpf}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.placeholderNome}
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
        />

        <Text style={styles.label}>{t.nome}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.placeholderNome}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>{t.email}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.placeholderEmail}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>{t.senha}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.placeholderSenha}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={true}
        />

        <Text style={styles.label}>{t.telefone}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.placeholderTelefone}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        {/* <Button title={t.criar} onPress={handleCreateUser} color="#8B4513" /> */}
        <TouchableOpacity
          style={{
            backgroundColor: '#8B4513',
            borderRadius: 5,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 16,
          }}
          onPress={handleCreateUser}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.criar}</Text>
        </TouchableOpacity>
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
});
