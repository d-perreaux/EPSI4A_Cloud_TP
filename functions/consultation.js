const functions = require('@google-cloud/functions-framework');
const { getConnection } = require('../db/connection');


functions.http('consultation', async(req, res) => {
    label = req.query.label;

    const connection = await getConnection();
    const query = "SELECT url FROM photos WHERE tags LIKE ?";
    const likeLabel = `%${label}%`;
    [results] = await connection.execute(query, [likeLabel]);
    console.log(results);
    res.json(results);
})
  