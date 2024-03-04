import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
//importo el index que tiene las relaciones
import { Precio, Categoria, Propiedad, Mensaje, Usuario} from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) =>{

    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    // Leer Query String para url
    const { pagina: paginaActual } = req.query;

    //Expresion regular
    const expresion = /^[1-9]$/

    if(!expresion.test(paginaActual)){
        return res.redirect('/mis-propiedades?pagina=1');
    }

    try {
        //Limites y Offset(saltar registros) para paginador
        const limit = 5;
        const offset = ((paginaActual * limit) - limit);

        const { id } = req.usuario;
        //envío de propiedades según usuario autenticado
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({ 
                limit,
                offset,
                where: {
                    usuarioId: id
                },
                //es como un INNER JOIN, porque traerá los datos de la tabla relacionada
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }

                ]
            }), 
            Propiedad.count({
                where:{
                    usuarioId: id
                }
            })    
        ])

        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit,
            flag
        });

    } catch (error) {
        console.log(error);
    }

    
}

//Formulario para crear una nueva vista
const crear = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    //Consultar Modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina:'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {},
        flag
    })
}

// Generar nuevas Propiedades
const guardar = async (req,res) => {

    //Validacion
    let resultado = validationResult(req);

    if(!resultado.isEmpty()){
        //Consultar Modelo de Precio y Categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear',{
            pagina:'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    // Crear Registro
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio, categoria: categoriaId } = req.body;

    const { id: usuarioId } = req.usuario

    try{
        const propiedadGuardada = await Propiedad.create({
            //como tienen el mismo nombre(variable y req.body.titulo) puedo poner solamente uno (titulo: titulo)
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId: precio,
            categoriaId,
            usuarioId,
            imagen: ''            
        })

        const { id } = propiedadGuardada;

        res.redirect(`/propiedades/agregar-imagen/${id}`)

    }catch(error){
        console.log(e);
    }

}


const agregarImagen = async (req,res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad no esté publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad pertenecea quien visita esta página
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades');
    }


    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad,
        flag
    })
}

//Almacenar en BD
const almacenarImagen = async (req, res, next) =>{
    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad no esté publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades');
    }

    //Validar que la propiedad pertenecea quien visita esta página
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades');
    }

    try{
        //console.log(req.file)

        /*Almacenar la imagen y publicar propiedad,
        req.file registro que Multer hace automáticamente*/
        propiedad.imagen = req.file.filename;
        propiedad.publicado = 1;

        await propiedad.save();

        //para que avance al siguiente middleware después de ejecutar el JavaScript event en dropzone
        next();

    }catch(e){
        console.log(e);
    }

}

const editar = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { id } = req.params;

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que quien visita la URL es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    //Consultar Modelo de Precio y Categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina:`Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos:  propiedad,
        flag
    })
}


const guardarCambios = async (req, res) => {

    //Verificar la validación
    let resultado = validationResult(req);

    if(!resultado.isEmpty()){
        //Consultar Modelo de Precio y Categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        res.render('propiedades/editar', {
            pagina:'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            //datos modificados
            datos:  req.body
        })
    }

    //Validar que la propiedad exista
    const { id } = req.params;

    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que quien visita la URL es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    //Reescribir el objeto y actualizarlo
    try{
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body;
        //lo almacena en memoria para actualizarlo
        propiedad.set({
            titulo,
            descripcion,
            habitaciones, 
            estacionamiento, 
            wc,
            calle,
            lat,
            lng, 
            precioId,
            categoriaId
        })

        await propiedad.save();

        res.redirect('/mis-propiedades');

    }catch(error){
        console.log(error);
    }

}

const eliminar = async (req, res) => {
    // Validar
    const { id } = req.params;

    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que quien visita la URL es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    //Eliminar la imagen (UNLINK es de Node)
    await unlink(`public/uploads/${propiedad.imagen}`);

    // Eliminar la propiedad
    await propiedad.destroy();
    res.redirect('/mis-propiedades');

}


// Modifica el estado(publicado/noPublicado)
const cambiarEstado = async (req, res) => {
    const { id } = req.params;

    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que quien visita la URL es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }

    //Actualizar
    propiedad.publicado = !propiedad.publicado;

    await propiedad.save();

    //respuesta json por estar usando una API
    res.json({
        resultado: true
    })
    
}


//Mostrar Propiedad en vista pública
const mostrarPropiedad = async (req,res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { id } = req.params;

    // Comprobar que la propiedad existe
    const propiedad = await Propiedad.findByPk(id, {
        //es como un INNER JOIN, porque traerá los datos de la tabla relacionada
        include: [
            { model: Categoria, as: 'categoria' },
            { model: Precio, as: 'precio' }
        ]
    });

    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404');
    }

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        flag
    })
}


const enviarMensaje = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la propiedad existe
    const propiedad = await Propiedad.findByPk(id, {
        //es como un INNER JOIN, porque traerá los datos de la tabla relacionada
        include: [
            { model: Categoria, as: 'categoria' },
            { model: Precio, as: 'precio' }
        ]
    });

    if(!propiedad){
        return res.redirect('/404');
    }
    
    //Renderizar los errores
    let resultado = validationResult(req);

    if(!resultado.isEmpty()){

        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }

    const { mensaje } = req.body;
    const { id: propiedadId } = req.params;
    const { id: usuarioId } = req.usuario;

    // Almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })

    res.redirect('/');

}


// Leer mensajes recibidos
const verMensajes = async (req, res) => {
    const {_token} = req.cookies;
    let flag= false;
    if(_token){
        flag = true;
    }

    const { id } = req.params;

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes',
                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            }
        ]
    });

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que quien visita la URL es quien creó la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ){
        return res.redirect('/mis-propiedades')
    }


    res.render('propiedades/mensajes', {
        pagina: 'Mensajes', 
        mensajes: propiedad.mensajes,
        formatearFecha,
        flag
    })
}

export{
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}