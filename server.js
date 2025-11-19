//Importar as bibliotecas (Express, dotenv e o driver 'pg' do Postgres)
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

//Inicializar o Express
const app = express();
const port = 3000; //Porta onde o servidor vai rodar

//Config conexão com o banco
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false //Necessário para o Neon
  }
});

//Servir Arquivos Estáticos (HTML/CSS)
//Isso faz a pasta 'public' ser a raiz do site
app.use(express.static('public'));

//ROTA DA API (STANDS): Buscar TODOS os Stands (em ordem alfabética)
app.get('/api/stands', async (req, res) => {
  try {
    //Consulta SQL para buscar todos os stands
    const query = 'SELECT * FROM Stands ORDER BY nome ASC';
    const result = await pool.query(query);

    //Envia os dados encontrados como JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar stands:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API (PERSONAGENS): Buscar TODOS os personagens (em ordem alfabética)
app.get('/api/personagens', async (req, res) => {
  try {
    //Busca todos os nomes da tabela Personagens, ordenados pelo nome
    const query = 'SELECT nome FROM Personagens ORDER BY nome ASC';
    const result = await pool.query(query);
    
    //Envia a lista de nomes como JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar personagens:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Buscar UM personagem específico (ATUALIZADA)
//O ':nome' é um parâmetro dinâmico
app.get('/api/personagem/:nome', async (req, res) => {
  try {
    const nomePersonagem = req.params.nome; 

    //Query 1: pega os dados do personagem (como antes)
    const queryPersonagem = 'SELECT * FROM Personagens WHERE nome = $1';
    const resultPersonagem = await pool.query(queryPersonagem, [nomePersonagem]);

    if (resultPersonagem.rows.length === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado' });
    }

    //Pega o objeto do personagem
    const personagem = resultPersonagem.rows[0];

    //Query 2: busca os stands associados a esse personagem
    const queryStands = 'SELECT nome FROM Stands WHERE personagem_nome = $1';
    const resultStands = await pool.query(queryStands, [nomePersonagem]);

    personagem.stands = resultStands.rows; 

    //Agora, busca os grupos (nome, descrição e status)
    //Usamos JOIN para ligar grupos -> personagem_grupo
    const queryGrupos = `
      SELECT G.nome, G.descricao, G.vilao_aliado 
      FROM Grupos AS G
      JOIN Personagem_Grupo AS PG ON G.nome = PG.grupo_nome
      WHERE PG.personagem_nome = $1`;

    const resultGrupos = await pool.query(queryGrupos, [nomePersonagem]);

    //Add a array de grupos ao objeto do personagem
    //(Será uma array vazia [] se ele não pertencer a nenhum grupo)
    personagem.grupos = resultGrupos.rows;
    
    // [CORREÇÃO] Query 3: Busca os episódios (Sem espaços inválidos)
    // A indentação foi refeita com espaços normais.
    const queryEpisodios = `
    SELECT E.numero, E.nome 
    FROM Episodios E 
    JOIN Personagem_Episodio PE ON E.numero = PE.episodio_numero 
    WHERE PE.personagem_nome = $1
    ORDER BY E.numero ASC
`; // <-- O '`' final deve estar limpo
    const resultEpisodios = await pool.query(queryEpisodios, [nomePersonagem]);
    personagem.episodios = resultEpisodios.rows; // Adiciona ao objeto

    // [CORREÇÃO] Query 4: Busca as batalhas (Sem espaços inválidos)
    // A indentação foi refeita com espaços normais.
    const queryBatalhas = `
    SELECT * FROM Batalha 
    WHERE personagem_a = $1 OR personagem_b = $1
    ORDER BY episodio_inicial ASC
`; // <-- O '`' final deve estar limpo
    const resultBatalhas = await pool.query(queryBatalhas, [nomePersonagem]);
    personagem.batalhas = resultBatalhas.rows; // Adiciona ao objeto

    //Envia o objeto 'personagem' agora combinado com stands, episodios e batalhas
    res.json(personagem);

  } catch (err) {
    console.error('Erro ao buscar detalhe do personagem:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API: Buscar UM stand específico (ATUALIZADA com Habilidades)
app.get('/api/stand/:nome', async (req, res) => {
  try {
    const nomeStand = req.params.nome; 

    //Query 1: Pega os dados do stand
    const queryStand = 'SELECT * FROM Stands WHERE nome = $1';
    const resultStand = await pool.query(queryStand, [nomeStand]);

    if (resultStand.rows.length === 0) {
      return res.status(404).json({ error: 'Stand não encontrado' });
    }

    const stand = resultStand.rows[0]; //Pega o objeto do stand

    //Query 2: Agora, busca as habilidades (nome e descrição)
    //Usamos JOIN (eba!) para ligar Habilidades -> Stand_Habilidade -> Stand
    const queryHabilidades = `
      SELECT H.nome, H.descricao 
      FROM Habilidades AS H
      JOIN Stand_Habilidade AS SH ON H.nome = SH.habilidade_nome
      WHERE SH.stand_nome = $1`;

    const resultHabilidades = await pool.query(queryHabilidades, [nomeStand]);

    //Adiciona a array de habilidades ao objeto do stand
    //(Será uma array vazia [] se não houver habilidades)
    stand.habilidades = resultHabilidades.rows; 

    //Envia o objeto 'stand' combinado com suas habilidades
    res.json(stand);

  } catch (err) {
    console.error('Erro ao buscar detalhe do stand:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/partes-com-episodios', async (req, res) => {
  try {
    // Query 1: Busca todas as Partes, ordenadas por número
    const queryPartes = 'SELECT * FROM Partes ORDER BY numero ASC';
    const resultPartes = await pool.query(queryPartes);
    const partes = resultPartes.rows;

    // Query 2: Busca TODOS os Episódios, já ordenados
    const queryEpisodios = 'SELECT * FROM Episodios ORDER BY parte_numero ASC, numero ASC';
    const resultEpisodios = await pool.query(queryEpisodios);
    const todosEpisodios = resultEpisodios.rows;

    // Agora, vamos agrupar os episódios dentro de suas respectivas partes
    const partesComEpisodios = partes.map(parte => {
      // Filtra a lista de todos os episódios, pegando só os desta parte
      const episodiosDaParte = todosEpisodios.filter(ep => 
        ep.parte_numero === parte.numero
      );
      
      // Retorna o objeto da parte com a lista de episódios aninhada
      return {
        ...parte, // Mantém os dados da parte (numero, nome, ano, etc.)
        episodios: episodiosDaParte // Adiciona o array de episódios
      };
    });

    // Envia o JSON agrupado
    res.json(partesComEpisodios);

  } catch (err) {
    console.error('Erro ao buscar partes e episódios:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA DA API: Contagem de Personagens por Nacionalidade (para o Dashboard)
app.get('/api/estatisticas/nacionalidade', async (req, res) => {
  try {
    // Query SQL: Agrupa e conta personagens por nacionalidade
    const query = `
      SELECT nacionalidade, COUNT(*) 
      FROM Personagens 
      GROUP BY nacionalidade 
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    
    // Envia o resultado: Ex: [{ nacionalidade: 'Japonesa', count: '10' }, ...]
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar estatísticas de nacionalidade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//Iniciar o Servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});