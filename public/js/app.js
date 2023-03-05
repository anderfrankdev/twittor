
var url = window.location.href;
var swLocation = "/twittor/sw.js";
const api = url.includes("localhost") 
  ? "http://localhost:3000/api" 
  : "api";

const generateSuscription = async (registration) => {
  const key = await fetch(api+'/key')
    .then(res=>res.arrayBuffer())
    .then(key=> new Uint8Array(key))
    
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly:true,
    applicationServerKey: key
  })
  .then(res=>res.toJSON())
  .catch(err=>window.location.reload())

  return subscription
}

const sendSuscription = (subscription) => fetch(api+'/subscribe',{
  method:'POST',
  headers:{
    'Content-Type':'application/json'
  },
  body:JSON.stringify(subscription)
})
.then(res=>res.json())
.catch(err=>{

  return false
})

const subscribeNotications = async (registration) => {
  const subscription = await generateSuscription(registration)
  const serverResponse = await sendSuscription(subscription)

  if(!serverResponse){
    return registration.pushManager.getSubscription().then(sub=>{
      sub.unsubscribe()
    })
  }

  return serverResponse
}

window.addEventListener('load',async (e)=>{

  if (!navigator.serviceWorker) return

  if (url.includes("localhost")) {
    swLocation = "/sw.js";
  }

  const registration = await navigator
    .serviceWorker
    .register(swLocation);

  await registration.pushManager.getSubscription()

  if(!window.Notification) return

  if(Notification.permission==='granted'){
    
    const serverResponse = await subscribeNotications(registration)
    console.log(serverResponse)

    return     
  }

  Notification.requestPermission(async permission=>{
    if(Notification.permission!='granted') return

    const serverResponse = await subscribeNotications(registration)
    console.log(serverResponse)

    return
  })

});


// Referencias de jQuery

var titulo = $("#titulo");
var nuevoBtn = $("#nuevo-btn");
var salirBtn = $("#salir-btn");
var cancelarBtn = $("#cancel-btn");
var postBtn = $("#post-btn");
var avatarSel = $("#seleccion");
var timeline = $("#timeline");

var modal = $("#modal");
var modalAvatar = $("#modal-avatar");
var avatarBtns = $(".seleccion-avatar");
var txtMensaje = $("#txtMensaje");

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;

// ===== Codigo de la aplicaciÃ³n

function crearMensajeHTML(mensaje, personaje) {
  var content = `
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${personaje}.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${personaje}</h3>
                <br/>
                ${mensaje}
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

  timeline.prepend(content);
  cancelarBtn.click();
}

// Globals
function logIn(ingreso) {
  if (ingreso) {
    nuevoBtn.removeClass("oculto");
    salirBtn.removeClass("oculto");
    timeline.removeClass("oculto");
    avatarSel.addClass("oculto");
    modalAvatar.attr("src", "img/avatars/" + usuario + ".jpg");
  } else {
    nuevoBtn.addClass("oculto");
    salirBtn.addClass("oculto");
    timeline.addClass("oculto");
    avatarSel.removeClass("oculto");

    titulo.text("Seleccione Personaje");
  }
}

// Seleccion de personaje
avatarBtns.on("click", function () {
  usuario = $(this).data("user");

  titulo.text("@" + usuario);

  logIn(true);
});

// Boton de salir
salirBtn.on("click", function () {
  logIn(false);
});

// Boton de nuevo mensaje
nuevoBtn.on("click", function () {
  modal.removeClass("oculto");
  modal.animate(
    {
      marginTop: "-=1000px",
      opacity: 1,
    },
    200
  );
});

// Boton de cancelar mensaje
cancelarBtn.on("click", function () {
  if (!modal.hasClass("oculto")) {
    modal.animate(
      {
        marginTop: "+=1000px",
        opacity: 0,
      },
      200,
      function () {
        modal.addClass("oculto");
        txtMensaje.val("");
      }
    );
  }
});



// Boton de enviar mensaje
postBtn.on("click", async function () {
  var mensaje = txtMensaje.val();
  if (mensaje.length === 0) {
    cancelarBtn.click();
    return;
  }

  const data = {
    mensaje,
    user:usuario
  }

  const res = await fetch(api,{
    method:'POST',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify(data)
  }).then(res => res.ok ? res.json() : res)

  if(res.ok) return crearMensajeHTML(mensaje, usuario);
  if(res.statusText==="savedInDb"){ 
    return crearMensajeHTML(mensaje, usuario)
  }

});

const getMessages = async () => {
  
  try{
    const res = await fetch(api)
  
    const posts = await res.json() 
    
    posts.forEach((post) => {
      crearMensajeHTML(post.mensaje, post.user);
    });

  }catch(err){

  } 
};
getMessages();

const isOnlinePresenter = (e) => {
  if(navigator.onLine) {
    return console.log('Online')
  }
  console.log('Offline')
}

window.addEventListener('online',isOnlinePresenter)
window.addEventListener('offline',isOnlinePresenter)

const createNotification = (body)=>{
  const opts = {
    body,
    icon:"/img/icons/icon-72x72.png",
    actions:[]
  }
  const n = new Notification('Hola',opts)

  n.onclick = () => console.log('Click')
}

fetch(api+"/push",{
  method:"POST",
  headers:{
    'Content-Type':'application/json'
  },
  body:JSON.stringify({

    data:{
      user:'thor',
      body:'Quiero comer chocolate',
      title:'Antojo'
    }

  })
})
.then(res=>res.json())
.then(console.log)