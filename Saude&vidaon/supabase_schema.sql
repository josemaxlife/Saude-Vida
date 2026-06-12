-- PostgreSQL Schema for Supabase based on application types
-- To be executed in the Supabase SQL Editor

-- 1. Create Pacientes Table
CREATE TABLE public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    senha TEXT, -- In production, use Supabase Auth and remove this col, or hash it!
    data_nascimento DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Medicos Table
CREATE TABLE public.medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT, -- In production, use Supabase Auth!
    especialidade TEXT NOT NULL,
    disponibilidade TEXT[] DEFAULT '{}',
    crm TEXT NOT NULL UNIQUE,
    rating NUMERIC(3, 2), -- Ex: 4.5
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Consultas Table
-- ENUM type for status
CREATE TYPE consulta_status AS ENUM ('AGENDADA', 'CANCELADA', 'REALIZADA');

CREATE TABLE public.consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    status consulta_status NOT NULL DEFAULT 'AGENDADA',
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Atendimentos Table (Prontuário/Medical Records)
CREATE TABLE public.atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id UUID NOT NULL REFERENCES public.consultas(id) ON DELETE CASCADE,
    sintomas TEXT,
    diagnostico TEXT,
    prescricao TEXT,
    observacoes TEXT,
    data_atendimento TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(consulta_id) -- Normally 1 attendance record per consultation
);

-- Enable Row Level Security (RLS) policies
-- You can configure these in the Supabase Dashboard, basic setup:
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- Exemplo of open policies for test/dev (Change in Prod)
CREATE POLICY "Enable read access for all users" ON public.pacientes FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.pacientes FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.medicos FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.medicos FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.consultas FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.consultas FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.atendimentos FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.atendimentos FOR ALL USING (true);
