const listthemes = require('../services/listthemes.js');
const getworkitems = require('../services/getworkitems.js'); // Import the getworkitems module
const neo4j = require('../db/neo4j.js');


(async () => {

    const ids = await listthemes.listRecentThemes({ days: 10 })

        for (i = 0; i < ids.length; i++) {
            const id = ids[i];
            console.log(`Starting download from root work item ID: ${id}`);
            const results = await getworkitems.fetchWorkItems(id);
            process.stdout.write('\n');
            console.log(`Download complete. Fetched ${results.length} work items.`);

            // Insert result into Neo4j
            const result = await neo4j.executeWorkItems(results);
            console.log(`Inserted work items into Neo4j.`);
        }

})();