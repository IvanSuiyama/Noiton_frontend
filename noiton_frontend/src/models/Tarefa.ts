export interface Tarefa {
    id_tarefa: number;
    titulo: string;
    data_inicio: Date | string;
    data_fim: Date | string | null;
    conteudo: string;
    status: string;
    prioridade: 'baixa' | 'media' | 'alta';
    categorias?: { id_categoria: number; nome: string }[]; // para múltiplas categorias
    eventId?: string | null; // id do evento do calendário
    id_pai?: number | null; // id da tarefa pai, se for subtarefa
  }
