//se importan todos los modelos por el filtro en la página INDEX
import { Propiedad, Precio, Categoria } from '../models/index.js'



const propiedades = async (req, res) => {

    const propiedades= await Propiedad.findAll({
        include: [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'}
        ]
    })

    res.json(propiedades)
}


export {
    propiedades
}