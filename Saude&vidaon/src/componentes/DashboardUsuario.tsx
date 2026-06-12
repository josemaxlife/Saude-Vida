/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Paciente, Medico, Consulta, Atendimento } from '../tipos';
import { Calendar, User, FileText, CheckCircle2, Clock, XCircle, Trash2, ShieldAlert, ChevronRight, Filter, Search, Plus, Mail, Phone } from 'lucide-react';

interface DashboardUsuarioProps {
  paciente: Paciente;
  medicos: Medico[];
  consultas: Consulta[];
  atendimentos: Atendimento[];
  onScheduleConsulta: (consultaData: {
    medico_id: string;
    data: string;
    hora: string;
    motivo: string;
  }) => void;
  onCancelConsulta: (consultaId: string) => void;
  onRescheduleConsulta: (consultaId: string, novaData: string, novaHora: string) => void;
  onUpdatePatient: (updatedPatient: Paciente) => void;
  onLogout: () => void;
}

export const DashboardUsuario: React.FC<DashboardUsuarioProps> = ({
  paciente,
  medicos,
  consultas,
  atendimentos,
  onScheduleConsulta,
  onCancelConsulta,
  onRescheduleConsulta,
  onUpdatePatient,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'agendar' | 'historico'>('perfil');
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(paciente.nome);
  const [editPhone, setEditPhone] = useState(paciente.telefone);

  // Schedule Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectDoctorId, setSelectDoctorId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [consultReason, setConsultReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Reschedule State
  const [rescheduleConsultaId, setRescheduleConsultaId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Filter lists
  const specialties = Array.from(new Set(medicos.map(m => m.especialidade)));
  
  const filteredDoctors = selectedSpecialty
    ? medicos.filter(m => m.especialidade === selectedSpecialty)
    : medicos;

  // Selected Doctor Object
  const currentDoctor = medicos.find(m => m.id === selectDoctorId);

  // Compute available times for the selected doctor on the selected date
  // Rule: "Um médico não pode ter duas consultas no mesmo horário"
  const getAvailableTimesForDate = (docId: string, dateStr: string) => {
    if (!docId || !dateStr) return [];
    
    const doctorObj = medicos.find(m => m.id === docId);
    if (!doctorObj) return [];

    // All active booked times for this doctor on this date
    const bookedTimes = consultas
      .filter(c => c.medico_id === docId && c.data === dateStr && c.status === 'AGENDADA')
      .map(c => c.hora);

    // Filter out standard hours that are already booked
    return doctorObj.disponibilidade.filter(time => !bookedTimes.includes(time));
  };

  const getAvailableHoursList = () => {
    if (!selectDoctorId || !targetDate) return [];
    return getStoredAvailableTimes();
  };

  const getStoredAvailableTimes = () => {
    return getAvailableTimesForDate(selectDoctorId, targetDate);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectDoctorId || !targetDate || !targetTime) {
      setFormError('Por favor, selecione o médico, data e horário desejados.');
      return;
    }

    // Verify appointment duplicate in database
    const hasConflict = consultas.some(
      c => c.medico_id === selectDoctorId && c.data === targetDate && c.hora === targetTime && c.status === 'AGENDADA'
    );

    if (hasConflict) {
      setFormError('Este horário já foi ocupado. Por favor, escolha outro horário.');
      return;
    }

    onScheduleConsulta({
      medico_id: selectDoctorId,
      data: targetDate,
      hora: targetTime,
      motivo: consultReason
    });

    setFormSuccess(true);
    setTargetDate('');
    setTargetTime('');
    setConsultReason('');
    
    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab('perfil'); // redirect to list
    }, 2000);
  };

  // Filter appointments for THIS patient only
  const patientConsultas = consultas
    .filter(c => c.paciente_id === paciente.id)
    .sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`));

  const upcomingConsultas = patientConsultas.filter(c => c.status === 'AGENDADA');
  const pastConsultas = patientConsultas.filter(c => c.status === 'REALIZADA' || c.status === 'CANCELADA');

  const handleSaveProfile = () => {
    if (!editName || !editPhone) return;
    onUpdatePatient({ ...paciente, nome: editName, telefone: editPhone });
    setIsEditingProfile(false);
  };

  // Search associated atendimento/clinical notes for a consultation
  const getAtendimentoForConsulta = (consultaId: string) => {
    return atendimentos.find(a => a.consulta_id === consultaId);
  };

  const handleDownloadPDF = (consulta: Consulta, aten: Atendimento | undefined, medico: Medico | undefined) => {
    const doc = new jsPDF();
    
    // Cores e Estilos Básicos (Alinhados com a UI)
    const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
    const secondaryColor: [number, number, number] = [100, 116, 139]; // slate-500
    const borderColor: [number, number, number] = [30, 41, 59]; // slate-800 - borda forte do cabeçalho
    const lightBorder: [number, number, number] = [203, 213, 225]; // slate-300
    
    // Cabeçalho Principal (Esquerda)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Saúde&Vida Clínica Médica", 20, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Av. Liberdade, Tete", 20, 32);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Tel: (+258) 84 123 4567 | contato@saudevida.co.mz", 20, 37);
    
    // Linha Separadora Grossa (Header)
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.8);
    doc.line(20, 42, 190, 42);
    
    // Título Principal
    let y = 52;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PRONTUÁRIO CLÍNICO DE ATENDIMENTO", 105, y, { align: "center" });
    
    y += 12;
    
    // Subtítulos DADOS (Layout de Colunas Grid)
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("DADOS DO PACIENTE", 20, y);
    doc.text("DADOS DO ATENDIMENTO", 105, y);
    
    y += 2;
    // Linha fina separadora de blocos
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.setLineWidth(0.4);
    doc.line(20, y, 95, y);
    doc.line(105, y, 190, y);
    
    y += 6;
    
    // Função Auxiliar para os campos de dados com "rótulo mono-like" simulado por bold compacto
    const drawFieldInfo = (label: string, value: string, x: number, yPos: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(label, x, yPos);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(value, x + 23, yPos);
    };
    
    drawFieldInfo("NOME:", paciente.nome, 20, y);
    drawFieldInfo("MÉDICO:", `Dr(a). ${medico?.nome || 'Desconhecido'} (${medico?.especialidade || '-'})`, 105, y);
    y += 6;
    
    drawFieldInfo("CONTATO:", paciente.telefone, 20, y);
    drawFieldInfo("CRM:", medico?.crm || '-', 105, y);
    y += 6;
    
    drawFieldInfo("EMAIL:", paciente.email, 20, y);
    drawFieldInfo("DATA/HORA:", `${new Date(consulta.data).toLocaleDateString('pt-PT')} às ${consulta.hora}`, 105, y);
    y += 6;
    
    if (paciente.dataNascimento) {
       drawFieldInfo("NASCIMENTO:", new Date(paciente.dataNascimento).toLocaleDateString('pt-PT'), 20, y);
    }
    drawFieldInfo("STATUS:", consulta.status.toUpperCase(), 105, y);
    
    y += 8;
    // Borda Inferior
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.setLineWidth(0.4);
    doc.line(20, y, 190, y);
    
    y += 12;
    
    // Seções de Conteúdo Principais
    const addSectionBlock = (title: string, content: string | undefined, isMonoBox: boolean = false, isItalic: boolean = false) => {
      if (!content) return;
      
      const lines = doc.splitTextToSize(content || '-', isMonoBox ? 160 : 170);
      const textHeight = lines.length * 5;
      const blockHeight = isMonoBox ? textHeight + 12 : textHeight + 6;
      
      if (y + blockHeight > 240) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title.toUpperCase() + " (CONTINUAÇÃO)", 20, y);
        y += 6;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(title.toUpperCase(), 20, y);
      y += 6;
      
      if (isMonoBox) {
        // Estilo especial para Prescrição Médica - Bloco Caixa Monospace UI style
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.rect(20, y, 170, textHeight + 6, 'FD');
        doc.setFont("courier", "normal"); // simular monospace
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // slate-900 (mais escuro na mono)
        doc.text(lines, 25, y + 6);
        y += textHeight + 6 + 10;
      } else {
        // Texto Normal sem bordas
        doc.setFont("helvetica", isItalic ? "italic" : "normal");
        doc.setFontSize(10);
        doc.setTextColor(isItalic ? secondaryColor[0] : primaryColor[0], isItalic ? secondaryColor[1] : primaryColor[1], isItalic ? secondaryColor[2] : primaryColor[2]);
        doc.text(lines, 20, y);
        y += textHeight + 8;
      }
    };
    
    addSectionBlock("MOTIVO DA CONSULTA", consulta.motivo || 'Check-up geral');
    
    if (aten) {
      addSectionBlock("QUADRO CLÍNICO E SINTOMAS", aten.sintomas);
      addSectionBlock("DIAGNÓSTICO FINAL", aten.diagnostico);
      addSectionBlock("PRESCRIÇÃO MÉDICA E CONDUTA", aten.prescricao, true); // Especial Mono Box
      if (aten.observacoes) {
        addSectionBlock("RECOMENDAÇÕES CLÍNICAS ADICIONAIS", aten.observacoes, false, true); // Itálico
      }
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Detalhes clínicos não preenchidos pelo profissional.", 20, y);
      y += 15;
    }
    
    // Assinatura Integrada na mesma página (se houver espaço, senão empurra pra próxima)
    if (y > 235) {
        doc.addPage();
        y = 40;
    } else {
        y += 24; // Espaço em branco antes da linha de assinatura
    }
    
    // Linha pequena de assinatura
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.4);
    const centerPage = 105;
    doc.line(centerPage - 30, y, centerPage + 30, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Dr(a). ${medico?.nome || 'Médico Responsável'}`, centerPage, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`CRM: ${medico?.crm || 'Não informado'}`, centerPage, y, { align: "center" });

    // Rodapé de todas as páginas
    const numPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= numPages; i++) {
        doc.setPage(i);
        
        // Linha do rodapé
        doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
        doc.setLineWidth(0.3);
        doc.line(20, 285, 190, 285);
        
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`Documento gerado eletronicamente - Saúde&Vida Clínica Médica`, 20, 290);
        doc.text(`Página ${i} de ${numPages}`, 190, 290, { align: 'right' });
    }

    doc.save(`Prontuario_${consulta.data.replace(/-/g, '')}.pdf`);
  };

  return (
    <div id="patient-dashboard-root" className="min-h-screen bg-slate-100">
      {/* Top Banner Accent - High Density Styling */}
      <div className="bg-slate-900 text-white shadow-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl text-white shadow-inner uppercase">
              {paciente.nome.substring(0, 2)}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">MedFlow Digital • Espaço do Paciente</span>
              <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                {paciente.nome}
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700/50">Paciente Registrado</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-patient-quick-schedule"
              onClick={() => setActiveTab('agendar')}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Nova Marcação
            </button>
            <button
              id="btn-patient-logout"
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
            <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">Módulos do Paciente</p>
            <button
              id="tab-patient-dashboard"
              onClick={() => setActiveTab('perfil')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className={`h-4 w-4 ${activeTab === 'perfil' ? 'text-white' : 'text-slate-400'}`} /> Minhas Consultas
            </button>
            
            <button
              id="tab-patient-schedule"
              onClick={() => setActiveTab('agendar')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'agendar'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === 'agendar' ? 'text-white' : 'text-slate-400'}`} /> Marcar Nova Consulta
            </button>

            <button
              id="tab-patient-history"
              onClick={() => setActiveTab('historico')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className={`h-4 w-4 ${activeTab === 'historico' ? 'text-white' : 'text-slate-400'}`} /> Relatórios Médico ({pastConsultas.filter(c => c.status === 'REALIZADA').length})
            </button>
          </div>

          {/* Quick Contact Info card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed font-medium space-y-3 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> MINHA CONTA</h4>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)} 
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Editar
                </button>
              )}
            </div>
            
            {isEditingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Contacto / Telefone</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleSaveProfile}
                    className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded hover:bg-blue-700 transition"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={() => {
                      setEditName(paciente.nome);
                      setEditPhone(paciente.telefone);
                      setIsEditingProfile(false);
                    }}
                    className="flex-1 bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 rounded hover:bg-slate-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> <span className="text-slate-700 font-semibold">{paciente.nome}</span></p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> <span className="text-slate-700">{paciente.telefone}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Central Content Area */}
        <div className="lg:col-span-9">

          {/* tab 1: Perfil & Appointments */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              
              {/* Upcoming schedules card list */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800 text-lg">Consultas Agendadas</h3>
                    <p className="text-xs text-slate-500">As suas próximas consultas aparecerão aqui.</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {upcomingConsultas.length} Confirmadas
                  </span>
                </div>

                {upcomingConsultas.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center">
                    <Calendar className="h-10 w-10 text-slate-300 stroke-1.5 mb-2" />
                    <p className="text-slate-500 font-medium text-sm">Não há agendamentos ativos.</p>
                    <button
                      onClick={() => setActiveTab('agendar')}
                      className="text-xs text-blue-600 font-semibold underline mt-1"
                    >
                      Marque agora sua consulta médica
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingConsultas.map((c) => {
                      const doc = medicos.find(m => m.id === c.medico_id);
                      return (
                        <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {doc?.nome.replace('Dr. ', '').replace('Dra. ', '').substring(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{doc?.nome}</h4>
                              <p className="text-xs text-slate-500">{doc?.especialidade} ({doc?.crm})</p>
                              {c.motivo && <p className="text-xs text-slate-400 mt-1 italic">"{c.motivo}"</p>}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row flex-wrap items-end sm:items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            {rescheduleConsultaId === c.id ? (
                              <div className="flex flex-col items-end gap-2 bg-slate-50 p-3 border border-slate-200 rounded-lg w-full sm:w-auto">
                                <div className="flex gap-2">
                                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="border border-slate-300 py-1.5 px-2 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                                  <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="border border-slate-300 py-1.5 px-2 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Hora</option>
                                    {doc?.disponibilidade.map(h => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if(!rescheduleDate || !rescheduleTime) { setRescheduleError('Selecione uma nova data e hora'); return; }
                                      const slotTaken = consultas.some(co => co.medico_id === doc?.id && co.data === rescheduleDate && co.hora === rescheduleTime && co.status === 'AGENDADA');
                                      if (slotTaken) {
                                        setRescheduleError('Horário não disponível');
                                      } else {
                                        onRescheduleConsulta(c.id, rescheduleDate, rescheduleTime);
                                        setRescheduleConsultaId(null);
                                        setRescheduleError('');
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-md transition-colors"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setRescheduleConsultaId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                {rescheduleError && <span className="text-red-500 text-[10px] w-full text-right">{rescheduleError}</span>}
                              </div>
                            ) : (
                              <>
                                <div className="text-right">
                                  <span className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                                    {new Date(c.data).toLocaleDateString('pt-PT')} às {c.hora}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setRescheduleConsultaId(c.id);
                                      setRescheduleDate(c.data);
                                      setRescheduleTime(c.hora);
                                      setRescheduleError('');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 p-1.5 px-2.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                                  >
                                    <Calendar className="h-3.5 w-3.5" /> Remarcar
                                  </button>

                                  <button
                                    id={`btn-cancel-consulta-${c.id}`}
                                    onClick={() => {
                                      if (confirm('Tem certeza de que deseja cancelar esta consulta?')) {
                                        onCancelConsulta(c.id);
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium hover:bg-red-50 p-1.5 px-2.5 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Cancelar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Past history summary quick checklist */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-800 text-lg">Consultas Passadas</h3>
                    <p className="text-xs text-slate-500">Histórico simplificado de atendimentos e ausências.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('historico')}
                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Ver Prontuários Completos <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {pastConsultas.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">Nenhuma consulta anterior registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {pastConsultas.slice(0, 3).map((c) => {
                      const doc = medicos.find(m => m.id === c.medico_id);
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => { if (c.status === 'REALIZADA') setActiveTab('historico') }}
                          className={`p-3 rounded-lg flex items-center justify-between border border-transparent transition-all ${
                            c.status === 'REALIZADA' 
                              ? 'bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer group' 
                              : 'bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mb-1 ${
                              c.status === 'REALIZADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {c.status}
                            </span>
                            <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{doc?.nome} ({doc?.especialidade})</p>
                            <span className="text-[10px] text-slate-400 font-medium">Marcada em: {new Date(c.data).toLocaleDateString('pt-PT')} - {c.hora}</span>
                          </div>
                          {c.status === 'REALIZADA' && (
                            <button
                              className="text-[11px] text-blue-600 bg-blue-100 font-semibold px-2.5 py-1 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors"
                            >
                              Ver Prontuário
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* tab 2: Marcar nova Consulta (O Agendamento) */}
          {activeTab === 'agendar' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="font-display font-semibold text-slate-800 text-xl">Marcar Nova Consulta</h3>
                <p className="text-slate-500 text-xs">Formulário integrado com validação automática de horários.</p>
              </div>

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-2 font-medium mb-6 animate-bounce">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> Consulta registrada com sucesso! A clínica confirmou de forma automática.
                </div>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs leading-relaxed mb-6">
                  {formError}
                </div>
              )}

              <form onSubmit={handleScheduleSubmit} className="space-y-6">
                
                {/* Specialty Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="filter-specialty" className="block text-xs font-bold text-slate-700 uppercase">Especialidade Desejada</label>
                    <select
                      id="filter-specialty"
                      value={selectedSpecialty}
                      onChange={(e) => {
                        setSelectedSpecialty(e.target.value);
                        setSelectDoctorId(''); // reset doctor selection on specialty change
                        setTargetDate('');
                        setTargetTime('');
                      }}
                      className="w-full border border-slate-250 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as Especialidades</option>
                      {specialties.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor List */}
                  <div className="space-y-1.5">
                    <label htmlFor="schedule-doctor" className="block text-xs font-bold text-slate-700 uppercase">Profissional Médico</label>
                    <select
                      id="schedule-doctor"
                      value={selectDoctorId}
                      onChange={(e) => {
                        setSelectDoctorId(e.target.value);
                        setTargetDate('');
                        setTargetTime('');
                      }}
                      required
                      className="w-full border border-slate-250 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Selecione o Médico --</option>
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.nome} ({doc.especialidade}) - {doc.crm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Doctor details banner if picked */}
                {currentDoctor && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-250 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 tracking-wider block uppercase">Profissional Selecionado</span>
                      <h4 className="font-semibold text-slate-800 text-sm mt-0.5">{currentDoctor.nome}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Especialidade: <strong className="text-slate-700">{currentDoctor.especialidade}</strong></p>
                      <p className="text-xs text-slate-400 font-mono">Registro: {currentDoctor.crm}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 tracking-wider block uppercase">Dias e Horários Disponíveis</span>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        Este médico atende de Segunda a Sexta nos horários: {currentDoctor.disponibilidade.join(', ')}.
                      </p>
                      <p className="text-xs text-slate-500 mt-1 italic">Agendamentos futuros dependem de vagas livres naquele dia específico.</p>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                {selectDoctorId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="schedule-date" className="block text-xs font-bold text-slate-700 uppercase">Data da Consulta</label>
                      <input
                        id="schedule-date"
                        type="date"
                        value={targetDate}
                        min={new Date().toISOString().split('T')[0]} // avoid booking past dates
                        onChange={(e) => {
                          setTargetDate(e.target.value);
                          setTargetTime('');
                        }}
                        required
                        className="w-full border border-slate-250 rounded-lg py-3 px-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-50 transition-colors"
                      />
                    </div>

                    {/* Time Selection with Availability validations in Real Time */}
                    {targetDate && (
                      <div className="space-y-1.5">
                        <label htmlFor="schedule-time" className="block text-xs font-bold text-slate-700 uppercase">Horários Disponíveis para este dia</label>
                        {getAvailableHoursList().length === 0 ? (
                          <div className="p-2.5 border border-dashed border-amber-200 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                            Nenhum horário livre para este médico no dia selecionado. Por favor, mude de data ou médico.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {getAvailableHoursList().map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setTargetTime(time)}
                                className={`py-2 px-1 text-center text-xs font-medium rounded-lg border transition-all ${
                                  targetTime === time
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-102 font-semibold'
                                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                        <input type="hidden" required value={targetTime} />
                      </div>
                    )}
                  </div>
                )}

                {/* Reason Details */}
                {selectDoctorId && targetDate && targetTime && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
                    <label htmlFor="schedule-reason" className="block text-xs font-bold text-slate-700 uppercase">Motivo Principal / Sintomas Iniciais</label>
                    <textarea
                      id="schedule-reason"
                      placeholder="Descreva brevemente o que está sentindo (ex: cansaço, dor de cabeça, consulta anual, etc.)"
                      value={consultReason}
                      onChange={(e) => setConsultReason(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-250 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                )}

                {/* Submitting Button */}
                <button
                  id="btn-schedule-submit-confirmation"
                  type="submit"
                  disabled={!selectDoctorId || !targetDate || !targetTime}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  Concluir Agendamento <CheckCircle2 className="h-4 w-4" />
                </button>

              </form>
            </div>
          )}

          {/* tab 3: Histórico Clínico Prontuário */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="font-display font-semibold text-slate-800 text-xl">Resultados Médicos</h3>
              </div>

              {pastConsultas.filter(c => c.status === 'REALIZADA').length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Ainda não existem resultados disponíveis.</p>
                  <p className="text-xs text-slate-400 mt-1">Os resultados e recomendações médicas serão apresentados aqui após a conclusão de uma consulta.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pastConsultas
                    .filter(c => c.status === 'REALIZADA')
                    .map((c) => {
                      const doc = medicos.find(m => m.id === c.medico_id);
                      const aten = getAtendimentoForConsulta(c.id);

                      return (
                        <div key={c.id} className="bg-white border border-slate-300 rounded-none p-6 md:p-10 shadow-sm mx-auto mb-8 max-w-4xl font-sans relative">
                          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Saúde&Vida Clínica Médica</h2>
                              <p className="text-xs text-slate-500 font-medium">Av. Liberdade, Tete</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Tel: (+258) 84 123 4567 | contato@saudevida.co.mz</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownloadPDF(c, aten, doc); }}
                              className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold border-2 border-blue-600 px-3 py-1.5 hover:bg-blue-50 transition-colors shadow-sm bg-white print:hidden"
                            >
                              <FileText className="h-3.5 w-3.5" /> Baixar PDF
                            </button>
                          </div>

                          <h3 className="text-center font-bold text-slate-900 text-sm tracking-widest mb-8">PRONTUÁRIO CLÍNICO DE ATENDIMENTO</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm mb-8 border-b border-slate-300 pb-8">
                            <div>
                              <p className="font-bold text-slate-700 border-b-2 border-slate-200 pb-1.5 mb-3 text-xs tracking-wider">DADOS DO PACIENTE</p>
                              <div className="space-y-1.5 text-slate-800">
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">NOME:</span> {paciente.nome}</p>
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">CONTATO:</span> {paciente.telefone}</p>
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">EMAIL:</span> {paciente.email}</p>
                                {paciente.dataNascimento && <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">NASCIMENTO:</span> {new Date(paciente.dataNascimento).toLocaleDateString('pt-PT')}</p>}
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-slate-700 border-b-2 border-slate-200 pb-1.5 mb-3 text-xs tracking-wider">DADOS DO ATENDIMENTO</p>
                              <div className="space-y-1.5 text-slate-800">
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">MÉDICO:</span> Dr(a). {doc?.nome || 'Desconhecido'} ({doc?.especialidade})</p>
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">CRM:</span> {doc?.crm || '-'}</p>
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">DATA/HORA:</span> {new Date(c.data).toLocaleDateString('pt-PT')} às {c.hora}</p>
                                <p><span className="text-slate-500 font-medium font-mono text-xs w-24 inline-block">STATUS:</span> <span className="uppercase">{c.status}</span></p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs mb-1.5 tracking-wider">MOTIVO DA CONSULTA</h4>
                              <p className="text-slate-700 text-sm">{c.motivo || 'Check-up geral'}</p>
                            </div>

                            {aten ? (
                              <div className="space-y-6">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 tracking-wider">QUADRO CLÍNICO E SINTOMAS</h4>
                                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{aten.sintomas}</p>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 tracking-wider">DIAGNÓSTICO FINAL</h4>
                                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{aten.diagnostico}</p>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 tracking-wider">PRESCRIÇÃO MÉDICA E CONDUTA</h4>
                                  <p className="text-slate-800 text-sm whitespace-pre-wrap font-mono p-4 border border-slate-300 bg-slate-50/50">{aten.prescricao}</p>
                                </div>
                                {aten.observacoes && (
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-xs mb-1.5 tracking-wider">RECOMENDAÇÕES CLÍNICAS ADICIONAIS</h4>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap italic">{aten.observacoes}</p>
                                  </div>
                                )}
                                
                                <div className="pt-16 text-center text-xs text-slate-500">
                                  <div className="w-56 mx-auto border-t border-slate-800 mb-2"></div>
                                  <p className="font-bold text-slate-800 text-sm">Dr(a). {doc?.nome}</p>
                                  <p className="text-xs">CRM: {doc?.crm}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 text-sm italic py-8 border-t border-slate-100">
                                Detalhes clínicos não preenchidos pelo profissional.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
