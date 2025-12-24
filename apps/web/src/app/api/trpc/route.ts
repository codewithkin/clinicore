import { NextResponse } from "next/server";
import { appRouter } from "@my-better-t-app/api/routers/index";
import { createContext } from "@my-better-t-app/api/context";

type BatchCall = {
  id?: number | string;
  jsonrpc?: string;
  method?: string;
  params?: { path: string; input?: any };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const calls: BatchCall[] = Array.isArray(body) ? body : [body];

    const results = await Promise.all(
      calls.map(async (call) => {
        try {
          const params = call.params || (body.params ? body.params : {});
          const path = params.path;
          const input = params.input;

          const ctx = await createContext(req as any);
          const caller = appRouter.createCaller(ctx as any);

          // traverse path (e.g., "settings.updateOrganizationSettings")
          const parts = path.split(".");
          let proc: any = caller;
          for (const p of parts) {
            proc = proc[p];
          }

          const result = await proc(input);

          return { id: call.id ?? null, result };
        } catch (err: any) {
          return { id: call.id ?? null, error: { message: err?.message || String(err) } };
        }
      })
    );

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
