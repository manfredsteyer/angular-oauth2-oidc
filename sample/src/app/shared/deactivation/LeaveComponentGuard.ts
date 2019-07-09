import {CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";

export class LeaveComponentGuard implements CanDeactivate<any> {

    canDeactivate(component: any, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

        return component.canDeactivate();

    }

}