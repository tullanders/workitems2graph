var neo4j = require('neo4j-driver');
const cypher = require('./cypher.js');
require('dotenv').config();

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

const executeReadQuery = async (query, params) => {

    let driver
    try {
        driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        //return await driver.executeQuery(query, params)

        const session = driver.session();
        try {
          const result = await session.executeRead(async tx => {
            return await tx.run(query, params)
          })
          return result.records.map(record => {
            let json;
            try {
              json = JSON.parse(record.get(0))
            }
            catch (e) {
              json = record
            }
            return json;
          });
        } finally {
          await session.close()
        }


    } catch(err) {
        console.log(`Error executing query\n${err}\nCause: ${err.cause}`)
    } finally {
        await driver.close()
    }
}
const executeWriteQuery = async (query, params) => {


    let driver
    try {
        driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        //return await driver.executeQuery(query, params)

        const session = driver.session();
        try {
          const result = await session.executeWrite(async tx => {
            return await tx.run(query, params)
          })
          return result
          /*return result.records.map(record => {
            let json;
            try {
              json = JSON.parse(record.get(0))
            }
            catch (e) {
              json = record
            }
            return json;
          });*/
        } finally {
          await session.close()
        }


    } catch(err) {
        console.log(`Error executing query\n${err}\nCause: ${err.cause}`)
    } finally {
        await driver.close()
    }
}

const executeWorkItems = async (params) => {
  executeWriteQuery(cypher, {param: params})
    .then(result => {
        return result;
    })
    .catch(err => {
        console.error('Error:', err);
    });
}

module.exports = {
    executeReadQuery,
    executeWriteQuery,
    executeWorkItems
};