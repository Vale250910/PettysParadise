const express = require("express")
const router = express.Router()
const authenticateToken = require("../middlewares/authenticateToken")
const {
  verificarPropietario,
  verificarAdministrador,
  verificarVeterinario,
} = require("../controladores.js/roles_control")

console.log("=== CONFIGURANDO RUTAS DE ROLES ===")

router.get(
  "/verificar-propietario",
  (req, res, next) => {
    console.log("Ruta verificar-propietario llamada")
    next()
  },
  authenticateToken,
  verificarPropietario,
)

router.get(
  "/verificar-administrador",
  (req, res, next) => {
    console.log("Ruta verificar-administrador llamada")
    next()
  },
  authenticateToken,
  verificarAdministrador,
)

router.get(
  "/verificar-veterinario",
  (req, res, next) => {
    console.log("Ruta verificar-veterinario llamada")
    next()
  },
  authenticateToken,
  verificarVeterinario,
)

console.log("Rutas de roles configuradas correctamente")

module.exports = router

