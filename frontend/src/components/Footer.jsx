import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

function Footer() {
    return (
           
           <Row className="text-center container-fluid" 
           style={{margin:'10px auto', position:'fix', bottom:'0px'}}
           >
               <Col lg={12}>Agrily &copy; {new Date().getFullYear()}</Col>
           </Row>
        
    )
}

export default Footer
