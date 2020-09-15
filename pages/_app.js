import App from 'next/app';
import Head from 'next/head';
import { CookiesProvider } from "react-cookie";
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/styles.css';
import translations from '@shopify/polaris/locales/en.json';

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <React.Fragment>
        <Head>
          <title>My First Shopify app</title>
          <meta charSet="utf-8" />
        </Head>
          <AppProvider i18n={translations} >
              <CookiesProvider>
              <Component {...pageProps}/>
              </CookiesProvider>
          </AppProvider>
      </React.Fragment>
    );
  }
}

export default MyApp;
