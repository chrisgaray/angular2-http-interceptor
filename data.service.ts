import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, RequestOptionsArgs, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';


@Injectable()
export class DataService {
    constructor(private _http: Http) { }

    getContent(url: string, options?: RequestOptionsArgs): Observable<any[]> {
        let content$ = this._http
            .get(url, options)
            //.get(url)            
            .map(this.extractData
            /*(response: Response) => <IContent[]>response.json()*/
            )
            .do(data => console.log('data is: ' + data))
            .catch(this.handleError);

        return content$;
    }

    postContent(url: string, data: object): Observable<any[]> {
        let content$ = this._http
            .post(url, data)
            .map(this.extractData)
            .do(pdata => console.log('pdata is: ' + pdata))
            .catch(this.handleError);

        return content$;

    }

    private handleError(error: Response) {
        console.error(error);
        let message = `Error status code ${error.status} at $ {error.url}`;
        return Observable.throw(message);
    }

    private extractData(res: Response) {
        // ngFor takes an Array so we have to convert the json to an array
        let body = Object.keys(res.json()).map(function (key) { return res.json()[key]; });

        if (body.length > 0) {
            if (typeof body[0].code !== 'undefined' && body[0].code === 403) {
                return Observable.throw(new Error('unauthorized'));
            }
        }
        return body || [];
    }

}