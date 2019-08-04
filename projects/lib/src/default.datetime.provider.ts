import { DatetimeProvider } from './types';

export class DefaultDatetimeProvider extends DatetimeProvider {
    get myDate(): Date {
        return new Date();
    };
    get myNow(): number {
        return Date.now();
    };

}