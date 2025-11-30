// seed.js - Script para popular o banco de dados com dados iniciais
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Carrega as variáveis de ambiente, incluindo MONGODB_URI do seu .env
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_saude';

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI);

// ==================== SCHEMAS DO MONGOOSE (Nome do Modelo 'Usuario' consistente) ====================
const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    telefone: String,
    tipo: { type: String, enum: ['paciente', 'medico', 'admin'], default: 'paciente' },
    criadoEm: { type: Date, default: Date.now }
});

const medicoSchema = new mongoose.Schema({
    // Referência corrigida para 'Usuario' - DEVE CASAR com o nome do modelo abaixo
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

// Modelos usando o nome de referência 'Usuario'
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Medico = mongoose.model('Medico', medicoSchema);
const Posto = mongoose.model('Posto', postoSchema);
const Medicamento = mongoose.model('Medicamento', medicamentoSchema);
const Consulta = mongoose.model('Consulta', consultaSchema);


async function seed() {
    try {
        console.log('🌱 Iniciando seed do banco de dados...');

        // Limpar dados existentes
        await Usuario.deleteMany({}); // Usa Usuario
        await Medico.deleteMany({});
        await Posto.deleteMany({});
        await Medicamento.deleteMany({});
        await Consulta.deleteMany({});
        console.log('✅ Dados existentes removidos');

        // Criar usuários
        const senhaHash = await bcrypt.hash('senha123', 8);

        const usuarios = await Usuario.insertMany([
            {
                nome: 'Maria Silva',
                email: 'maria@email.com',
                senha: senhaHash,
                telefone: '(11) 98765-4321',
                tipo: 'paciente'
            },
            {
                nome: 'João Santos',
                email: 'joao@email.com',
                senha: senhaHash,
                telefone: '(11) 98765-1234',
                tipo: 'paciente'
            },
            {
                nome: 'Dr. Carlos Silva',
                email: 'carlos@email.com',
                senha: senhaHash,
                telefone: '(11) 91234-5678',
                tipo: 'medico'
            },
            {
                nome: 'Dra. Ana Costa',
                email: 'ana@email.com',
                senha: senhaHash,
                telefone: '(11) 91234-8765',
                tipo: 'medico'
            },
            {
                nome: 'Administrador',
                email: 'admin@email.com',
                senha: senhaHash,
                telefone: '(11) 99999-9999',
                tipo: 'admin'
            }
        ]);
        console.log('✅ Usuários criados');

        // Criar médicos
        const medicos = await Medico.insertMany([
            {
                // Usa o ID do usuário médico criado acima
                usuario: usuarios[2]._id,
                especialidade: 'Cardiologia',
                crm: 'CRM-SP 123456',
                disponibilidade: [
                    { diaSemana: 1, horarios: ['08:00', '09:00', '10:00', '14:00', '15:00'] },
                    { diaSemana: 3, horarios: ['08:00', '09:00', '10:00', '14:00', '15:00'] },
                    { diaSemana: 5, horarios: ['08:00', '09:00', '10:00', '14:00', '15:00'] }
                ]
            },
            {
                // Usa o ID do usuário médico criado acima
                usuario: usuarios[3]._id,
                especialidade: 'Dermatologia',
                crm: 'CRM-SP 654321',
                disponibilidade: [
                    { diaSemana: 2, horarios: ['08:00', '09:00', '10:00', '14:00', '15:00'] },
                    { diaSemana: 4, horarios: ['08:00', '09:00', '10:00', '14:00', '15:00'] }
                ]
            }
        ]);
        console.log('✅ Médicos criados');

        // Criar postos de saúde
        const postos = await Posto.insertMany([
            {
                nome: 'Posto de Saúde Central',
                endereco: 'Rua das Flores, 123',
                bairro: 'Centro',
                coordenadas: { lat: -23.5505, lng: -46.6333 },
                telefone: '(11) 3000-0001',
                horarioFuncionamento: 'Segunda a Sexta: 8h às 17h'
            },
            {
                nome: 'Posto de Saúde Norte',
                endereco: 'Av. Principal, 456',
                bairro: 'Zona Norte',
                coordenadas: { lat: -23.5205, lng: -46.6133 },
                telefone: '(11) 3000-0002',
                horarioFuncionamento: 'Segunda a Sexta: 8h às 17h'
            },
            {
                nome: 'Posto de Saúde Sul',
                endereco: 'Rua das Palmeiras, 789',
                bairro: 'Zona Sul',
                coordenadas: { lat: -23.5805, lng: -46.6533 },
                telefone: '(11) 3000-0003',
                horarioFuncionamento: 'Segunda a Sexta: 8h às 17h'
            },
            {
                nome: 'Posto de Saúde Leste',
                endereco: 'Av. das Árvores, 321',
                bairro: 'Zona Leste',
                coordenadas: { lat: -23.5405, lng: -46.6033 },
                telefone: '(11) 3000-0004',
                horarioFuncionamento: 'Segunda a Sexta: 8h às 17h'
            },
            {
                nome: 'Posto de Saúde Oeste',
                endereco: 'Rua dos Pinheiros, 654',
                bairro: 'Zona Oeste',
                coordenadas: { lat: -23.5605, lng: -46.6633 },
                telefone: '(11) 3000-0005',
                horarioFuncionamento: 'Segunda a Sexta: 8h às 17h'
            }
        ]);
        console.log('✅ Postos de saúde criados');

        // Criar medicamentos
        const medicamentos = [];
        const medicamentosData = [
            { nome: 'Paracetamol 500mg', tipo: 'Analgésico', quantidade: 45 },
            { nome: 'Paracetamol 750mg', tipo: 'Analgésico', quantidade: 30 },
            { nome: 'Amoxicilina 250mg', tipo: 'Antibiótico', quantidade: 12 },
            { nome: 'Amoxicilina 500mg', tipo: 'Antibiótico', quantidade: 25 },
            { nome: 'Losartana 50mg', tipo: 'Anti-hipertensivo', quantidade: 0 },
            { nome: 'Losartana 100mg', tipo: 'Anti-hipertensivo', quantidade: 18 },
            { nome: 'Metformina 850mg', tipo: 'Antidiabético', quantidade: 28 },
            { nome: 'Metformina 500mg', tipo: 'Antidiabético', quantidade: 35 },
            { nome: 'Omeprazol 20mg', tipo: 'Gastroprotetor', quantidade: 35 },
            { nome: 'Omeprazol 40mg', tipo: 'Gastroprotetor', quantidade: 22 },
            { nome: 'Sinvastatina 20mg', tipo: 'Hipolipemiante', quantidade: 5 },
            { nome: 'Sinvastatina 40mg', tipo: 'Hipolipemiante', quantidade: 15 },
            { nome: 'AAS 100mg', tipo: 'Antiagregante Plaquetário', quantidade: 60 },
            { nome: 'Insulina NPH', tipo: 'Antidiabético', quantidade: 0 },
            { nome: 'Captopril 25mg', tipo: 'Anti-hipertensivo', quantidade: 42 },
            { nome: 'Dipirona 500mg', tipo: 'Analgésico', quantidade: 50 },
            { nome: 'Ibuprofeno 600mg', tipo: 'Anti-inflamatório', quantidade: 38 },
            { nome: 'Atenolol 25mg', tipo: 'Anti-hipertensivo', quantidade: 27 },
            { nome: 'Enalapril 10mg', tipo: 'Anti-hipertensivo', quantidade: 33 }
        ];

        for (const posto of postos) {
            for (const med of medicamentosData) {
                let status = 'disponivel';
                if (med.quantidade === 0) status = 'esgotado';
                else if (med.quantidade < 10) status = 'baixa';

                medicamentos.push({
                    nome: med.nome,
                    tipo: med.tipo,
                    descricao: `${med.tipo} - ${med.nome}`,
                    postoSaude: posto._id,
                    quantidade: med.quantidade,
                    status
                });
            }
        }

        await Medicamento.insertMany(medicamentos);
        console.log('✅ Medicamentos criados');

        console.log('\n🎉 Seed concluído com sucesso!');
        console.log('\n📊 Resumo:');
        console.log(`   - ${usuarios.length} usuários criados`);
        console.log(`   - ${medicos.length} médicos criados`);
        console.log(`   - ${postos.length} postos de saúde criados`);
        console.log(`   - ${medicamentos.length} medicamentos criados`);
        console.log('\n🔑 Credenciais de teste:');
        console.log('   Paciente: maria@email.com / senha123');
        console.log('   Médico: carlos@email.com / senha123');
        console.log('   Admin: admin@email.com / senha123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante seed:', error);
        process.exit(1);
    }
}

mongoose.connection.once('open', () => {
    console.log('✅ Conectado ao MongoDB');
    seed();
});

mongoose.connection.on('error', err => {
    console.error('❌ Erro de conexão MongoDB:', err);
    process.exit(1);
});