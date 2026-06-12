/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Medico, Paciente, Consulta, Atendimento } from '../tipos';
import { Users, Stethoscope, Calendar, ArrowUpRight, BarChart3, Plus, Search, Filter, Mail, Phone, Hash, ShieldCheck, CheckCircle2, XCircle, Key, Activity, Clock, Edit2 } from 'lucide-react';

interface DashboardAdministradorProps {
  medicos: Medico[];
  pacientes: Paciente[];
  consultas: Consulta[];
  atendimentos: Atendimento[];
  onAddMedico: (novoMedico: Medico) => void;
  onLogout: () => void;
}

export const DashboardAdministrador: React.FC<DashboardAdministradorProps> = ({
  medicos,
  pacientes,
  consultas,
  atendimentos,
  onAddMedico,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'medicos' | 'pacientes' | 'consultas'>('kpis');
  
  // Doctor Add Form States
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [newGender, setNewGender] = useState('Masculino');
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('Clínica Geral');
  const [newCrm, setNewCrm] = useState('');
  const [initialHours, setInitialHours] = useState<string[]>(['08:00', '09:00', '10:00', '14:00', '15:00', '16:00']);
  const [formSuccessMsg, setFormSuccessMsg] = useState('');

  // Filtering Ledgers
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'TODAS' | 'AGENDADA' | 'CANCELADA' | 'REALIZADA'>('TODAS');
  const [docSearch, setDocSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Calculations for KPIs
  const totalAgendadas = consultas.filter(c => c.status === 'AGENDADA').length;
  const totalRealizadas = consultas.filter(c => c.status === 'REALIZADA').length;
  const totalCanceladas = consultas.filter(c => c.status === 'CANCELADA').length;
  const totalConsultasCount = consultas.length;

  // Rating and performance computation
  const getConsultCountsForDoctor = (medicoId: string) => {
    return consultas.filter(c => c.medico_id === medicoId).length;
  };

  const getCompletedCountForDoctor = (medicoId: string) => {
    return consultas.filter(c => c.medico_id === medicoId && c.status === 'REALIZADA').length;
  };

  // Specialty statistics for plotting
  const specialtiesStats = medicos.reduce((acc, current) => {
    const spec = current.especialidade;
    const conCount = consultas.filter(c => {
      const doc = medicos.find(m => m.id === c.medico_id);
      return doc?.especialidade === spec;
    }).length;

    acc[spec] = (acc[spec] || 0) + conCount;
    return acc;
  }, {} as Record<string, number>);

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCrm.trim()) return;

    let finalName = newName.trim();
    if (!finalName.startsWith('Dr.') && !finalName.startsWith('Dra.')) {
      finalName = newGender === 'Masculino' ? `Dr. ${finalName}` : `Dra. ${finalName}`;
    }

    const newDoc: Medico = {
      id: `med-${Date.now()}`,
      nome: finalName,
      email: `${newCrm.toLowerCase().replace(/\W/g, '')}@email.com`,
      senha: 'dr1234',
      especialidade: newSpecialty,
      disponibilidade: initialHours,
      crm: newCrm,
      rating: 5.0
    };

    onAddMedico(newDoc);
    setFormSuccessMsg('Profissional cadastrado com sucesso!');
    
    // Clear states
    setNewName('');
    setNewCrm('');
    
    setTimeout(() => {
      setFormSuccessMsg('');
      setShowAddDoctorForm(false);
    }, 1800);
  };

  // Filter clinical master consultation lists
  const filteredConsultasLedger = consultas.filter(c => {
    const docObj = medicos.find(m => m.id === c.medico_id);
    const patObj = pacientes.find(p => p.id === c.paciente_id);
    
    const matchesStatus = ledgerStatusFilter === 'TODAS' || c.status === ledgerStatusFilter;
    const matchesDocName = docObj?.nome.toLowerCase().includes(docSearch.toLowerCase()) || false;
    const matchesPatName = patObj?.nome.toLowerCase().includes(docSearch.toLowerCase()) || false;

    return matchesStatus && (docSearch === '' || matchesDocName || matchesPatName);
  });
  return (
    <div id="admin-dashboard-root" className="min-h-screen bg-slate-100">
      {/* Top Banner Accent - High Density Styling */}
      <div className="bg-slate-900 text-white shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl text-white shadow-inner">
              H+
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">MedFlow Digital • Gestão</span>
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                Central de Operações ADMIN 
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700/50">Diretoria Clínica</span>
              </h1>
            </div>
          </div>

          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-3 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">Administração</p>
            <button
              id="tab-admin-kpis"
              onClick={() => setActiveTab('kpis')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                activeTab === 'kpis'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className={`h-4 w-4 ${activeTab === 'kpis' ? 'text-white' : 'text-slate-400'}`} /> Relatório de Desempenho
            </button>
            
            <button
              id="tab-admin-medicos"
              onClick={() => setActiveTab('medicos')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                activeTab === 'medicos'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className={`h-4 w-4 ${activeTab === 'medicos' ? 'text-white' : 'text-slate-400'}`} /> Gestão de Médicos ({medicos.length})
            </button>

            <button
              id="tab-admin-pacientes"
              onClick={() => setActiveTab('pacientes')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                activeTab === 'pacientes'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className={`h-4 w-4 ${activeTab === 'pacientes' ? 'text-white' : 'text-slate-400'}`} /> Gestão de Pacientes ({pacientes.length})
            </button>

            <button
              id="tab-admin-consultas"
              onClick={() => setActiveTab('consultas')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-colors ${
                activeTab === 'consultas'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === 'consultas' ? 'text-white' : 'text-slate-400'}`} /> Monitorizar Consultas ({consultas.length})
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed font-semibold space-y-2 shadow-inner">
            <span className="font-bold text-slate-700 uppercase flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" /> Modo Diretor Clínico
            </span>
            <span>Este perfil possui privilégio para auditar, acrescentar novos doutores e realizar o controle de horários.</span>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-9">

          {/* TAB 1: KPI Dashboard & charts */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              
              {/* Stat numerical boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Atendimentos Hoje</span>
                  <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">{totalAgendadas}</span>
                  <span className="text-[10px] text-blue-600 font-medium block mt-1.5 bg-blue-50/60 px-2 py-0.5 rounded-full w-max">AGENDADOS</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Histórico Realizado</span>
                  <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">{totalRealizadas}</span>
                  <span className="text-[10px] text-emerald-605 font-medium block mt-1.5 bg-emerald-50/60 px-2 py-0.5 text-emerald-700 rounded-full w-max">CONCLUÍDOS</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cancelados</span>
                  <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">{totalCanceladas}</span>
                  <span className="text-[10px] text-red-650 font-medium block mt-1.5 bg-red-50/60 text-red-700 rounded-full w-max">FALTAS/SISTEMA</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Acumulado</span>
                  <span className="text-3xl font-extrabold font-display text-slate-900 block mt-1">{totalConsultasCount}</span>
                  <span className="text-[10px] text-slate-650 font-medium block mt-1.5 bg-slate-100 text-slate-700 rounded-full w-max">SOMA TOTAL</span>
                </div>
              </div>

              {/* Data Visualization charts using editorial CSS/SVG graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart 1: Consultations count by Specialty */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-display font-semibold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Demanda por Especialidade (Consultas)</h3>
                  
                  <div className="space-y-4">
                    {Object.keys(specialtiesStats).map((spec) => {
                      const count = specialtiesStats[spec] || 0;
                      const percentage = totalConsultasCount > 0 ? (count / totalConsultasCount) * 100 : 0;
                      return (
                        <div key={spec} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-700">{spec}</span>
                            <span className="font-bold text-slate-900 font-mono">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${Math.max(percentage, 4)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Doctor Patient stats and conversion metrics */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-display font-semibold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Fluxo Clínico e Atividade Individual</h3>
                  
                  <div className="space-y-3.5">
                    {medicos.slice(0, 4).map((doc) => {
                      const totalDocsCon = getConsultCountsForDoctor(doc.id);
                      const completedDocsCon = getCompletedCountForDoctor(doc.id);
                      return (
                        <div key={doc.id} className="text-xs bg-slate-50 p-2.5 rounded-lg flex justify-between items-center border border-slate-150">
                          <div>
                            <p className="font-semibold text-slate-800">{doc.nome}</p>
                            <p className="text-slate-500 text-[11px]">{doc.especialidade}</p>
                          </div>
                          <div className="text-right font-mono">
                            <p className="font-bold text-slate-800">{totalDocsCon} convocadas</p>
                            <p className="text-emerald-600 text-[10px] font-semibold">{completedDocsCon} concluídas com prontuário</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Doctor management layout list */}
          {activeTab === 'medicos' && (
            <div className="space-y-6">
              
              {/* Doctor Control actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-150">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800 text-lg">Corpo Clínico Ativo</h3>
                    <p className="text-xs text-slate-500">Visualizar credenciais, classificações de pacientes e registrar novos especialistas.</p>
                  </div>
                  
                  <button
                    id="btn-admin-add-doctor-toggler"
                    onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1 transition-colors shadow-md shadow-blue-250/20"
                  >
                    <Plus className="h-4 w-4" /> {showAddDoctorForm ? 'Cancelar Cadastro' : 'Cadastrar Médico'}
                  </button>
                </div>

                {/* Add Doctor form toggle expand */}
                {showAddDoctorForm && (
                  <form onSubmit={handleAddDoctorSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mb-6">
                    <h4 className="font-semibold text-slate-800 text-sm">Cadastrar Novo...</h4>
                    
                    {formSuccessMsg && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs flex items-center gap-1 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {formSuccessMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      
                      {/* Gender selection */}
                      <div className="space-y-1">
                        <label htmlFor="adm-med-gender" className="block text-xs font-semibold text-slate-700">Sexo</label>
                        <select
                          id="adm-med-gender"
                          value={newGender}
                          onChange={(e) => setNewGender(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                        </select>
                      </div>

                      {/* Name input */}
                      <div className="space-y-1 sm:col-span-1">
                        <label htmlFor="adm-med-name" className="block text-xs font-semibold text-slate-700">Nome do Médico</label>
                        <input
                           id="adm-med-name"
                          type="text"
                          required
                          placeholder="Ex: Juliana Reis"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Specialty selection */}
                      <div className="space-y-1">
                        <label htmlFor="adm-med-spec" className="block text-xs font-semibold text-slate-700">Especialidade</label>
                        <select
                          id="adm-med-spec"
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Clínica Geral">Clínica Geral</option>
                          <option value="Cardiologia">Cardiologia</option>
                          <option value="Pediatria">Pediatria</option>
                          <option value="Dermatologia">Dermatologia</option>
                          <option value="Ortopedia">Ortopedia</option>
                          <option value="Ginecologia">Ginecologia</option>
                          <option value="Oftalmologia">Oftalmologia</option>
                          <option value="Neurologia">Neurologia</option>
                        </select>
                      </div>

                      {/* CRM */}
                      <div className="space-y-1">
                        <label htmlFor="adm-med-crm" className="block text-xs font-semibold text-slate-700">CRM de Inscrição</label>
                        <input
                          id="adm-med-crm"
                          type="text"
                          required
                          placeholder="CRM/SP 999999"
                          value={newCrm}
                          onChange={(e) => setNewCrm(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                    </div>

                    <button
                      id="btn-admin-add-doctor-submit"
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-md"
                    >
                      Salvar Cadastro Médico
                    </button>
                  </form>
                )}

                {/* Grid Doctors active */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicos.map((doc) => {
                    const totalCons = getConsultCountsForDoctor(doc.id);
                    return (
                      <div key={doc.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm leading-snug">{doc.nome}</h4>
                            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{doc.especialidade}</span>
                          </div>
                          <span className="text-xs text-slate-450 font-mono font-bold text-slate-400">{doc.crm}</span>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-3 text-[11px] text-slate-500 relative">
                          <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">Login: <strong className="text-slate-700">{doc.email}</strong></span></div>
                          <div className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">Senha: <strong className="text-slate-700">{doc.senha || 'dr1234'}</strong></span></div>
                          <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">Histórico: <strong className="text-slate-700">{totalCons} consultas</strong></span></div>
                          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">Horários: <strong className="font-mono text-slate-600 truncate">{doc.disponibilidade.slice(0, 3).join(', ')}...</strong></span></div>
                          
                          <div className="col-span-1 sm:col-span-2 pt-2">
                             <button
                               onClick={() => alert(`Editar perfil de ${doc.nome}`)}
                               className="w-full flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:text-blue-700 py-1.5 rounded-lg text-slate-600 font-semibold transition-colors"
                             >
                               <Edit2 className="h-3.5 w-3.5" /> Editar Profissional
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Patients list layout */}
          {activeTab === 'pacientes' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-150 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-semibold text-slate-800 text-lg">Cadastro de Pacientes Ativos</h3>
                  <p className="text-xs text-slate-500">Lista geral de pacientes registrados e volumes totais de atendimento por usuário.</p>
                </div>
                
                {/* Search query box */}
                <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1.5 rounded-lg w-full sm:w-auto">
                  <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Filtrar por paciente..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Table listings */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Nome</th>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">Contato</th>
                      <th className="py-2.5 px-3">Idade</th>
                      <th className="py-2.5 px-3 text-right">Consultas Totais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pacientes
                      .filter(p => patientSearch === '' || p.nome.toLowerCase().includes(patientSearch.toLowerCase()))
                      .map((p) => {
                        const countCon = consultas.filter(c => c.paciente_id === p.id).length;
                        
                        // Compute approximate age
                        let age = 'N/A';
                        if (p.dataNascimento) {
                          const birthYear = new Date(p.dataNascimento).getFullYear();
                          const currentYear = new Date().getFullYear();
                          age = (currentYear - birthYear).toString();
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{p.nome}</td>
                            <td className="py-2.5 px-3 text-slate-500">{p.email}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{p.telefone}</td>
                            <td className="py-2.5 px-3 text-slate-500">{age} anos</td>
                            <td className="py-2.5 px-3 text-right font-bold text-blue-700 font-mono">{countCon}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: Master clinical consultation ledgers */}
          {activeTab === 'consultas' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-150 pb-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-display font-semibold text-slate-800 text-lg">Central de Rastreabilidade (Todas as Consultas)</h3>
                  <p className="text-xs text-slate-500 font-sans">Busca individualizada e filtragem de estados em tempo real.</p>
                </div>
                
                {/* Search/Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={ledgerStatusFilter}
                    onChange={(e) => setLedgerStatusFilter(e.target.value as any)}
                    className="border border-slate-200 bg-slate-50 px-2 py-1 rounded text-xs outline-none"
                  >
                    <option value="TODAS">Qualquer Status</option>
                    <option value="AGENDADA">Agendadas</option>
                    <option value="REALIZADA">Realizadas</option>
                    <option value="CANCELADA">Canceladas</option>
                  </select>

                  <div className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-1 rounded w-full md:w-auto">
                    <Search className="h-3 w-3 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      className="bg-transparent text-xs text-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Master ledger lists table */}
              {filteredConsultasLedger.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">Nenhum registro encontrado com os filtros aplicados.</p>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left font-sans border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2 px-3">Cód</th>
                        <th className="py-2 px-3">Paciente</th>
                        <th className="py-2 px-3">Médico / Especialidade</th>
                        <th className="py-2 px-3">Horário</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredConsultasLedger.map((c) => {
                        const patObj = pacientes.find(p => p.id === c.paciente_id);
                        const docObj = medicos.find(m => m.id === c.medico_id);
                        return (
                          <tr key={c.id} className="hover:bg-slate-55/40">
                            <td className="py-2.5 px-3 text-slate-400 font-mono uppercase">{c.id.substring(0, 5)}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{patObj?.nome || 'Paciente'}</td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <span className="font-medium">{docObj?.nome}</span>
                              <span className="block text-[10px] text-slate-450 text-slate-400 uppercase font-semibold">{docObj?.especialidade}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800">
                              {new Date(c.data).toLocaleDateString('pt-PT')} às {c.hora}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                c.status === 'AGENDADA' ? 'bg-blue-105 text-blue-700 bg-blue-50 border border-blue-105' :
                                c.status === 'REALIZADA' ? 'bg-emerald-105 text-emerald-800 bg-emerald-50 border border-emerald-105' :
                                'bg-slate-105 text-slate-700 bg-slate-50 border border-slate-105'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
