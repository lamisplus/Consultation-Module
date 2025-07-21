import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { Step, Label, Segment, Icon } from "semantic-ui-react";
import { Form, Row, Card, CardBody, Spinner } from "reactstrap";
import DualListBox from "react-dual-listbox";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { toast } from "react-toastify";
import { url as baseUrl, token } from "../../../api";
import { useHistory } from "react-router-dom";
import MatButton from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import { format } from "date-fns";
import "react-dual-listbox/lib/react-dual-listbox.css";

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(20),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  cardBottom: {
    marginBottom: 20,
  },
  Select: {
    height: 45,
    width: 350,
  },
  button: {
    margin: theme.spacing(1),
  },

  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: "none",
  },
  error: {
    color: "#f85032",
    fontSize: "11px",
  },
  success: {
    color: "#4BB543 ",
    fontSize: "11px",
  },
}));

const PostClient = (props) => {
  const patientObj = props.patientObj;

  let newDate = new Date();
  const [selectedOption, setSelectedOption] = useState([]);
  let history = useHistory();
  const classes = useStyles();
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [postServices, setPostServices] = useState({
    encounterDate: format(new Date(newDate), "yyyy-MM-dd"),
    facilityId: patientObj.facilityId,
    personId: "",
    serviceCode: "",
    visitId: "",
  });

  async function ServicesPost() {
    axios
      .get(`${baseUrl}opd-setting`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        let data = response.data.filter(
          (a) =>
            a.moduleServiceName.toUpperCase() !== "TRIAGE" &&
            a.moduleServiceName.toUpperCase() !== "CONSULTATION"
        );

        setServices(
          Object.entries(data).map(([key, value]) => ({
            label: value.moduleServiceName,
            value: value.moduleServiceCode,
          }))
        );
      })
      .catch((error) => {});
  }

  useEffect(() => {
    ServicesPost();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedOption.length > 0) {
      setSaving(true);

      try {
        await axios.put(
          `${baseUrl}patient/visit/checkout/${patientObj.visitId}`,
          patientObj.visitId,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let serviceArr = [];
        selectedOption.forEach(function (value, index, array) {
          serviceArr.push(value);
        });

        postServices.personId = patientObj.id;
        postServices.visitId = patientObj.visitId;
        postServices.serviceCode = serviceArr;

        const response = await axios.post(
          `${baseUrl}patient/post`,
          postServices,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSaving(false);
        props.patientObj.commenced = true;
        toast.success("Patient checked out and posted successfully.");
        props.toggle();
        history.push("/");
      } catch (error) {
        setSaving(false);
        console.error(error);
        toast.error("Something went wrong during checkout or posting");
      }
    } else {
      toast.error("Kindly select a service to post the patient");
    }
  };

  return (
    <div>
      <Modal
        show={props.showModal}
        toggle={props.toggle}
        className="fade"
        size="lg"
      >
        <Modal.Header toggle={props.toggle} style={{ backgroundColor: "#fff" }}>
          <Label
            for="post-services"
            style={{
              backgroundColor: "#fff",
              color: "#014d88",
              fontWeight: "bolder",
              fontSize: "18px",
            }}
          >
            <h5
              style={{
                fontWeight: "bold",
                fontSize: "30px",
                color: "#992E62",
              }}
            >
              Post Patient
            </h5>
          </Label>
          <Button
            variant=""
            className="btn-close"
            onClick={props.toggle}
          ></Button>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <CardBody>
              <form>
                <div className="row">
                  <DualListBox
                    options={services}
                    onChange={setSelectedOption}
                    selected={selectedOption}
                  />
                </div>
                {saving ? <Spinner /> : ""}
                <br />
                <MatButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  style={{ backgroundColor: "#014d88" }}
                >
                  {!saving ? (
                    <span style={{ textTransform: "capitalize" }}>Save</span>
                  ) : (
                    <span style={{ textTransform: "capitalize" }}>
                      Saving...
                    </span>
                  )}
                </MatButton>
              </form>
            </CardBody>
          </Card>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PostClient;
