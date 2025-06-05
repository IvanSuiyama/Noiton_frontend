export default interface Categoria {
    id_categoria: number;
    nome: string;
    cpf_user?: string; // Novo campo opcional, retornado pelo backend
  }