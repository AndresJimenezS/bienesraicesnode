import { check, validationResult} from 'express-validator';
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js';
import {generarId, generarJWT} from '../helpers/tokens.js'
import{ emailRegistro, emailOlvidePassword } from '../helpers/emails.js' 


const formularioLogin = (req, res) =>{
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    });
}

const autenticar = async (req, res) => {
    //Validar datos de usuario
    await check('email').isEmail().withMessage('El Email es Obligatorio').run(req);
    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req);
    
    let resultado = validationResult(req);

    //verificar que resultado no esté vacío
    if(!resultado.isEmpty()){
        //Errores
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  resultado.array()
        });
    }

    //Comprobar si el Usuario existe
    const {email, password} = req.body;

    const usuario = await Usuario.findOne({ where: {email}});
    if(!usuario){
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  [{ msg: 'El usuario No Existe'}]
        });
    }

    //Comprobar si el usuario está confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  [{ msg: 'Tu cuenta No Ha Sido Confirmada'}]
        });
    }

    //Revisar el Password utilizando el prototype creado
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina : 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  [{ msg: 'El Password Es Incorrecto'}]
        });
    }

    //Autenticar al usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });
    
    //Almacenar en Cookies
    return res.cookie('_token', token, {
        httpOnly: true
        //secure: true,
        //sameSite: true
    }).redirect('/mis-propiedades');

}

// Cerrar sesión
const cerrarSesion = (req,res) => {
    return res.clearCookie('_token').status(200).redirect('/');
}


const formularioRegistro = (req, res) =>{
    res.render('auth/registro', {
        pagina : 'Crear cuenta',
        //token url generado antes de enviar formularios
        csrfToken: req.csrfToken()
    });
}

//registro nuevo usuario
const registrar = async (req, res)=> {
    //Validacion usando express validator
    await check('nombre').notEmpty().withMessage('El nombre es obligatorio').run(req);
    await check('email').isEmail().withMessage('Eso no parece un email').run(req);
    await check('password').isLength({min : 6}).withMessage('El Password debe ser de al menos 6 caracteres').run(req);
    await check('repetir').equals(req.body.password).withMessage('Los passwords no son iguales').run(req);

    //segundo metodo de validator(check, validationResult)
    let resultado = validationResult(req);

    //verificar que resultado no esté vacío
    if(!resultado.isEmpty()){
        //Errores
        return res.render('auth/registro', {
            pagina : 'Crear cuenta',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email

            }
        });
    }

    //extraer los datos
    const{ nombre, email, password} = req.body;


    //Verificar que el usuario no esté creado
    const existeUsuario = await Usuario.findOne({ where: { email }})
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina : 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario ya está Registrado'}], 
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        });   
    }

    //Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Envia EMAIL de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmación
    res.render('templates/mensajes', {
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmación, presiona en el enlace'
    })

}

const formularioOlvidePassword = (req, res) =>{
    res.render('auth/olvide-password', {
        pagina : 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    });
}

const resetPassword = async (req, res) => {
    await check('email').isEmail().withMessage('Eso no parece un email').run(req);

    //segundo metodo de validator(check, validationResult)
    let resultado = validationResult(req);

    //verificar que resultado no esté vacío
    if(!resultado.isEmpty()){
        //Errores
        return res.render('auth/olvide-password', {
            pagina : 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        });
    }

    //Buscar el usuario
    const { email } = req.body;

    const usuario = await Usuario.findOne( { where: {email}});
    if(!usuario){
            return res.render('auth/olvide-password', {
            pagina : 'Recupera tu acceso a Bienes Raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El email no pertenece a ningún usuario'}]
        });
    }

    //Generar TOKEN y enviar el email
    usuario.token= generarId();
    await usuario.save();

    //Enviar EMAIL
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    });

    //Mostrar mensaje de confimación
    res.render('templates/mensajes', {
        pagina : 'Restablece tu Password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    });

}

//funcion comprueba cuenta
const confirmar = async (req, res) => {

    //.params para leer variables del routing dinámico
    const { token } = req.params;

    //verificar si el token es válido
    const usuario = await Usuario.findOne({ where: {token}});

    if(!usuario){
        return res.render('auth/confirmar-cuenta' , {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intente de nuevo',
            error: true
        })
    }

    //Confirmar cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    return res.render('auth/confirmar-cuenta' , {
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmó correctamente'
    })
}

const comprobarToken = async (req,res) => {
    const { token } = req.params;

    const usuario = await Usuario.findOne({where: {token}});

    if(!usuario){
        return res.render('auth/confirmar-cuenta' , {
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu información, intente de nuevo',
            error: true
        })
    }

    //Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Reestablece tu Password',
        csrfToken: req.csrfToken()
    })


}

const nuevoPassword = async (req,res) => {
    //Validar el password
    await check('password').isLength({min : 6}).withMessage('El Password debe ser de al menos 6 caracteres').run(req);

    //segundo metodo de validator(check, validationResult)
    let resultado = validationResult(req);

    //verificar que resultado no esté vacío
    if(!resultado.isEmpty()){
        //Errores
        return res.render('auth/reset-password', {
            pagina : 'Restablece Tu Password',
            csrfToken: req.csrfToken(),
            //retorna un arreglo de objetos, dentro vienen los mensajes de los errores
            errores:  resultado.array()
        });
    }

    const { token } = req.params;
    const { password } = req.body;

    //Identificar quién hace el cambio
    const usuario = await Usuario.findOne({ where: {token}});

    //Hashear el nuevo password
    const salt= await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash( password, salt); 
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardó correctamente'
    })
    
}


export {
    formularioLogin,
    formularioRegistro,
    formularioOlvidePassword,
    registrar,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    autenticar,
    cerrarSesion
}