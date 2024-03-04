import { exit } from 'node:process'
import categorias from './categorias.js'
import db from '../config/db.js'
import precios from './precios.js'
import usuarios from './usuarios.js'
import { Categoria, Precio, Usuario} from '../models/index.js'

const importarDatos = async() => {
    try{
        //Autenticar 
        await db.authenticate();

        //Generar las Columnas
        await db.sync();

        //Insertamos los datos. BulkCreate inserta los datos. Con este enfoque ambos corren al mismo tiempo
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ])
            
        console.log('Datos Importados Correctamente');
        exit();

    }catch(e){
        console.log(e);
        exit(1);
    }

}

// Eliminar registros de BD
const eliminarDatos = async () =>{
    try{
        /* TRUNCATE a las tablas
        await Promise.all([
            Categoria.destroy({where: {}, truncate: true}),
            Precio.destroy({where: {}, truncate: true})
        ])*/

        //este otro es un DROP
        await db.sync({force: true })
        console.log('Datos eliminados correctamente');
        exit(1);
    }catch(e){
        console.log(e);
        exit(1);
    }
}



/*proceso interno de Node. argv es para para argumentos desde la terminal
 el [2] es porque en el package.json esa es la posicion del proceso que llama a i*/
if(process.argv[2] == "-i"){
    importarDatos();
}


//llamado de eliminarDatos()
if(process.argv[2] == "-e"){
    eliminarDatos();
}