const express = require('express');
const router = express.Router();

const controller = require("../controllers/TreinadoresController")

router.get('', autenticar, controller.getAll)
router.post('', autenticarAdmin, controller.add)
router.post('/admin', controller.addAdmin)
router.get('/:id', autenticar, controller.getById)
router.patch('/:id', autenticar, controller.update)
router.delete('/:id', autenticar, controller.remove)
router.post('/:treinadorId/pokemons', autenticar, controller.addPokemon)
router.patch('/:treinadorId/pokemons/:pokemonId/treinar', autenticar, controller.treinarPokemon)
router.get('/:treinadorId/pokemons/:pokemonId', autenticar, controller.getPokemonById)
router.patch('/:treinadorId/pokemons/:pokemonId', autenticar, controller.updatePokemon)
router.post('/login', controller.login)

module.exports = router