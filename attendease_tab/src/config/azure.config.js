/**
 * Azure AD / Microsoft Entra Configuration
 * 
 * TODO: This is a PLACEHOLDER for future Azure AD integration
 * 
 * Required Environment Variables:
 * - AAD_APP_CLIENT_ID: Your Azure AD Application (client) ID
 * - AAD_APP_CLIENT_SECRET: Your Azure AD Client Secret
 * - AAD_APP_TENANT_ID: Your Azure AD Tenant ID
 * 
 * Required Permissions:
 * - User.Read (Delegated)
 * - OnlineMeetings.Read.All (Application)
 * - OnlineMeetingArtifact.Read.All (Application)
 * 
 * Setup Instructions:
 * 1. Go to Azure Portal (https://portal.azure.com)
 * 2. Navigate to Azure Active Directory > App registrations
 * 3. Create new registration or use existing
 * 4. Add API permissions listed above
 * 5. Generate client secret
 * 6. Add credentials to .env.local or .localConfigs
 */

export const azureConfig = {
  clientId: process.env.AAD_APP_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
  clientSecret: process.env.AAD_APP_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
  tenantId: process.env.AAD_APP_TENANT_ID || 'PLACEHOLDER_TENANT_ID',
  redirectUri: 'https://localhost:53001/auth-callback',
  
  // OAuth scopes
  scopes: {
    user: ['User.Read', 'profile', 'openid', 'email'],
    application: ['OnlineMeetings.Read.All', 'OnlineMeetingArtifact.Read.All']
  },
  
  // Authority URL
  get authority() {
    return `https://login.microsoftonline.com/${this.tenantId}`;
  },
  
  // Graph API base URL
  graphApiUrl: 'https://graph.microsoft.com/v1.0'
};

// Check if Azure AD is configured
export function isAzureConfigured() {
  return azureConfig.clientId !== 'PLACEHOLDER_CLIENT_ID' 
    && azureConfig.clientSecret !== 'PLACEHOLDER_CLIENT_SECRET'
    && azureConfig.tenantId !== 'PLACEHOLDER_TENANT_ID';
}

export default azureConfig;

