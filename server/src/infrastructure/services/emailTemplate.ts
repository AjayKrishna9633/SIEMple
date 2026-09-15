/** Shared dark-themed chrome so every SIEMple email looks the same. */
export function renderEmailShell(innerHtml: string): string {
    return `
<div style="background:#0b111a;padding:40px 20px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#141d2b;border:1px solid #232f42;border-radius:8px;padding:32px">
    <h1 style="margin:0;color:#a9c1f0;font-size:20px;text-align:center">SIEMple</h1>
    <p style="margin:4px 0 28px;color:#6b7a91;font-size:11px;letter-spacing:3px;text-align:center;text-transform:uppercase">SOC Ops</p>
    ${innerHtml}
  </div>
</div>`.trim();
}
