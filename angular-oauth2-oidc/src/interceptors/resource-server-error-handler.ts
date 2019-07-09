import {HttpResponse} from '@angular/common/http';
import { Observable,  } from 'rxjs/Observable';
import {  _throw } from 'rxjs/observable/throw';

export abstract class OAuthResourceServerErrorHandler {
    abstract handleError(err: HttpResponse<any>): Observable<any>;
}

export class OAuthNoopResourceServerErrorHandler implements OAuthResourceServerErrorHandler {
    
    handleError(err: HttpResponse<any>): Observable<any> {
        return _throw(err);
    }

}