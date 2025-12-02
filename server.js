//Importar as bibliotecas (Express, dotenv e o driver 'mongodb' para o Atlas)
const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

//Inicializar o Express
const app = express();
const port = 3000; //Porta onde o servidor vai rodar

//Conexão com o banco (MongoDB)
//Precisa da URL no arquivo .env
const uri = process.env.mongoConnectionString; 
const client = new MongoClient(uri);

let db; //Variável global para guardar a conexão com o banco

//Função para conectar ao iniciar o servidor
async function conectarMongo() {
  try {
    await client.connect();
    //Define qual banco de dados vamos usar dentro do Cluster
    db = client.db('jjba_wiki'); 
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar no Mongo:", err);
  }
}
conectarMongo();

//Servir Arquivos Estáticos (HTML/CSS)
//Isso faz a pasta 'public' ser a raiz do site
app.use(express.static('public'));

//ROTA DA API (STANDS): Buscar TODOS os Stands (em ordem alfabética)
app.get('/api/stands', async (req, res) => {
  try {
    //Consulta MongoDB: Buscar Stands dentro dos Personagens
    //Como migramos os stands para dentro dos personagens,
    //precisamos buscar personagens que tenham o campo 'stand' preenchido.
    const personagens = await db.collection('personagens')
      .find({ stand: { $ne: null } }) // Filtra onde stand NÃO é nulo
      .project({ stand: 1, nome: 1, _id: 0 }) // Traz apenas o stand e o nome do usuário
      .toArray();

    //Transformação de Dados:
    //O front-end espera uma lista plana de stands. 
    //Extraímos o objeto 'stand' e adicionamos o nome do dono.
    const listaStands = personagens.map(p => ({
      ...p.stand, // Espalha as propriedades do stand (nome, poder, etc.)
      personagem_nome: p.nome // Adiciona o campo de referência manual
    }));

    //Ordenação alfabética com JavaScript
    listaStands.sort((a, b) => a.nome.localeCompare(b.nome));

    //Envia os dados encontrados como JSON
    res.json(listaStands);
  } catch (err) {
    console.error('Erro ao buscar stands:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API (PERSONAGENS): Buscar TODOS os personagens (em ordem alfabética)
app.get('/api/personagens', async (req, res) => {
  try {
    //Busca apenas o campo 'nome' da coleção Personagens
    //projection: { nome: 1 } funciona como o SELECT nome
    const lista = await db.collection('personagens')
      .find({}, { projection: { nome: 1, _id: 0 } }) 
      .sort({ nome: 1 }) // 1 = Ordem Crescente (ASC)
      .toArray();
    
    //Envia a lista de nomes como JSON
    res.json(lista);
  } catch (err) {
    console.error('Erro ao buscar personagens:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Buscar UM personagem específico
//O ':nome' é um parâmetro dinâmico
app.get('/api/personagem/:nome', async (req, res) => {
  try {
    const nomePersonagem = req.params.nome; 

    //Query Simples: Busca o documento completo do personagem pelo nome.
    const personagemDoc = await db.collection('personagens').findOne({ nome: nomePersonagem });

    if (!personagemDoc) {
      return res.status(404).json({ error: 'Personagem não encontrado' });
    }

    //Adaptação para o Front-End:
    //O site foi construído esperando Arrays para stands, grupos, etc.
    //No Mongo, se usamos embedding 1:1, precisamos envolver em um array.
    
    const resposta = {
      ...personagemDoc,
      
      //Se existe um stand, coloca num array [stand], senão array vazio []
      stands: personagemDoc.stand ? [personagemDoc.stand] : [],
      
      //Garante que retorne array vazio se os campos não existirem no documento
      grupos: personagemDoc.grupos || [],
      episodios: personagemDoc.episodios || [],
      batalhas: personagemDoc.batalhas || []
    };

    //Envia o objeto 'personagem' completo
    res.json(resposta);

  } catch (err) {
    console.error('Erro ao buscar detalhe do personagem:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Buscar UM stand específico (ATUALIZADA com Habilidades)
app.get('/api/stand/:nome', async (req, res) => {
  try {
    const nomeStand = req.params.nome; 

    //Query Inversa: Buscamos o Personagem que possui este Stand
    //Acessamos o campo aninhado usando notação de ponto "stand.nome"
    const dono = await db.collection('personagens').findOne({ "stand.nome": nomeStand });

    if (!dono || !dono.stand) {
      return res.status(404).json({ error: 'Stand não encontrado' });
    }

    //Monta o objeto do stand combinando os dados internos
    const standObj = {
      ...dono.stand, // Pega os dados do stand todos de uma vez
      personagem_nome: dono.nome // Pega o nome do dono do documento pai e adiciona ao stand
    };

    //Envia o objeto 'stand' combinado
    res.json(standObj);

  } catch (err) {
    console.error('Erro ao buscar detalhe do stand:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Partes com Episódios (Agrupados)
app.get('/api/partes-com-episodios', async (req, res) => {
  try {    
    const partes = await db.collection('partes')
      .find()
      .sort({ numero: 1 }) // Ordena pelo número da Parte
      .toArray();

    //Não precisamos mais fazer o map/filter do JavaScript, pois o banco NoSQL já entrega a estrutura pronta!
    
    //Envia o JSON agrupado
    res.json(partes);

  } catch (err) {
    console.error('Erro ao buscar partes e episódios:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Contagem de Personagens por Nacionalidade (para o Dashboard)
app.get('/api/estatisticas/nacionalidade', async (req, res) => {
  try {
    //Query Aggregation: O equivalente ao GROUP BY no MongoDB
    const pipeline = [
      { 
        $group: { 
          _id: "$nacionalidade", // Agrupa pelo campo nacionalidade
          count: { $sum: 1 }     // Soma 1 para cada documento encontrado
        } 
      },
      { $sort: { count: -1 } }   // Ordena do maior para o menor
    ];

    const result = await db.collection('personagens').aggregate(pipeline).toArray();
    
    //Adaptação: O Mongo retorna {_id: 'Japão', count: 10}.
    //O front espera {nacionalidade: 'Japão', count: 10}.
    const formatado = result.map(item => ({
      nacionalidade: item._id,
      count: item.count
    }));

    //Envia o resultado formatado
    res.json(formatado);
  } catch (err) {
    console.error('Erro ao buscar estatísticas de nacionalidade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//Iniciar o Servidor
app.listen(port, () => {
  console.log(`Servidor MongoDB rodando em http://localhost:${port}`);
});