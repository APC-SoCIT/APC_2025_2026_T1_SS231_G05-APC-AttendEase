/**
 * Azure AD Authentication Service — Teams SDK SSO + OBO Flow
 *
 * This module provides the On-Behalf-Of (OBO) token exchange that enables
 * seamless authentication when AttendEase runs inside Teams:
 *
 *   1. Teams JS SDK calls getAuthToken() → returns a Teams-scoped JWT
 *   2. Frontend sends that JWT to our backend /api/auth/teams-sso endpoint
 *   3. Backend uses MSAL's acquireTokenOnBehalfOf() to exchange it for a
 *      Graph API access token
 *   4. The Graph token is returned to the frontend, which then uses it
 *      exactly like a Graph Explorer token (same delegated proxy endpoints)
 *
 * PREREQUISITES:
 *   - AAD_APP_CLIENT_ID, AAD_APP_CLIENT_SECRET, AAD_APP_TENANT_ID env vars set
 *   - The AAD app registration has:
 *       · api://[domain]/[clientId] as an Application ID URI
 *       · "access_as_user" scope exposed
 *       · Graph API permissions consented by admin: User.Read, OnlineMeetings.Read,
 *         OnlineMeetingArtifact.Read.All
 *
 * STATUS: Scaffolded — will work once the AAD app registration is properly configured.
 */

import { azureConfig, isAzureConfigured } from '../../config/azure.config.js';

/**
 * Exchange a Teams SSO token for a Graph API access token via OBO flow.
 * This runs on the backend (Express).
 *
 * @param {string} teamsToken - The JWT from microsoftTeams.authentication.getAuthToken()
 * @returns {Promise<{success: boolean, graphToken?: string, error?: string}>}
 */
export async function exchangeTeamsTokenForGraph(teamsToken) {
  if (!isAzureConfigured()) {
    return { success: false, error: 'Azure AD not configured. Set AAD_APP_CLIENT_ID, AAD_APP_CLIENT_SECRET, AAD_APP_TENANT_ID.' };
  }

  try {
    // Dynamic import to avoid breaking the app if msal-node isn't configured
    const { ConfidentialClientApplication } = await import('@azure/msal-node');

    const msalConfig = {
      auth: {
        clientId: azureConfig.clientId,
        authority: azureConfig.authority,
        clientSecret: azureConfig.clientSecret,
      }
    };

    const msalClient = new ConfidentialClientApplication(msalConfig);

    const oboRequest = {
      oboAssertion: teamsToken,
      scopes: ['https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/OnlineMeetings.Read', 'https://graph.microsoft.com/OnlineMeetingArtifact.Read.All'],
    };

    const result = await msalClient.acquireTokenOnBehalfOf(oboRequest);

    return {
      success: true,
      graphToken: result.accessToken,
      expiresOn: result.expiresOn,
    };
  } catch (error) {
    console.error('OBO token exchange failed:', error.message);
    return {
      success: false,
      error: error.message || 'OBO token exchange failed',
    };
  }
}

/**
 * Check if Azure AD SSO is configured.
 */
export function isSSOConfigured() {
  return isAzureConfigured();
}

export default {
  exchangeTeamsTokenForGraph,
  isSSOConfigured,
};
