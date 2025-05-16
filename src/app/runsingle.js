const getworkitems = require('../services/getworkitems.js'); // Import the getworkitems module
const neo4j = require('../db/neo4j.js');

const args = process.argv.slice(2);      // tar bort första två poster (node-exe och skriptets sökväg)
const firstArg = args[0];                // första argumentet
if (!firstArg) {
  console.error('Argument is missing. Please provide a valid argument.\nUsage: node run.js <argument>');
  process.exit(1);
}

(async () => {
    console.log(`Starting download from root work item ID: ${firstArg}`);
    try {
        const results = await getworkitems.fetchWorkItems(firstArg);
        process.stdout.write('\n');
        console.log(`Download complete. Fetched ${results.length} work items.`);

        // Insert result into Neo4j
        neo4j.executeWorkItems(results).then(() => {
            console.log('Data inserted into Neo4j');
        });
        
    } catch (error) {
        console.error('Error fetching work items:', error);
    }
})();