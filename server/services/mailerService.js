// services/mailerService.js
// Service pour l'envoi de mails (reset password avec nodemailer)
const nodemailer = require('nodemailer');

// Créer un transporteur pour envoyer des mails avec gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAILER_USER, // Email dédié
        pass: process.env.MAILER_PASSWORD, // Mot de passe du compte Gmail
    },
});

/**
 * Envoyer un mail pour réinitialiser le mot de passe
 * @param {*} email - Email de l'utilisateur
 * @param {*} resetLink - Lien de réinitialisation du mot de passe
 */
exports.sendPasswordReset = async (email, resetLink) => {
    const mailOptions = {
        from: process.env.MAILER_USER,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Cliquez sur le lien suivant pour réinitialiser votre mot de passe : ${resetLink}`,
        html: `<p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
           <a href="${resetLink}">${resetLink}</a>`,
    };

    console.warn('User:', process.env.MAILER_USER);
    console.warn('Password:', process.env.MAILER_PASSWORD);

    await transporter.sendMail(mailOptions);
};
