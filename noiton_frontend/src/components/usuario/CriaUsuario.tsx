import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Usuario from '../../models/Usuario';
import { IP_WIFI, IP_CELULAR } from '@env'; // Import the variable from .env

export default function CriaUsuario() {
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');

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
    console.log('handleCreateUser called'); // Log para depuração

    const baseURL = `${IP_WIFI}`; // Certifique-se de incluir o protocolo
    console.log(`Base URL: ${baseURL}`); // Log para verificar o endpoint

    if (!validarCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Erro', 'E-mail inválido.');
      return;
    }

    try {
      console.log('Fetching user list...'); // Log para depuração
      const response = await fetch(
        `${baseURL}/api/usuario/list`, // Use baseURL com protocolo
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Error fetching user list:', errorMessage); // Log de erro
        throw new Error(errorMessage);
      }

      const usuarios: Usuario[] = await response.json();
      const emailExists = usuarios.some((usuario) => usuario.email === email);

      if (emailExists) {
        Alert.alert('Erro', 'E-mail já cadastrado.');
        return;
      }

      console.log('Creating new user...'); // Log para depuração
      const novoUsuario: Omit<Usuario, 'id_workspace'> = {
        cpf,
        nome,
        email,
        senha,
        telefone,
      };

      const createResponse = await fetch(
        `${baseURL}/api/usuario`, // Use baseURL com protocolo
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
        console.error('Error creating user:', errorMessage); // Log de erro
        throw new Error(errorMessage);
      }

      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      setCpf('');
      setNome('');
      setEmail('');
      setSenha('');
      setTelefone('');
    } catch (error) {
      console.error('Network or server error:', error); // Log de erro
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Erro de conexão: ${errorMessage}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o CPF"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={true}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <Button title="Cadastrar Usuário" onPress={handleCreateUser} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000', // Texto preto
  },
  input: {
    height: 40,
    borderColor: 'rgba(255, 255, 255, 0.5)', // Borda branca transparente
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
    color: '#000', // Texto preto
  },
});
