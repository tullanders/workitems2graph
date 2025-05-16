CALL gds.graph.project(
  'workitem-graph',
  ['WorkItem', 'User'],
  {
    HAS_CHILD: {type: 'HAS_CHILD', orientation: 'UNDIRECTED'},
    RELATED_TO: {type: 'RELATED_TO', orientation: 'UNDIRECTED'},
    CREATED_BY: {type: 'CREATED_BY', orientation: 'UNDIRECTED'},
    ASSIGNED_TO: {type: 'ASSIGNED_TO', orientation: 'UNDIRECTED'},
    DUPLICATE_OF: {type: 'DUPLICATE_OF', orientation: 'UNDIRECTED'},
    CHANGED_BY: {type: 'CHANGED_BY', orientation: 'UNDIRECTED'}
  }
);


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
