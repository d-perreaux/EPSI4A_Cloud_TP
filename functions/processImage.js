const functions = require('@google-cloud/functions-framework');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { getConnection} = require('../db/connection');


functions.cloudEvent('processImage', async(cloudEvent) => {
    const vision = new ImageAnnotatorClient();
    const file = cloudEvent.data;
  
    const bucketName = file.bucket;
    const fileName = file.name;
  
    const connection = await getConnection();
  
    const [result] = await vision.labelDetection(`gs://${bucketName}/${fileName}`);
    const labels = result.labelAnnotations.map(label => label.description);
    connection.execute("UPDATE photos SET tags = ? WHERE name = ? ", [JSON.stringify(labels), fileName])
})