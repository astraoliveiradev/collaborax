import React, { useState } from 'react';
import { useAppContext } from '../App';
import { Card, Button, Input } from './UI';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useAppContext();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let success = false;
    if (isLogin) {
      success = await login(email, password);
      if (!success) setError('Email ou senha inválidos.');
    } else {
      if (!name || !email || !password) {
        setError('Todos os campos são obrigatórios.');
        setLoading(false);
        return;
      }
      success = await signup(name, email, password);
      if (!success) setError('Este email já está em uso.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md animate-scaleIn">
        <h1 className="text-4xl font-bold text-center mb-2 text-accent">CollaboraX</h1>
        <p className="text-center text-dark-text mb-8">Seu Escritório Virtual te Espera</p>
        <Card>
          <div className="flex border-b border-slate-600 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 font-semibold transition-colors ${isLogin ? 'text-accent border-b-2 border-accent' : 'text-dark-text hover:text-light'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 font-semibold transition-colors ${!isLogin ? 'text-accent border-b-2 border-accent' : 'text-dark-text hover:text-light'}`}
            >
              Cadastrar
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input label="Nome Completo" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
            )}
            <Input label="Endereço de Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
            
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;