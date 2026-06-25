const express = require("express");
const cors = require("cors");
const mysql = require("mysql2")

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "natacao",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
});

db.connect((erro) => {
    if (erro) {
        console.log("Erro ao conectar");
        console.log(erro);
        return;
    }
    console.log("Conectado com sucesso");
    const criarTabelaSQL = ` 
CREATE TABLE IF NOT EXISTS alunos1 (
  id int auto_increment primary key,
  nome varchar(70) not null,
  idade int not null,
  telefone varchar(20) not null,
  nivel varchar(50) not null,
  horario varchar(50) not null,
  ativo boolean default true
);
    `;
    db.query(criarTabelaSQL, (erroTabela => {
        if(erroTabela) {
            console.log("Erro de verificação ou criação da tabela", erroTabela);
        } else {
            console.log("Tabela pronta para uso")
        }
    }))
});

app.get("/", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    })
})

app.post("/alunos", (req, res) => {
    const {
        nome, idade, telefone, nivel, horario
    } = req.body

    if (!nome || !idade || !nivel || !horario || !telefone) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        })
    }
    if (idade <= 4) {
        return res.status(400).json({
            erro: "Você deve ser maior que 4 anos."
        })
    }
    if (idade > 100) {
        return res.status(400).json({
            erro: "Você já é velho de guerra amigão!"
        })
    }
    if (nome.length <= 3) {
        return res.status(400).json({
            erro: "Nome curto demais!"
        })
    }

    const verificaSQL = "SELECT * FROM alunos1 WHERE nome = ?";
    db.query(verificaSQL, [nome],
        (erro, resultado) => {
            if (erro) {
                return res.status(500).json(erro);
            }
            if (resultado.length > 0) {
                return res.status(400).json({
                    erro: "Já existe esse nome cadastrado no banco de dados!"
                })
            }
            const inserirSQL = `INSERT INTO alunos1 (nome, idade, telefone, nivel, horario)
    VALUES( ? , ? , ? , ? , ?)`
            db.query(
                inserirSQL,
                [nome, idade, telefone, nivel, horario],
                (erro, resultado) => {
                    if (erro) {
                        return res.status(500).json(erro);
                    }
                    res.status(201).json({
                        mensagem: "Aluno cadastrado!",
                        id: resultado.insertId
                    });
                }
            );
        }
    )
});

app.get("/alunos", (req, res) => {
    db.query(
        "SELECT * FROM alunos1", (erro, resultado) => {
            if (erro) {
                return res.status(500).json(erro);
            }
            res.json(resultado);
        }
    )
})

app.delete("/alunos/:id", (req, res) => {
    const id = req.params.id;
    db.query(" DELETE FROM alunos1 WHERE id = ? ",
        [id], (erro, resultado) => {
            if (erro) {
                return res.status(500).json(erro);
            } if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Aluno não encontrado!"
                });
            }
            res.json({
                mensagem: "Aluno removido!"
            });
        });
});

app.put("/alunos/:id", (req, res) => {
    const id = req.params.id
    db.query("SELECT ativo FROM alunos1 WHERE id = ?", [id], (erro, resultado) => {
        if (erro) {
            return res.status(500).json(erro);
        }
        if (resultado.length === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado!"
            })
        }
        const novoStatus =
            resultado[0].ativo ? 0 : 1;

        db.query("UPDATE alunos1 SET ativo = ? WHERE id = ?", [novoStatus, id], (erro) => {
            if (erro) {
                return res.status(500).json(erro);
            }
            res.json({
                mensagem: "Aluno atualizado!"
            });
        });
    });
});

let incorretas = 0;
let bloqueado = false;

app.post("/admin", (req, res) => {
    const { senha } = req.body;

    if (bloqueado === true) {
        return res.status(403).json({
            erro: "Tentativas excedentes! Sistema bloqueado!"
        })
    }
    if (!senha) {
        return res.status(400).json({
            erro: "Senha inválida!"
        })
    }
    if (senha === "adm123") {
        incorretas = 0;
        return res.json({ autenticado: true });
    }

    incorretas++;
    if (incorretas >= 3) {
        bloqueado = true;
        return res.status(403).json({
            erro: "Sistema bloqueado!"
        })
    }
    return res.status(401).json({
        erro: `Senha incorreta.Faltam ${ 3 - incorretas } até o bloqueio do sistema!`
    })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando! Em: ")
    console.log(`porta ${ PORT } `)
})

//post = salvar dados
//get = puxar dados internos
//delete = deletar dados
//put = atualizar dados
//req = faz a requisao e procura informação/documento
//res = resposta pro frontend, mandar informação do backend para o frontend, onde faz aparecer pro usuário
//status code = 400, 404 - Página nao encontrada, 200, 201, 501
//localhost:3000
