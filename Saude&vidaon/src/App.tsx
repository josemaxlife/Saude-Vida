/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Paciente, Medico, Consulta, Atendimento } from './tipos';
import { getStoredData, saveStoredData } from './utilitarios/db';
import { PaginaInicial } from './componentes/PaginaInicial';
import { DashboardUsuario } from './componentes/DashboardUsuario';
import { DashboardMedico } from './componentes/DashboardMedico';
import { DashboardAdministrador } from './componentes/DashboardAdministrador';
import { Activity, ShieldCheck, User } from 'lucide-react';

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any}> {
  constructor(props: any) { 
    super(props); 
    // @ts-ignore
    this.state = { hasError: false, error: null }; 
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    // @ts-ignore
    if (this.state.hasError) return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong.</h1><pre>{this.state.error?.toString()}</pre><pre>{this.state.error?.stack}</pre></div>;
    // @ts-ignore
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  )
}

function MainApp() {
  // DB States loaded from local storage
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  // Session login router
  const [currentRole, setCurrentRole] = useState<'patient' | 'doctor' | 'admin' | 'none'>('none');
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);

  // Initialize DB from localStorage or simulated external database on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await getStoredData();
      setMedicos(data.medicos);
      setPacientes(data.pacientes);
      setConsultas(data.consultas);
      setAtendimentos(data.atendimentos);
    };
    loadData();
    // Automatically set default logged patient to João (pac-1) if they want, but let's keep role 'none' (landing page) initially
  }, []);

  // Save changes to db helper
  const updateDB = async (updatedMedicos: Medico[], updatedPacientes: Paciente[], updatedConsultas: Consulta[], updatedAtendimentos: Atendimento[]) => {
    setMedicos(updatedMedicos);
    setPacientes(updatedPacientes);
    setConsultas(updatedConsultas);
    setAtendimentos(updatedAtendimentos);
    await saveStoredData({
      medicos: updatedMedicos,
      pacientes: updatedPacientes,
      consultas: updatedConsultas,
      atendimentos: updatedAtendimentos
    });
  };

  // Callback 1: Scheduled medical checkup
  const handleScheduleConsulta = (formInput: { medico_id: string; data: string; hora: string; motivo: string }) => {
    if (!activePatientId) return;
    const newCon: Consulta = {
      id: `con-${Date.now()}`,
      paciente_id: activePatientId,
      medico_id: formInput.medico_id,
      data: formInput.data,
      hora: formInput.hora,
      status: 'AGENDADA',
      motivo: formInput.motivo
    };

    const updatedConsultas = [...consultas, newCon];
    updateDB(medicos, pacientes, updatedConsultas, atendimentos);
  };

  // Callback 2: Cancellations
  const handleCancelConsulta = (consultaId: string) => {
    const updatedConsultas = consultationsUpdateStatus(consultaId, 'CANCELADA');
    updateDB(medicos, pacientes, updatedConsultas, atendimentos);
  };

  const consultationsUpdateStatus = (id: string, statusText: 'CANCELADA' | 'REALIZADA') => {
    return consultas.map(c => c.id === id ? { ...c, status: statusText } : c);
  };

  // Callback 3: Atendimento submit (Finalize consultations, record diagnosis)
  const handleFinishAtendimento = (data: {
    consulta_id: string;
    sintomas: string;
    diagnostico: string;
    prescricao: string;
    observacoes: string;
  }) => {
    // 1. Mark consultation as REALIZADA
    const updatedConsultas = consultationsUpdateStatus(data.consulta_id, 'REALIZADA');

    // 2. Append new Atendimento summary record
    const newAtendimento: Atendimento = {
      id: `aten-${Date.now()}`,
      consulta_id: data.consulta_id,
      sintomas: data.sintomas,
      diagnostico: data.diagnostico,
      prescricao: data.prescricao,
      observacoes: data.observacoes,
      data_atendimento: new Date().toISOString().split('T')[0]
    };

    const updatedAtendimentos = [...atendimentos, newAtendimento];
    updateDB(medicos, pacientes, updatedConsultas, updatedAtendimentos);
  };

  // Callback 3.5: Update existing Atendimento
  const handleUpdateAtendimento = (data: {
    atendimento_id: string;
    sintomas: string;
    diagnostico: string;
    prescricao: string;
    observacoes: string;
  }) => {
    const updatedAtendimentos = atendimentos.map(a => 
      a.id === data.atendimento_id ? {
        ...a,
        sintomas: data.sintomas,
        diagnostico: data.diagnostico,
        prescricao: data.prescricao,
        observacoes: data.observacoes
      } : a
    );
    updateDB(medicos, pacientes, consultas, updatedAtendimentos);
  };

  // Callback 3.8: Reschedule Consulta
  const handleRescheduleConsulta = (consultaId: string, novaData: string, novaHora: string) => {
    const updatedConsultas = consultas.map(c => 
      c.id === consultaId ? {
        ...c,
        data: novaData,
        hora: novaHora
      } : c
    );
    updateDB(medicos, pacientes, updatedConsultas, atendimentos);
  };

  // Callback 4: Adding doctors by admin
  const handleAddMedico = (novoMed: Medico) => {
    const updatedMedicos = [...medicos, novoMed];
    updateDB(updatedMedicos, pacientes, consultas, atendimentos);
  };

  // Callback 5: Edit doctors availability hours
  const handleUpdateAvailability = (medId: string, newList: string[]) => {
    const updatedMedicos = medicos.map(m => m.id === medId ? { ...m, disponibilidade: newList } : m);
    updateDB(updatedMedicos, pacientes, consultas, atendimentos);
  };

  // Callback 6: Register new patients inside landing pages
  const handleRegisterPatient = (newPatient: Paciente) => {
    const updatedPacientes = [...pacientes, newPatient];
    
    const mockConsulta: Consulta = {
      id: `cons-mock-${Date.now()}`,
      paciente_id: newPatient.id,
      medico_id: medicos[0]?.id || 'm1',
      data: new Date().toISOString().split('T')[0],
      hora: '10:00',
      status: 'REALIZADA',
      motivo: 'Primeira consulta de rotina'
    };
    
    const mockAtendimento: Atendimento = {
      id: `atend-mock-${Date.now()}`,
      consulta_id: mockConsulta.id,
      sintomas: 'Check-up geral inicial',
      diagnostico: 'Paciente apresenta quadro estável e saudável.',
      prescricao: 'Manter rotina de exercícios físicos regulares e hidratação. Vitamina C 1x ao dia.',
      observacoes: 'Retornar em 1 ano para novos exames de rotina.',
      data_atendimento: new Date().toISOString()
    };

    const updatedConsultas = [...consultas, mockConsulta];
    const updatedAtendimentos = [...atendimentos, mockAtendimento];

    // Also automatically update DB
    updateDB(medicos, updatedPacientes, updatedConsultas, updatedAtendimentos);
  };

  const handleUpdatePatient = (updatedPatient: Paciente) => {
    const updatedPacientes = pacientes.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    updateDB(medicos, updatedPacientes, consultas, atendimentos);
  };

  const handleLoginSuccess = (type: 'patient' | 'doctor' | 'admin', id?: string) => {
    setCurrentRole(type);
    if (type === 'patient' && id) {
      setActivePatientId(id);
    } else if (type === 'doctor' && id) {
      setActiveDoctorId(id);
    }
  };

  const handleLogout = () => {
    setCurrentRole('none');
    setActivePatientId(null);
    setActiveDoctorId(null);
  };

  // Render proper views
  const renderActiveView = () => {
    if (currentRole === 'patient') {
      const activePatient = pacientes.find(p => p.id === activePatientId) || pacientes[0];
      if (!activePatient) return <div className="p-8 text-center text-slate-500">Nenhum paciente carregado.</div>;
      
      return (
        <DashboardUsuario
          paciente={activePatient}
          medicos={medicos}
          consultas={consultas}
          atendimentos={atendimentos}
          onScheduleConsulta={handleScheduleConsulta}
          onCancelConsulta={handleCancelConsulta}
          onRescheduleConsulta={handleRescheduleConsulta}
          onUpdatePatient={handleUpdatePatient}
          onLogout={handleLogout}
        />
      );
    }

    if (currentRole === 'doctor') {
      const activeDoctor = medicos.find(m => m.id === activeDoctorId) || medicos[0];
      if (!activeDoctor) return <div className="p-8 text-center text-slate-500">Nenhum médico carregado.</div>;

      return (
        <DashboardMedico
          medico={activeDoctor}
          consultas={consultas}
          pacientes={pacientes}
          atendimentos={atendimentos}
          onFinishAtendimento={handleFinishAtendimento}
          onUpdateAtendimento={handleUpdateAtendimento}
          onRescheduleConsulta={handleRescheduleConsulta}
          onUpdateDisponibilidade={handleUpdateAvailability}
          onLogout={handleLogout}
        />
      );
    }

    if (currentRole === 'admin') {
      return (
        <DashboardAdministrador
          medicos={medicos}
          pacientes={pacientes}
          consultas={consultas}
          atendimentos={atendimentos}
          onAddMedico={handleAddMedico}
          onLogout={handleLogout}
        />
      );
    }

    // Default Landing page with Auth screen
    return (
      <PaginaInicial
        pacientes={pacientes}
        medicos={medicos}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterPatient}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Main viewport */}
      <main className="flex-1 flex flex-col">
        {renderActiveView()}
      </main>

      {/* Footer Status Bar - High Density Theme Telemetry */}
      <footer className="h-8 bg-slate-200 border-t border-slate-300 px-8 flex items-center justify-between text-[10px] mobile-hidden font-bold text-slate-500 shrink-0">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Sistema Online
          </span>
          <span>DB: v2.4.0-cloud</span>
        </div>
        <div className="hidden sm:flex gap-4">
          <span>Sincronização: Tempo Real</span>
          <span>ID Sessão: CLINIC_HUB_0192</span>
        </div>
      </footer>
    </div>
  );
}
