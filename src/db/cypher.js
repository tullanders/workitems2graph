module.exports = `
with $param as param
  unwind param as row
  merge (workItem:WorkItem {id:row.id})
  set workItem.state = row.fields['System.State'],
  workItem.createdDate = datetime(row.fields['System.CreatedDate']),
  workItem.workItemType = row.fields['System.WorkItemType'],
  workItem.rev = row.rev,
  workItem.changedDate = datetime(row.fields['System.ChangedDate']),
  workItem.description = row.fields['System.Description'],
  workItem.acceptanceCriteria = row.fields['Microsoft.VSTS.Common.AcceptanceCriteria'],
  workItem.areaPath = row.fields['System.AreaPath'],
  workItem.iterationPath = row.fields['System.IterationPath'],
  workItem.riskWsjf = row.fields['Custom.Riskwsjf'],
  workItem.wsjf = row.fields['Custom.WSJF'],
  workItem.timecriticalitywsjf = row.fields['Custom.Timecriticalitywsjf'],
  workItem.businessvaluewsjf = row.fields['Custom.Businessvaluewsjf'],
  workItem.jobsize = row.fields['Custom.Jobsize'],
  workItem.budget = row.fields['Custom.Budget'],
  workItem.involvedTeams = row.fields['Custom.InvolvedTeams'],
  workItem.budget = row.fields['Custom.Budget'],
  workItem.commentCount = row.fields['System.CommentCount'],
  workItem.title = row.fields['System.Title'],
  workItem.url = row._links.html.href
with row, workItem

call (row, workItem) {
    with row.fields['System.AssignedTo'] as assignedTo
    where assignedTo.uniqueName is not null
    merge (u:User {uniqueName:assignedTo.uniqueName})
    set u.displayName = assignedTo.displayName, 
    u.uniqueName = assignedTo.uniqueName

    with row, workItem, assignedTo, u
    merge (workItem)-[:ASSIGNED_TO]->(u)
}

call (row, workItem) {
    with row, workItem, row.fields['System.CreatedBy'] as createdBy
    where createdBy.uniqueName is not null
    merge (u:User {uniqueName:createdBy.uniqueName})
    set u.displayName = createdBy.displayName,
    u.id = createdBy.id
    with row, workItem, createdBy, u
    merge (workItem)-[:CREATED_BY]->(u)
}

call (row, workItem) {
    with row, workItem, row.fields['System.ChangedBy'] as changedBy
    //where changedBy.uniqueName is not null
    merge (u3:User {uniqueName:changedBy.uniqueName})
    set u3.displayName = changedBy.displayName,
    u3.id = changedBy.id
    with row, workItem, changedBy, u3
    merge (workItem)-[:CHANGED_BY]->(u3)
}


call (row, workItem) {
    unwind row.relations as relation
    call apoc.do.case([
        relation.attributes.name = 'Related', 
        'merge (related:WorkItem {id:tointeger(last(split(relation.url, "/")))}) merge (workItem)-[:RELATED_TO]->(related)',
        relation.attributes.name = 'Duplicate', 
        'merge (duplicate:WorkItem {id:tointeger(last(split(relation.url, "/")))}) merge (workItem)-[:DUPLICATE_OF]->(duplicate)',
        relation.attributes.name = 'Child', 
        'merge (child:WorkItem {id:tointeger(last(split(relation.url, "/")))}) merge (workItem)-[:HAS_CHILD]->(child)'        
    ], '', {relation: relation, workItem: workItem}) YIELD value as v return v
}

unwind row.relations as relation
with row, workItem, relation where relation.attributes.name = 'Parent'
match (parent:WorkItem {id:tointeger(last(split(relation.url, '/')))})
merge (workItem)<-[:HAS_CHILD]-(parent) 
`;