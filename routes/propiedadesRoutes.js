import express from 'express'
import { admin, crear, guardar, agregarImagen, almacenarImagen, editar,
guardarCambios, eliminar, cambiarEstado, mostrarPropiedad, enviarMensaje, verMensajes } from '../controllers/propiedadController.js'
import { body } from 'express-validator' 
import protegerRuta from '../middleware/protegerRuta.js'
import upload from '../middleware/subirImagen.js'
import identificarUsuario from '../middleware/identificarUsuario.js'

//Router
const router = express.Router();

router.get('/mis-propiedades', protegerRuta, admin)

router.get('/propiedades/crear', crear)

router.post('/propiedades/crear', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La descripción no puede ir vacía')
        .isLength({ max: 200 }).withMessage('La Descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una categoría'),
    body('precio').isNumeric().withMessage('Selecciona un rango de Precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardar

)

router.get('/propiedades/agregar-imagen/:id', protegerRuta, agregarImagen)


router.post('/propiedades/agregar-imagen/:id', 
    protegerRuta,
    //Subida de imagenes con Multer
    upload.single('imagen'),
    almacenarImagen
)

router.get('/propiedades/editar/:id' , protegerRuta, editar)

//Validar Edición
router.post('/propiedades/editar/:id', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El Titulo del Anuncio es Obligatorio'),
    body('descripcion')
        .notEmpty().withMessage('La descripción no puede ir vacía')
        .isLength({ max: 200 }).withMessage('La Descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una categoría'),
    body('precio').isNumeric().withMessage('Selecciona un rango de Precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona la cantidad de baños'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardarCambios
)


router.post('/propiedades/eliminar/:id', 
    protegerRuta,
    eliminar
)

//Cambiar booleano publicado
router.put('/propiedades/:id', 
    protegerRuta,
    cambiarEstado
)


// Área Pública
router.get('/propiedad/:id', 
    identificarUsuario,
    mostrarPropiedad
)


// Almacenar los mensajes enviados
router.post('/propiedad/:id', 
    identificarUsuario,
    body('mensaje').isLength({min: 10}).withMessage('El mensaje no puede ir vacío o es muy corto'),
    enviarMensaje
)


router.get('/mensajes/:id',
    protegerRuta,
    verMensajes
)


export default router;