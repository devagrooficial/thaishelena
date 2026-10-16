import type { Cliente } from "@/lib/fichas";

type Props = {
  action: (form: FormData) => Promise<void>;
  cliente?: Partial<Cliente>;
  botao: string;
};

export function ClienteForm({ action, cliente = {}, botao }: Props) {
  const v = (k: keyof Cliente) => (cliente[k] as string | null | undefined) ?? "";
  return (
    <form action={action} className="form">
      <label className="campo full">
        Nome completo *
        <input className="in" name="nome" defaultValue={v("nome")} required />
      </label>
      <label className="campo">
        CPF
        <input className="in" name="cpf" defaultValue={v("cpf")} placeholder="000.000.000-00" maxLength={14} />
      </label>
      <label className="campo">
        Data de nascimento
        <input className="in" name="nascimento" type="date" defaultValue={v("nascimento")} />
      </label>
      <label className="campo">
        Telefone / WhatsApp
        <input className="in" name="telefone" defaultValue={v("telefone")} placeholder="(00) 00000-0000" />
      </label>
      <label className="campo">
        E-mail
        <input className="in" name="email" type="email" defaultValue={v("email")} />
      </label>
      <label className="campo">
        Rede social
        <input className="in" name="rede_social" defaultValue={v("rede_social")} placeholder="@" />
      </label>
      <label className="campo">
        Sexo
        <select className="in" name="sexo" defaultValue={v("sexo")}>
          <option value="">—</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
        </select>
      </label>
      <label className="campo full">
        Endereço
        <input className="in" name="endereco" defaultValue={v("endereco")} />
      </label>
      <label className="campo full">
        Observações
        <textarea className="in" name="observacoes" defaultValue={v("observacoes")} />
      </label>
      <div className="full acoes">
        <button className="btn">{botao}</button>
      </div>
    </form>
  );
}
