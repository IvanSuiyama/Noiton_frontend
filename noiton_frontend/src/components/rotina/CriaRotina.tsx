import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, TextInput, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { IP_CELULAR } from '@env';
import MultiSelectDias from './MultiSelectDias';
import { useLanguage } from '@/context/LanguageContext';

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
    fetch(`${IP_CELULAR}/api/tarefa/list`, {
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
      const resp = await fetch(`${IP_CELULAR}/api/rotinas`, {
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
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.label}>{t.tarefa}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={idTarefaBase}
          onValueChange={v => setIdTarefaBase(v)}
          style={styles.picker}
        >
          <Picker.Item label={t.selecione} value={null} />
          {tarefas.map(tarefa => (
            <Picker.Item key={tarefa.id_tarefa} label={tarefa.titulo} value={tarefa.id_tarefa} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>{t.dias}</Text>
      <MultiSelectDias diasSelecionados={dias} onChange={setDias} />
      <Text style={styles.label}>{t.dataFim}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.dataFim}
        value={dataFim}
        onChangeText={setDataFim}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
        <Text style={styles.label}>{t.ativa}</Text>
        <Switch value={ativa} onValueChange={setAtiva} />
      </View>
      <Button title={t.salvar} color="#8B4513" onPress={handleSalvar} />
      <Button title={t.cancelar} color="#aaa" onPress={() => navigation.goBack()} />
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
