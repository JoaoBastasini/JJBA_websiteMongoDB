## Website-Enciclopédia JoJo's Bizarre Adventure 
[![Deploy Status](https://img.shields.io/badge/Deploy-Render-success?style=for-the-badge&logo=render)](https://jojo-wiki.onrender.com/)

Projeto de aplicação web dinâmica com front-end (HTML, CSS, JS) e back-end (Node.js, Express) conectado a um banco de dados MongoDB (Atlas).

Este projeto foi desenvolvido para a disciplina de Bancos de Dados II, com o objetivo de exibir dinamicamente informações sobre o universo de JoJo's Bizarre 
Adventure.

Esta é a parte 2 do projeto, que consiste em migrar de PostgreSQL (Neon) para NoSQL (MongoDB Atlas). Por isso, algumas formatações foram feitas no backend para facilitar a passagem correta para o frontend sem precisar revisitar todas as páginas. a parte 1 pode ser encontrada em: [Parte 1](https://github.com/Julia-Amadio/JJBA_website.git)

## 🔗 Acesso Online

A aplicação está rodando em produção. Você pode acessá-la clicando no link abaixo:
<br>
👉 ** To be made **

## Tecnologias utilizadas

### Front-End
* **HTML5**
* **CSS3**
* **JavaScript (Vanilla)**: Usando `fetch` para consumir a API do back-end.
* **Chart.js**: Biblioteca para renderização dos gráficos de radar.

### Back-End
* **Node.js**: Ambiente de execução do servidor.
* **Express.js**: Framework para criar o servidor web e as rotas da API.


### Banco de dados e infraestrutura


## Como executar

É necessário ter [Node.js](https://nodejs.org/) (versão 16 ou superior) instalado.

1.  **Clone o repositório**
    <br>No terminal, navegue até a pasta onde você deseja clonar o repositório e utilize o comando:
    ```bash
    git clone https://github.com/JoaoBastasini/JJBA_websiteMongoDB.git
    ```

2.  **Configure as Variáveis de Ambiente (.env)**
    <br>Este projeto utiliza um arquivo `.env` para guardar a string de conexão do banco de dados (que não é enviada a este repositório do GitHub por segurança).
    * Crie um arquivo chamado `.env` na raiz do projeto.
    * Adicione sua string de conexão do Neon dentro dele:
    ```env
    mongoConnectionString="mongodb+srv://admin:SUA_SENHA_MONGO@cluster0.abcde.mongodb.net/?..."
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
* **Variáveis de ambiente:** `mongoConnectionString` foi configurada diretamente no painel de controle do Render para garantir a segurança das credenciais do banco MongoDB.
