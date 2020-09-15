require('isomorphic-fetch');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('@koa/cors');
const bodyParser = require("koa-bodyparser");
const Koa = require('koa');
const Router = require('koa-router');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const next = require('next');
const fs = require('fs');
const https = require('https');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT, 10) || 3001;
const router = new Router();


const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  APP_NAME,
} = process.env;
app.prepare().then(() => {
  const server = new Koa(app);

  router.get('/GetShopifyCustomerdata', async (ctx) => {
      try {
          ctx.response.status = 200;
      } catch (err) {
          console.log(err)
      }
  });
  router.get('/EraseShopifyCustomerdata', async (ctx) => {
      try {
          ctx.response.status = 200;
      } catch (err) {
          console.log(err)
      }
  });
  router.get('/EraseShopData', async (ctx) => {
      try {
          ctx.response.status = 200;
      } catch (err) {
          console.log(err)
      }
  });
  server.use(router.routes());
  server.use(
      bodyParser({
          detectJSON: function (ctx) {
              return /\.json$/i.test(ctx.path);
          },
      })
  );
  server.use(session({ sameSite: 'none', secure: true }, server));
  server.use(session({ sameSite: 'none', secure: true }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") {
    server.use(
      createShopifyAuth({
        apiKey: SHOPIFY_API_KEY,
        secret: SHOPIFY_API_SECRET_KEY,
        scopes: ['read_products', 'write_products'],
        async afterAuth(ctx) {
          const { shop, accessToken } = ctx.session;
          ctx.cookies.set("shopOrigin", shop, {
            httpOnly: false,
            secure: true,
            sameSite: 'none'
          });
          ctx.cookies.set("accessToken", accessToken, {
            httpOnly: false,
            secure: true,
            sameSite: 'none'
          });
          console.log("afterAuth");
          ctx.redirect(`https://${shop}/admin/apps/${APP_NAME}`);
        }
      })
    );
    server.use(verifyRequest());
  }
  server.use(bodyParser());
  server.use(router.routes());
  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    return
  });
  server.use(cors())
  const serverCallback = server.callback();
  if (process.env.NODE_ENV === 'production') {
      var privateKey = fs.readFileSync(
          '/etc/letsencrypt/live/productedit.vowelweb.com/privkey.pem',
          'utf8'
      );
      var certificate = fs.readFileSync(
          '/etc/letsencrypt/live/productedit.vowelweb.com/fullchain.pem',
          'utf8'
      );
      const config = {
          https: {
              options: {
                  key: privateKey,
                  cert: certificate,
              },
          },
      };
      const httpsServer = https.createServer(
          config.https.options,
          serverCallback
      );
      httpsServer.listen(port, function (err) {
          console.log(`> Ready on production http://localhost:${port}`);
          if (!!err) {
              console.error('HTTPS server FAIL: ', err, err && err.stack);
          }
      });
  } else {
      server.listen(port, () => {
          console.log(`> Ready on development http://localhost:${port}`);
      });
  }
});


