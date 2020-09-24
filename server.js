require('isomorphic-fetch');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('@koa/cors');
const bodyParser = require("koa-bodyparser");
const Koa = require('koa');
const Router = require('koa-router');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks');
const postBilling = require('./utils/postbilling');
const authRouter = require('./server/routers/authRouter');
const session = require('koa-session');
const next = require('next');
const Shop = require('./server/models/Shops.js');
const fs = require('fs');
const https = require('https');
const { isEmpty } = require('lodash');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT, 10) || 3001;
const router = new Router();
const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  APP_NAME,
  HOST
} = process.env;
const connectMongod = async () => {
    try {
        await mongoose.connect(
            `mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false`,
            { useUnifiedTopology: true, useNewUrlParser: true, dbName: "Bulkedit" }
        );
    } catch (error) {
        console.log('mongodb connection failed');
    }
};
connectMongod();
mongoose.connection.on('error', (error) => {
    console.log(error, 'mongodb error>>>>>>>>>>');
});
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
        accessMode: 'offline',
        scopes: ['read_products', 'write_products'],
        async afterAuth(ctx) {
            const { shop, accessToken } = ctx.session;
            const registration = await registerWebhook({
                address: `https://${HOST}/webhooks/app/uninstalled`,
                topic: 'APP_UNINSTALLED',
                accessToken,
                shop,
                apiVersion:"2020-04"
              });
            try {
                const shopDetails = await Shop.findOne({ shopOrigin: shop }).exec();
                if (isEmpty(shopDetails)) {
                  const plan = {
                    price: '4.99',
                    name: 'Basic Plan',
                    trial_days:3
                  };
                  const billingResponse = await postBilling(plan,shop,accessToken);
                  const newShop = new Shop({
                    _id: new mongoose.Types.ObjectId(),
                    shopOrigin: shop,
                    accessToken: accessToken,
                    chargeDetails:billingResponse,
                    isAppInstalled:true,
                    created_at: new Date(),
                    updated_at: new Date(),
                  });
                  await newShop.save();
                  const confirmationUrl = billingResponse.confirmation_url;
                  return ctx.redirect(confirmationUrl);
                } else if((!isEmpty(shopDetails) && shopDetails.isAppInstalled === false)){
                  console.log(shopDetails,"shopDetails");
                  const plan = {
                    price: '4.99',
                    name: 'Basic Plan',
                    trial_days:shopDetails.chargeDetails.trial_days
                  };
                  const billingResponse = await postBilling(plan, shop,accessToken);
                  await Shop.updateOne(
                    { shopOrigin: shop },
                    {
                      $set: {
                        accessToken: accessToken,
                        chargeDetails:billingResponse,
                        updated_at: new Date(),
                      },
                    }
                  );
                  const confirmationUrl = billingResponse.confirmation_url;
                  return ctx.redirect(confirmationUrl);
                }else{
                  console.log("false fallback to createshopifyauth willbe redirected to the app")
                  ctx.redirect(`https://${shop}/admin/apps/${APP_NAME}`);
                }
        } catch (error) {
            console.log(error, 'error while updating accessstoken');
          }
      }})
    );
    receiveWebhook({
        path: '/webhooks/app/uninstalled',
        secret: SHOPIFY_API_SECRET_KEY,
        // called when a valid webhook is received
        onReceived(ctx) {
          console.log('received webhook: ', ctx.state.webhook);
          async function updateDatabase(){
          await Shop.updateOne(
            { shopOrigin: ctx.state.webhook.domain },
            {
              $set: {
                isAppInstalled:false
              },
            }
          );
          console.log("install flag set to false")
        }
        updateDatabase();
        },
      }),
    server.use(verifyRequest());
  }
  server.use(bodyParser());
  server.use(authRouter.routes());
  server.use(authRouter.allowedMethods());
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


