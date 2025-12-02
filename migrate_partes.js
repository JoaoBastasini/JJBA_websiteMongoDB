const { Client } = require('pg');
const { MongoClient } = require('mongodb');

const pgConnectionString = process.env.pgConnectionString;
const mongoConnectionString = process.env.mongoConnectionString;

async function migratePartes() {
    const pgClient = new Client({ connectionString: pgConnectionString });
    const mongoClient = new MongoClient(mongoConnectionString);

    try {
        await pgClient.connect();
        await mongoClient.connect();
        
        const db = mongoClient.db("jjba_wiki");
        const collection = db.collection("partes");
        await collection.deleteMany({}); // Limpa coleção para evitar duplicatas

        console.log("Migrando Partes e Episódios...");

        // Busca Partes
        const resPartes = await pgClient.query('SELECT * FROM partes ORDER BY numero');
        
        for (const parte of resPartes.rows) {
            const docParte = {
                numero: parte.numero,
                nome: parte.nome,
                ano: parte.ano,
                descricao: parte.descricao,
                episodios: [] // Array para colocar os episódios junto
            };

            // Busca Episódios desta parte (JOIN manual)
            const resEp = await pgClient.query(
                'SELECT * FROM episodios WHERE parte_numero = $1 ORDER BY numero', 
                [parte.numero]
            );

            // Preenche o array
            docParte.episodios = resEp.rows.map(ep => ({
                numero: ep.numero,
                nome: ep.nome,
                descricao: ep.descricao,
                data_lancamento: ep.data_lancamento
            }));

            await collection.insertOne(docParte);
            console.log(`Parte ${parte.numero} migrada com ${docParte.episodios.length} episódios.`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pgClient.end();
        await mongoClient.close();
    }
}

migratePartes();