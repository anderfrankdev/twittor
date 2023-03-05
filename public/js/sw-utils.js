
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";
const INMUTABLE_CACHE = "inmutable-v1";

const api = "http://localhost:3000/api"

const APP_SHELL = [
  "/",
  "index.html",
  "img/favicon.ico",
  "img/avatars/hulk.jpg",
  "img/avatars/ironman.jpg",
  "img/avatars/spiderman.jpg",
  "img/avatars/thor.jpg",
  "img/avatars/wolverine.jpg",
  "js/app.js",
  "js/sw-utils.js",
];

const APP_SHELL_INMUTABLE = [
  "https://fonts.googleapis.com/css?family=Quicksand:300,400",
  "https://fonts.googleapis.com/css?family=Lato:400,300",
  "https://use.fontawesome.com/releases/v5.3.1/css/all.css",
  "https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css",
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js",
  "https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js"
];

const db = new PouchDB('mensajes');

// Guardar  en el cache dinamico
async function actualizaCacheDinamico({ DYNAMIC_CACHE, req }) {
  if (!req?.url) return;

  const fetchedFile = await fetch(req);

  if (!fetchedFile.ok) return fetchedFile;

  const dynamicCache = await caches.open(DYNAMIC_CACHE);

  dynamicCache.put(req, fetchedFile.clone());

  return fetchedFile.clone();
}

// Cache with network update
function actualizaCacheStatico({ STATIC_CACHE, req, APP_SHELL_INMUTABLE }) {
  if (!APP_SHELL_INMUTABLE.includes(req.url)) return;

  return actualizaCacheDinamico(STATIC_CACHE, req);
}

const installPresenter = (e) => {
  self.skipWaiting()
  const cacheStatic = caches
    .open(STATIC_CACHE)
    .then((cache) => cache.addAll(APP_SHELL));

  const cacheInmutable = caches
    .open(INMUTABLE_CACHE)
    .then((cache) => cache.addAll(APP_SHELL_INMUTABLE));

  e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
};

const postMessages = async () => {
  const posts = await db.allDocs({
      include_docs:true,
      descending:true
  })

  const promises = posts.rows.map( post =>{
    return fetch(api,{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify(post.doc)
    })
    .then(res=>res.json())
    .then(json=>db.remove(post.doc))

    
  })
  return Promise.all(promises)
}

const activatePresenter = (e) => {
  const respuesta = caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== STATIC_CACHE && key.includes("static")) {
        return caches.delete(key);
      }

      if (key !== DYNAMIC_CACHE && key.includes("dynamic")) {
        return caches.delete(key);
      }
    });
  });

  e.waitUntil(Promise.all([respuesta,postMessages()]));
};


const getPosts = async (e,cachedFile)=>{
  const posts = await fetch(e.request.clone())
    .catch(async (err) => {

      const savedDocs = await db.allDocs({
        include_docs:true,
        descending:true
      })
      const posts = savedDocs.rows.map(e=>e.doc)
      const blob = new Blob([JSON.stringify(posts)])

      const res = new Response(blob,{status:500});

      return res;
        
    });

  if (!posts.ok && cachedFile) return cachedFile;
  if (!posts.ok && !cachedFile){
    return posts.clone()
  };

  const dynamicCache = await caches.open(DYNAMIC_CACHE);

  dynamicCache.put(e.request, posts.clone());

  return posts.clone();
}

const postToIgnore = [
  "api/suscribe",
  "api/push"
]

const fetchResponse = async (e) => {

  if(e.request.method.toUpperCase()==='POST'){

    for (let i = postToIgnore.length; i--;) {
      if (e.request.url.includes(postToIgnore[i])) {
        console.log(e.request.url.includes(postToIgnore[i]))
        return fetch(e.request)
      }
    }

    const response = await fetch(e.request.clone())
      .catch(err=> new Response(new Blob(),{
        status:500,
        statusText: 'savedInDb'
      }));

    if(response.ok) return response.clone()
    
    if(self.registration.sync){
      
      const message =  await e.request.clone().json()

      message._id = new Date().toISOString();

      const result = await db.put(message)
      if(result) self.registration.sync.register('new-post')
    }
    
    return response.clone()
  }

  const updateDynamicArgs = {
    DYNAMIC_CACHE,
    req: e.request,
  };

  const cachedFile = await caches.match(e.request);

  if (e.request.url.includes("/api")) {
    
    return getPosts(e,cachedFile)

  }

  const updateStaticArgs = {
    STATIC_CACHE,
    APP_SHELL_INMUTABLE,
    req: e.request,
  };

  if (cachedFile) {
    actualizaCacheStatico(updateStaticArgs);

    return cachedFile;
  }

  return actualizaCacheDinamico(updateDynamicArgs);
};

const fetchPresenter = (e) => e.respondWith(fetchResponse(e));

const syncPresenter = e =>{ 
  console.log("SW:SYNC")
  console.log(e.tag)

  if(e.tag!="new-post") return;
  e.waitUntil(postMessages())

}

const pushPresenter = e => {
  console.log(e)
  const data = JSON.parse(e.data.text())
  const title = data.title
  const options = {
    body:data.body,
    icon:`img/avatars/${data.user}.jpg`,
    badge:'img/favicon.ico',
    vibrate:[125,75,125,275,200,275,125,75,125,275,200,600,200,600],
    openUrl:'/',
    actions:[
      {
        action:"thor-action",
        title:"Thor",
        icon:"img/avatar/thor.jpg"
      },
      {
        action:"ironman-action",
        title:"Ironman",
        icon:"img/avatar/ironman.jpg"
      }
    ]
  }

  e.waitUntil(
    self
    .registration
    .showNotification(title,options)
  )
}

const closeNotification = (e)=>console.log(e)

const clickNotification = (e)=>{
  const {action,notification} = e

  const response = clients.matchAll().then(clientsIn=>{
    let client = clientsIn.find( c => c.visibityState==='visible')

    if(client!==undefined){
      client.navigate(notification.data.url);
      client.focus();
      notification.close()
      return
    }

    client.openWindow(notification.data.url)
    notification.close()
  })

  e.waitUntil(response)

}

