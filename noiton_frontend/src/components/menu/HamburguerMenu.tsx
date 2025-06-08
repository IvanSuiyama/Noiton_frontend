import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/routes/Route';
import { useLanguage } from '@/context/LanguageContext';

export default function HamburgerMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null); // Controla o menu expandido
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isEnglish } = useLanguage();
  const translations = {
    pt: {
      tarefas: 'Tarefas',
      criarTarefa: 'Criar Tarefa',
      listarTarefa: 'Listar Tarefa',
      categorias: 'Categorias',
      listarCategoria: 'Listar Categoria',
      notificacoes: 'Notificações',
      rotinas: 'Rotinas',
      listarRotinas: 'Listar Rotinas',
      criarRotina: 'Criar Rotina',
    },
    en: {
      tarefas: 'Tasks',
      criarTarefa: 'Create Task',
      listarTarefa: 'List Tasks',
      categorias: 'Categories',
      listarCategoria: 'List Categories',
      notificacoes: 'Notifications',
      rotinas: 'Routines',
      listarRotinas: 'List Routines',
      criarRotina: 'Create Routine',
    }
  };
  const t = isEnglish ? translations.en : translations.pt;

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuItemPress = (item: string) => {
    if (item === t.tarefas) {
      setExpandedMenu(expandedMenu === t.tarefas ? null : t.tarefas); // Expande ou recolhe o menu
    } else if (item === t.categorias) {
      setExpandedMenu(expandedMenu === t.categorias ? null : t.categorias); // Expande ou recolhe o menu
    } else if (item === t.rotinas) {
      setExpandedMenu(expandedMenu === t.rotinas ? null : t.rotinas); // Expande ou recolhe o menu de rotinas
    } else if (item === t.notificacoes) {
      setMenuVisible(false);
      navigation.navigate('ListarNotificacoes');
    } else {
      setMenuVisible(false); // Fecha o menu ao clicar em outros itens
    }
  };

  
  const handleSubMenuItemPress = (subItem: string) => {
    console.log(`Navegando para: ${subItem}`); // Log para depuração
    setMenuVisible(false); // Fecha o menu ao clicar em um subtítulo
    if (subItem === t.criarTarefa) {
      navigation.navigate('CriaTarefa'); // Navega para CriaTarefa
    }
    if (subItem === t.listarTarefa) {
      navigation.navigate('ListarTarefas'); // Navega para ListarTarefas
    }
    if (subItem === t.listarCategoria) {
      navigation.navigate('ListarCategoria'); // Navega para ListarCategoria
    }
    if (subItem === t.listarRotinas) {
      navigation.navigate('RotinasScreen');
    }
    if (subItem === t.criarRotina) {
      navigation.navigate('CriaRotina');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <MaterialIcons name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu}>
          <View style={styles.menu}>
            {/* Tarefas com subtítulos */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress(t.tarefas)}
            >
              <Text style={styles.menuItem}>{t.tarefas}</Text>
            </TouchableOpacity>
            {expandedMenu === t.tarefas && (
              <View style={styles.subMenu}>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress(t.criarTarefa)}
                >
                  <Text style={styles.subMenuItem}>{t.criarTarefa}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress(t.listarTarefa)}
                >
                  <Text style={styles.subMenuItem}>{t.listarTarefa}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Categorias com subtítulos */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress(t.categorias)}
            >
              <Text style={styles.menuItem}>{t.categorias}</Text>
            </TouchableOpacity>
            {expandedMenu === t.categorias && (
              <View style={styles.subMenu}>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress(t.listarCategoria)}
                >
                  <Text style={styles.subMenuItem}>{t.listarCategoria}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Rotinas com subtítulos */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress(t.rotinas)}
            >
              <Text style={styles.menuItem}>{t.rotinas}</Text>
            </TouchableOpacity>
            {expandedMenu === t.rotinas && (
              <View style={styles.subMenu}>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress(t.listarRotinas)}
                >
                  <Text style={styles.subMenuItem}>{t.listarRotinas}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress(t.criarRotina)}
                >
                  <Text style={styles.subMenuItem}>{t.criarRotina}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notificações */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress(t.notificacoes)}
            >
              <Text style={styles.menuItem}>{t.notificacoes}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 29,
    left: 20,
    zIndex: 10,
  },
  menuButton: {
    backgroundColor: '#8B4513',
    padding: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menu: {
    width: '70%', // Responsivo: ocupa 70% da largura da tela
    maxWidth: 320,
    minWidth: 180,
    backgroundColor: '#f5f5dc', // Fundo bege claro
    padding: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 29,
  },
  menuItemTouchable: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#8B4513', // Fundo marrom escuro forte (apenas títulos)
  },
  menuItem: {
    fontSize: 18,
    color: '#fff', // Letras brancas para contraste (apenas títulos)
    fontWeight: 'bold',
  },
  subMenu: {
    paddingLeft: 12, // Indenta os subtítulos
  },
  subMenuItemTouchable: {
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#f5f5dc', // Fundo bege claro (subtítulos)
  },
  subMenuItem: {
    fontSize: 16,
    color: '#8B4513', // Texto marrom escuro (subtítulos)
  },
});
