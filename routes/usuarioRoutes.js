import express from 'express';
import{formularioLogin, cerrarSesion, formularioRegistro, formularioOlvidePassword, registrar, confirmar, resetPassword, comprobarToken, nuevoPassword, autenticar} 
from '../controllers/usuarioController.js'

//crear app
const router = express.Router();

//Routing
router.get('/login', formularioLogin);
router.post('/login', autenticar);

// cerrar sesión
router.post('/cerrar-sesion', cerrarSesion)

router.get('/registro', formularioRegistro);

router.post('/registro', registrar);

router.get('/olvide-password', formularioOlvidePassword);

router.get('/confirmar/:token', confirmar);

router.post('/olvide-password', resetPassword );

//Almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken);
router.post('/olvide-password/:token', nuevoPassword);


export default router;