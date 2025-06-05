export interface Tarefa {
    id_tarefa: number;
    id_categoria: number;
    titulo: string;
    data_inicio: Date | string;
    data_fim: Date | string | null;
    conteudo: string;
    status: string;
    prioridade: 'baixa' | 'media' | 'alta';
  }
