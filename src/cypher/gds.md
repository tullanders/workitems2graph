Här är ett komplett Cypher-skript som taggar noder i din `workitem-graph` med metadata baserat på resultaten från GDS-algoritmerna.

Det antas att `WorkItem`-noder har en unik egenskap som `id` eller `workItemId`. Du kan byta ut det om du använder något annat som identifierare.

---

## 🏷️ Cypher: Tagga noder med GDS-resultat

```cypher
// === PageRank-score till egenskap ===
CALL gds.pageRank.stream('workitem-graph')
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS n, score
SET n.pagerank = score;

// === Louvain-community till egenskap ===
CALL gds.louvain.stream('workitem-graph')
YIELD nodeId, communityId
WITH gds.util.asNode(nodeId) AS n, communityId
SET n.community = communityId;

// === WCC-komponent till egenskap ===
CALL gds.wcc.stream('workitem-graph')
YIELD nodeId, componentId
WITH gds.util.asNode(nodeId) AS n, componentId
SET n.component = componentId;

// === Link Prediction: skapa (valfria) föreslagna beroenderelationer ===
CALL gds.nodeSimilarity.stream('workitem-graph', {
  topK: 3,
  relationshipTypes: ['RELATED_TO'],
  nodeLabels: ['WorkItem']
})
YIELD node1, node2, similarity
WITH gds.util.asNode(node1) AS a, gds.util.asNode(node2) AS b, similarity
MERGE (a)-[r:PREDICTED_RELATED_TO]->(b)
SET r.similarity = similarity;

// === (Valfritt) Tagga isolerade komponenter (singleton-WCC) ===
MATCH (n:WorkItem)
WHERE n.component IS NOT NULL
WITH n.component AS comp, count(*) AS size
WITH collect({comp: comp, size: size}) AS comps
UNWIND comps AS c
WITH c WHERE c.size = 1
MATCH (n:WorkItem {component: c.comp})
SET n.isIsolated = true;
```

---

## 🔍 Vad gör detta?

| Tagg / Egenskap         | Förklaring                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| `pagerank`              | Centralitet i nätverket                                               |
| `community`             | Klustertillhörighet enligt Louvain                                    |
| `component`             | Identifierar till vilken svagt sammanhängande komponent noden tillhör |
| `:PREDICTED_RELATED_TO` | Relationer med `similarity`-score från link prediction                |
| `isIsolated = true`     | Markerar helt isolerade `WorkItem`-noder (singleton-WCC)              |

Vill du exportera eller visualisera dessa taggar i Neo4j Bloom, eller integrera dem i en sprint-dashboard?
