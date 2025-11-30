const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Configuração CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Conexão com MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_saude';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch(err => {
        console.error('❌ Erro ao conectar ao MongoDB:', err.message);
        console.log('💡 Certifique-se de que o MongoDB está rodando');
    });

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_temporaria_123';

// ==================== SCHEMAS DO MONGOOSE ====================
const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    telefone: String,
    tipo: { type: String, enum: ['paciente', 'medico', 'admin'], default: 'paciente' },
    criadoEm: { type: Date, default: Date.now }
});

const medicoSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    especialidade: String,
    crm: String,
    disponibilidade: Array
});

const postoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    endereco: String,
    bairro: String,
    coordenadas: {
        lat: Number,
        lng: Number
    },
    telefone: String,
    horarioFuncionamento: String
});

const medicamentoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    tipo: String,
    descricao: String,
    postoSaude: { type: mongoose.Schema.Types.ObjectId, ref: 'Posto' },
    quantidade: { type: Number, default: 0 },
    status: { type: String, enum: ['disponivel', 'baixa', 'esgotado'], default: 'disponivel' },
    ultimaAtualizacao: { type: Date, default: Date.now }
});

const consultaSchema = new mongoose.Schema({
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico' },
    medicoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico' },
    data: { type: Date, required: true },
    horario: { type: String, required: true },
    tipo: { type: String, required: true },
    especialidade: String,
    status: { type: String, default: 'pendente' },
    observacoes: String,
    criadoEm: { type: Date, default: Date.now }
});

// Models
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Medico = mongoose.model('Medico', medicoSchema);
const Posto = mongoose.model('Posto', postoSchema);
const Medicamento = mongoose.model('Medicamento', medicamentoSchema);
const Consulta = mongoose.model('Consulta', consultaSchema);

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================
const autenticar = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = await Usuario.findById(decoded.id).select('-senha'); // Retira a senha ao buscar

        if (!usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar se o usuário é Admin
const isAdmin = (req, res, next) => {
    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador.' });
    }
    next();
};

// ==================== ROTAS DE TESTE ====================
app.get('/api', (req, res) => {
    res.json({
        mensagem: '✅ API do Sistema de Saúde - FUNCIONANDO!',
        versao: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
    });
});

// ==================== ROTAS DE AUTENTICAÇÃO ====================
app.post('/api/auth/registro', async (req, res) => {
    try {
        const { nome, email, senha, telefone, tipo } = req.body;

        // Verificar se o usuário já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 8);

        // Criar usuário
        const usuario = new Usuario({
            nome,
            email,
            senha: senhaHash,
            telefone,
            tipo: tipo || 'paciente'
        });

        await usuario.save();

        // Gerar token
        const token = jwt.sign({ id: usuario._id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            mensagem: 'Usuário criado com sucesso',
            token,
            user: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                tipo: usuario.tipo
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar usuário', detalhes: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Buscar usuário
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Gerar token
        const token = jwt.sign({ id: usuario._id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            },
            token
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login', detalhes: error.message });
    }
});

// ==================== ROTAS DE USUÁRIOS (NOVAS) ====================

// Rota para listar todos os usuários (Apenas para Admin)
app.get('/api/usuarios', autenticar, isAdmin, async (req, res) => {
    try {
        // Encontra todos os usuários, mas omite o campo 'senha'
        const usuarios = await Usuario.find().select('-senha');
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários', detalhes: error.message });
    }
});

// Rota para obter perfil do usuário logado (ou buscar por ID - Admin/Self)
app.get('/api/usuarios/me', autenticar, async (req, res) => {
    // O middleware autenticar já anexou o objeto usuário (sem senha) em req.usuario
    res.json(req.usuario);
});

// Rota para obter usuário por ID (Apenas para Admin)
app.get('/api/usuarios/:id', autenticar, isAdmin, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-senha');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário', detalhes: error.message });
    }
});

// ==================== ROTAS DE MÉDICOS ====================
app.get('/api/medicos', async (req, res) => {
    try {
        const { especialidade } = req.query;
        const filtro = especialidade ? { especialidade } : {};

        const medicos = await Medico.find(filtro).populate('usuario', 'nome email telefone');
        res.json(medicos);
    } catch (error) {
        console.error('Erro ao listar médicos:', error);
        res.status(500).json({ error: 'Erro ao listar médicos', detalhes: error.message });
    }
});

app.get('/api/medicos/:id', async (req, res) => {
    try {
        const medico = await Medico.findById(req.params.id).populate('usuario', 'nome email telefone');
        if (!medico) {
            return res.status(404).json({ error: 'Médico não encontrado' });
        }
        res.json(medico);
    } catch (error) {
        console.error('Erro ao buscar médico:', error);
        res.status(500).json({ error: 'Erro ao buscar médico', detalhes: error.message });
    }
});

// ==================== ROTAS DE POSTOS ====================
app.get('/api/postos', async (req, res) => {
    try {
        const { bairro } = req.query;
        const filtro = bairro ? { bairro } : {};

        const postos = await Posto.find(filtro);
        res.json(postos);
    } catch (error) {
        console.error('Erro ao listar postos:', error);
        res.status(500).json({ error: 'Erro ao listar postos', detalhes: error.message });
    }
});

app.get('/api/postos/:id', async (req, res) => {
    try {
        const posto = await Posto.findById(req.params.id);
        if (!posto) {
            return res.status(404).json({ error: 'Posto não encontrado' });
        }
        res.json(posto);
    } catch (error) {
        console.error('Erro ao buscar posto:', error);
        res.status(500).json({ error: 'Erro ao buscar posto', detalhes: error.message });
    }
});

// ==================== ROTAS DE MEDICAMENTOS ====================
app.get('/api/medicamentos', async (req, res) => {
    try {
        const { nome, tipo, status, postoId } = req.query;
        const filtro = {};

        if (nome) filtro.nome = new RegExp(nome, 'i');
        if (tipo) filtro.tipo = tipo;
        if (status) filtro.status = status;
        if (postoId) filtro.postoSaude = postoId;

        const medicamentos = await Medicamento.find(filtro)
            .populate('postoSaude', 'nome endereco bairro')
            .sort('nome');

        res.json(medicamentos);
    } catch (error) {
        console.error('Erro ao listar medicamentos:', error);
        res.status(500).json({ error: 'Erro ao listar medicamentos', detalhes: error.message });
    }
});

app.get('/api/medicamentos/:id', async (req, res) => {
    try {
        const medicamento = await Medicamento.findById(req.params.id).populate('postoSaude');
        if (!medicamento) {
            return res.status(404).json({ error: 'Medicamento não encontrado' });
        }
        res.json(medicamento);
    } catch (error) {
        console.error('Erro ao buscar medicamento:', error);
        res.status(500).json({ error: 'Erro ao buscar medicamento', detalhes: error.message });
    }
});

app.post('/api/medicamentos', autenticar, async (req, res) => {
    try {
        const medicamento = new Medicamento(req.body);
        await medicamento.save();
        res.status(201).json(medicamento);
    } catch (error) {
        console.error('Erro ao criar medicamento:', error);
        res.status(500).json({ error: 'Erro ao criar medicamento', detalhes: error.message });
    }
});

app.patch('/api/medicamentos/:id', autenticar, async (req, res) => {
    try {
        const { quantidade } = req.body;

        let status = 'disponivel';
        if (quantidade === 0) status = 'esgotado';
        else if (quantidade < 10) status = 'baixa';

        const medicamento = await Medicamento.findByIdAndUpdate(
            req.params.id,
            { quantidade, status, ultimaAtualizacao: new Date() },
            { new: true }
        );

        if (!medicamento) {
            return res.status(404).json({ error: 'Medicamento não encontrado' });
        }

        res.json(medicamento);
    } catch (error) {
        console.error('Erro ao atualizar medicamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar medicamento', detalhes: error.message });
    }
});

// ==================== ROTAS DE CONSULTAS ====================
app.get('/api/consultas', autenticar, async (req, res) => {
    try {
        // Busca consultas APENAS para o usuário logado (paciente ou médico)
        const filtro = req.usuario.tipo === 'paciente'
            ? { paciente: req.usuario._id }
            : req.usuario.tipo === 'medico'
                ? { medico: req.usuario._id } // Assumindo que medicoId do Consulta reflete o Usuario._id do Medico
                : {}; // Admin vê todas (se não houver filtro)

        const consultas = await Consulta.find(filtro)
            .populate('medico')
            .sort('-criadoEm');

        res.json(consultas);
    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        res.status(500).json({ error: 'Erro ao listar consultas', detalhes: error.message });
    }
});

app.post('/api/consultas', autenticar, async (req, res) => {
    try {
        const novaConsulta = new Consulta({
            ...req.body,
            paciente: req.usuario._id,
            medico: req.body.medicoId, // Aqui deve ser o ID do Medico, não do Usuario Medico
            status: 'pendente'
        });

        await novaConsulta.save();

        const consulta = await Consulta.findById(novaConsulta._id).populate('medico');
        res.status(201).json(consulta);
    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        res.status(500).json({ error: 'Erro ao criar consulta', detalhes: error.message });
    }
});

app.get('/api/consultas/:id', autenticar, async (req, res) => {
    try {
        const filtro = {
            _id: req.params.id
        };

        // Permite que o paciente veja sua própria consulta ou o médico veja sua consulta
        if (req.usuario.tipo === 'paciente') {
            filtro.paciente = req.usuario._id;
        } else if (req.usuario.tipo === 'medico') {
            filtro.medico = req.usuario._id; // Assumindo que medicoId do Consulta reflete o Usuario._id do Medico
        }

        const consulta = await Consulta.findOne(filtro).populate('medico');

        if (!consulta) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        res.json(consulta);
    } catch (error) {
        console.error('Erro ao buscar consulta:', error);
        res.status(500).json({ error: 'Erro ao buscar consulta', detalhes: error.message });
    }
});

app.patch('/api/consultas/:id', autenticar, async (req, res) => {
    try {
        const consulta = await Consulta.findOneAndUpdate(
            { _id: req.params.id, paciente: req.usuario._id }, // Paciente só pode atualizar as suas
            req.body,
            { new: true }
        ).populate('medico');

        if (!consulta) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        res.json(consulta);
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        res.status(500).json({ error: 'Erro ao atualizar consulta', detalhes: error.message });
    }
});

app.delete('/api/consultas/:id', autenticar, async (req, res) => {
    try {
        const consulta = await Consulta.findOneAndDelete({
            _id: req.params.id,
            paciente: req.usuario._id // Permite que apenas o paciente cancele
        });

        if (!consulta) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        res.json({ mensagem: 'Consulta cancelada com sucesso' });
    } catch (error) {
        console.error('Erro ao cancelar consulta:', error);
        res.status(500).json({ error: 'Erro ao cancelar consulta', detalhes: error.message });
    }
});

// ==================== ROTAS DE SOLICITAÇÕES DE MEDICAMENTO ====================
app.post('/api/solicitacoes-medicamento', autenticar, async (req, res) => {
    try {
        // Implementação futura
        res.status(201).json({
            mensagem: 'Solicitação registrada com sucesso',
            medicamentoId: req.body.medicamentoId,
            postoId: req.body.postoId
        });
    } catch (error) {
        console.error('Erro ao solicitar medicamento:', error);
        res.status(500).json({ error: 'Erro ao solicitar medicamento', detalhes: error.message });
    }
});

// ==================== ESTATÍSTICAS ====================
app.get('/api/stats/dashboard', autenticar, async (req, res) => {
    try {
        const [totalConsultas, medicamentosDisponiveis, totalMedicos] = await Promise.all([
            // Conta apenas as consultas do usuário logado (paciente)
            Consulta.countDocuments({ paciente: req.usuario._id }),
            Medicamento.countDocuments({ status: 'disponivel' }),
            Medico.countDocuments()
        ]);

        const consultasRealizadas = await Consulta.countDocuments({
            paciente: req.usuario._id,
            status: 'realizada'
        });

        res.json({
            consultasAgendadas: totalConsultas,
            consultasRealizadas,
            medicamentosDisponiveis,
            medicosDisponiveis: totalMedicos
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas', detalhes: error.message });
    }
});

// ==================== INICIALIZAÇÃO ====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('\n🎉 SERVIDOR RODANDO!');
    console.log(`🔗 Backend: http://localhost:${PORT}/api`);
    console.log(`📊 MongoDB: ${MONGODB_URI}`);
    console.log('\n💡 Para popular o banco, execute: node seed.js');
    console.log('👤 Credenciais de teste: maria@email.com / senha123\n');
});