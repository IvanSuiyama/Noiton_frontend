export interface Notificacao {
  id: number;
  data: string; // data/hora em que a notificação foi criada
  id_tarefa: number; // referência à tarefa relacionada
  mensagem: string; // texto da notificação
}