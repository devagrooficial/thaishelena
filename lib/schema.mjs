// Estrutura do banco (usada pelo app e pelo script de cópia).
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT, nascimento TEXT, telefone TEXT, email TEXT,
  endereco TEXT, rede_social TEXT, sexo TEXT, observacoes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fichas (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT,
  dados TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS fichas_cliente ON fichas(cliente_id);
CREATE INDEX IF NOT EXISTS clientes_nome ON clientes(nome);
`;
