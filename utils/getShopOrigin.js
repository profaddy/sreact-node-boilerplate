const dotenv = require('dotenv');
dotenv.config();

const getShopOrigin = (ctx) => {
    console.log(process.env.NODE_ENV, process.env.SHOP,"process in getshoporigin")
    if (process.env.NODE_ENV === 'production') {
        return ctx.session.shop
    } else if(process.env.NODE_ENV === 'development'){
        return ctx.session.shop
    }else{
        return process.env.SHOP
    }
}

module.exports = getShopOrigin;
