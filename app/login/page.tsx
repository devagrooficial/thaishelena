import { LoginForm } from "./form";

export const metadata = { title: "Entrar · Espaço Thaís Helena" };

export default function LoginPage() {
  return (
    <div className="login-pag">
      <div className="card login">
        <div className="marca">
          <span className="logo">TH</span>
          <span>
            <b>Espaço Thaís Helena</b>
            <small>Estria · Cicatriz · Flacidez</small>
          </span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
