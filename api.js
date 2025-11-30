// api.js - Cliente para integração do Frontend com o Backend
const API_BASE_URL = 'http://localhost:3001/api';

// Classe para gerenciar chamadas à API
class HealthSystemAPI {
  constructor() {
    console.log('🔧 API inicializada');
  }

  // ==================== MÉTODOS DE STORAGE ====================

  // Salvar token
  setToken(token) {
    try {
      localStorage.setItem('authToken', token);
      console.log('💾 Token salvo');
    } catch (e) {
      console.error('❌ Erro ao salvar token:', e);
    }
  }

  // Obter token
  getToken() {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      console.error('❌ Erro ao ler token:', e);
      return null;
    }
  }

  // Salvar usuário
  setUser(user) {
    try {
      localStorage.setItem('userData', JSON.stringify(user));
      console.log('💾 Dados do usuário salvos:', user);
    } catch (e) {
      console.error('❌ Erro ao salvar usuário:', e);
    }
  }

  // Obter usuário
  getUser() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('❌ Erro ao ler usuário:', e);
      return null;
    }
  }

  // Limpar storage
  clearStorage() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      console.log('🗑️ Storage limpo');
    } catch (e) {
      console.error('❌ Erro ao limpar storage:', e);
    }
  }

  // ==================== AUTENTICAÇÃO ====================

  async login(email, password) {
    try {
      console.log('🔐 Tentando login:', email);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          senha: password
        })
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Login bem-sucedido:', data);

      // Armazenar no localStorage
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  async registro(nome, email, password, telefone, tipo = 'paciente') {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome,
          email,
          senha: password,
          telefone,
          tipo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no registro');
      }

      const data = await response.json();

      // Armazenar no localStorage
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  logout() {
    console.log('🚪 Fazendo logout...');
    this.clearStorage();
    window.location.href = 'login.html';
  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    const authenticated = !!(token && user);

    console.log('🔍 Verificando autenticação:', {
      hasToken: !!token,
      hasUser: !!user,
      authenticated: authenticated
    });

    return authenticated;
  }

  // Métodos para gerenciar "lembrar-me"
  setRememberMe(email) {
    try {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedEmail', email);
      console.log('💾 Remember-me ativado para:', email);
    } catch (e) {
      console.error('❌ Erro ao salvar remember-me:', e);
    }
  }

  clearRememberMe() {
    try {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      console.log('🗑️ Remember-me limpo');
    } catch (e) {
      console.error('❌ Erro ao limpar remember-me:', e);
    }
  }

  getSavedEmail() {
    try {
      const rememberMe = localStorage.getItem('rememberMe');
      const savedEmail = localStorage.getItem('savedEmail');
      return rememberMe === 'true' ? (savedEmail || '') : '';
    } catch (e) {
      console.error('❌ Erro ao ler email salvo:', e);
      return '';
    }
  }

  // ==================== CONSULTAS ====================

  async listarConsultas() {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/consultas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao listar consultas');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar consultas:', error);
      throw error;
    }
  }

  async criarConsulta(consulta) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consulta)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar consulta');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      throw error;
    }
  }

  async buscarConsulta(id) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar consulta');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar consulta:', error);
      throw error;
    }
  }

  async atualizarConsulta(id, atualizacoes) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(atualizacoes)
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar consulta');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar consulta:', error);
      throw error;
    }
  }

  async cancelarConsulta(id) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao cancelar consulta');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      throw error;
    }
  }

  // ==================== MÉDICOS ====================

  async listarMedicos(especialidade = null) {
    try {
      const url = especialidade
        ? `${API_BASE_URL}/medicos?especialidade=${especialidade}`
        : `${API_BASE_URL}/medicos`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao listar médicos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar médicos:', error);
      throw error;
    }
  }

  async buscarMedico(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/medicos/${id}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar médico');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      throw error;
    }
  }

  // ==================== POSTOS DE SAÚDE ====================

  async listarPostos(bairro = null) {
    try {
      const url = bairro
        ? `${API_BASE_URL}/postos?bairro=${bairro}`
        : `${API_BASE_URL}/postos`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao listar postos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar postos:', error);
      throw error;
    }
  }

  async buscarPosto(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/postos/${id}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar posto');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar posto:', error);
      throw error;
    }
  }

  // ==================== MEDICAMENTOS ====================

  async listarMedicamentos(filtros = {}) {
    try {
      const params = new URLSearchParams();

      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.postoId) params.append('postoId', filtros.postoId);

      const url = `${API_BASE_URL}/medicamentos${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao listar medicamentos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar medicamentos:', error);
      throw error;
    }
  }

  async buscarMedicamento(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/medicamentos/${id}`);

      if (!response.ok) {
        throw new Error('Falha ao buscar medicamento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar medicamento:', error);
      throw error;
    }
  }

  async atualizarQuantidadeMedicamento(id, quantidade) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/medicamentos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantidade })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar medicamento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar medicamento:', error);
      throw error;
    }
  }

  // ==================== SOLICITAÇÕES DE MEDICAMENTOS ====================

  async solicitarMedicamento(medicamentoId, postoId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/solicitacoes-medicamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicamentoId, postoId })
      });

      if (!response.ok) {
        throw new Error('Falha ao solicitar medicamento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao solicitar medicamento:', error);
      throw error;
    }
  }

  async listarSolicitacoesMedicamento() {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/solicitacoes-medicamento`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao listar solicitações');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar solicitações:', error);
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================

  async obterEstatisticasDashboard() {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao obter estatísticas');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  async _fetchAuth(endpoint, options = {}) {
    const token = this.getToken();
    if (!token) {
      // Redireciona ou lanca erro se não autenticado
      // Opcional: window.location.href = 'login.html'; 
      throw new Error('Usuário não autenticado. Token ausente.');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const finalOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers // Permite sobrescrever Content-Type se necessário (ex: upload de arquivo)
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro de servidor' }));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    return response.status === 204 ? {} : await response.json(); // Retorna JSON ou objeto vazio (para DELETE/204)
  }

  // ==================== TESTE DE CONEXÃO ====================

  async testarConexao() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return await response.json();
    } catch (error) {
      console.error('❌ Erro na conexão com o servidor:', error);
      throw error;
    }
  }
}

// Criar instância global da API
const api = new HealthSystemAPI();

// Log para confirmar que a API foi carregada
console.log('✅ API carregada com sucesso. Instância global "api" disponível.');
console.log('📦 Estado inicial da autenticação:', {
  isAuthenticated: api.isAuthenticated(),
  hasToken: !!api.getToken(),
  hasUser: !!api.getUser()
});