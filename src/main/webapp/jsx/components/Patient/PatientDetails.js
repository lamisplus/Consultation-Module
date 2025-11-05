import React,{useState} from 'react';
import 'semantic-ui-css/semantic.min.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PatientCardDetail from './PatientCard'
import { useHistory } from "react-router-dom";
import RecentHistory from './../History/RecentHistory';



function PatientDetails(props) {
  //console.log('here we are 3')
    let history = useHistory();
    const [key, setKey] = useState('home');
    const { classes } = props;
    const patientObj = history.location && history.location.state ? history.location.state.patientObj : {}

  return (
  
    <div>
      <Card >
        <CardContent>
            <PatientCardDetail patientObj={patientObj}/>
            <RecentHistory patientObj={patientObj} />
         </CardContent>
      </Card>
    </div>
  );
}


export default PatientDetails;