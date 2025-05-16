#!/usr/bin/env node

/**
 * Module to list Azure DevOps work item IDs of type 'Theme' changed in the last N days.
 *
 * Usage:
 *   const { listRecentThemes } = require('./list-recent-themes');
 *   listRecentThemes({ days: 100 })
 *     .then(ids => console.log(ids))
 *     .catch(err => console.error(err));
 *
 * 1. Create a .env file with AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, AZURE_DEVOPS_PAT
 * 2. Install dependencies: npm install axios dotenv
 */

require('dotenv').config();
const axios = require('axios');

const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
const project = process.env.AZURE_DEVOPS_PROJECT;
const pat = process.env.AZURE_DEVOPS_PAT;
const apiVersion = '7.1-preview.2';

if (!orgUrl || !project || !pat) {
  throw new Error(
    'Please set AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PROJECT, and AZURE_DEVOPS_PAT in your .env file'
  );
}

const authHeader = `Basic ${Buffer.from(':' + pat).toString('base64')}`;

/**
 * List IDs of 'Theme' work items changed in the last specified number of days.
 * @param {object} options
 * @param {number} options.days Number of days back from today to filter by ChangedDate
 * @returns {Promise<number[]>} Promise resolving to array of work item IDs
 */
async function listRecentThemes({ days = 100 } = {}) {
  const wiql = {
    query: `
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.WorkItemType] = 'Theme'
        AND [System.ChangedDate] >= @Today - ${days}
    `
  };

  const url = `${orgUrl}/${project}/_apis/wit/wiql?api-version=${apiVersion}`;
  const response = await axios.post(url, wiql, {
    headers: { Authorization: authHeader }
  });

  const workItems = response.data.workItems || [];
  return workItems.map(wi => wi.id);
}

module.exports = { listRecentThemes };
