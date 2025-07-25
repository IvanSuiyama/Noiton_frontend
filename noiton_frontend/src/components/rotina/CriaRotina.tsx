import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import MultiSelectDias from './MultiSelectDias';
import { useLanguage } from '@/context/LanguageContext';

const Footer = () => (
  <View style={{ backgroundColor: '#8B4513', height: 38 }} />
);

export default function CriaRotina() {
  const { token } = useAuth();
  const { userCpf } = useUserContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [idTarefaBase, setIdTarefaBase] = useState<number | null>(null);
  const [dias, setDias] = useState<string[]>([]);
  const [dataFim, setDataFim] = useState('');
  const [ativa, setAtiva] = useState(true);
  const { isEnglish } = useLanguage();

  const t = isEnglish
    ? {
        title: 'Create Routine',
        tarefa: 'Base Task',
        dias: 'Days',
        dataFim: 'End Date (YYYY-MM-DD)',
        ativa: 'Active',
        salvar: 'Save',
        cancelar: 'Cancel',
        selecione: 'Select',
        sucesso: 'Routine created!',
        erro: 'Error creating routine',
        obrigatorio: 'Please fill all required fields.',
      }
    : {
        title: 'Criar Rotina',
        tarefa: 'Tarefa Base',
        dias: 'Dias',
        dataFim: 'Data Fim (AAAA-MM-DD)',
        ativa: 'Ativa',
        salvar: 'Salvar',
        cancelar: 'Cancelar',
        selecione: 'Selecione',
        sucesso: 'Rotina criada!',
        erro: 'Erro ao criar rotina',
        obrigatorio: 'Preencha todos os campos obrigatórios.',
      };

  useEffect(() => {
    if (!token || !userCpf) return;
    fetch(`http://192.168.95.119:4000/api/tarefa/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setTarefas(Array.isArray(data) ? data : []))
      .catch(() => setTarefas([]));
  }, [token, userCpf]);

  const handleSalvar = async () => {
    if (!idTarefaBase || dias.length === 0) {
      Alert.alert(t.erro, t.obrigatorio);
      return;
    }
    try {
      const resp = await fetch(`http://192.168.95.119:4000/api/rotinas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_tarefa_base: idTarefaBase,
          dias_semana: dias.join(','),
          data_fim: dataFim || null,
          ativa,
        }),
      });
      if (!resp.ok) throw new Error();
      Alert.alert(t.sucesso);
      navigation.goBack();
    } catch {
      Alert.alert(t.erro);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]}>{t.title}</Text>
          <Text style={styles.label}>{t.tarefa}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={idTarefaBase}
              onValueChange={v => setIdTarefaBase(v)}
              style={styles.picker}
            >
              <Picker.Item label={t.selecione} value={null} />
              {tarefas
                .filter((t, idx, arr) => arr.findIndex(x => x.id_tarefa === t.id_tarefa) === idx)
                .map(tarefa => (
                  <Picker.Item label={tarefa.titulo} value={tarefa.id_tarefa} />
                ))}
            </Picker>
          </View>
          <Text style={styles.label}>{t.dias}</Text>
          <MultiSelectDias diasSelecionados={dias} onChange={setDias} />
          <Text style={styles.label}>{t.dataFim}</Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder={t.dataFim}
            value={dataFim}
            onChangeText={setDataFim}
            keyboardType="numeric"
            returnKeyType="done"
            blurOnSubmit={true}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
            <Text style={styles.label}>{t.ativa}</Text>
            <Switch value={ativa} onValueChange={setAtiva} />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#8B4513',
              borderRadius: 5,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 8,
            }}
            onPress={handleSalvar}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.salvar}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#aaa',
              borderRadius: 5,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 16,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.cancelar}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5dc', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#8B4513', marginBottom: 12 },
  label: { fontWeight: 'bold', color: '#8B4513', marginTop: 12 },
  pickerContainer: { borderWidth: 1, borderColor: '#8B4513', borderRadius: 5, marginBottom: 10, backgroundColor: '#fff' },
  picker: { height: 50, color: '#8B4513' },
  input: { borderWidth: 1, borderColor: '#8B4513', borderRadius: 5, backgroundColor: '#fff', padding: 8, marginBottom: 10 },
});
