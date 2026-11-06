export const deriveDropboxPath = (avarta: any): string | null => {
    if (!avarta) return null;

    if (typeof avarta === "object" && typeof avarta.url === "string") {
        const p = normalize(avarta.url);
        return p.startsWith("/") ? p : null;
    }

    if (typeof avarta === "string") {
        if (/^https?:\/\//i.test(avarta) || avarta.startsWith("data:")) return null;
        const p = normalize(avarta);
        return p.startsWith("/") ? p : null;
    }

    return null;

    function normalize(p: string) {
        const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "");
        return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    }
};

export const resolveImageSrcFallback = (avarta: any) => {
    const onlinePlaceholder = `https://www.gravatar.com/avatar/?d=mp&s=128`;
    const publicFallback = "/assets/profile1.png";

    if (!avarta) return onlinePlaceholder;

    if (typeof avarta === "object") {
        if (typeof avarta.url === "string" && avarta.url.length > 0) return normalize(avarta.url);
        return onlinePlaceholder;
    }

    if (typeof avarta === "string") {
        if (/^https?:\/\//i.test(avarta) || avarta.startsWith("data:")) return avarta;
        return normalize(avarta);
    }

    return onlinePlaceholder;

    function normalize(p: string) {
        const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "");
        if (!cleaned || cleaned.startsWith("src/") || cleaned.startsWith("assets/")) return publicFallback;
        return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    }
};