import {HttpResponse} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export abstract class OAuthResourceServerErrorHandler {
    abstract handleError(err: HttpResponse<any>): Observable<any>;
}

export class OAuthNoopResourceServerErrorHandler implements OAuthResourceServerErrorHandler {
    handleError(err: HttpResponse<any>): Observable<any> {
        return throwError(err);
    }
}
