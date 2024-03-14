import React, {useEffect, useState, useContext} from 'react'
import TopBar from '../components/TopBar'
import {useUser} from '../auth/useUser'
import {useToken} from '../auth/useToken'
import {useNavigate} from 'react-router-dom'
import './Home.css'
import { Alert, Container, Row, Col } from 'react-bootstrap'
import Footer from '../components/Footer'
import ProductList from '../components/ProductList'
import RevenueCards from '../components/RevenueCards'
import FarmerOrders from '../components/FarmerOrders'
import { AppContext } from '../state/AppContext'

function Home() {

    const {value} = useContext(AppContext)
    const navigate = useNavigate();
    const [moment, setMoment] = useState('');

    const user = useUser()
    const [token, setToken] = useToken()
    const {firstName, lastName, id, email, isVerified} = user || {}

    const [products, setProducts] = useState([]);

    useEffect(()=>{
        if (user === null) navigate('/index')
        checkTime()
    }, [user])

    const logout = () => {
        localStorage.removeItem('token')
        navigate('/index')
    }

    const checkTime = () =>{
        var today = new Date()
        var curHr = today.getHours()

        if (curHr < 12) {
          setMoment('morning')
        } else if (curHr < 18) {
          setMoment('afternoon')
        } else {
          setMoment('evening')
        }
    }

    return (
        <div className="agrily-home-dashboard">
            <TopBar logout={logout}/>

            <Container className="py-4">
                {/* Greeting & Verification Banner */}
                {isVerified ? (
                    <header className="mb-4">
                        <h2 className="welcome" style={{ fontWeight: 800, color: '#1b4332' }}>
                            Good {moment}, {firstName || 'Producer'} 🌾
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                            Welcome to your Agrily Farm Operations Console. Monitor sales revenue, fulfill orders, and manage stock.
                        </p>
                    </header>
                ) : (
                    <Alert className="welcome mb-4" variant="warning">
                        Please verify your producer email address ({email}) to unlock direct buyer payouts.
                    </Alert>
                )}

                {/* 1. Revenue & Sales Analytics KPI Cards */}
                <section aria-label="Farm Revenue Analytics">
                    <RevenueCards email={email} />
                </section>

                {/* 2. Order Fulfillment Management Board */}
                <section aria-label="Incoming Buyer Orders">
                    <FarmerOrders farmerEmail={email} />
                </section>

                {/* 3. Producer Active Product Listings */}
                <section aria-label="My Produce Listings" className="mb-5">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1b4332', margin: 0 }}>
                            My Listed Farm Produce
                        </h3>
                    </div>
                    {email ? (
                        <ProductList email={email} />
                    ) : (
                        <p className="text-muted">Loading your farm produce catalogue...</p>
                    )}
                </section>
            </Container>

            <Footer/>
        </div>
    )
}

export default Home
