import { Fragment, useMemo, useState, useEffect } from 'react'
import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import PleaseVerifyEmailPage from './pages/PleaseVerifyEmailPage'
import EmailVerificationLandingPage from './pages/EmailVerificationLandingPage'
import { PrivateRoute } from './auth/PrivateRoute'
import ForgotPassword from './pages/ForgotPassword'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import ResetPassword from './pages/ResetPassword'
import AddProduct from './pages/AddProduct'
import Marketplace from './pages/Marketplace'
import { AppContext } from './state/AppContext'
import useFetch from './hook/useFetch'
import { useUser } from './auth/useUser'
import { useToken } from './auth/useToken'

function App() {

  const user = useUser()
  const email = user?.email
  const [token] = useToken()

  const {data, error, isPending} = useFetch(email ? `http://localhost:5000/api/products/${email}` : null, 
                  {
                    headers:{Authorization: `Bearer ${token}`}
                  });

  const [value, setValue] = useState(data)

  useEffect(() => {
    setValue(data);
  }, [data]);

  const providerValue = useMemo(()=>({value, setValue}), [value, setValue])

  return(
    <AppContext.Provider value={providerValue}>
    <BrowserRouter>
    <>
      <Routes> 
      
      <Route exact path="/" element={<Index/>} />      
        <Route path="/index" element={<Index/>} />   
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/verify/:verificationString" element={<EmailVerificationLandingPage/>}/>
        <Route path="/verify-email" element={<PleaseVerifyEmailPage/>}/>
        <Route path="/reset-password/:resetPasswordCode" element={<ResetPassword/>} />
        <Route path="*" element={<NotFound/>} />
        <Route path="/add-product" element ={<AddProduct/>}/>
        <Route path="/marketplace" element={<Marketplace/>}/>
        
        
        <Route exact path='/home' element={<PrivateRoute/>}>
            <Route exact path='/home' element={<Home/>}/>
        </Route>
       
      </Routes>
      </>
    </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
