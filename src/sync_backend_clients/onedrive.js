import { PublicClientApplication } from "@azure/msal-browser";

const MSGRAPH_LIST_URL = "https://graph.microsoft.com/v1.0/me/drive/root/{path}/children";
const MSGRAPH_FILE_URL = "https://graph.microsoft.com/v1.0/me/drive/root/{path}";
const MSGRAPH_CONTENT_URL = "https://graph.microsoft.com/v1.0/me/drive/root/{path}/content";
const REDIRECT_URI = window.location.origin + '/blank.html';
console.log(REDIRECT_URI);

export class OneDrive {
    constructor(options) {
        this.clientId = options.clientId;
        this.tenantId = options.tenantId;
        this.config = {
            auth: {
                clientId: this.clientId,
                authority: 'https://login.microsoftonline.com/' + this.tenantId,
                redirectUri: REDIRECT_URI
            },
            cache: {
                cacheLocation: "sessionStorage", // where your cache will be stored
                storeAuthStateInCookie: false, // Set to "true" if having issues on IE11 or Edge
            }
        }
        this.loginRequest = {
            scopes: ['files.readwrite.all', 'user.read', 'openid', 'profile', 'offline_access']
        }
        this.token = null;
        this.pca = new PublicClientApplication(this.config);
    }

    getClientId() {
        return this.clientId;
    }

    getTenantId() {
        return this.tenantId;
    }

    getToken() {
        return this.token;
    }

    signOut() {
        this.pca.logoutPopup();
    }

    signIn() {
        return new Promise((resolve, reject) => {
            this.pca.loginPopup(this.loginRequest)
                .then( loginResponse => {
                    this.token = loginResponse;
                }).then(resolve)
        });
    }

    getAccount() {
        return new Promise( (resolve, reject) => {
            const accounts = this.pca.getAllAccounts();
            if (!!accounts && accounts.length > 0) {
                resolve(accounts[0]);
            } else {
                reject("Unable to get account");
            }
        });
    }

    isSignedIn() {
        console.log('IsSignedIn');
        return new Promise((resolve, reject) =>
            this.getAccount()
                .then((account) => {
                    this.pca.acquireTokenSilent({
                        account: account,
                        redirectUri: this.pca.getRedirectUri(),
                        scopes: this.loginRequest.scopes
                    })
                        .then((response) => {
                            this.token = response;
                            resolve(true);
                        })
                        .catch((error) => {
                            resolve(false);
                        })

                })
                .catch((error) => {
                    resolve(false);
                })
        );
    }



    tryAcquireTokenSilent() {
        return new Promise((resolve, reject) => {
            this.getAccount()
                .then( (account) => {
                    return this.pca.acquireTokenSilent({
                        account: account,
                        redirectUri: this.pca.getRedirectUri(),
                        scopes: this.loginRequest.scopes
                    })
                        .then((response) => {
                            this.token = response;
                            resolve(this.token);
                        })
                        .catch((error) => reject(error));
            })
        })
    }

    getTokenPopup() {
        return this.tryAcquireTokenSilent()
            .then( (token) => {
                this.token = token;
                return token;
            })
            .catch( () => {
                return this.pca.loginPopup(this.loginRequest)
                    .then((response) => {
                        this.token = response;
                    });
            });
    }

    rpcRequest(url, options) {
        return this.getTokenPopup()
            .then( token => {
                const fetchOptions = Object.assign({
                    'headers' :  {
                        'Authorization': 'Bearer ' + token.accessToken
                    }
                }, options);
                return fetch(url, fetchOptions);
            });
    }

    pathComponents(url, path) {
        const finalPath = path === '' ? path : ':'+path+':';
        const finalUrl = url.replace('/{path}', finalPath).replace('//','/');
        return {
            path: finalPath,
            url: finalUrl
        };
    }

    filesListFolder( path ) {
        const parts = this.pathComponents(MSGRAPH_LIST_URL, path);
        var r = this.rpcRequest(parts.url);
        return r
            .then( (response) => {
                return response.json();
            })
            .then( (json) => {
                return json.value;
            })
    }

    fileMetadata(path) {
        return new Promise((resolve, reject) => {
            const parts = this.pathComponents(MSGRAPH_FILE_URL, path);
            this.rpcRequest(parts.url)
                .then((response) => {
                    if (response.status === 200) {
                        resolve(response.json());
                    } else {
                        reject();
                    }
                })
                .catch(reject);
        });
    }

    fileDownload(path) {
        return new Promise((resolve, reject) => {
            const parts = this.pathComponents(MSGRAPH_CONTENT_URL, path);
            this.rpcRequest(parts.url)
                .then((response) => {
                    if (response.status === 200) {
                        resolve(response.text());
                    } else {
                        reject( response.status );
                    }
                })
                .catch(reject);
        });
    }

    fileUpload(path, content) {
        return new Promise((resolve, reject) => {
            const parts = this.pathComponents(MSGRAPH_CONTENT_URL, path);
            this.rpcRequest(parts.url, {
                method: 'PUT',
                body: content
            })
                .then((response) => {
                    resolve(response);
                });
        });
    }
}
