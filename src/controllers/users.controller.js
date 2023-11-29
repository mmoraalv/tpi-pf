import crypto from 'crypto';
import { sendRecoveryEmail } from '../config/nodemailer.js';
import userModel from '../models/users.model.js';
import logger from '../utils/loggers.js';
import { createHash, validatePassword } from '../utils/bcrypt.js';
import 'dotenv/config'

const postUser = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(400).send({ mensaje: 'Usuario existente' });
		}
		res.status(200).send({ mensaje: 'Usuario creado' });
	} catch (error) {
		res.status(500).send({ mensaje: `Error al crear el usuario ${error}` });
	}
};

const getUser = async (req, res) => {
	try {
		const response = await userModel.find();
		res.status(200).send(response);
	} catch (error) {
		res.status(400).send({ error: `Error al consultar usuarios: ${error}` });
	}
};

const recoveryLinks = {};

const recoveryPassword = async (req, res) => {
    const { email } = req.body;

    try {
        //Verificacion de usuario existente
        const user = await userModel.findOne({ email });
        if (!user) {
            logger.error(`Usuario no encontrado: ${email}`);
            return res.status(400).send({ error: `Usuario no encontrado: ${email}` });
        }

        //Generacion de token
        const token = crypto.randomBytes(20).toString('hex');
        recoveryLinks[token] = { email, timestamp: Date.now() };

        //Envio de email
        const recoveryLink = `${process.env.RECOVERY_URL}${token}`;
        sendRecoveryEmail(email, recoveryLink);
        res.status(200).send({ resultado: 'OK', message: 'Email enviado correctamente' });
    } catch (error) {
        logger.error(`Error al enviar email: ${error}`);
        res.status(500).send({ error: `Error al enviar email de recuperacion: ${error}` });
    }
}

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const linkData = recoveryLinks[token];
        if (!linkData) {
            logger.error(`Token no encontrado: ${token}`);
            return res.status(400).send({ error: `Token no encontrado: ${token}` });
        }

        const now = Date.now();
        const tokenTimestamp = linkData.timestamp;
        const tokenAge = now - tokenTimestamp;

        if (tokenAge > process.env.TOKEN_EXPIRATION_TIME) {
            logger.error(`Token expirado: ${token}`);
            return res.status(400).send({ error: `Token expirado: ${token}` });
        }

        const { email } = linkData;

        try {
            const user = await userModel.findOne({ email });
            if (!user) {
                logger.error(`Usuario no encontrado: ${email}`);
                return res.status(400).send({ error: `Usuario no encontrado: ${email}` });
            }

            // Check if new password === password in database
            const isSamePassword = validatePassword(newPassword, user.password);
            if (isSamePassword) {
                logger.error(`La nueva contraseña no puede ser igual a la anterior`);
                return res.status(400).send({ error: `La nueva contraseña no puede ser igual a la anterior` });
            }

            // Update the users password in the database
            user.password = createHash(newPassword);
            await user.save();

            // Delete token
            delete recoveryLinks[token];
            logger.info(`Password actualizado correctamente para el usuario ${email}`);
            return res.status(200).send({ resultado: 'OK', message: 'Password actualizado correctamente' });
        } catch (error) {
            logger.error(`Error al modificar contraseña: ${error}`);
            return res.status(500).send({ error: `Error al modificar contraseña: ${error}` });
        }
    } catch (error) {
        logger.error(`Error al actualizar password: ${error}`);
        return res.status(500).send({ error: `Error al actualizar password: ${error}` });
    }
}

const usersController = { getUser, postUser, recoveryPassword, resetPassword };

export default usersController;