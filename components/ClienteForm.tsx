import type { Cliente } from "@/lib/fichas";
import { CampoCpf, CampoRede, CampoTelefone } from "./Campos";
import { BotaoEnviar } from "./BotaoEnviar";

type Props = {
  action: (form: FormData) => Promise<void>;
  cliente?: Partial<Cliente>;
  botao: string;
  cancelar?: React.ReactNode;
};

export function ClienteForm({ action, cliente = {}, botao, cancelar }: Props) {
  const v = (k: keyof Cliente) => (cliente[k] as string | null | undefined) ?? "";
  return (
    <form action={action}>
      <div className="secao">
        <div className="secao-tit">
          <h2>Dados pessoais</h2>
          <p>Usados para preencher automaticamente as fichas.</p>
        </div>
        <div className="grade">
          <label className="campo toda">
            <span className="rot">Nome completo <em>*</em></span>
            <input className="in" name="nome" defaultValue={v("nome")} required autoComplete="off" autoCapitalize="words" placeholder="Nome e sobrenome" />
          </label>
          <CampoCpf name="cpf" label="CPF" defaultValue={v("cpf")} />
          <label className="campo">
            <span className="rot">Data de nascimento</span>
            <input className="in" name="nascimento" type="date" defaultValue={v("nascimento")} max={new Date().toISOString().slice(0, 10)} />
          </label>
          <div className="campo toda">
            <span className="rot">Sexo</span>
            <div className="segmento" role="radiogroup">
              {[["F", "Feminino"], ["M", "Masculino"], ["", "Não informar"]].map(([val, rot]) => (
                <label key={val}>
                  <input type="radio" name="sexo" value={val} defaultChecked={v("sexo") === val} />
                  {rot}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="secao">
        <div className="secao-tit">
          <h2>Contato</h2>
          <p>O telefone vira um atalho direto para o WhatsApp.</p>
        </div>
        <div className="grade">
          <CampoTelefone name="telefone" label="Telefone / WhatsApp" defaultValue={v("telefone")} />
          <label className="campo">
            <span className="rot">E-mail</span>
            <input className="in" name="email" type="email" inputMode="email" autoCapitalize="none" defaultValue={v("email")} placeholder="nome@email.com" />
          </label>
          <CampoRede name="rede_social" label="Instagram / rede social" defaultValue={v("rede_social")} />
          <label className="campo">
            <span className="rot">Endereço</span>
            <input className="in" name="endereco" defaultValue={v("endereco")} placeholder="Rua, número, bairro, cidade" autoComplete="street-address" />
          </label>
        </div>
      </div>

      <div className="secao">
        <div className="secao-tit">
          <h2>Observações</h2>
          <p>Anotações internas, não aparecem nas fichas.</p>
        </div>
        <label className="campo">
          <span className="sr">Observações</span>
          <textarea className="in" name="observacoes" defaultValue={v("observacoes")} placeholder="Ex.: indicação, preferências de horário…" />
        </label>
      </div>

      <div className="form-rodape">
        {cancelar}
        <BotaoEnviar>{botao}</BotaoEnviar>
      </div>
    </form>
  );
}
