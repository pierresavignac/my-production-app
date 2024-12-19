import { config as dotenvConfig } from 'dotenv';
import FtpDeploy from 'ftp-deploy';

dotenvConfig();
const ftpDeploy = new FtpDeploy();

// Logs de déploiement
ftpDeploy.on("uploading", function(data) {
    console.log(`Uploading: ${data.totalFilesCount} files, transfer ${data.transferredFileCount} / ${data.totalFilesCount}`);
});

ftpDeploy.on("uploaded", function(data) {
    console.log(`Uploaded: ${data.filename}`);
});

// Configuration du déploiement front-end
const ftpConfig = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    host: process.env.FTP_HOST,
    port: 21,
    localRoot: new URL('.', import.meta.url).pathname + 'dist',
    remoteRoot: process.env.FTP_PATH,
    include: ['*', '**/*'],
    exclude: [
        'node_modules/**',
        '.git/**'
    ],
    deleteRemote: false,
    forcePasv: true
};

// Déploiement
console.log('Déploiement du front-end...');
ftpDeploy.deploy(ftpConfig)
    .then(res => console.log('Déploiement terminé!'))
    .catch(err => {
        console.error('Erreur:', err);
        process.exit(1);
    });
