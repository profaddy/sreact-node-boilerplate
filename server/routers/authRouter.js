'use strict';
const { isEmpty } = require('lodash');
const Shop = require('../models/Shops.js');
const Router = require('koa-router');
const postBilling = require('../../utils/postbilling');
const adminApi = require('../../utils/adminApi');
const router = new Router({ prefix: '/api/v1/test' });
const omit = require('lodash/omit');
const getShopOrigin = require('../../utils/getShopOrigin');

router.get('/', async (ctx) => {
  try {
    const shopOrigin = getShopOrigin(ctx);
    const shopDetails = await Shop.findOne({
      shopOrigin: shopOrigin,
    }).exec();
    const accessToken = shopDetails.accessToken;
    const chargeDetails = shopDetails.chargeDetails;
    let confirmationUrl = null;
    let status = "success";
    if (!isEmpty(chargeDetails)) {
      adminApi.defaults.headers.common[
        'X-Shopify-Access-Token'
      ] = `${shopDetails.accessToken}`;
      const response = await adminApi.get(
        `https://${shopOrigin}/admin/api/2020-04/recurring_application_charges/${chargeDetails.id}.json`
      );
      await Shop.updateOne(
        { shopOrigin: shopOrigin },
        {
          $set: {
            accessToken: shopDetails.accessToken,
            chargeDetails:response.data.recurring_application_charge,
            updated_at: new Date(),
          },
        }
      );
      console.log("charge details updated successfully")
      console.log(response.data, 'getcharge daresponse');
      const chargeStatus = response.data.recurring_application_charge.status;
        const activatePayload = {
              recurring_application_charge:chargeDetails
            }
      if(chargeStatus !== 'active' && chargeStatus === 'accepted'){
        const response = await adminApi.post(
          `https://${shopOrigin}/admin/api/2020-04/recurring_application_charges/${chargeDetails.id}/activate.json`,
          omit(activatePayload,['confirmation_url'])
        );
        status = "activate";
        confirmationUrl = `https://${shopOrigin}/admin/apps`
      }
      if (chargeStatus !== 'active' &&  chargeStatus !== 'accepted') {
        const plan = {
          price: '4.99',
          name: 'Basic Plan',
          trial_days:chargeDetails.trial_days
        };
        const billingResponse = await postBilling(plan, shopOrigin,accessToken);
        confirmationUrl = billingResponse.confirmation_url;
        status = "billing"
        ctx.redirect(confirmationUrl);
      }
    } else {
      const plan = {
        price: '4.99',
        name: 'Basic Plan',
        trial_days:chargeDetails.trial_days
      };
      const billingResponse = await postBilling(plan, shopOrigin,accessToken);
       confirmationUrl = billingResponse.confirmation_url;
       status = "billing"
      ctx.redirect(confirmationUrl);
    }

    console.log('auth test');

    ctx.status = 200;
    ctx.body = {
      status: status,
      data: confirmationUrl,
    };
  } catch (err) {
    console.log(err,"error in test auth router")
    ctx.status = 400;
    ctx.body = {
      status: "failure",
      msg: err,
    };
    console.log(err);
  }
});

module.exports = router;
