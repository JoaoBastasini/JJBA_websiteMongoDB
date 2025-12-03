const { Client } = require('pg');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// String de conexão do PostgreSQL (Neon)
const pgConnectionString = process.env.pgConnectionString;

// String de conexão do MongoDB Atlas
const mongoConnectionString = process.env.mongoConnectionString;

async function migrate() {
    const pgClient = new Client({ connectionString: pgConnectionString });
    const mongoClient = new MongoClient(mongoConnectionString);

    try {
        await pgClient.connect();
        await mongoClient.connect();
        console.log("Conectado aos dois bancos!");

        const db = mongoClient.db("jjba_wiki");
        const collection = db.collection("personagens");

        // Limpa coleção para evitar duplicatas
        await collection.deleteMany({});

        // Busca Personagens do PostgreSQL
        const resPersonagens = await pgClient.query('SELECT * FROM personagens');
        const personagens = resPersonagens.rows;

        console.log(`Encontrados ${personagens.length} personagens. Iniciando migração...`);

        // Loop por cada personagem para montar o documento completo
        for (const p of personagens) {
            
            // Estrutura base do documento NoSQL
            const doc = {
                nome: p.nome,
                genero: p.genero,
                nacionalidade: p.nacionalidade,
                ano_nascimento: p.ano_nascimento,
                vivo: p.vivo,
                primeira_aparicao: p.primeira_aparicao,
                imgname: p.imgname,
                stand: null,           // Preenchido abaixo
                participacoes: []      // Preenchido abaixo
            };

            // Busca Stand do personagem (JOIN manual)
            // Transforma uma tabela separada em um objeto embutido
            const resStand = await pgClient.query(
                // $1 é placeholder, evita erro com nomes que contenham ' e SQL injection
                'SELECT * FROM stands WHERE personagem_nome = $1', 
                [p.nome]
            );
            
            if (resStand.rows.length > 0) {
                const s = resStand.rows[0];
                doc.stand = {
                    nome: s.nome,
                    referencia: s.referencia,
                    categoria: s.categoria,
                    imgname: s.imgname,
                    stats: {
                        destrutivo: s.poder_destrutivo,
                        velocidade: s.velocidade,
                        alcance: s.alcance,
                        durabilidade: s.durabilidade,
                        precisao: s.precisao,
                        potencial: s.potencial
                    }
                };
            }

            // Busca Participações nas Partes (Tabela N para N)
            const resPartes = await pgClient.query(
                'SELECT * FROM personagem_parte WHERE personagem_nome = $1',
                [p.nome]
            );

            // Adiciona cada parte em um array dentro do personagem
            for (const parte of resPartes.rows) {
                doc.participacoes.push({
                    parte_numero: parte.parte_numero,
                    idade: parte.idade,
                    vilao_aliado: parte.vilao_aliado, // true/false
                    local_aparicao: parte.primeira_aparicao_local,
                    protagonista: parte.protagonista
                });
            }

            // Insere no MongoDB
            await collection.insertOne(doc);
            console.log(`Migrado: ${p.nome}`);
        }

        console.log("Migração concluída com sucesso!");

    } catch (err) {
        console.error("Erro na migração:", err);
    } finally {
        await pgClient.end();
        await mongoClient.close();
    }
}

migrate();