// https://bun.sh/
const host = "www.dow.com";
import express from "express";
import {responseInterceptor, createProxyMiddleware} from "http-proxy-middleware";
import dictionary from "./dictionary.json"
const rewriter = new HTMLRewriter();
const responseInterceptorBuffer = new Buffer();
const app = express();

app.use('/fr-fr', (req, res) => {
    const proxy = createProxyMiddleware({
        selfHandleResponse: true,
        target: `https://${host}`,
        changeOrigin: true,
        pathRewrite: {
            '^/fr-fr': '/en-us',
        },
        onProxyRes: responseInterceptor(async (responseInterceptorBuffer, proxyRes, req, res) => {
            try {
                if (proxyRes.headers['content-type'].includes('text/html')) {
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
                    const responseToString = responseInterceptorBuffer.toString('utf8');
                    //responseToString.replaceAll('en-us', 'fr-fr');
                    res.send(rewriter.transform(responseToString));
                } else {
                    proxyRes.pipe(res);
                }
            } catch (error) {
                console.error('Translation error:', error);
                res.status(500).send('Translation Error');
            }
    })

    });
    proxy(req, res, (error) => {
        console.error('Proxy Error:', error);
        res.status(500).send('Proxy Error');
    });
});

app.use('/', createProxyMiddleware({
    target: `https://${host}`,
    changeOrigin: true,
}));


app.listen(36107);

console.log("Run on http://localhost:36107");
