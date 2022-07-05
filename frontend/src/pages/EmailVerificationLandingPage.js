import React, {useState, useEffect} from 'react'
import axios from 'axios'
import {useParams} from 'react-router-dom'
import {useToken} from '../auth/useToken'
import EmailVerificationSuccess from './EmailVerificationSuccess'
import EmailVerificationFail from './EmailVerificationFail'
import NavBar from '../components/NavBar'
import farmer2 from '../images/farmer.jpg'
import {Container, Row, Col} from 'react-bootstrap'
import Footer from '../components/Footer'

function EmailVerificationLandingPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSuccess, setIsSuccess] = useState(false)
    const verificationString = useParams()
    const [,setToken] = useToken()

    useEffect(()=>{
        const loadVerification = async () =>{
            
                axios.put(`http://localhost:5000/verify/`, verificationString)
                .then(response =>{
                    const {token} = response.data
                    setToken(token)
                    setIsSuccess(true)
                    setIsLoading(false)
                    //console.log(response)
                })           
                .catch(error=>{
                setIsSuccess(false)
                setIsLoading(false)
                //console.log(error)
                })
            

        }

        loadVerification()

    },[])

    



    return(
        <>
            <NavBar/>
            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>

            <Container>
                <Row>
                    <Col md={4}></Col>
                    
                    <Col md={4} style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                    
                        { (isLoading) && <p >Loading...</p> }
                        { (!isSuccess) ? <EmailVerificationFail/> : <EmailVerificationSuccess/> }

                    </Col>
                     
                    <Col md={4}></Col>
                </Row>
            </Container>
            <Footer/>
            
            
        </>
    )












}

export default EmailVerificationLandingPage
