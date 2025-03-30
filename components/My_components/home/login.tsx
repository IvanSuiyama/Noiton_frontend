import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/routes/Route'; // Importação do tipo RootStackParamList

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>(); // Tipagem do useNavigation

  const handleLogin = async () => {
    try {
      console.log('Tentando login com:', { email, senha: password });

      const response = await fetch('http://192.168.15.12:4000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
      });

      console.log('Resposta do servidor:', response.status);

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Erro na resposta:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);

      if (data.token) { // Verifica se o token foi retornado
        Alert.alert('Login bem-sucedido', 'Bem-vindo!');
        navigation.navigate('TelaPrincipal'); // Redireciona para TelaPrincipal
      } else {
        Alert.alert('Erro no login', 'Email ou senha incorretos.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no login:', errorMessage);
      Alert.alert('Erro no login', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu email"
        placeholderTextColor="#000"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Digite sua senha"
        placeholderTextColor="#000"
        secureTextEntry={true} // Oculta o texto com asteriscos
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonContainer}>
        <Button title="Entrar" onPress={handleLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5dc', // Cor de fundo bege
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'transparent', // Campo transparente
    color: '#000', // Texto preto
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});
