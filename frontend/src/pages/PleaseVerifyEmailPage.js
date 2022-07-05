import React from 'react'
import { useEffect } from 'react'
import {useNavigate} from 'react-router-dom'

import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import { Row, Col, Container} from 'react-bootstrap'
import farmer2 from '../images/farmer.jpg'
//import {Link} from 'react-router-dom'
//import axios from 'axios'
//import {useToken} from '../auth/useToken'


function Login() {

    const navigate = useNavigate()

    useEffect(()=>{
        setTimeout(()=>{
                navigate('/home')
            }, 5000
        )
    }, [])

    // const [token, setToken] = useToken()

    // const [errorMessage, setErrorMessage] = useState(null)
    // const [email, setEmail] = useState('')
    // const [password, setPassword] = useState('')
    
    

    // const onLogin = async(e) =>{
    //     e.preventDefault()
    //     axios.post('http://localhost:5000/api/login', { email, password})
    //     .then((response) =>{
    //         const {token} = response.data
    //         setToken(token)
    //         navigate('/home')
    //         console.log(`${token}`)
    //     } )
    //     .catch(err=> {
    //         setErrorMessage(err)
    //         console.log({Error: err})
    
    //     })
    // }

    // const forgotPasswordHandler = () =>{
    //     navigate("/forgot-password")
    // }

    return (
        <div>
            <NavBar/>
            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
            
            
            <Container>
            <Row> 
                
                <Col md={4}></Col>
                
                
                <Col md={4} style={{textAlign:'center'}}> 
                    <h3>Thank you for signing up on Agrily!</h3>
                    <p>A verification link has been sent to the email provide.                       
                    Kindly verify your email to have access to all features on Agrily.
                    </p>
                </Col>
                
                
                <Col md={4}></Col>
            
            </Row>

            </Container>

            
            <Footer/>
        </div>
    )
}

export default Login
