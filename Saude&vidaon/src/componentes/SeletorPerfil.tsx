/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Shield, Stethoscope } from 'lucide-react';

interface SeletorPerfilProps {
  currentRole: 'patient' | 'doctor' | 'admin' | 'none';
  selectedPatientId: string | null;
  selectedDoctorId: string | null;
  onSwitchRole: (role: 'patient' | 'doctor' | 'admin' | 'none', id?: string) => void;
  pacientes: { id: string; nome: string }[];
  medicos: { id: string; nome: string; especialidade: string }[];
}

export const SeletorPerfil: React.FC<SeletorPerfilProps> = ({
  currentRole,
  selectedPatientId,
  selectedDoctorId,
  onSwitchRole,
  pacientes,
  medicos,
}) => {
  return (
    <div id="role-selector-container" className="bg-slate-900 text-white py-3 px-4 shadow-lg border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider">
            DEMO
          </div>
          <span className="text-sm font-medium text-slate-300">
            Simulador de Perfis (Altere papéis para testar o fluxo completo):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Patient Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
            <User className="h-3.5 w-3.5 text-blue-400" />
            <select
              id="select-patient-simulator"
              value={currentRole === 'patient' ? (selectedPatientId || '') : ''}
              onChange={(e) => {
                const id = e.target.value;
                if (id) onSwitchRole('patient', id);
              }}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer max-w-[130px]"
            >
              <option value="" disabled className="text-slate-900">Como Paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id} className="text-slate-950">
                  👤 {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
            <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
            <select
              id="select-doctor-simulator"
              value={currentRole === 'doctor' ? (selectedDoctorId || '') : ''}
              onChange={(e) => {
                const id = e.target.value;
                if (id) onSwitchRole('doctor', id);
              }}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer max-w-[130px]"
            >
              <option value="" disabled className="text-slate-900">Como Médico...</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id} className="text-slate-950">
                  🩺 {m.nome} ({m.especialidade})
                </option>
              ))}
            </select>
          </div>

          {/* Admin Switcher */}
          <button
            id="btn-admin-role-toggle"
            onClick={() => onSwitchRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              currentRole === 'admin'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/20'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            Painel Clínica (Admin)
          </button>
        </div>
      </div>
    </div>
  );
};
