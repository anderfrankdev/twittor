// Routes.js - Módulo de rutas
var express = require("express");
var router = express.Router();
const pushPublicKey = require("../vapi.json").publicKey
const pushPrivateKey = require("../vapi.json").privateKey
const urlSafeBase64 = require("urlsafe-base64")
const webpush = require('web-push')

webpush.setVapidDetails(
  'mailto:anderfrankdev@gmail.com',
  pushPublicKey,
  pushPrivateKey
)

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

let suscriptions = []

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

router.post('/subscribe',(req,res)=>{

  const suscription = req.body

  suscriptions.push(suscription)  
  console.log(suscriptions)
  return res.json({ok:true,request:"suscribe"});

})

router.get('/key',(req,res)=>{
  return res.send(urlSafeBase64.decode(pushPublicKey)).end();
})

router.post('/push',(req,res)=>{
  const {data} = req.body
  suscriptions.forEach((sus,i)=>{
    webpush.sendNotification(sus,JSON.stringify(data))
    .catch(err=>{
      if(err.statusCode===410){
        suscriptions[i].delete = true
      }
    })
  })

  suscriptions = suscriptions.filter(suscription=>!suscription.delete)
  return res.json('key publico')
})



module.exports = router;
