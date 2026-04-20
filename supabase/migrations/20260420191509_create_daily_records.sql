/*
  # Sistema de Diárias de Funcionários

  ## Descrição
  Tabela principal para armazenar os registros de diárias trabalhadas pelos funcionários.

  ## Nova Tabela: daily_records
  - `id` (uuid) - Chave primária gerada automaticamente
  - `employee_name` (text) - Nome do funcionário
  - `work_date` (date) - Data do dia trabalhado
  - `start_time` (time) - Horário de início
  - `end_time` (time) - Horário de término
  - `shift_type` (text) - Tipo do turno: 'diurno', 'noturno', 'personalizado'
  - `value` (numeric) - Valor calculado da diária em reais
  - `notes` (text) - Observações opcionais
  - `created_at` (timestamp) - Data de criação do registro

  ## Segurança
  - RLS habilitado
  - Política para leitura pública (sistema interno sem autenticação)
  - Política para inserção, atualização e deleção públicas (sistema interno)

  ## Observações
  - Sistema de uso interno sem autenticação de usuário
  - Políticas permitem acesso anônimo pois trata-se de sistema interno
*/

CREATE TABLE IF NOT EXISTS daily_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  work_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  shift_type text NOT NULL DEFAULT 'personalizado',
  value numeric(10, 2) NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on daily_records"
  ON daily_records FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert on daily_records"
  ON daily_records FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update on daily_records"
  ON daily_records FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete on daily_records"
  ON daily_records FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_records_employee ON daily_records(employee_name);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(work_date);
