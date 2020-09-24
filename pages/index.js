import React, { useEffect, useState } from 'react';
import { Frame, Spinner } from '@shopify/polaris';
import api from '../utils/adminApi';

const Index = (props) => {
  const [isAuthSuccess, setAuthSuccess] = useState(true);
  useEffect(() => {
    getAuth();
  });
  const getAuth = async () => {
    try {
      const response = await api.get('api/v1/auth');
      console.log('auth success', response);
      const {status,data} = response.data
      if(status === "billing"){
        console.log(data,"url")
        window.parent.location.href = data;
      }
      setAuthSuccess(true);
      return response;
    } catch (error){
      console.log("error",error.response.statusText)
      console.log(error, 'error while auth');
    }
  };
  return (
    <Frame>
      {isAuthSuccess && <>My First shopify App</>}
      {!isAuthSuccess && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 100,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div>
            {' '}
            <Spinner
              accessibilityLabel="Loading App ..."
              size="large"
              color="teal"
            />
          </div>
          <div>Loading App ...</div>
        </div>
      )}
    </Frame>
  );
};
export default Index;
