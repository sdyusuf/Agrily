
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Jumbotron from '../components/Jumbotron';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { useUser } from '../auth/useUser';

function Index() {
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  return (
    <>
      <NavBar />
      <Jumbotron />
      <Body />
      <Footer />
    </>
  );
}

export default Index;
