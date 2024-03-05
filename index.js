const host = "www.dow.com";
const targetPort = 36107;
const targetHost = `https://${host}`;
const dictionary = require('./dictionary.json');
const rewriter = new HTMLRewriter();


const server = Bun.serve({
    port: targetPort,
    fetch: async (req) => {
        const url = new URL(req.url);

        if (url.pathname.includes("/fr-fr")) {
            const fetchUrl = targetHost + url.pathname.replace('fr-fr', 'en-us');
            const res = await fetch(fetchUrl);
            const content = await res.text();

            //Handle Dictionary
            Object.entries(dictionary).forEach(([key, value]) => {
                rewriter.on(key, {
                    text(el) {
                        el.lastInTextNode || el.replace(value);
                    },
                });
            });
            //Handle links
            rewriter.on("a[href]", {
                element(el) {
                    const href=  el?.getAttribute('href');
                    if(href) {
                        const newHref = href.replace('en-us', 'fr-fr');
                        el.setAttribute('href', newHref);
                    }
                },
            });

            const headers = new Headers();
            headers.set('Content-Type', 'text/html');
            return new Response(rewriter.transform(content), {headers: headers});

        }

        const res = await fetch(targetHost + url.pathname);
        return new Response(res.body, {
            status: res.status,
        });
    },
});

console.log("Run on http://localhost:"+targetPort);
