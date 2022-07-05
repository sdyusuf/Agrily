import React from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useState} from 'react'

import axios from 'axios'
import ResetPasswordSuccess from './ResetPasswordSuccess'
import ResetPasswordFail from './ResetPasswordFail'
import { Form, Row, Col, Button, Container, Alert } from 'react-bootstrap'
//import {Col, Row, Container} from 'react-bootstrap'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import farmer2 from '../images/farmer.jpg'


function ResetPassword() {
    const [passwordValue, setPasswordValue] = useState('')
    const [confirmPasswordValue, setConfirmPasswordValue] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [isFail, setIsFail] = useState(false)
    const {resetPasswordCode} = useParams()
    const navigate = useNavigate()

    const onResetClicked = async(e)=>{
        e.preventDefault()
        try{
            await axios.put(`http://localhost:5000/api/users/${resetPasswordCode}/reset-password`, {newPassword: passwordValue})
            setIsSuccess(true)
        }catch(error){
            setIsFail(true)
        }
    }

    console.log(resetPasswordCode)
    if(isFail) return (<ResetPasswordFail/>)

    if(isSuccess) return (<ResetPasswordSuccess/>)


    return (
        <div>


                <div>
                    <NavBar/>
                    <div style={{backgroundImage:`url(${farmer2})`, height:'40vh', marginBottom:'1rem', backgroundSize:'100%'}}></div>
                    
                    
                    <Container>
                    <Row>  <Col md={4}></Col>
                    <Col md={4} style={{textAlign:'center'}}> 
                    

                    <h2>Reset password</h2>
                    <p>Please enter a new password</p>

                    <form>

                    <Form.Label id="email" label="email" style={{width:'100%'}}>
                    <Form.Control 
                        size="sm" 
                        type="password" 
                        placeholder="Enter password" 
                        style={{width:'100%'}}
                        onChange={(e)=>setPasswordValue(e.target.value)}
                        value={passwordValue}/>
                </Form.Label> <br/>

                <Form.Label id="floatingPassword" label="Password" style={{width:'100%'}}>
                
                <Form.Control 
                        size="sm" 
                        type="password" 
                        placeholder="Confirm Password" 
                        style={{width:'100%'}}
                        onChange={(e)=>setConfirmPasswordValue(e.target.value)}
                        value={confirmPasswordValue}/>
                </Form.Label> <br/>

                <Button 
                    type="submit" 
                    className="mb-2" 
                    style={{width:'100%'}}
                    disabled={!passwordValue || !confirmPasswordValue || (passwordValue !==confirmPasswordValue)}
                        onClick={onResetClicked}>
                    Submit
                </Button>


                    </form>

                    

                    </Col>
                    <Col md={4}></Col>
                    
                    </Row>

                    </Container>

                    
                    <Footer/>
                </div>







            
        </div>
    )
}

export default ResetPassword


                
