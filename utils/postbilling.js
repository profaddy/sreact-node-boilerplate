const Shop = require('../server/models/Shops');
const adminApi = require('../utils/adminApi');
const dotenv = require('dotenv');
dotenv.config();
const { APP_NAME } = process.env;
const postBilling = async (plan, shopOrigin, accessToken) => {
  try {
    console.log("APP_NAME>>>",APP_NAME)
    const shopDetails = await Shop.find({
      shopOrigin: shopOrigin,
    }).exec();
    const payload = {
      recurring_application_charge: {
        name: plan.name,
        price: plan.price.split('$')[0],
        return_url: `https://${shopOrigin}/admin/apps/${APP_NAME}`,
        trial_days: plan.trial_days,
        test: true,
      },
    };
    adminApi.defaults.headers.common[
      'X-Shopify-Access-Token'
    ] = `${accessToken}`;

    const response = await adminApi.post(
      `https://${shopOrigin}/admin/api/2020-04/recurring_application_charges.json`,
      payload
    );
    console.log(
      response.data.recurring_application_charge,
      'resonse'
    );
    return response.data.recurring_application_charge;
  } catch (err) {
    console.log(err, 'error');
  }
};

module.exports = postBilling;
