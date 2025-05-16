#!/usr/bin/env node

/**
 * Script to recursively download all work items under a given Azure DevOps work item using REST API.
 *
 * Usage:
 *   1. Create a .env file in the same folder with the following variables:
 *      AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, AZURE_DEVOPS_ROOT_ID, AZURE_DEVOPS_PAT
 *   2. Install dependencies:
 *      npm install axios dotenv
 *   3. Run:
 *      node download-workitems.js
 */

require('dotenv').config();
const axios = require('axios');

// Load config from .env
const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
const project = process.env.AZURE_DEVOPS_PROJECT;
const pat = process.env.AZURE_DEVOPS_PAT;

if (!orgUrl || !project || !pat) {
    console.error('Error: Please ensure AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, AZURE_DEVOPS_ROOT_ID, and AZURE_DEVOPS_PAT are set in your .env file.');
    process.exit(1);
}

// Base64-encode PAT for Basic auth
const authHeader = `Basic ${Buffer.from(':'+pat).toString('base64')}`;
const apiVersion = '7.1';

const visited = new Set();
const results = [];

async function iterate(id) {
    if (visited.has(id)) return;
    visited.add(id);

    process.stdout.write('.');

    const url = `${orgUrl}/${project}/_apis/wit/workitems/${id}`;
    const params = { 'api-version': apiVersion, '$expand': 'Relations' };

    const response = await axios.get(url, {
        headers: { 'Authorization': authHeader },
        params
    });
    const wi = response.data;
    results.push(wi);

    const relations = wi.relations || [];
    const children = relations
        .filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward')
        .map(r => parseInt(r.url.split('/').pop(), 10))
        .filter(n => !isNaN(n));

    for (const childId of children) {
        await iterate(childId);
    }
}

async function fetchWorkItems(id) {
    await iterate(id);
    return results;
}
module.exports = {fetchWorkItems};

// .env example:
// AZURE_DEVOPS_ORG_URL=https://dev.azure.com/minOrganisation
// AZURE_DEVOPS_PROJECT=MittProjekt
// AZURE_DEVOPS_ROOT_ID=1234
// AZURE_DEVOPS_PAT=abcdef1234567890
