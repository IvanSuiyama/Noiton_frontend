// import React, { useState } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import {IP_WIFI} from '@env';

// export default function SelectBox() {
//   const [selectedValue, setSelectedValue] = useState<string>('java');

//   return (
//     <View style={styles.container}>
//       <Text style={styles.label}>Escolha uma linguagem:</Text>
//       <Picker
//         selectedValue={selectedValue}
//         onValueChange={(itemValue) => setSelectedValue(itemValue)}
//         style={styles.picker}
//       >
//         <Picker.Item label="Java" value="java" />
//         <Picker.Item label="JavaScript" value="js" />
//         <Picker.Item label="TypeScript" value="ts" />
//       </Picker>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     margin: 20,
//     padding: 10,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 10,
//   },
//   label: {
//     marginBottom: 8,
//     fontSize: 16,
//   },
//   picker: {
//     height: 50,
//     width: '100%',
//   },
// });
