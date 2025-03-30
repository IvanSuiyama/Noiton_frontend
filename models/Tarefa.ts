export interface Tarefa {
  id_tarefa: number;
  id_categoria: number;
  id_workspace: number;
  titulo: string;
  data_inicio: string; // ISO string para a data
  data_fim: string | null; // ISO string ou null
  conteudo: string;
  status: 'pendente' | 'em andamento' | 'concluída'; // Enum de status
  prioridade: 'baixa' | 'media' | 'alta'; // Enum de prioridade
}
