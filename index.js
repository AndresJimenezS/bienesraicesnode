import express from 'express';
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

//crear app
const app = express();

//Habilitar lectura de datos de forms(todo menos archivos)
app.use( express.urlencoded({extend: true}));

//Habilitar Cookie Parser ()
app.use( cookieParser() );

//Habilitar CSRF
app.use( csrf({ cookie: true}) );

//Conexión a la base de datos
try{
    await db.authenticate();
    db.sync();
    console.log('Conexión correcta a la BASE DE DATOS');
}catch(error){
    console.log(error);
}

//Routing
//USE busca todas las rutas que inicien con esa diagonal
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes);
app.use('/', propiedadesRoutes);
app.use('/api', apiRoutes);


//Habilitar Pug
app.set('view engine', 'pug');
app.set('views', './views');

//Carpeta Pública
app.use(express.static('public'));


//Definir un puerto y levantar el proyecto
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`El servidor esta funcionando en el puerto ${port}`);
})