export interface Tarefa {
    id_tarefa: number;
    titulo: string;
    data_inicio: Date | string;
    data_fim: Date | string | null;
    conteudo: string;
    status: string;
    prioridade: 'baixa' | 'media' | 'alta';
    categorias?: { id_categoria: number; nome: string }[]; // para múltiplas categorias
  }
