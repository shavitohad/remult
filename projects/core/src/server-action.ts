import 'reflect-metadata';



import { Remult, AllowedForInstance, Allowed, allEntities, ControllerOptions, classHelpers, ClassHelper, MethodHelper, setControllerSettings } from './context';




import { DataApiRequest, DataApiResponse } from './data-api';

import { SqlDatabase } from './data-providers/sql-database';


import { packedRowInfo } from './__EntityValueProvider';
import { Filter, AndFilter } from './filter/filter-interfaces';
import { DataProvider, RestDataProviderHttpProvider } from './data-interfaces';
import { getEntityRef, rowHelperImplementation, getFields, decorateColumnSettings, getEntitySettings, getControllerRef, EntityFilter, controllerRefImpl } from './remult3';
import { FieldOptions } from './column-interfaces';



interface inArgs {
    args: any[];
}
interface result {
    data: any;

}
export abstract class Action<inParam, outParam>{
    constructor(private actionUrl: string, private queue: boolean, private allowed: AllowedForInstance<any>) {

    }
    static apiUrlForJobStatus = 'jobStatusInQueue';
    static provider: RestDataProviderHttpProvider;
    async run(pIn: inParam): Promise<outParam> {

        let r = await Action.provider.post(Remult.apiBaseUrl + '/' + this.actionUrl, pIn);
        let p: jobWasQueuedResult = r;
        if (p && p.queuedJobId) {

            let progress = actionInfo.startBusyWithProgress();
            try {
                let runningJob: queuedJobInfoResponse;
                await actionInfo.runActionWithoutBlockingUI(async () => {
                    while (!runningJob || !runningJob.done) {
                        if (runningJob)
                            await new Promise(res => setTimeout(() => {
                                res(undefined);
                            }, 200));
                        runningJob = await Action.provider.post(Remult.apiBaseUrl + '/' + Action.apiUrlForJobStatus, { queuedJobId: r.queuedJobId });
                        if (runningJob.progress) {
                            progress.progress(runningJob.progress);
                        }
                    }
                });
                if (runningJob.error)
                    throw runningJob.error;
                progress.progress(1);
                return runningJob.result;

            }
            finally {
                progress.close();
            }
        }
        else
            return r;



    }
    protected abstract execute(info: inParam, req: Remult, res: DataApiResponse): Promise<outParam>;

    __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) {
        reg(this.actionUrl, this.queue, this.allowed, async (d, req, res) => {

            try {
                var r = await this.execute(d, req, res);
                res.success(r);
            }
            catch (err) {
                if (err instanceof ForbiddenError)
                    res.forbidden();
                else
                    res.error(err);
            }

        });
    }
}
class ForbiddenError extends Error {
    constructor() {
        super("Forbidden");
    }
}

export class myServerAction extends Action<inArgs, result>
{
    constructor(name: string, private types: any[], private options: BackendMethodOptions<any>, private originalMethod: (args: any[]) => any) {
        super(name, options.queue, options.allowed)
    }

    protected async execute(info: inArgs, remult: Remult, res: DataApiResponse): Promise<result> {
        let result = { data: {} };
        let ds = remult._dataSource;
        await ds.transaction(async ds => {
            remult.setDataProvider(ds);
            if (!remult.isAllowedForInstance(undefined, this.options.allowed))
                throw new ForbiddenError();

            info.args = await prepareReceivedArgs(this.types, info.args, remult, ds, res);
            try {
                result.data = await this.originalMethod(info.args);

            }

            catch (err) {
                throw err
            }
        });
        return result;
    }



}
export interface BackendMethodOptions<type> {
    /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
    allowed: AllowedForInstance<type>;
    /** EXPERIMENTAL: Determines if this method should be queued for later execution */
    queue?: boolean;
    /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
    blockUser?: boolean;
}

export const actionInfo = {
    allActions: [] as any[],
    runningOnServer: false,
    runActionWithoutBlockingUI: (what: () => Promise<any>): Promise<any> => { return what() },
    startBusyWithProgress: () => ({
        progress: (percent: number) => { },
        close: () => { }
    })
}


export const serverActionField = Symbol('serverActionField');





interface serverMethodInArgs {
    args: any[],
    fields?: any,
    rowInfo?: packedRowInfo

}
interface serverMethodOutArgs {
    result: any,
    fields?: any,
    rowInfo?: packedRowInfo
}







const methodHelpers = new Map<any, MethodHelper>();
const classOptions = new Map<any, ControllerOptions>();
export function Controller(key: string) {
    return function (target) {
        let r = target;
        classOptions.set(r, { key });
        setControllerSettings(target, { key });



        return target;
    };
}

/** Indicates that the decorated methods runs on the backend. See: [Backend Methods](https://remult.dev/docs/backendMethods.html) */
export function BackendMethod<type = any>(options: BackendMethodOptions<type>) {
    return (target: any, key: string, descriptor: any) => {
        if (target.prototype !== undefined) {
            var originalMethod = descriptor.value;

            var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
            // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

            let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



            descriptor.value = async function (...args: any[]) {
                if (!actionInfo.runningOnServer) {


                    args = prepareArgsToSend(types, args);
                    if (options.blockUser === false) {
                        return await actionInfo.runActionWithoutBlockingUI(async () => (await serverAction.run({ args })).data);
                    }
                    else
                        return (await serverAction.run({ args })).data;
                }
                else
                    return (await originalMethod.apply(undefined, args));
            }
            actionInfo.allActions.push(descriptor.value);
            descriptor.value[serverActionField] = serverAction;


            return descriptor;
        }


        var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
        let x = classHelpers.get(target.constructor);
        if (!x) {
            x = new ClassHelper();
            classHelpers.set(target.constructor, x);
        }
        let mh = new MethodHelper();
        methodHelpers.set(descriptor, mh);
        x.methods.push(mh);
        var originalMethod = descriptor.value;
        let serverAction = {

            __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) {

                let c = new Remult();
                for (const constructor of mh.classes.keys()) {
                    let controllerOptions = mh.classes.get(constructor);


                    if (!controllerOptions.key) {
                        controllerOptions.key = c.repo(constructor).metadata.key;
                    }


                    reg(controllerOptions.key + '/' + key, options ? options.queue : false, options.allowed, async (d: serverMethodInArgs, req, res) => {

                        d.args = d.args.map(x => isCustomUndefined(x) ? undefined : x);
                        let allowed = options.allowed;


                        try {
                            let remult = req;

                            let ds = remult._dataSource;

                            let r: serverMethodOutArgs;
                            await ds.transaction(async ds => {
                                remult.setDataProvider(ds);
                                d.args = await prepareReceivedArgs(types, d.args, remult, ds, res);
                                if (allEntities.includes(constructor)) {
                                    let repo = remult.repo(constructor);
                                    let y: any;

                                    if (d.rowInfo.isNewRow) {
                                        y = repo.create();
                                        let rowHelper = repo.getEntityRef(y) as rowHelperImplementation<any>;
                                        await rowHelper._updateEntityBasedOnApi(d.rowInfo.data);

                                    }
                                    else {

                                        let rows = await repo.find({
                                            where: {
                                                ...repo.metadata.idMetadata.getIdFilter(d.rowInfo.id),
                                                $and: [repo.metadata.options.apiPrefilter]
                                            }
                                        });
                                        if (rows.length != 1)
                                            throw new Error("not found or too many matches");
                                        y = rows[0];
                                        await (repo.getEntityRef(y) as rowHelperImplementation<any>)._updateEntityBasedOnApi(d.rowInfo.data);
                                    }
                                    if (!remult.isAllowedForInstance(y, allowed))
                                        throw new ForbiddenError();
                                    let defs = getEntityRef(y) as rowHelperImplementation<any>;
                                    await defs.__validateEntity();
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            rowInfo: {
                                                data: await defs.toApiJson(),
                                                isNewRow: defs.isNew(),
                                                wasChanged: defs.wasChanged(),
                                                id: defs.getOriginalId()
                                            }
                                        };
                                    } catch (err) {
                                        throw defs.catchSaveErrors(err);
                                    }
                                }
                                else {
                                    let y = new constructor(remult, ds);
                                    let controllerRef = getControllerRef(y, remult) as controllerRefImpl;
                                    await controllerRef._updateEntityBasedOnApi(d.fields);
                                    if (!remult.isAllowedForInstance(y, allowed))
                                        throw new ForbiddenError();

                                    await controllerRef.__validateEntity();
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            fields: await controllerRef.toApiJson()
                                        };
                                    } catch (err) {
                                        throw controllerRef.catchSaveErrors(err);
                                    }
                                }

                            });
                            res.success(r);
                        }
                        catch (err) {
                            res.error(err);
                        }
                    });
                }
            }
        };

        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                let self = this;
                args = prepareArgsToSend(types, args);

                if (allEntities.includes(target.constructor)) {
                    let defs = getEntityRef(self) as rowHelperImplementation<any>;
                    await defs.__validateEntity();
                    let classOptions = mh.classes.get(self.constructor);
                    if (!classOptions.key) {
                        classOptions.key = defs.repository.metadata.key + "_methods";
                    }
                    try {

                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(classOptions.key + "/" + key, options ? options.queue : false, options.allowed).run({
                            args,
                            rowInfo: {
                                data: await defs.toApiJson(),
                                isNewRow: defs.isNew(),
                                wasChanged: defs.wasChanged(),
                                id: defs.getOriginalId()
                            }

                        }));
                        await defs._updateEntityBasedOnApi(r.rowInfo.data);
                        return r.result;
                    }
                    catch (err) {
                        defs.catchSaveErrors(err);
                        throw err;
                    }
                }

                else {
                    let defs = getControllerRef(self, undefined) as controllerRefImpl;
                    try {
                        await defs.__validateEntity();
                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(mh.classes.get(this.constructor).key + "/" + key, options ? options.queue : false, options.allowed).run({
                            args,
                            fields: await defs.toApiJson()
                        }));
                        await defs._updateEntityBasedOnApi(r.fields);
                        return r.result;
                    }
                    catch (e) {
                        throw defs.catchSaveErrors(e);
                    }
                }
            }
            else
                return (await originalMethod.apply(this, args));
        }
        actionInfo.allActions.push(descriptor.value);
        descriptor.value[serverActionField] = serverAction;


        return descriptor;
    }
}







const customUndefined = {
    _isUndefined: true
}
function isCustomUndefined(x: any) {
    return x && x._isUndefined;
}
export interface registrableAction {
    __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) => void
}
export interface jobWasQueuedResult {
    queuedJobId?: string
}
export interface queuedJobInfoResponse {
    done: boolean;
    result?: any;
    error?: any;
    progress?: number;
}
export class ProgressListener {
    constructor(private res: DataApiResponse) { }
    progress(progress: number) {
        this.res.progress(progress);
    }
}
export function prepareArgsToSend(types: any[], args: any[]) {

    if (types) {
        for (let index = 0; index < types.length; index++) {
            const paramType = types[index];
            for (const type of [Remult, SqlDatabase]) {
                if (args[index] instanceof type)
                    args[index] = undefined;
                else if (paramType == type) {
                    args[index] = undefined;
                }
            }
            if (args[index] != undefined) {
                let x: FieldOptions = { valueType: paramType };
                x = decorateColumnSettings(x, new Remult());
                if (x.valueConverter)
                    args[index] = x.valueConverter.toJson(args[index]);
                let eo = getEntitySettings(paramType, false);
                if (eo != null) {
                    let rh = getEntityRef(args[index]);
                    args[index] = rh.getId();
                }
            }
        }
    }
    return args.map(x => x !== undefined ? x : customUndefined);

}
export async function prepareReceivedArgs(types: any[], args: any[], remult: Remult, ds: DataProvider, res: DataApiResponse) {
    for (let index = 0; index < args.length; index++) {
        const element = args[index];
        if (isCustomUndefined(element))
            args[index] = undefined;
    }

    if (types)
        for (let i = 0; i < types.length; i++) {
            if (args.length < i) {
                args.push(undefined);
            }
            if (types[i] == Remult || types[i] == Remult) {

                args[i] = remult;
            } else if (types[i] == SqlDatabase && ds) {
                args[i] = ds;
            } else if (types[i] == ProgressListener) {
                args[i] = new ProgressListener(res);
            } else {
                let x: FieldOptions = { valueType: types[i] };
                x = decorateColumnSettings(x, remult);
                if (x.valueConverter)
                    args[i] = x.valueConverter.fromJson(args[i]);
                let eo = getEntitySettings(types[i], false);
                if (eo != null) {
                    if (!(args[i] === null || args[i] === undefined))
                        args[i] = await remult.repo(types[i]).findId(args[i]);
                }


            }
        }
    return args;
}
