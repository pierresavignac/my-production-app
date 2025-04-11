import FtpDeploy from 'ftp-deploy';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ftpDeploy = new FtpDeploy();

const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    host: process.env.FTP_HOST,
    port: 21,
    localRoot: join(__dirname, 'dist'),
    remoteRoot: process.env.FTP_PATH,
    include: ['*', '**/*'],
    exclude: ['**/*.map'],
    deleteRemote: false,
    forcePasv: true
};

ftpDeploy.deploy(config)
    .then(res => console.log('Déploiement terminé:', res))
    .catch(err => console.log('Erreur de déploiement:', err));
