/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medico, Consulta, Paciente, Atendimento } from '../tipos';
import { Calendar, Stethoscope, Clock, ShieldAlert, CheckCircle2, History, Activity, Sparkles, FileText, ChevronRight, Play, Check } from 'lucide-react';

interface DashboardMedicoProps {
  medico: Medico;
  consultas: Consulta[];
  pacientes: Paciente[];
  atendimentos: Atendimento[];
  onFinishAtendimento: (atendimentoData: {
    consulta_id: string;
    sintomas: string;
    diagnostico: string;
    prescricao: string;
    observacoes: string;
  }) => void;
  onUpdateAtendimento: (atendimentoData: {
    atendimento_id: string;
    sintomas: string;
    diagnostico: string;
    prescricao: string;
    observacoes: string;
  }) => void;
  onRescheduleConsulta: (consultaId: string, novaData: string, novaHora: string) => void;
  onUpdateDisponibilidade: (medicoId: string, novaDisponibilidade: string[]) => void;
  onLogout: () => void;
}

export const DashboardMedico: React.FC<DashboardMedicoProps> = ({
  medico,
  consultas,
  pacientes,
  atendimentos,
  onFinishAtendimento,
  onUpdateAtendimento,
  onRescheduleConsulta,
  onUpdateDisponibilidade,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'atendimento' | 'disponibilidade'>('agenda');
  
  // Active Consultation for Atendimento
  const [selectedConsultaId, setSelectedConsultaId] = useState<string | null>(null);
  
  // Edit mode for history
  const [editingAtendimentoId, setEditingAtendimentoId] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleConsultaId, setRescheduleConsultaId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  
  // Atendimento Form States
  const [sintomas, setSintomas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [prescricao, setPrescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Availability setup state
  const hoursTemplate = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];
  const [localHours, setLocalHours] = useState<string[]>(medico.disponibilidade);

  const handleHourToggle = (hour: string) => {
    let updated: string[];
    if (localHours.includes(hour)) {
      updated = localHours.filter(h => h !== hour);
    } else {
      updated = [...localHours, hour].sort();
    }
    setLocalHours(updated);
    onUpdateDisponibilidade(medico.id, updated);
  };

  const handleStartAtendimento = (consultaId: string) => {
    setSelectedConsultaId(consultaId);
    setEditingAtendimentoId(null);
    setSintomas('');
    setDiagnostico('');
    setPrescricao('');
    setObservacoes('');
    setFormError('');
    setActiveTab('atendimento');
  };

  const handleEditAtendimento = (consultaId: string, atendimento: Atendimento) => {
    setSelectedConsultaId(consultaId);
    setEditingAtendimentoId(atendimento.id);
    setSintomas(atendimento.sintomas);
    setDiagnostico(atendimento.diagnostico);
    setPrescricao(atendimento.prescricao);
    setObservacoes(atendimento.observacoes || '');
    setFormError('');
    setActiveTab('atendimento');
  };

  const submitAtendimento = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedConsultaId) return;
    if (!sintomas.trim() || !diagnostico.trim() || !prescricao.trim()) {
      setFormError('Sintomas, Diagnóstico e Prescrição constituem preenchimento clínico obrigatório.');
      return;
    }

    if (editingAtendimentoId) {
      onUpdateAtendimento({
        atendimento_id: editingAtendimentoId,
        sintomas,
        diagnostico,
        prescricao,
        observacoes
      });
    } else {
      onFinishAtendimento({
        consulta_id: selectedConsultaId,
        sintomas,
        diagnostico,
        prescricao,
        observacoes
      });
    }

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setSelectedConsultaId(null);
      setEditingAtendimentoId(null);
      setActiveTab('agenda');
    }, 1800);
  };

  // Filter consultations for THIS doctor
  const doctorConsultas = consultas
    .filter(c => c.medico_id === medico.id)
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));

  const pendingConsultas = doctorConsultas.filter(c => c.status === 'AGENDADA');
  const finishedConsultas = doctorConsultas.filter(c => c.status === 'REALIZADA' || c.status === 'CANCELADA');

  // Find Patient details
  const getPatientDetails = (pacienteId: string) => {
    return pacientes.find(p => p.id === pacienteId);
  };

  // Find Patient pre-existing history counts & entries
  const getPatientHistory = (pacienteId: string) => {
    // historical appointments
    const pastIds = doctorConsultas
      .filter(c => c.paciente_id === pacienteId && c.status === 'REALIZADA')
      .map(c => c.id);
    
    return atendimentos.filter(a => pastIds.includes(a.consulta_id));
  };

  const selectedConsulta = selectedConsultaId ? consultas.find(c => c.id === selectedConsultaId) : null;
  const activePatientObj = selectedConsulta ? getPatientDetails(selectedConsulta.paciente_id) : null;
  const activePatientPastClinicalNotes = activePatientObj ? atendimentos.filter(a => {
    // get all other completed consultations for this patient (with any doctor)
    const patientAllPastConsultationIds = consultas
      .filter(c => c.paciente_id === activePatientObj.id && c.status === 'REALIZADA' && c.id !== selectedConsultaId)
      .map(c => c.id);
    return patientAllPastConsultationIds.includes(a.consulta_id);
  }) : [];

  return (
    <div id="doctor-dashboard-root" className="min-h-screen bg-slate-100">
      {/* Top Banner Accent - High Density Styling */}
      <div className="bg-slate-900 text-white shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl text-white shadow-inner uppercase">
              {medico.nome.replace('Dr. ', '').replace('Dra. ', '').substring(0, 2)}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">MedFlow Digital • Espaço do Médico</span>
              <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                {medico.nome}
                <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold font-mono px-2 py-0.5 rounded border border-slate-700/50">{medico.crm} | {medico.especialidade}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-doctor-logout"
              onClick={onLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-3 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">Módulos Médicos</p>
            <button
              id="tab-doctor-queue"
              onClick={() => setActiveTab('agenda')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === 'agenda' ? 'text-white' : 'text-slate-400'}`} /> Minha Agenda
            </button>

            {selectedConsultaId && (
              <button
                id="tab-doctor-current-atendimento"
                onClick={() => setActiveTab('atendimento')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all text-amber-800 bg-amber-50 animate-pulse`}
              >
                <Activity className="h-4 w-4 text-amber-600" /> Atendimento Ativo!
              </button>
            )}
            
            <button
              id="tab-doctor-hours"
              onClick={() => setActiveTab('disponibilidade')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'disponibilidade'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className={`h-4 w-4 ${activeTab === 'disponibilidade' ? 'text-white' : 'text-slate-400'}`} /> Configurar Meus Horários
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm font-sans space-y-3">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Atividade Geral</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 shadow-inner">
                <span className="block text-xl font-extrabold text-slate-800">{pendingConsultas.length}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Pendentes</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 shadow-inner">
                <span className="block text-xl font-extrabold text-slate-800">{finishedConsultas.filter(c => c.status === 'REALIZADA').length}</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Atendidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic content modules */}
        <div className="lg:col-span-9">

          {/* Module 1: Queue and Appointments list */}
          {activeTab === 'agenda' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800 text-lg">Consultas Marcadas do Dia</h3>
                    <p className="text-xs text-slate-500">Pacientes agendados aguardando atendimento clínico.</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {pendingConsultas.length} Pacientes
                  </span>
                </div>

                {pendingConsultas.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <Stethoscope className="h-10 w-10 text-slate-350 stroke-1.5 mb-2" />
                    <p className="text-slate-500 text-sm font-medium">Agenda limpa para hoje.</p>
                    <p className="text-xs text-slate-400 mt-1">Todas as consultas agendadas foram atendidas ou não há novas reservas.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingConsultas.map((c) => {
                      const patient = getPatientDetails(c.paciente_id);
                      return (
                        <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold font-mono">
                              <Clock className="h-3 w-3" /> {new Date(c.data).toLocaleDateString('pt-PT')} ás {c.hora}
                            </span>
                            <h4 className="font-semibold text-slate-800 text-sm mt-1.5">
                              {patient ? patient.nome : 'Paciente Desconhecido'}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                              {patient?.telefone && <p>Tel: {patient?.telefone}</p>}
                              {c.motivo && <p className="italic text-slate-400 mt-1">"Motivo: {c.motivo}"</p>}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {rescheduleConsultaId === c.id ? (
                              <div className="flex items-center gap-2 bg-slate-50 p-2 border border-slate-200 rounded-lg">
                                <div>
                                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs" />
                                </div>
                                <div>
                                  <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs">
                                    <option value="">Hora</option>
                                    {medico.disponibilidade.map(h => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  onClick={() => {
                                    if(!rescheduleDate || !rescheduleTime) { setRescheduleError('Selecione data e hora'); return; }
                                    // check if slot is taken
                                    const slotTaken = consultas.some(co => co.medico_id === medico.id && co.data === rescheduleDate && co.hora === rescheduleTime && co.status === 'AGENDADA');
                                    if (slotTaken) {
                                      setRescheduleError('Horário não disponível');
                                    } else {
                                      onRescheduleConsulta(c.id, rescheduleDate, rescheduleTime);
                                      setRescheduleConsultaId(null);
                                      setRescheduleError('');
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setRescheduleConsultaId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded transition-colors"
                                >
                                  ❌
                                </button>
                                {rescheduleError && rescheduleConsultaId === c.id && <span className="text-red-500 text-[10px]">{rescheduleError}</span>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setRescheduleConsultaId(c.id);
                                    setRescheduleDate(c.data);
                                    setRescheduleTime(c.hora);
                                    setRescheduleError('');
                                  }}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  <Calendar className="h-3 w-3 fill-current" /> Remarcar
                                </button>
                                <button
                                  id={`btn-doctor-start-consult-${c.id}`}
                                  onClick={() => handleStartAtendimento(c.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-200 transition-colors"
                                >
                                  <Play className="h-3 w-3 fill-current" /> Iniciar Consulta
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* General history for this doctor (Finished summary) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-display font-semibold text-slate-800 text-base">Consultas Encerradas</h3>
                  <p className="text-xs text-slate-500 font-sans">Visualize consultas concluídas e atendimentos já finalizados.</p>
                </div>

                {finishedConsultas.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">Nenhum histórico disponível para este médico.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {finishedConsultas.map((c) => {
                      const patient = getPatientDetails(c.paciente_id);
                      const atendimentoRef = atendimentos.find(a => a.consulta_id === c.id);
                      return (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-slate-800">{patient?.nome || 'Paciente'}</p>
                            <p className="text-slate-400 font-mono text-[10px] mt-0.5">Agendado para {new Date(c.data).toLocaleDateString('pt-PT')} ({c.hora})</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              c.status === 'REALIZADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {c.status}
                            </span>
                            {c.status === 'REALIZADA' && atendimentoRef && (
                              <button
                                onClick={() => handleEditAtendimento(c.id, atendimentoRef)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                              >
                                Editar Registro
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Module 2: Atendimento Form (EMBEDDED CODES ONLY) */}
          {activeTab === 'atendimento' && selectedConsulta && activePatientObj && (
            <div className="space-y-6">
              
              {/* Patient Profile Card summary to consult records beforehand */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <History className="h-5 w-5" />
                  <h4 className="font-display font-bold text-sm">Prontuário e Histórico Anterior do Paciente: <strong className="text-amber-900">{activePatientObj.nome}</strong></h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pb-2.5">
                  <p><strong>Nascimento:</strong> {activePatientObj.dataNascimento ? new Date(activePatientObj.dataNascimento).toLocaleDateString('pt-PT') : 'Não especificado'}</p>
                  <p><strong>E-mail de contato:</strong> {activePatientObj.email}</p>
                  <p className="sm:col-span-2 bg-white/70 p-2.5 rounded-lg border border-slate-100">
                    <strong>Motivo da queixa ativa hoje:</strong> <br />
                    <span className="italic mt-1 inline-block">"{selectedConsulta.motivo || 'Nenhum motivo preenchido pelo paciente.'}"</span>
                  </p>
                </div>

                {/* Show clinical notes from other consultations */}
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnósticos Passados Registrados na Clínica ({activePatientPastClinicalNotes.length})</h5>
                  {activePatientPastClinicalNotes.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhum prontuário anterior disponível no banco de dados.</p>
                  ) : (
                    <div className="space-y-2 bg-white/40 p-2 rounded-lg max-h-36 overflow-y-auto custom-scrollbar">
                      {activePatientPastClinicalNotes.map((note) => (
                        <div key={note.id} className="text-[11px] border-b border-indigo-100/30 pb-2 last:border-b-0">
                          <span className="font-bold text-emerald-700 block">Sintomas e Diagnose:</span>
                          <p className="text-slate-700">Sintomas: {note.sintomas}</p>
                          <p className="font-medium text-slate-900 mt-0.5">Diagnóstico: {note.diagnostico}</p>
                          <p className="text-slate-400 text-[9px] mt-0.5 font-mono">{new Date(note.data_atendimento || '').toLocaleDateString('pt-PT')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Main Consultation Clinical Data entry form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="border-b border-slate-100 pb-3 mb-5">
                  <h3 className="font-display font-semibold text-slate-800 text-lg">Prontuário Ativo - Registro de Atendimento Clínico</h3>
                  <p className="text-xs text-slate-500">Insira as anotações do exame clínico e receitas que serão salvas no prontuário digital permanente do paciente.</p>
                </div>

                {formSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm mb-4 flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Atendimento Concluído! O histórico do prontuário foi arquivado.
                  </div>
                )}

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs mb-4">
                    {formError}
                  </div>
                )}

                <form onSubmit={submitAtendimento} className="space-y-4">
                  
                  {/* Inputs symptoms */}
                  <div className="space-y-1">
                    <label htmlFor="form-status-sintomas" className="block text-xs font-bold text-slate-700 uppercase">Sintomas Relatados / Anamnese *</label>
                    <textarea
                      id="form-status-sintomas"
                      required
                      placeholder="Descreva as queixas e observações físicas relatadas pelo paciente na anamnese"
                      value={sintomas}
                      onChange={(e) => setSintomas(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850"
                    ></textarea>
                  </div>

                  {/* Diagnostic details */}
                  <div className="space-y-1">
                    <label htmlFor="form-status-diagnostico" className="block text-xs font-bold text-slate-700 uppercase">Diagnóstico Clínico *</label>
                    <textarea
                      id="form-status-diagnostico"
                      required
                      placeholder="Parecer do médico e hipótese diagnóstica (ex: Gases intestinais severos, Ansiedade clínica, etc.)"
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850"
                    ></textarea>
                  </div>

                  {/* Prescription */}
                  <div className="space-y-1">
                    <label htmlFor="form-status-prescricao" className="block text-xs font-bold text-blue-600 uppercase">Receita / Prescrição Médica *</label>
                    <textarea
                      id="form-status-prescricao"
                      required
                      placeholder="Medicamentos recomendados, exames laboratoriais complementares solicitados ou encaminhamentos"
                      value={prescricao}
                      onChange={(e) => setPrescricao(e.target.value)}
                      rows={3}
                      className="w-full border border-blue-100 bg-blue-50/20 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-blue-950 font-mono"
                    ></textarea>
                  </div>

                  {/* Additional logs */}
                  <div className="space-y-1">
                    <label htmlFor="form-status-observacoes" className="block text-xs font-bold text-slate-700 uppercase">Recomendações e Observações de Retorno</label>
                    <input
                      id="form-status-observacoes"
                      type="text"
                      placeholder="Ex: Orientação nutricional de repouso, agendar retorno em 30 dias se os sintomas persistirem."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-850"
                    />
                  </div>

                  {/* Action row button */}
                  <div className="flex gap-3 justify-end items-center pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja interromper o formulário?')) {
                          setSelectedConsultaId(null);
                          setActiveTab('agenda');
                        }
                      }}
                      className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                    >
                      Voltar para Agenda
                    </button>
                    
                    <button
                      id="btn-finished-consultation-register"
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-250/25"
                    >
                      Finalizar Consulta &amp; Atendimento <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* Module 3: Available Hours selector settings */}
          {activeTab === 'disponibilidade' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-display font-semibold text-slate-800 text-xl">Configurar Horários de Atendimento</h3>
                <p className="text-slate-500 text-xs">Selecione quais horários você quer disponibilizar aos pacientes para consultas.</p>
              </div>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                As consultas marcadas seguirão esses slots gerais de atendimento. Ao desmarcar um horário, os pacientes não poderão agendar novas consultas naquele período dali em diante.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {hoursTemplate.map((hr) => {
                  const isActive = localHours.includes(hr);
                  return (
                    <button
                      key={hr}
                      onClick={() => handleHourToggle(hr)}
                      className={`p-3 rounded-xl border font-mono text-sm font-semibold flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500/50 shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <span>{hr}</span>
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white ${isActive ? 'bg-emerald-650 text-[10px] bg-emerald-600' : 'bg-slate-100'}`}>
                        {isActive && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 bg-amber-50 rounded-xl p-4 border border-amber-200/60 leading-relaxed text-xs text-amber-800">
                <span className="font-bold flex items-center gap-1 mb-1"><ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" /> Nota importante</span>
                Novos horários selecionados ficam ativos imediatamente nas ferramentas de busca de agendamento online para os pacientes.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
