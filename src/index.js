import queue from 'queue';
import extend from "just-extend";
import {Middleware} from 'request-middleware-pipeline';

const defaultOptions = {
    concurrency: 10,
    timeout: 10000,
};

const privateNames = {
    options: Symbol('options'),
    requestQueue: Symbol('requestQueue')
}

export default class QueueMiddleware extends Middleware {

    constructor(nextMiddleware, options) {
        super(nextMiddleware);

        this[privateNames.options] = extend(true, {}, defaultOptions, options);
        this[privateNames.requestQueue] = queue(extend({ autostart: true }, this[privateNames.options]));
    }

    invoke(middlewareContext) {
        return new Promise((resolve, reject) => {
            this[privateNames.requestQueue].push((callback) => {
                try {
                    resolve(this.next(middlewareContext));
                } catch (err) {
                    reject(err);
                }
                finally {
                    callback();
                }
            });
        });
    }

    config(options) {
        this[privateNames.options] = extend(true, this[privateNames.options], options);
        if (this[privateNames.options].concurrency !== this[privateNames.requestQueue].concurrency) {
            this[privateNames.requestQueue].concurrency = this[privateNames.options].concurrency;
        }
        if (this[privateNames.options].timeout !== this[privateNames.requestQueue].timeout) {
            this[privateNames.requestQueue].timeout = this[privateNames.options].timeout;
        }
    }
}
