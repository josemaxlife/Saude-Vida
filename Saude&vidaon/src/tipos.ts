/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
  dataNascimento?: string;
}

export interface Medico {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  especialidade: string;
  disponibilidade: string[]; // ex: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"]
  crm: string;
  rating?: number;
}

export type ConsultaStatus = 'AGENDADA' | 'CANCELADA' | 'REALIZADA';

export interface Consulta {
  id: string;
  paciente_id: string;
  medico_id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  status: ConsultaStatus;
  motivo?: string;
}

export interface Atendimento {
  id: string;
  consulta_id: string;
  sintomas: string;
  diagnostico: string;
  prescricao: string;
  observacoes: string;
  data_atendimento: string;
}

export interface AppState {
  pacientes: Paciente[];
  medicos: Medico[];
  consultas: Consulta[];
  atendimentos: Atendimento[];
}
