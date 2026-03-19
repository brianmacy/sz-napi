/**
 * Proxy wrapper that gives a tRPC client native-style positional call syntax.
 *
 * Instead of:
 *   client.engine.addRecord.mutate({ dataSourceCode: "DS", recordId: "1", ... })
 *
 * You get:
 *   client.engine.addRecord("DS", "1", '{"NAME_FULL":"Bob"}', 0n)
 *
 * The wrapper uses METHOD_REGISTRY to zip positional args into named objects,
 * then dispatches to the underlying tRPC .query() or .mutate().
 */
import { METHOD_REGISTRY, type MethodDef } from './methods.js';

/**
 * Wraps a raw tRPC client with a Proxy so methods can be called
 * with positional args matching the native Senzing SDK signatures.
 */
export function wrapClient<T extends Record<string, any>>(trpcClient: T): any {
  // Group registry by service
  const byService = new Map<string, MethodDef[]>();
  for (const def of METHOD_REGISTRY) {
    let list = byService.get(def.service);
    if (!list) {
      list = [];
      byService.set(def.service, list);
    }
    list.push(def);
  }

  return new Proxy(trpcClient, {
    get(target, serviceName: string) {
      const defs = byService.get(serviceName);
      if (!defs) return target[serviceName];

      const serviceObj = target[serviceName];
      return new Proxy(serviceObj, {
        get(_svc, methodName: string) {
          const def = defs.find(d => d.method === methodName);
          if (!def) return serviceObj[methodName];

          const trpcProcedure = serviceObj[methodName];

          // Return a callable that accepts positional args
          return (...args: any[]) => {
            // Build the named input object from positional args
            const input: Record<string, any> = {};
            for (let i = 0; i < def.args.length; i++) {
              if (i < args.length && args[i] !== undefined) {
                input[def.args[i]] = args[i];
              }
            }

            const hasInput = def.args.length > 0 && Object.keys(input).length > 0;

            if (def.type === 'mutation') {
              return hasInput ? trpcProcedure.mutate(input) : trpcProcedure.mutate();
            } else {
              return hasInput ? trpcProcedure.query(input) : trpcProcedure.query();
            }
          };
        },
      });
    },
  });
}
