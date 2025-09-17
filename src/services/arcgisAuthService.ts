/**
 * ArcGIS Authentication Service
 * Handles token generation and management for secured ArcGIS services
 */

export interface ArcGISCredentials {
  username: string;
  password: string;
  serverUrl: string;
}

export interface ArcGISToken {
  token: string;
  expires: number;
  serverUrl: string;
}

export interface AuthenticationResult {
  success: boolean;
  token?: ArcGISToken;
  error?: string;
}

export class ArcGISAuthService {
  private static instance: ArcGISAuthService;
  private tokenCache: Map<string, ArcGISToken> = new Map();

  private constructor() {}

  public static getInstance(): ArcGISAuthService {
    if (!ArcGISAuthService.instance) {
      ArcGISAuthService.instance = new ArcGISAuthService();
    }
    return ArcGISAuthService.instance;
  }

  /**
   * Generate a token for ArcGIS service authentication
   */
  public async generateToken(credentials: ArcGISCredentials): Promise<AuthenticationResult> {
    const { username, password, serverUrl } = credentials;
    
    // Check if we have a valid cached token
    const cached = this.getCachedToken(serverUrl);
    if (cached && this.isTokenValid(cached)) {
      return { success: true, token: cached };
    }

    try {
      console.log('🔐 Generating ArcGIS token via backend proxy for:', serverUrl);

      // Use our backend proxy to avoid CORS issues
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/auth/arcgis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          server_url: serverUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        return {
          success: false,
          error: 'Authentication failed: No token received'
        };
      }

      // Create token object
      const token: ArcGISToken = {
        token: data.token,
        expires: data.expires || Date.now() + (60 * 60 * 1000), // Default 1 hour
        serverUrl
      };

      // Cache the token
      this.cacheToken(serverUrl, token);

      console.log('✅ ArcGIS token generated successfully via backend proxy');
      return { success: true, token };

    } catch (error) {
      console.error('❌ Error generating ArcGIS token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  }

  /**
   * Get cached token if available and valid
   */
  public getCachedToken(serverUrl: string): ArcGISToken | null {
    const token = this.tokenCache.get(serverUrl);
    if (token && this.isTokenValid(token)) {
      return token;
    }
    
    // Clean up expired token
    if (token) {
      this.tokenCache.delete(serverUrl);
    }
    
    return null;
  }

  /**
   * Check if a token is still valid (not expired)
   */
  public isTokenValid(token: ArcGISToken): boolean {
    return Date.now() < token.expires - (5 * 60 * 1000); // 5-minute buffer
  }

  /**
   * Clear cached token for a server
   */
  public clearToken(serverUrl: string): void {
    this.tokenCache.delete(serverUrl);
  }

  /**
   * Clear all cached tokens
   */
  public clearAllTokens(): void {
    this.tokenCache.clear();
  }

  /**
   * Get the token generation URL for a server
   */
  private getTokenUrl(serverUrl: string): string {
    // Remove any trailing slashes and paths
    const baseUrl = serverUrl.replace(/\/(rest\/services.*)?$/, '');
    
    // Check if it's ArcGIS Server or Portal/ArcGIS Online
    if (baseUrl.includes('arcgis.com') || baseUrl.includes('/sharing/') || baseUrl.includes('/portal')) {
      return `${baseUrl}/sharing/rest/generateToken`;
    } else {
      // ArcGIS Server
      return `${baseUrl}/tokens/generateToken`;
    }
  }

  /**
   * Cache a token
   */
  private cacheToken(serverUrl: string, token: ArcGISToken): void {
    this.tokenCache.set(serverUrl, token);
  }

  /**
   * Get token for making authenticated requests
   */
  public getTokenForRequest(serverUrl: string): string | null {
    const token = this.getCachedToken(serverUrl);
    return token ? token.token : null;
  }

  /**
   * Check if credentials are stored for a server (in localStorage)
   */
  public hasStoredCredentials(serverUrl: string): boolean {
    const stored = localStorage.getItem(`arcgis_creds_${this.getServerKey(serverUrl)}`);
    return !!stored;
  }

  /**
   * Store credentials securely in localStorage
   */
  public storeCredentials(credentials: ArcGISCredentials): void {
    const key = this.getServerKey(credentials.serverUrl);
    const encrypted = btoa(JSON.stringify({
      username: credentials.username,
      password: credentials.password,
      serverUrl: credentials.serverUrl
    }));
    localStorage.setItem(`arcgis_creds_${key}`, encrypted);
  }

  /**
   * Retrieve stored credentials
   */
  public getStoredCredentials(serverUrl: string): ArcGISCredentials | null {
    try {
      const key = this.getServerKey(serverUrl);
      const stored = localStorage.getItem(`arcgis_creds_${key}`);
      if (stored) {
        return JSON.parse(atob(stored));
      }
    } catch (error) {
      console.error('Error retrieving stored credentials:', error);
    }
    return null;
  }

  /**
   * Remove stored credentials
   */
  public removeStoredCredentials(serverUrl: string): void {
    const key = this.getServerKey(serverUrl);
    localStorage.removeItem(`arcgis_creds_${key}`);
  }

  /**
   * Generate a key for localStorage based on server URL
   */
  private getServerKey(serverUrl: string): string {
    return btoa(serverUrl).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Auto-authenticate using stored credentials
   */
  public async autoAuthenticate(serverUrl: string): Promise<AuthenticationResult> {
    const storedCredentials = this.getStoredCredentials(serverUrl);
    if (storedCredentials) {
      return await this.generateToken(storedCredentials);
    }
    return { success: false, error: 'No stored credentials found' };
  }
}

export const arcgisAuthService = ArcGISAuthService.getInstance(); 