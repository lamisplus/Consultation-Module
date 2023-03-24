import React, {useState, Fragment } from "react";
import { Row, Col, Card,  Tab, Tabs, } from "react-bootstrap";
import Dashboard from './Patient/PatientList'
import {Link} from "react-router-dom";


const divStyle = {
  borderRadius: "2px",
  fontSize: 14,
};

const Home = () => {
    const [key, setKey] = useState('home');


  return (
    <Fragment>
      <Row>
       
        <Col xl={12}>
          {/*<div className="row page-titles mx-0" style={{marginTop:"0.5px"}}>
            <ol className="breadcrumb">
              <li className="breadcrumb-item active"><Link to={`#`}>Consultation</Link></li>
              <li className="breadcrumb-item  "><Link to={`#`}>Patient List</Link></li>
            </ol>
          </div>*/}
          <Card style={divStyle}>
            
            <Card.Body>
              {/* <!-- Nav tabs --> */}
              <div className="custom-tab-1">
                <Tabs
                    id="controlled-tab-example"
                    activeKey={key}
                    onSelect={(k) => setKey(k)}
                    className="mb-3"
                >
                  <Tab eventKey="home" title="Checked In Patients">                   
                    <Dashboard />
                  </Tab>
                                    
                </Tabs>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
      </Row>
    </Fragment>
  );
};

export default Home;
