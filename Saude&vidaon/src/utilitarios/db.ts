/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paciente, Medico, Consulta, Atendimento } from '../tipos';
import { INITIAL_MEDICOS, INITIAL_PACIENTES, INITIAL_CONSULTAS, INITIAL_ATENDIMENTOS } from '../dados';
import { supabase } from './supabase';

// Simple in-memory fallback for environments where localStorage is blocked (like iframes)
let memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return memoryStorage[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    memoryStorage[key] = value;
  }
}

// Abstract service layer simulating external database connection with generic fallbacks
// A future API implementation (e.g. Firebase, Cloud SQL, Supabase) will replace the functions below.

export async function getStoredData(): Promise<{
  medicos: Medico[];
  pacientes: Paciente[];
  consultas: Consulta[];
  atendimentos: Atendimento[];
}> {
  try {
    if (!supabase) throw new Error('Database not connected. Missing Supabase credentials.');

    // Fetch data from Supabase
    const [
      { data: medicos, error: errM },
      { data: pacientes, error: errP },
      { data: consultas, error: errC },
      { data: atendimentos, error: errA }
    ] = await Promise.all([
      supabase.from('medicos').select('*'),
      supabase.from('pacientes').select('*'),
      supabase.from('consultas').select('*'),
      supabase.from('atendimentos').select('*')
    ]);

    if (errM || errP || errC || errA) {
      throw new Error(`DB Error: ${errM?.message || errP?.message || errC?.message || errA?.message}`);
    }

    // Map database snake_case back to frontend camelCase where necessary
    const mappedPacientes = (pacientes || []).map((p: any) => ({
      ...p,
      dataNascimento: p.data_nascimento || p.dataNascimento
    }));

    return {
      medicos: (medicos as Medico[]) || [],
      pacientes: (mappedPacientes as Paciente[]) || [],
      consultas: (consultas as Consulta[]) || [],
      atendimentos: (atendimentos as Atendimento[]) || [],
    };
  } catch (error) {
    console.warn('Falling back to local storage:', error);
    const medicos = safeGetItem('co_medicos');
    const pacientes = safeGetItem('co_pacientes');
    const consultas = safeGetItem('co_consultas');
    const atendimentos = safeGetItem('co_atendimentos');

    return {
      medicos: medicos ? JSON.parse(medicos) : INITIAL_MEDICOS,
      pacientes: pacientes ? JSON.parse(pacientes) : INITIAL_PACIENTES,
      consultas: consultas ? JSON.parse(consultas) : INITIAL_CONSULTAS,
      atendimentos: atendimentos ? JSON.parse(atendimentos) : INITIAL_ATENDIMENTOS,
    };
  }
}

export async function saveStoredData(data: {
  medicos: Medico[];
  pacientes: Paciente[];
  consultas: Consulta[];
  atendimentos: Atendimento[];
}): Promise<void> {
  // Always save to localStorage as a reliable fallback
  safeSetItem('co_medicos', JSON.stringify(data.medicos));
  safeSetItem('co_pacientes', JSON.stringify(data.pacientes));
  safeSetItem('co_consultas', JSON.stringify(data.consultas));
  safeSetItem('co_atendimentos', JSON.stringify(data.atendimentos));

  try {
    if (!supabase) return; // Silent return since we already backed up locally

    // For a simple generic save state without breaking standard RDBMS rules, we will upsert
    // map camelCase back to snake_case for Supabase
    const pacientesToDb = data.pacientes.map(p => {
      const { dataNascimento, ...rest } = p;
      return { ...rest, data_nascimento: dataNascimento };
    });

    if (data.medicos.length > 0) await supabase.from('medicos').upsert(data.medicos);
    if (pacientesToDb.length > 0) await supabase.from('pacientes').upsert(pacientesToDb);
    if (data.consultas.length > 0) await supabase.from('consultas').upsert(data.consultas);
    if (data.atendimentos.length > 0) await supabase.from('atendimentos').upsert(data.atendimentos);

  } catch (error) {
    console.error('Error synchronizing with Supabase:', error);
  }
}
