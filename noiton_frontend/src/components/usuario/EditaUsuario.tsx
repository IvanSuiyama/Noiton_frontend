import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useUserContext } from '@/context/UserContext';
import { IP_WIFI } from '@env'; // Import the variable from .env
import { useNavigation, CommonActions } from '@react-navigation/native'; // Import navigation hook and CommonActions

export default function EditaUsuario() {
  const { userCpf } = useUserContext(); // Obtém o CPF do contexto
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
      const response = await fetch(`${IP_WIFI}/api/usuario/${cpf}`, {
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

      const response = await fetch(`${IP_WIFI}/api/usuario/${userCpf}`, {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#e0e0e0' }]} // Campo readonly com fundo cinza
            value={userCpf || ''}
            editable={false} // CPF é somente leitura
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

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <View style={styles.buttonContainer}>
            <Button title="Atualizar Usuário" onPress={handleUpdateUser} color="#8B4513" /> {/* Botão marrom */}
          </View>
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
    color: '#8B4513', // Texto marrom
  },
  input: {
    height: 40,
    borderColor: '#8B4513', // Borda marrom
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff', // Fundo branco
    color: '#000', // Texto preto
  },
  buttonContainer: {
    marginTop: 15,
  },
});


