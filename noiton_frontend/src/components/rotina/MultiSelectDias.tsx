import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';

const diasSemanaPt = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const diasSemanaEn = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const Footer = () => (
  <View style={{ backgroundColor: '#8B4513', height: 38 }} />
);

export default function MultiSelectDias({ diasSelecionados, onChange }: { diasSelecionados: string[], onChange: (dias: string[]) => void }) {
  const { isEnglish } = useLanguage();
  const diasSemana = isEnglish ? diasSemanaEn : diasSemanaPt;
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5dc' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {diasSemana.map(dia => (
          <TouchableOpacity
            key={dia}
            style={{
              padding: 8,
              margin: 4,
              backgroundColor: diasSelecionados.includes(dia) ? '#8B4513' : '#eee',
              borderRadius: 4,
            }}
            onPress={() => {
              const novosDias = diasSelecionados.includes(dia)
                ? diasSelecionados.filter(d => d !== dia)
                : [...diasSelecionados, dia];
              onChange(novosDias);
            }}
          >
            <Text style={{ color: diasSelecionados.includes(dia) ? '#fff' : '#000' }}>
              {dia}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Footer />
    </View>
  );
}
