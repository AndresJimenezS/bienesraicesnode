import { Sequelize } from 'sequelize'
import { Precio, Categoria, Propiedad} from '../models/index.js'


const inicio = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const [ categorias, precios, casas, departamentos ] = await Promise.all([
        Categoria.findAll({raw: true}), //con raw trae unicamente id y nombre
        Precio.findAll({raw: true}),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 1
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 2
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        })
    ])


    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken(),
        flag
    })

}



const categoria = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { id } = req.params;

    //Comprobar que la categoria exista
    const categoria = await Categoria.findByPk(id)
    if(!categoria){
        res.redirect('/404');
    }

    //Obtener las propiedades de la categoria
    const propiedades = await Propiedad.findAll({
        where: {
            categoriaId: id
        },
        include: [
            {model: Precio, as: 'precio'}
        ]
    })

    res.render('categoria', {
        pagina: `${categoria.nombre}s en Venta`,
        propiedades,
        csrfToken: req.csrfToken(),
        flag
    })
}


const noEncontrado = (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    res.render('404', {
        pagina: 'No encontrada',
        csrfToken: req.csrfToken(),
        flag
    })
    
}


const buscador = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { termino } = req.body;

    // Validar que termino no esté vacio
    if(!termino.trim()){
        return res.redirect('back')
    }

    // Consultar propiedades
    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                //metodo sequelize. Con % busca al inicio y al final
                [ Sequelize.Op.like] : '%' + termino + '%'
            }
        },
        include: [
            { model: Precio, as: 'precio'}
        ]
    })


    res.render('busqueda', {
        pagina: 'Resultados de la Búsqueda',
        propiedades,
        csrfToken: req.csrfToken(),
        flag
    })

    
}


export {
    inicio,
    categoria,
    noEncontrado,
    buscador
}