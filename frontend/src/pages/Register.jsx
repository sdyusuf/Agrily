import React from 'react'
import {useState} from 'react'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import { Form, Row, Col, Button, Container, Alert} from 'react-bootstrap'
import farmer2 from '../images/farmer.jpg'
import {Link, useNavigate} from 'react-router-dom'
import {useToken} from '../auth/useToken'
import axios from 'axios'


function Login() {

    const [token, setToken] = useToken()
    const navigate = useNavigate()

    const [errorMessage, setErrorMessage] = useState("")

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState ('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSignUp = (e) =>{
        e.preventDefault()
        axios.post('http://localhost:5000/api/signup', {firstName, lastName, email, password})
        .then((response) =>{
            const {token} = response.data
            setToken(token)
            navigate('/verify-email')
            console.log(`${token}`)
        } )
        .catch(err=> {
            console.log({Error: err})
            setErrorMessage("Sign up failed, user exists!")

        })
    
    }

    return (
        <div>
            <NavBar/>
            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
            <h3 className="text-center">Sign Up </h3>
            <Container>
            <Row>  <Col md={4}></Col>
            <Col md={4}> 
            <form>
               
                { errorMessage && (<Alert  variant="warning"> {errorMessage} </Alert>) }


                <Form.Label controlId="Fname" label="Fname" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="text" 
                        name="firstName" 
                        placeholder="First Name" 
                        style={{width:'100%'}}
                        value={firstName}
                        onChange={e=>setFirstName(e.target.value)}/>
                </Form.Label> <br/>

                <Form.Label controlId="Lname" label="Lname" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="text" 
                        name="lastName" 
                        placeholder="Last Name" 
                        style={{width:'100%'}}
                        value={lastName}
                        onChange={e=>setLastName(e.target.value)}/>
                </Form.Label> <br/>

                <Form.Label controlId="email" label="email" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm"   
                        type="email" 
                        name="email" 
                        placeholder="Email" 
                        style={{width:'100%'}}
                        value={email}
                        onChange={e=>setEmail(e.target.value)}/>
                </Form.Label> <br/>

                <Form.Label controlId="Password" label="Password" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="password" 
                        name="password" 
                        placeholder="Password" 
                        style={{width:'100%'}}
                        value={password}
                        onChange={e=>setPassword(e.target.value)}/>
                </Form.Label> <br/>

                <Form.Label controlId="Password" label="Password" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="password" 
                        name="confirmPassword" 
                        placeholder="Comfirm Password" 
                        style={{width:'100%'}}
                        value={confirmPassword}
                        onChange={e=>setConfirmPassword(e.target.value)}/>
                </Form.Label> <br/>

                <Button 
                    type="submit" 
                    className="mb-2" 
                    style={{width:'100%'}}
                    disabled={
                        !firstName || !lastName || !email || password !== confirmPassword
                    }
                    onClick={handleSignUp}
                    >
                    Sign Up
                </Button> <br/>

                <p style={{fontSize:'12px'}}>Registered Already? <Link to="/login">Login here</Link></p>

                
                
                    
            </form>
            

            </Col>
            <Col md={4}></Col>
            
            </Row>
            </Container>
            <Footer/>
        </div>
    )
}

export default Login
