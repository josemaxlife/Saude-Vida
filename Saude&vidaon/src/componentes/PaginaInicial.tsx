/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Paciente, Medico } from '../tipos';
import { Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PaginaInicialProps {
  pacientes: Paciente[];
  medicos: Medico[];
  onLoginSuccess: (type: 'patient' | 'doctor' | 'admin', id?: string) => void;
  onRegisterSuccess: (newPatient: Paciente) => void;
}

export const PaginaInicial: React.FC<PaginaInicialProps> = ({
  pacientes,
  medicos,
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBirth, setRegBirth] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const loginValue = email.trim();

    // Check Admin
    if ((loginValue.toLowerCase() === 'jose' || loginValue === 'admin' || loginValue.toLowerCase() === 'jose@admin.com' || loginValue === 'admin@clinica.com') && password === 'admin') {
      onLoginSuccess('admin');
      return;
    }

    // Check Patient
    const foundPatient = pacientes.find(p => p.email.toLowerCase() === loginValue.toLowerCase());
    if (foundPatient) {
      // Simulate checking password if one was set (otherwise let pass for demo)
      if (foundPatient.senha && foundPatient.senha !== password) {
        setLoginError('Senha incorreta para este paciente.');
        return;
      }
      onLoginSuccess('patient', foundPatient.id);
      return;
    }

    // Check Doctor via Email or Name/CRM
    const foundDoctor = medicos.find(m => 
      (m.email && m.email.toLowerCase() === loginValue.toLowerCase()) || 
      m.crm.toLowerCase().includes(loginValue.toLowerCase()) || 
      m.nome.toLowerCase().includes(loginValue.toLowerCase())
    );
    
    if (foundDoctor && loginValue !== '') {
      if (foundDoctor.senha && foundDoctor.senha !== password) {
        setLoginError('Senha incorreta para este médico.');
        return;
      }
      onLoginSuccess('doctor', foundDoctor.id);
      return;
    }

    setLoginError('Utilizador ou senha inválidos. Tente novamente.');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPhone || !regBirth || !regPass) {
      setRegError('Preencha todos os campos obrigatórios.');
      return;
    }

    const emailExists = pacientes.some(p => p.email.toLowerCase() === regEmail.toLowerCase());
    if (emailExists) {
      setRegError('Este email já está cadastrado.');
      return;
    }

    const newPatient: Paciente = {
      id: `pac-${Date.now()}`,
      nome: regName,
      email: regEmail,
      telefone: regPhone,
      senha: regPass,
      dataNascimento: regBirth
    };

    onRegisterSuccess(newPatient);
    setRegSuccess(true);
    // Reset register values
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegBirth('');
    setRegPass('');
    
    // Switch to dashboard automatically
    setTimeout(() => {
      setRegSuccess(false);
      onLoginSuccess('patient', newPatient.id);
    }, 1500);
  };

  return (
    <div id="landing-page-component" className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clinic Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800 block">
                Saúde&amp;Vida
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Clínica Médica Digital
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Medical Result Example */}
        <div className="hidden lg:flex flex-col space-y-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Consultas e Resultados na palma da sua mão.
          </h1>
          <p className="text-slate-600 text-lg max-w-md leading-relaxed">
            Acompanhe o seu histórico médico de forma simples e segura.
          </p>
        </div>

        {/* Right Side: Auth System Panel */}
        <div className="w-full max-w-md mx-auto space-y-4 relative">
          <div id="auth-form-panel" className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Entrar</h2>
                  <p className="text-sm text-slate-500 mt-1">Acesse sua conta para continuar</p>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs leading-relaxed">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    id="login-email"
                    type="text"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-700">Senha</label>
                  <input
                    id="login-pass"
                    type="password"
                    placeholder="digite a sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-1.5 mt-2"
                >
                  Entrar <ArrowRight className="h-4 w-4" />
                </button>

                <div className="text-center pt-4 border-t border-slate-100 mt-6">
                  <p className="text-sm text-slate-600">
                    Ainda não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('register'); setRegError(''); }}
                      className="text-blue-600 font-semibold hover:underline bg-transparent border-none p-0"
                    >
                      Criar Conta
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Criar Conta</h2>
                  <p className="text-sm text-slate-500 mt-1">Preencha seus dados para começar</p>
                </div>

                {regError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Conta criada com sucesso! Aguarde...
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700">Nome Completo</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="w-full px-3.5 py-1.5 border border-slate-100 bg-slate-50 rounded-lg text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">E-mail</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-1.5 border border-slate-100 bg-slate-50 rounded-lg text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">Telemóvel</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg">
                        +258
                      </span>
                      <input
                        id="reg-phone"
                        type="tel"
                        placeholder="840000000"
                        maxLength={9}
                        minLength={9}
                        pattern="\d{9}"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-3.5 py-1.5 border border-slate-200 bg-slate-50 rounded-r-lg text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 relative">
                    <label htmlFor="reg-birth" className="block text-xs font-semibold text-slate-700">Nascimento</label>
                    <input
                      id="reg-birth"
                      type="date"
                      value={regBirth}
                      onChange={(e) => setRegBirth(e.target.value)}
                      onClick={(e) => {
                        try {
                          const target = e.target as HTMLInputElement;
                          if (target.showPicker) target.showPicker();
                        } catch (err) {
                          // Ignore cross-origin iframe showPicker errors
                        }
                      }}
                      required
                      className="w-full px-3.5 py-1.5 border border-slate-100 bg-slate-50 rounded-lg text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer relative"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-700">Senha</label>
                  <input
                    id="reg-pass"
                    type="password"
                    placeholder="digite a sua senha"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    required
                    className="w-full px-3.5 py-1.5 border border-slate-100 bg-slate-50 rounded-lg text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-1"
                >
                  Criar Conta
                </button>

                <div className="text-center pt-3 mt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setLoginError(''); }}
                      className="text-blue-600 font-semibold hover:underline bg-transparent border-none p-0"
                    >
                      Entrar
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer Info Placeholder (clean) */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Clínica Saúde &amp; Vida Digital
      </footer>
    </div>
  );
};
