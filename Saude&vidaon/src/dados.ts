/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paciente, Medico, Consulta, Atendimento } from './tipos';

export const INITIAL_MEDICOS: Medico[] = [
  {
    id: 'med-1',
    nome: 'Dr. Carlos Silva',
    email: 'carlos@email.com',
    senha: 'dr1234',
    especialidade: 'Cardiologia',
    disponibilidade: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    crm: 'CRM/SP 123456',
    rating: 4.9
  },
  {
    id: 'med-2',
    nome: 'Dra. Ana Souza',
    email: 'ana@email.com',
    senha: 'dr1234',
    especialidade: 'Pediatria',
    disponibilidade: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
    crm: 'CRM/RJ 654321',
    rating: 4.8
  },
  {
    id: 'med-3',
    nome: 'Dr. Roberto Alves',
    email: 'roberto@email.com',
    senha: 'dr1234',
    especialidade: 'Clínica Geral',
    disponibilidade: ['08:00', '10:00', '13:00', '15:00', '16:00', '17:00'],
    crm: 'CRM/MG 987654',
    rating: 4.7
  },
  {
    id: 'med-4',
    nome: 'Dra. Mariana Costa',
    email: 'mariana@email.com',
    senha: 'dr1234',
    especialidade: 'Dermatologia',
    disponibilidade: ['09:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
    crm: 'CRM/PR 456789',
    rating: 5.0
  },
  {
    id: 'med-5',
    nome: 'Dr. Felipe Santos',
    email: 'felipe@email.com',
    senha: 'dr1234',
    especialidade: 'Ortopedia',
    disponibilidade: ['08:00', '09:00', '10:00', '14:00', '15:00'],
    crm: 'CRM/RS 321654',
    rating: 4.6
  }
];

export const INITIAL_PACIENTES: Paciente[] = [
  {
    id: 'pac-1',
    nome: 'João Oliveira',
    email: 'joao@email.com',
    telefone: '(11) 98888-7777',
    senha: 'senha',
    dataNascimento: '1988-05-15'
  },
  {
    id: 'pac-2',
    nome: 'Maria Carmo',
    email: 'maria@email.com',
    telefone: '(21) 97777-6666',
    senha: 'senha',
    dataNascimento: '1995-10-22'
  },
  {
    id: 'pac-3',
    nome: 'Pedro Santos',
    email: 'pedro@email.com',
    telefone: '(31) 96666-5555',
    senha: 'senha',
    dataNascimento: '1975-01-30'
  }
];

export const INITIAL_CONSULTAS: Consulta[] = [
  {
    id: 'con-1',
    paciente_id: 'pac-1',
    medico_id: 'med-3',
    data: '2026-06-01',
    hora: '10:00',
    status: 'REALIZADA',
    motivo: 'Check-up de rotina e cansaço constante'
  },
  {
    id: 'con-2',
    paciente_id: 'pac-2',
    medico_id: 'med-2',
    data: '2026-06-03',
    hora: '09:00',
    status: 'AGENDADA',
    motivo: 'Consulta de rotina anual pediatria (filho)'
  },
  {
    id: 'con-3',
    paciente_id: 'pac-3',
    medico_id: 'med-5',
    data: '2026-06-04',
    hora: '14:00',
    status: 'AGENDADA',
    motivo: 'Dor crônica no joelho esquerdo'
  },
  {
    id: 'con-4',
    paciente_id: 'pac-1',
    medico_id: 'med-4',
    data: '2026-05-20',
    hora: '15:00',
    status: 'CANCELADA',
    motivo: 'Revisão de manchas na pele'
  }
];

export const INITIAL_ATENDIMENTOS: Atendimento[] = [
  {
    id: 'aten-1',
    consulta_id: 'con-1',
    sintomas: 'Fadiga extrema nas últimas duas semanas, sono irregular, batimentos normais.',
    diagnostico: 'Gases intestinais severos e estresse leve. Déficit vitamínico a investigar.',
    prescricao: 'Hemograma completo com dosagem de Vitamina D e B12. Atividade física moderada e repouso.',
    observacoes: 'Paciente orientado a diminuir o consumo de álcool e café à noite.',
    data_atendimento: '2026-06-01'
  }
];
