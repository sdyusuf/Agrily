import React, {useState} from 'react'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import { Form, Row, Col, Button, Container, Alert } from 'react-bootstrap'
import farmer2 from '../images/farmer.jpg'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
//import {Link} from 'react-router-dom'

function Login() {
    const [email, setEmail] =  useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

        const handleSubmit= async (e)=>{        
        try{
            e.preventDefault()
            await axios.put(`http://localhost:5000/api/forgot-password/${email}`)
            setSuccess(true)
            setTimeout(()=>{
                navigate('/login')
            }, 3000)
        }catch(e){
            setError(e.message)
        }
    }
    return (
        <div>
            <NavBar/>
            <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'3rem', backgroundSize:'100%'}}></div>
            
            <h3 className="text-center">Recover Account </h3>
            
            <Container>
            <Row>  <Col md={4}></Col>
            <Col md={4}> 
                
                    {success ? 
                        (<div> 
                            <h2>Success</h2> 
                            <p>Check your email for a reset link</p>
                        </div>
                        )
                        :
                        (
                            <form>
                                {error && 
                                
                                (<Alert variant="danger">
                                    {error}
                                </Alert>)}
                                
                                <Form.Label controlId="email" label="email" style={{width:'100%'}} mt-5>
                                    <Form.Control size="sm" type="email" placeholder="Email" style={{width:'100%'}}
                                    value={email} onChange={(e)=>setEmail(e.target.value)}/>
                                </Form.Label> <br/>
        
                                <Button type="submit" className="mb-2" style={{width:'100%'}}
                                disabled={!email} onClick={handleSubmit}>
                                    Send reset link
                                </Button>
                            </form>  
                        )
                    }   
                    
                

            </Col>
            <Col md={4}></Col>
            
            </Row>

            </Container>

            
            <Footer/>
        </div>
    )
}

export default Login
