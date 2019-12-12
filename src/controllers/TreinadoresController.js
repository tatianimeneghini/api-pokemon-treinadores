const { connect } = require('../models/Repository')
const treinadoresModel = require('../models/TreinadoresSchema')
const { pokemonsModel } = require('../models/PokemonsSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const SEGREDO =  process.env.SEGREDO
connect()

//Para autorizar através do token diversos endpoints, é só inserir como função de Middleweare
const estaAutenticado = (request, response, next) => {
  const authHeader = request.get('authorization')
  //Retorna o <Bearer + token>, para ser mais seguro.
  let autenticado = false

if (!authHeader) {
  return response.status(401).send('Você precisa fazer login!')
}

const token = authHeader.split(' ')[1]

jwt.verify(token, CHAVE_PRIVADA, (error, decoded) => { //decoded é o payload
  if (error) {
    autenticado = false
  } else {
    if(decoded == 'user'){
      autenticado = true
    } else {
    autenticado = false
    }
  }
})

if (!autenticado) {
  return response.status(403).send('Acesso negado')
}
next()
}

const autenticarAdmin = (request, response, next) => {
  const authHeader = request.get('authorization')
  let autenticado = false

if (!authHeader) {
  return response.status(401).send('Você precisa fazer login!')
}

const token = authHeader.split(' ')[1]

jwt.verify(token, CHAVE_PRIVADA, (error, decoded) => {
  if (error) {
    autenticado = false
  } else {
    if(decoded == 'admin'){
      autenticado = true
    } else {
    autenticado = false
    }
  }
})

if (!autenticado) {
  return response.status(403).send('Acesso negado')
}
next()
}

const calcularNivel = (inicio, fim, nivelAtual) => {
  const diff = Math.abs(new Date(inicio) - new Date(fim)) / 3600000

  return (diff / 4) + nivelAtual;
}

const montarPokemonUpdateBody = async (body) => {
  let setBody = {}

  if (body.nome) {
    setBody['pokemons.$.nome'] = body.nome
  }

  if (body.foto) {
    setBody['pokemons.$.foto'] = body.foto
  }

  return (
    {
      $set: setBody
    }
  )
}

const getAll = (request, response) => {
  treinadoresModel.find((error, treinadores) => {
    if (error) {
      return response.status(500).send(error)
    }

    return response.status(200).send(treinadores)
  })
}

const getById = (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const id = request.params.id

  return treinadoresModel.findById(id, (error, treinador) => {
    if (error) {
      return response.status(500).send(error)
    }

    if (treinador) {
      return response.status(200).send(treinador)
    }

    return response.status(404).send('Treinador não encontrado.')
  })
}

const add = (request, response) => {
  const senhaCriptografada = bcrypt.hashSync(request.body.senha)
  request.body.senha = senhaCriptografada
  request.body.grupo = 'user' //Atribui o valor do grupo para o usuário
  const novoTreinador = new treinadoresModel(request.body)

  novoTreinador.save((error) => {
    if (error) {
      return response.status(500).send(error)
    }

    return response.status(201).send(novoTreinador)
  })
}

const addAdmin = (request, response) => {
  const senhaCriptografada = bcrypt.hashSync(request.body.senha)
  request.body.senha = senhaCriptografada
  request.body.grupo = 'admin' //Atribui o valor do grupo para o usuário
  const novoTreinador = new treinadoresModel(request.body)

  novoTreinador.save((error) => {
    if (error) {
      return response.status(500).send(error)
    }

    return response.status(201).send(novoTreinador)
  })
}

const remove = (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const id = request.params.id

  treinadoresModel.findByIdAndDelete(id, (error, treinador) => {
    if (error) {
      return response.status(500).send(error)
    }

    if (treinador) {
      return response.status(200).send(id)
    }

    return response.status(404).send('Treinador não encontrado.')
  })
}

const update = (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const id = request.params.id
  const treinadorUpdate = request.body
  const options = { new: true }

  treinadoresModel.findByIdAndUpdate(
    id,
    treinadorUpdate,
    options,
    (error, treinador) => {
      if (error) {
        return response.status(500).send(error)
      }

      if (treinador) {
        return response.status(200).send(treinador)
      }

      return response.status(404).send('Treinador não encontrado.')
    }
  )
}

const addPokemon = async (request, response) => {
  const treinadorId = request.params.treinadorId
  const pokemon = request.body
  const options = { new: true }
  const novoPokemon = new pokemonsModel(pokemon)
  const treinador = await treinadoresModel.findById(treinadorId)

  treinador.pokemons.push(novoPokemon)
  treinador.save((error) => {
    if (error) {
      return response.status(500).send(error)
    }

    return response.status(201).send(treinador)
  })
}

const treinarPokemon = async (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const pokemonId = request.params.pokemonId
  const treinadorId = request.params.treinadorId
  const treinador = await treinadoresModel.findById(treinadorId)
  const pokemon = treinador.pokemons.find(pokemon => pokemon._id == pokemonId)

  pokemon.nivel = calcularNivel(request.body.inicio, request.body.fim, pokemon.nivel)

  return treinador.save((error) => {
    if (error) {
      return response.status(500).send(error)
    }

    return response.status(200).send(treinador)
  })
}

const getPokemons = async (request, response) => {
  const treinadorId = request.params.id
  await treinadoresModel.findById(treinadorId, (error, treinador) => {
    if (error) {
      return response.status(500).send(error)
    }

    if (treinador) {
      return response.status(200).send(treinador.pokemons)
    }

    return response.status(404).send('Treinador não encontrado.')
  })
}

const updatePokemon = async (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const treinadorId = request.params.treinadorId
  const pokemonId = request.params.pokemonId
  const options = { new: true }
  const updateBody = await montarPokemonUpdateBody(request.body)

  treinadoresModel.findOneAndUpdate(
    { _id: treinadorId, 'pokemons._id': pokemonId },
    updateBody,
    options,
    (error, treinador) => {
      if (error) {
        return response.status(500).send(error)
      }

      if (treinador) {
        return response.status(200).send(treinador)
      }

      return response.status(404).send('Treinador não encontrado.')
    }
  )
}

const getPokemonById = async (request, response) => {
  if(!estaAutenticado(request)) {
    return response.status(401).send('Acesso negado')
  }
  const treinadorId = request.params.treinadorId
  const pokemonId = request.params.pokemonId
  const treinador = await treinadoresModel.findById(treinadorId)
  const pokemon = treinador.pokemons.find(pokemon => pokemon._id == pokemonId)

  return response.status(200).send(pokemon)
}

const login = async (request, response) => {
  const treinadorEncontrado = await treinadoresModel.findOne({ email: request.body.email })

  if (treinadorEncontrado) {
    const senhaCorreta = bcrypt.compareSync(request.body.senha, treinadorEncontrado.senha)

    if (senhaCorreta) {
      const token = jwt.sign(
        {
         grupo: treinadorEncontrado.grupo
        },
        CHAVE_PRIVADA,
        { expiresIn: 6000 }
      )

      return response.status(200).send({ token })
    }

    return response.status(401).send('Senha incorreta.')
  }

  return response.status(404).send('Treinador não encontrado.')
}

module.exports = {
  getAll,
  getById,
  add,
  addAdmin,
  remove,
  update,
  addPokemon,
  treinarPokemon,
  getPokemons,
  updatePokemon,
  getPokemonById,
  login
}