import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Use NativeStackNavigationProp
import type { RootStackParamList } from '@/routes/Route'; // Importação do tipo RootStackParamList
import { IP_WIFI, IP_CELULAR } from '@env'; // Importa a variável do .env
import { useUserContext } from '@/context/UserContext'; // Import the UserContext
import { useAuth } from '@/context/ApiContext'; // Importa o AuthContext
import { useLanguage } from '@/context/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // Remova o segundo parâmetro
  const { setUserCpf } = useUserContext(); // Access the context function to set CPF
  const { setToken } = useAuth(); // Pegue o setToken do contexto de autenticação
  const { isEnglish } = useLanguage();
  const translations = {
    pt: {
      login: 'Login',
      email: 'Digite seu email',
      senha: 'Digite sua senha',
      entrar: 'Entrar',
      sucesso: 'Login bem-sucedido',
      bemVindo: 'Bem-vindo!',
      erroLogin: 'Erro no login',
      erroDesconhecido: 'Erro desconhecido',
      dadosIncompletos: 'Dados incompletos retornados do servidor.',
    },
    en: {
      login: 'Login',
      email: 'Enter your email',
      senha: 'Enter your password',
      entrar: 'Sign In',
      sucesso: 'Login successful',
      bemVindo: 'Welcome!',
      erroLogin: 'Login error',
      erroDesconhecido: 'Unknown error',
      dadosIncompletos: 'Incomplete data returned from server.',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  const handleLogin = async () => {
    try {
      console.log('Tentando login com:', { email, senha: password });

      const response = await fetch(
        `${IP_CELULAR}/api/login`, // Utiliza a variável IP_WIFI
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, senha: password }),
        }
      );

      console.log('Resposta do servidor:', response.status);

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Erro na resposta:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);

      if (data.token && data.cpf) { // Verifica se o token e o CPF foram retornados
        console.log('CPF recebido:', data.cpf); // Log para depuração
        setUserCpf(data.cpf); // Armazena o CPF no contexto
        setToken(data.token); // Salve o token no contexto de autenticação
        Alert.alert(t.sucesso, t.bemVindo);
        navigation.navigate('TelaPrincipal'); // Redireciona para TelaPrincipal
      } else {
        console.error('CPF ou token ausente na resposta do servidor.');
        Alert.alert(t.erroLogin, t.dadosIncompletos);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.erroDesconhecido;
      console.error('Erro no login:', errorMessage);
      Alert.alert(t.erroLogin, errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5dc' }} // Fundo bege ocupa toda a tela
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{t.login}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.email}
            placeholderTextColor="#000"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder={t.senha}
            placeholderTextColor="#000"
            secureTextEntry={true} // Oculta o texto com asteriscos
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.buttonContainer}>
            {/* <Button title={t.entrar} onPress={handleLogin} color="#8B4513" /> */}
            <TouchableOpacity
              style={{
                backgroundColor: '#8B4513',
                borderRadius: 5,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 16,
              }}
              onPress={handleLogin}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.entrar}</Text>
            </TouchableOpacity>
            {/* Botão de cadastrar */}
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                borderRadius: 5,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#8B4513',
                marginBottom: 8,
              }}
              onPress={() => navigation.navigate('CriaUsuario')}
            >
              <Text style={{ color: '#8B4513', fontWeight: 'bold', fontSize: 16 }}>
                {isEnglish ? 'Register' : 'Cadastrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    minWidth: 0,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B4513',
    textAlign: 'center',
    width: '100%',
  },
  input: {
    width: '100%',
    minWidth: 0,
    height: 40,
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#8B4513',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});
