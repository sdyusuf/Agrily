import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Image from 'react-bootstrap/Image'
import '../index.css'
import farmer from '../images/farmer.jpg'
import farmer2 from '../images/farmer1.jpg'

function Body() {
    return (
        <Container>
            <h3 className="mt-5 text-center Fjalla">Who We Are</h3>
            <Row className="mt-5" style={{color:'#bc6c25'}}>
                <Col className="" md={6}>
                    <h4 className="Fjalla text-center">We're Farmers' best choice</h4>
                    <p>
                        Agrily provides farmers with a reliable and a trusted platform to 
                        enlist their farm produce, and get a buyer in a very short time, 
                        with a very good price. <br/> Because Agrily cares loves to help
                         farmers sell their farm produces while it is still fresh.
                         Farmers have made Agrily their most trusted crop trading platform. <br/>
                         If you are a farmer, kindly sign up and enjoy the benefits of getting your
                          farm produce to the buyers within the fastest time possible. 

                    </p>
                </Col>
                <Col md={6}>
                    <Image src={farmer2} fluid />
                </Col>
                
            </Row>


            <Row className="mt-5" style={{color:'#bc6c25'}}>
                <Col className="" md={6}>
                    <Image src={farmer} fluid />
                </Col>
                <Col md={6}>
                <h4 className="Fjalla text-center">Buyers prefer Agrily</h4>
                    <p>
                        Buyers prefer to buy farm produce through Agrily. Getting a high quality produce has never been easier,
                        thanks to Agrily. Because we have the buyers in mind, we are the best choice for buyers looking to purchase 
                        fresh, and quality farm produce.
                    </p>
                    
                </Col>
                
            </Row>
        </Container>
    )
}

export default Body
