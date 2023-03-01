const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

const publicPath = path.resolve(__dirname, "../public");
const port = process.env.PORT || 3000;

// Directorio Público
app.use(express.static(publicPath));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Rutas
const routes = require("./routes");
app.use("/api", routes);

app.listen(port, (err) => {
  if (err) throw new Error(err);

  console.log(`Servidor corriendo en puerto ${port}`);
});
