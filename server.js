//Importar as bibliotecas (Express e o driver 'pg' do Postgres)
const express = require('express');
const { Pool } = require('pg');

//Inicializar o Express
const app = express();
const port = 3000; //Porta onde o servidor vai rodar

//Configurar a Conexão com o Banco
//ATENÇÃO: Pegar string de conexão no site do Neon 
//e colar ela aqui quando pronta.
const connectionString = "string_de_conexao_neon_esta_no_zipzop"; 
//A STRING DE CONEXÃO DO NEON FOI PASSADA NO ZAP
//A STRING DE CONEXÃO NÃO DEVE IR PRO GITHUB DE MANEIRA ALGUMA
//APENAS ESTE CÓDIGO DEVE.
//VOU DESCOBRIR OUTRA HORA COMO FAÇO PRA ELE NÃO APARECER NO RENDER.

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false //Necessário para o Neon
  }
});

//Servir Arquivos Estáticos (HTML/CSS)
//Isso faz a pasta 'public' ser a raiz do site
app.use(express.static('public'));

//Criar a Rota da API (Onde o front-end buscará os dados)
app.get('/api/stands', async (req, res) => {
  try {
    //Consulta SQL para buscar todos os stands
    const query = 'SELECT * FROM Stands';
    const result = await pool.query(query);

    //Envia os dados encontrados como JSON
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar stands:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//ROTA DA API (PÁGINA 1 - PERSONAGENS): Buscar TODOS os personagens (em ordem alfabética)
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

    //NOVA PARTE
    //Query 2: busca os stands associados a esse personagem
    //Usamos 'SELECT nome' pois só precisamos do nome do stand para o link
    const queryStands = 'SELECT nome FROM Stands WHERE personagem_nome = $1';
    const resultStands = await pool.query(queryStands, [nomePersonagem]);

    //Adiciona a lista de stands ao objeto do personagem
    //resultStands.rows será uma array vazia [] se ele não tiver stands
    //^ serve para personagens como Lisa Lisa
    personagem.stands = resultStands.rows; 
    //FIM DA NOVA PARTE

    //Envia o objeto 'personagem' agora combinado com seus stands
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

//Iniciar o Servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});