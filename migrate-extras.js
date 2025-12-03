const { Client } = require('pg');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const pgConnectionString = process.env.pgConnectionString;
const mongoConnectionString = process.env.mongoConnectionString;

async function migrateExtras() {
    const pgClient = new Client({ connectionString: pgConnectionString });
    const mongoClient = new MongoClient(mongoConnectionString);

    try {
        await pgClient.connect();
        await mongoClient.connect();
        console.log("Conectado para migração complementar...");

        const db = mongoClient.db("jjba_wiki");
        const colPersonagens = db.collection("personagens");
        const colGrupos = db.collection("grupos");
        const colBatalhas = db.collection("batalhas");

        // MIGRA GRUPOS (Coleção Separada)
        await colGrupos.deleteMany({});
        const resGrupos = await pgClient.query('SELECT * FROM grupos');
        if (resGrupos.rows.length > 0) {
            await colGrupos.insertMany(resGrupos.rows);
            console.log(`Grupos migrados: ${resGrupos.rowCount}`);
        }

        // MIGRA BATALHAS (Coleção Separada)
        await colBatalhas.deleteMany({});
        const resBatalhas = await pgClient.query('SELECT * FROM batalha');

        // Ajusta estrutura
        const docsBatalha = resBatalhas.rows.map(b => ({
            personagem_a: b.personagem_a,
            personagem_b: b.personagem_b,
            vencedor: b.vencedor,
            parte_numero: b.parte_numero,
            episodios: {
                inicio: b.episodio_inicial,
                fim: b.episodio_final
            }
        }));
        if (docsBatalha.length > 0) {
            await colBatalhas.insertMany(docsBatalha);
            console.log(`Batalhas migradas: ${docsBatalha.length}`);
        }

        // Update nos documentos existentes de Personagens
        // Itera sobre cada personagem para adicionar info extra
        const cursorPersonagens = colPersonagens.find({}); // Pega todos
        
        console.log("Enriquecendo personagens com Habilidades, Relacionamentos e Grupos...");

        for await (const doc of cursorPersonagens) {
            const nome = doc.nome;
            const updateFields = {};

            // Habilidades do Personagem (ex: Hamon, Vampirismo)
            const resHabPers = await pgClient.query(`
                SELECT h.nome, h.descricao as desc_geral, ph.nivel, ph.descricao_uso 
                FROM personagem_habilidade ph
                JOIN habilidades h ON ph.habilidade_nome = h.nome
                WHERE ph.personagem_nome = $1
            `, [nome]);
            
            if (resHabPers.rowCount > 0) {
                updateFields.habilidades = resHabPers.rows.map(r => ({
                    nome: r.nome,
                    tipo: "Inata/Técnica",
                    descricao: r.desc_geral,
                    uso: r.descricao_uso,
                    nivel: r.nivel
                }));
            }

            // Habilidades do Stand (Se tiver)
            if (doc.stand) {
                const resHabStand = await pgClient.query(`
                    SELECT h.nome, h.descricao 
                    FROM stand_habilidade sh
                    JOIN habilidades h ON sh.habilidade_nome = h.nome
                    WHERE sh.stand_nome = $1
                `, [doc.stand.nome]);

                if (resHabStand.rowCount > 0) {
                    // Atualiza o objeto stand dentro do updateFields
                    updateFields["stand.habilidades"] = resHabStand.rows.map(r => ({
                        nome: r.nome,
                        descricao: r.descricao
                    }));
                }
            }

            // Grupos (Afiliações)
            const resGruposPers = await pgClient.query(
                'SELECT grupo_nome FROM personagem_grupo WHERE personagem_nome = $1',
                [nome]
            );
            if (resGruposPers.rowCount > 0) {
                updateFields.afiliacoes = resGruposPers.rows.map(r => r.grupo_nome);
            }

            // Relacionamentos
            const resRel = await pgClient.query(`
                SELECT personagem_b, descricao FROM relacao_personagem WHERE personagem_a = $1
                UNION
                SELECT personagem_a, descricao FROM relacao_personagem WHERE personagem_b = $1
            `, [nome]);
            
            if (resRel.rowCount > 0) {
                updateFields.relacionamentos = resRel.rows.map(r => ({
                    personagem: r.personagem_a === nome ? r.personagem_b : r.personagem_a, // Pega o "outro"
                    tipo: r.descricao
                }));
            }

            // Executa o update no MongoDB 
            if (Object.keys(updateFields).length > 0) {
                await colPersonagens.updateOne(
                    { _id: doc._id },
                    { $set: updateFields }
                );
                // Opcional para não poluir
                // console.log(`Atualizado: ${nome}`);
            }
        }

        console.log("Enriquecimento concluído!");

    } catch (err) {
        console.error("Erro no script extra:", err);
    } finally {
        await pgClient.end();
        await mongoClient.close();
    }
}

migrateExtras();