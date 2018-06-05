var express = require('express'),
    bodyParser = require('body-parser'),
    multiParty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectId,
    fs = require('fs');

var app = express();

// Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiParty());

var port = 3000;

app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
)

console.log('Servidor HTTP escutando na porta '+port);

app.get('/', function(req, res){
    res.send({msg: 'teste'});
});

// URI + HTTP

/**
 * Cadastra informações no banco de dados
 */
app.post('/api' , function(req, res){
    
    // Seta o header para receber requisições de outros domínios
    res.setHeader('Access-Control-Allow-Origin', '*');

    var date = new Date();
    var timeStamp = date.getTime();

    var url_imagem  = timeStamp + '_' + req.files.arquivo.originalFilename;
    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    // Faz o upload do arquivo no servidor
    fs.rename(path_origem, path_destino, function(err){
        if(err){
            res.status(500).json({error: err});
            return;
        } 
        var dados = {
            url_imagem : url_imagem,
            titulo: req.body.titulo
        };

        if(dados.titulo != undefined && dados.url_imagem != undefined){
            db.open(function(err, mongoClient){
                mongoClient.collection('postagens', function(err, collection){
                    collection.insert(dados, function(err, records){
                        if(err){
                            res.status(500).json({status: 'Ops, houve um erro no servidor!'});
                        } else {
                            res.status(200).json({status: 'Inclusão realizada com sucesso!'});
                        }
                        mongoClient.close();
                    });
                });
            });
        } else {
            res.status(400).json({msg: 'Dados inválidos para requisição'});        
        }

    });

    // res.send(dados);
});

/**
 * Retorna TODAS informações do banco de dados
 */
app.get('/api' , function(req, res){
    var dados = req.body;

    db.open(function(err, mongoClient){
        mongoClient.collection('postagens', function(err, collection){
            collection.find().toArray(function(err, results){
                if(err){
                    res.status(500).json(err);
                } else {
                    if(results == []){
                        res.status(404).json({msg: 'Nenhum documento encontrado!'});
                    } else{
                        res.status(200).json(results);
                    }
                }
                mongoClient.close();
            });
        });
    });
    // res.send(dados);
});

/**
 * Retorna o registro de acordo com o ID
 */
app.get('/api/:id' , function(req, res){
    var dados = req.body;

    db.open(function(err, mongoClient){
        mongoClient.collection('postagens', function(err, collection){
            collection.find(objectId(req.params.id)).toArray(function(err, results){
                if(err){
                    res.status(500).json(err);
                } else {
                    if(results == ''){
                        res.status(404).json({msg: 'Nenhum documento encontrado!'});
                    } else{
                        res.status(200).json(results);
                    }
                }
                mongoClient.close();
            });
        });
    });
    // res.send(dados);
});

/**
 * Realiza o update no banco de dados
 */
app.put('/api/:id' , function(req, res){
    var dados = req.body;

    if(req.params.id != undefined && dados.titulo != undefined){
        db.open(function(err, mongoClient){
            mongoClient.collection('postagens', function(err, collection){
                collection.update(
                    { _id : objectId(req.params.id)},
                    { $set : {titulo: req.body.titulo}},
                    {},
                    function(err, records){
                        if(err){
                            res.json(err);
                        } else {
                            res.json(records);
                        }
                        mongoClient.close();
                    } 
                );
                
            });
        });
    } else {
        res.status(400).json({msg: 'Dados inválidos para requisição'});        
    }
    // res.send(dados);
});


/**
 * Realiza o delete no banco de dados
 */
app.delete('/api/:id' , function(req, res){
    var dados = req.body;

    if(req.params.id != undefined){
        db.open(function(err, mongoClient){
            mongoClient.collection('postagens', function(err, collection){
                collection.remove({_id: objectId(req.params.id)}, function(err, records){
                    if(err){
                        res.status(500).json(err);
                    } else {
                        if(records.result.n != 0){
                            res.status(200).json(records);
                        } else {
                            res.status(500).json({msg: 'Nenhum documento foi deletado!'});
                        }
                    }
                    mongoClient.close();
                });
                
            });
        });
    } else {
        res.status(400).json({msg: 'Dados inválidos para requisição'});                
    }
    // res.send(dados);
});