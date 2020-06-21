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

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT, 10) || 3001;
const router = new Router();


const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
} = process.env;
app.prepare().then(() => {
  const server = new Koa(app);
  server.use(session({ sameSite: 'none', secure: true }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

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
        ctx.redirect('/')
      }
    })
  );
  server.use(verifyRequest());
  server.use(bodyParser());
  server.use(router.routes());
  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    return
  });
  server.use(cors())
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

