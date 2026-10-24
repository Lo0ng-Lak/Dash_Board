export async function handleWebShieldSetupApi(request: Request): Promise<Response> {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }
    let body: { domain?: string; sheetId?: string } = {};
    try {
        body = (await request.json()) as { domain?: string; sheetId?: string };
    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const domain = String(body.domain ?? "").trim().toLowerCase();
    if (!domain.includes(".")) {
        return Response.json({ error: "Thiếu domain" }, { status: 400 });
    }
    return Response.json({
        ok: false,
        pending: true,
        domain,
        sheetId: String(body.sheetId ?? ""),
        message: "Đã nhận domain. Bước gắn lên App Platform sẽ làm tiếp.",
    });
}
