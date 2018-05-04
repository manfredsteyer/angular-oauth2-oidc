import { HttpResponse } from '@angular/common/http';
import { Observable, throwError as _throw } from 'rxjs';

export abstract class OAuthResourceServerErrorHandler {
    abstract handleError(err: HttpResponse<any>): Observable<any>;
}

export class OAuthNoopResourceServerErrorHandler implements OAuthResourceServerErrorHandler {

    handleError(err: HttpResponse<any>): Observable<any> {
        return _throw(err);
    }
}
