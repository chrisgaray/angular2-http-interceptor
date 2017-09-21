import { Http, Request, RequestOptions, RequestOptionsArgs, Response, ConnectionBackend, Headers } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/map";
import { AppSettings } from "./app.settings";

/**
 * The HttpInterceptor class intercepts all http requests and adds a token to the header
 * @class HttpInterceptor
 * @extends Http
 * @constructor
 */
export class HttpInterceptor extends Http {
    headers: Headers = new Headers({ '': '' });
    private refreshTokenUrl = AppSettings.API_ENDPOINT + '/token';
    private currentUrl = '';
    private authDataName = 'authorizationData';

    constructor(backend: ConnectionBackend, defaultOptions: RequestOptions) {
        super(backend, defaultOptions);
    }

    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {

        this.currentUrl = (typeof url === 'string') ? url : (url as Request).url;

        //adding access token to each http request before calling super(..,..)
        let token = '';
        let refreshToken = '';
        let authToken = JSON.parse(localStorage.getItem(this.authDataName));
        if (authToken) {
            token = authToken.access_token;
            refreshToken = authToken.refresh_token;
        }

        if (token === '' && this.currentUrl !== this.refreshTokenUrl) {
            return Observable.throw(new Error());

        } else {
            if (this.currentUrl !== this.refreshTokenUrl) {
                if (typeof url === 'string') {
                    if (!options) {
                        options = { headers: new Headers() };
                    }
                    options.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    url.headers.set('Authorization', `Bearer ${token}`);
                }
            }

            return super.request(url, options)
                .map((response: Response) => {
                    return response;
                })
                .catch((error) => {
                    if (error.status == 401) {
                        return Observable.throw(error);
                    } else if (error.status == 403) {
                        return this.refreshToken()
                            .flatMap((newToken) => {
                                authToken = JSON.parse(localStorage.getItem(this.authDataName));
                                if (authToken) {
                                    token = authToken.access_token;

                                    if (typeof url === 'string') {
                                        if (!options) {
                                            options = { headers: new Headers() };
                                        }
                                        options.headers.set('Authorization', `Bearer ${token}`);
                                        return super.request(url, options);
                                    } else {
                                        url.headers.set('Authorization', `Bearer ${token}`);
                                        return super.request(url);
                                    }
                                   
                                } else {
                                    return Observable.throw(error);
                                }                                
                        });
                    }
                    else {
                        return Observable.throw(error);
                    }
                });

        }
    }
       
    protected refreshToken(): Observable<boolean> {
        var storeData = localStorage.getItem('authorizationData');
        if (storeData) {
            var auth = JSON.parse(storeData);
            var currTime = Date.now();
            var expireDate = new Date(Date.parse(auth['.expires']));
        } 

        let body: string = 'grant_type=refresh_token&refresh_token=' + auth.refresh_token + '&client_id=testApp';

        return super.post(this.refreshTokenUrl, body)
            .map((response: Response) => {
                var returnedBody: any = response;
                if (typeof returnedBody !== 'undefined') {
                    localStorage.setItem(this.authDataName, returnedBody._body);
                    return true;
                }
                else {
                    return false;
                }
            }).catch((error: any) => {
                return Observable.throw(error.message);
            });
    }
    
}