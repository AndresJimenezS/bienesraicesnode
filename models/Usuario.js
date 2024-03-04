import {DataTypes} from 'sequelize'
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const Usuario = db.define('usuarios', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: DataTypes.STRING,

    confirmado: DataTypes.BOOLEAN
}, {   
    //hooks: funciones en modelos
    hooks: {
        beforeCreate: async function (usuario){
            const salt= await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(usuario.password, salt);
        }
    },
    //scopes: funcion para eliminar atributos mostrados al realizar consultas
    scopes: {
        eliminarPassword: {
            attributes: {
                exclude: ['password', 'token', 'confirmado', 'createdAt', 'updatedAt']
            }
        }
    }
});

//Metodos Personalizados
Usuario.prototype.verificarPassword = function(password) {
    /*comparar texto plano con password en base de datos el primer parametro es
     el ingresado por el usuario y el segundo el de la base de datos*/
    return bcrypt.compareSync(password, this.password);
}


export default Usuario;