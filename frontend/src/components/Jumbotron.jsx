import React from "react";
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import background from '../images/bg.jpg'
import {Link} from 'react-router-dom'




function Jumbotron() {
  return (
    <Container  
    style={{height:'70vh', backgroundImage:`url(${background})`, 
    backgroundSize:'100%', backgroundRepeat:'no-repeat',
    padding:'20px', textAlign:'center', borderRadius:'0px  1% 1%', 
    color:'#fff', textShadow:'2px 0px 10px rgba(0, 0, 0, 1)', margin:'auto'}}>

      <h2 className="text-center" style={{marginTop:'7rem'}}> We are the connection between farmers and buyers.<br/>
      <small>Agrily is the most trusted marketplace for both farmers and buyers.</small></h2>
      <p className="text-center mt-5" style={{fontSize:'18px'}}></p> 
      <Link to="/register">
      <Button style={{marginTop: '15px', backgroundColor:'#bc6c25', padding:'10px 20px', border:'1px solid #fefae0'}}> Get Started</Button>
      </Link>
    </Container>
  );
}

export default Jumbotron;
