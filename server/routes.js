// Routes.js - Módulo de rutas
var express = require("express");
var router = express.Router();

const mensajes = [
  {
    _id: "XXX",
    user: "spiderman",
    mensaje: "Hola Mundo",
  },
  {
    _id: "XXX",
    user: "ironman",
    mensaje: "Hola Mundo",
  },
  {
    _id: "XXX",
    user: "hulk",
    mensaje: "Hola Mundo",
  },
];

// Get mensajes
router.get("/", function (req, res) {
  return res.json(mensajes);
});

router.post("/", (req,res)=>{

  const mensaje = {
    _id:"XXX",
    mensaje:req.body.mensaje,
    user:req.body.user
  }
  mensajes.push(mensaje)
  return res.json({ok:true,mensaje})

})

module.exports = router;
