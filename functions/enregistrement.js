const functions = require('@google-cloud/functions-framework');
const {Storage} = require('@google-cloud/storage');

const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

const { getConnection } = require('../db/connection');


functions.cloudEvent('Enregistrement', async (cloudEvent) => {
    const storage = new Storage();
    const destinationBucketName = 'tp-photo-public';
    const connection = await getConnection();
  
    const file = cloudEvent.data;
    const sourceBucketName = file.bucket;
    const fileName = file.name;
  
    console.log(`Traitement de : ${fileName} depuis ${sourceBucketName}`);
  
    const ext = path.extname(fileName).toLowerCase();
    if(!(ext === '.jpg' || ext === '.jpeg' || ext === '.png')){
      console.log(`Fichier ignoré : extension non supportée (${ext})`);
      return;
    }
  
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const newFileName = `${timestamp}.jpg`;
  
    const tempLocalPath = path.join(os.tmpdir(), path.basename(fileName));
    const tempResizedPath = path.join(os.tmpdir(), 'resized-' + path.basename(newFileName));
  
    try {
      await storage.bucket(sourceBucketName).file(fileName).download({destination: tempLocalPath});
      console.log(`Image téléchargée temporairement à ${tempLocalPath}`);
  
      await sharp(tempLocalPath)
        .resize({ width: 800 })
        .toFile(tempResizedPath);
      console.log(`Image redimensionnée à ${tempResizedPath}`);
  
      await storage.bucket(destinationBucketName).upload(tempResizedPath, {
        destination: newFileName,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      const publicUrl = `https://storage.googleapis.com/${destinationBucketName}/${newFileName}`;
      await connection.execute("INSERT INTO photos (name, url) VALUES (?, ?)", [newFileName, publicUrl]);
      console.log(`Image uploadée dans ${destinationBucketName}/${newFileName}`);
      await storage.bucket(sourceBucketName).file(fileName).delete();
  
    } catch (err) {
      console.error('Erreur durant le traitement de l’image :', err);
    } finally {
      // Nettoyage des fichiers temporaires
      await fs.unlink(tempLocalPath).catch(() => {});
      await fs.unlink(tempResizedPath).catch(() => {});
    }
  });