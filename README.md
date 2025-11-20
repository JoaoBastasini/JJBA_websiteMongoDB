## Website-Enciclopédia JoJo's Bizarre Adventure 
[![Deploy Status](https://img.shields.io/badge/Deploy-Render-success?style=for-the-badge&logo=render)](https://jojo-wiki.onrender.com/)

Projeto de aplicação web dinâmica com front-end (HTML, CSS, JS) e back-end (Node.js, Express) conectado a um banco de dados PostgreSQL (Neon).

Este projeto foi desenvolvido para a disciplina de Bancos de Dados II, com o objetivo de exibir dinamicamente informações sobre o universo de JoJo's Bizarre 
Adventure.

## 🔗 Acesso Online

A aplicação está rodando em produção. Você pode acessá-la clicando no link abaixo:
<br>
👉 **[Acessar Enciclopédia JoJo (Live Demo)](https://jojo-wiki.onrender.com/)**

## Tecnologias utilizadas

### Front-End
* **HTML5**
* **CSS3**
* **JavaScript (Vanilla)**: Usando `fetch` para consumir a API do back-end.
* **Chart.js**: Biblioteca para renderização dos gráficos de radar.

### Back-End
* **Node.js**: Ambiente de execução do servidor.
* **Express.js**: Framework para criar o servidor web e as rotas da API.
* **node-postgres (`pg`)**: Driver para conectar o Node.js ao banco de dados PostgreSQL.

### Banco de dados e infraestrutura
* **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional.
* **Neon**: Plataforma de hospedagem serverless para o PostgreSQL na nuvem.
* **Render**: Plataforma de cloud utilizada para o deploy da aplicação.

## Como executar

É necessário ter o [Node.js](https://nodejs.org/) (versão 16 ou superior) instalado.

1.  **[to-do] Clone o repositório**
    <br>No terminal, navegue até a pasta onde você deseja clonar o repositório e utilize o comando:
    ```bash
    git clone https://github.com/Julia-Amadio/JJBA_website.git
    ```

2.  **Configure as Variáveis de Ambiente (.env)**
    <br>Este projeto utiliza um arquivo `.env` para guardar a string de conexão do banco de dados (que não é enviada a este repositório do GitHub por segurança).
    * Crie um arquivo chamado `.env` na raiz do projeto.
    * Adicione sua string de conexão do Neon dentro dele:
    ```env
    DATABASE_URL="postgresql://usuario:senha@endpoint-neon.tech/neondb?sslmode=require"
    ```

3.  **Instale as Dependências do Back-End**
    <br>No terminal, navegue até a raiz do repositório clonado e execute:
    ```bash
    npm install
    ```
    Isso irá ler o `package.json` e instalar o `express` e o `pg` na pasta `node_modules`.

4. **Inicie o servidor**
    <br>Ainda no terminal, execute:
    ```bash
    node server.js
    ```
    Você deverá ver a mensagem: `Servidor rodando em http://localhost:3000` 

5. **Acesse a Aplicação**
<br>Acesse `http://localhost:3000/` (ou `http://localhost:3000/index.html`) para ver a página inicial.

## ☁️ Sobre o deploy

O deploy foi realizado utilizando a plataforma **Render** conectado diretamente a este repositório do GitHub.

* **Serviço:** Web Service (Node.js)
* **Build Command:** `npm install`
* **Start Command:** `node server.js`
* **Variáveis de ambiente:** `DATABASE_URL` foi configurada diretamente no painel de controle do Render para garantir a segurança das credenciais do banco Neon.